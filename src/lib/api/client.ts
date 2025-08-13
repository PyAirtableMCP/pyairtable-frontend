import { ApiResponse, AppError } from "@/types"

export interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: number
  retryDelay?: number
}

export interface ApiClientConfig {
  baseUrl?: string
  timeout?: number
  retry?: number
  retryDelay?: number
}

class ApiClient {
  private baseUrl: string
  private timeout: number
  private retry: number
  private retryDelay: number

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || ""
    this.timeout = config.timeout || 10000
    this.retry = config.retry || 2
    this.retryDelay = config.retryDelay || 1000
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const timeout = config.timeout || this.timeout
    const maxRetries = config.retry ?? this.retry
    const retryDelay = config.retryDelay || this.retryDelay

    const requestConfig: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      ...config,
    }

    // Add auth token if available
    const token = this.getAuthToken()
    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response)
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return {
          success: true,
          data,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")
        
        // Don't retry on auth errors or client errors (4xx)
        if (error instanceof Error && error.message.includes("401")) {
          this.handleAuthError()
          break
        }

        if (attempt < maxRetries && this.shouldRetry(lastError)) {
          await this.delay(retryDelay * (attempt + 1))
          continue
        }
        break
      }
    }

    console.error(`API request failed: ${endpoint}`, lastError)
    return {
      success: false,
      error: lastError?.message || "Request failed",
    }
  }

  private async parseErrorResponse(response: Response): Promise<AppError> {
    try {
      const errorData = await response.json()
      return {
        code: errorData.code || response.status.toString(),
        message: errorData.message || `HTTP ${response.status}`,
        details: errorData.details,
        timestamp: new Date(),
      }
    } catch {
      return {
        code: response.status.toString(),
        message: response.statusText || `HTTP ${response.status}`,
        timestamp: new Date(),
      }
    }
  }

  private shouldRetry(error: Error): boolean {
    // Retry on network errors and 5xx server errors
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503") ||
      error.message.includes("504")
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private handleAuthError(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      // Optionally redirect to login page
      // window.location.href = '/login'
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "GET" })
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" })
  }
}

// Create configured API clients
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 10000,
  retry: 2,
  retryDelay: 1000,
})

export const gatewayClient = new ApiClient({
  baseUrl: "/api/gateway",
  timeout: 15000,
})

export const airtableClient = new ApiClient({
  baseUrl: "/api/airtable",
  timeout: 20000,
})

export default apiClient