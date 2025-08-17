import { ApiResponse, PaginatedResponse, ApiError } from "@/types";
import { ApiInterceptorManager, createDefaultInterceptorManager } from './interceptors';

// Enhanced API Error with retry information
export class ApiErrorImpl extends Error implements ApiError {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public timestamp: string = new Date().toISOString(),
    public requestId: string = "",
    public field?: string,
    public retryCount: number = 0
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestConfig extends RequestInit {
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private tokenRefreshPromise: Promise<boolean> | null = null;
  private interceptorManager: ApiInterceptorManager;

  constructor(baseURL?: string, interceptorManager?: ApiInterceptorManager) {
    // Use API Gateway (8000) for main API calls - REAL SERVICE IS RUNNING!
    this.baseURL = baseURL || `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000"}/api/v1`;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    this.interceptorManager = interceptorManager || createDefaultInterceptorManager();
  }

  private async refreshToken(): Promise<boolean> {
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    const result = await this.tokenRefreshPromise;
    this.tokenRefreshPromise = null;
    
    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      // Try refreshing via NextAuth
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const { token } = await response.json();
        if (token) {
          sessionStorage.setItem('access_token', token);
        }
        return true;
      }

      // If NextAuth refresh fails, try direct auth service refresh
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        const authResponse = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8007"}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.access_token) {
            sessionStorage.setItem('access_token', authData.access_token);
            if (authData.refresh_token) {
              sessionStorage.setItem('refresh_token', authData.refresh_token);
            }
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // First try to get token from session storage for SPA token management
      const cachedToken = sessionStorage.getItem('access_token');
      if (cachedToken) {
        // Verify token is not expired (basic check)
        try {
          const payload = JSON.parse(atob(cachedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            return cachedToken;
          }
        } catch {
          // Invalid token format, remove it
          sessionStorage.removeItem('access_token');
        }
      }

      // Fall back to NextAuth session token
      const response = await fetch("/api/auth/token", {
        credentials: "include",
      });
      
      if (response.ok) {
        const { token } = await response.json();
        if (token) {
          sessionStorage.setItem('access_token', token);
        }
        return token;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
    return null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      retryCount = 0,
      maxRetries = 3,
      retryDelay = 1000,
      ...options
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // Prepare initial request config
    let requestConfig: RequestInit & { url: string } = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
      url,
    };

    try {
      // Apply request interceptors
      requestConfig = await this.interceptorManager.applyRequestInterceptors(requestConfig);
      
      // Extract URL from config as it might have been modified by interceptors
      const finalUrl = requestConfig.url;
      const { url: _, ...fetchConfig } = requestConfig;

      let response = await fetch(finalUrl, fetchConfig);
      
      try {
        // Apply response interceptors
        response = await this.interceptorManager.applyResponseInterceptors(response);
      } catch (interceptorError) {
        // If interceptor wants to retry, handle it
        if (interceptorError.shouldRetry && retryCount < maxRetries) {
          await this.sleep(retryDelay * Math.pow(2, retryCount));
          return this.request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
        }
        throw interceptorError;
      }
      
      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && retryCount === 0) {
        const refreshSuccess = await this.refreshToken();
        
        if (refreshSuccess) {
          // Retry the request with fresh token
          return this.request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
        } else {
          // Redirect to login if token refresh fails
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        const apiError = new ApiErrorImpl(
          errorData.code || "HTTP_ERROR",
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.details,
          new Date().toISOString(),
          errorData.requestId || response.headers.get("x-request-id") || "",
          errorData.field,
          retryCount
        );

        // Apply response error interceptors
        try {
          await this.interceptorManager.applyResponseErrorInterceptors(apiError);
        } catch (interceptorError) {
          if (interceptorError.shouldRetry && retryCount < maxRetries) {
            await this.sleep(retryDelay * Math.pow(2, retryCount));
            return this.request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
          }
        }

        // Retry on 5xx errors or specific 4xx errors
        if (retryCount < maxRetries && this.shouldRetry(response.status)) {
          await this.sleep(retryDelay * Math.pow(2, retryCount)); // Exponential backoff
          return this.request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
        }
        
        throw apiError;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      
      return response as unknown as T;
    } catch (error) {
      if (error instanceof ApiErrorImpl) {
        throw error;
      }
      
      // Retry on network errors
      if (retryCount < maxRetries && this.isNetworkError(error)) {
        await this.sleep(retryDelay * Math.pow(2, retryCount));
        return this.request<T>(endpoint, { ...config, retryCount: retryCount + 1 });
      }
      
      throw new ApiErrorImpl(
        "NETWORK_ERROR",
        "Network error occurred",
        { originalError: error instanceof Error ? error.message : error },
        new Date().toISOString(),
        "",
        undefined,
        retryCount
      );
    }
  }

  private shouldRetry(status: number): boolean {
    // Retry on server errors (5xx) and specific client errors
    return status >= 500 || [408, 429].includes(status);
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true;
    }
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      return errorMessage.includes("network") || 
             errorMessage.includes("failed to fetch") ||
             errorMessage.includes("connection refused");
    }
    return false;
  }

  // HTTP Methods with retry logic
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request<ApiResponse<T>>(`${endpoint}${searchParams}`);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: "DELETE",
    });
  }

  // Paginated requests with retry
  async getMany<T>(
    endpoint: string, 
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const searchParams = params ? `?${new URLSearchParams(params).toString()}` : "";
    return this.request<PaginatedResponse<T>>(`${endpoint}${searchParams}`);
  }

  // Upload with progress support
  async upload<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    // For uploads, we handle XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }
      
      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText as any);
          }
        } else {
          const errorData = await this.parseErrorResponse(xhr);
          reject(new ApiErrorImpl(
            errorData.code || "UPLOAD_ERROR",
            errorData.message || "Upload failed",
            errorData.details,
            new Date().toISOString(),
            errorData.requestId || ""
          ));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new ApiErrorImpl(
          "NETWORK_ERROR",
          "Upload failed due to network error",
          { status: xhr.status },
          new Date().toISOString(),
          ""
        ));
      });
      
      xhr.open("POST", `${this.baseURL}${endpoint}`);
      
      // Add auth header if available
      this.getAuthToken().then(token => {
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    });
  }

  private async parseErrorResponse(xhr: XMLHttpRequest) {
    try {
      return JSON.parse(xhr.responseText);
    } catch {
      return {
        code: "HTTP_ERROR",
        message: `HTTP ${xhr.status}: ${xhr.statusText}`,
      };
    }
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();