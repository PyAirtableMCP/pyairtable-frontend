import { TokenManager } from './auth';

export interface RequestInterceptor {
  onRequest?: (config: RequestInit & { url: string }) => RequestInit & { url: string };
  onRequestError?: (error: any) => Promise<any>;
}

export interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: any) => Promise<any>;
}

export class ApiInterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  // Request interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    
    // Return unsubscribe function
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  // Response interceptor management
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    
    // Return unsubscribe function
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  // Apply request interceptors
  async applyRequestInterceptors(config: RequestInit & { url: string }): Promise<RequestInit & { url: string }> {
    let modifiedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.onRequest) {
          modifiedConfig = interceptor.onRequest(modifiedConfig);
        }
      } catch (error) {
        if (interceptor.onRequestError) {
          await interceptor.onRequestError(error);
        }
        throw error;
      }
    }

    return modifiedConfig;
  }

  // Apply response interceptors
  async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.onResponse) {
          const result = interceptor.onResponse(modifiedResponse);
          modifiedResponse = result instanceof Promise ? await result : result;
        }
      } catch (error) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(error);
        }
        throw error;
      }
    }

    return modifiedResponse;
  }

  // Apply response error interceptors
  async applyResponseErrorInterceptors(error: any): Promise<any> {
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponseError) {
        try {
          await interceptor.onResponseError(error);
        } catch (interceptorError) {
          console.error('Response error interceptor failed:', interceptorError);
        }
      }
    }
    throw error;
  }
}

// Default interceptors
export const createAuthInterceptor = (): RequestInterceptor => ({
  onRequest: (config) => {
    const token = TokenManager.getAccessToken();
    
    if (token && !TokenManager.isTokenExpired()) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  onRequestError: async (error) => {
    console.error('Auth interceptor request error:', error);
    throw error;
  },
});

export const createRetryInterceptor = (maxRetries = 3, baseDelay = 1000): ResponseInterceptor => ({
  onResponseError: async (error) => {
    const config = error.config;
    const retryCount = config?.retryCount || 0;

    // Don't retry auth errors or if max retries reached
    if (error.status === 401 || error.status === 403 || retryCount >= maxRetries) {
      throw error;
    }

    // Exponential backoff
    const delay = baseDelay * Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increment retry count and retry
    const newConfig = {
      ...config,
      retryCount: retryCount + 1,
    };

    throw { ...error, config: newConfig, shouldRetry: true };
  },
});

export const createLoggingInterceptor = (): RequestInterceptor & ResponseInterceptor => ({
  onRequest: (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method || 'GET'} ${config.url}`);
      if (config.body) {
        console.log('📤 Request Body:', config.body);
      }
    }
    return config;
  },
  onResponse: (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 API Response: ${response.status} ${response.url}`);
    }
    return response;
  },
  onResponseError: async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', error);
    }
    throw error;
  },
});

export const createCacheInterceptor = (): ResponseInterceptor => {
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  return {
    onResponse: (response) => {
      // Only cache GET requests
      if (response.url && response.status === 200) {
        const url = response.url;
        const isGetRequest = !response.headers.get('cache-control')?.includes('no-cache');
        
        if (isGetRequest) {
          response.clone().json().then(data => {
            cache.set(url, {
              data,
              timestamp: Date.now(),
              ttl: 5 * 60 * 1000, // 5 minutes default TTL
            });
          }).catch(() => {
            // Ignore cache errors
          });
        }
      }
      
      return response;
    },
  };
};

export const createRateLimitInterceptor = (): ResponseInterceptor => ({
  onResponseError: async (error) => {
    if (error.status === 429) {
      const retryAfter = error.headers?.get('retry-after');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      
      console.warn(`Rate limited. Retrying after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Mark for retry
      throw { ...error, shouldRetry: true };
    }
    throw error;
  },
});

export const createErrorInterceptor = (): ResponseInterceptor => ({
  onResponseError: async (error) => {
    // Handle specific error cases
    switch (error.status) {
      case 401:
        // Clear tokens and redirect to login
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        break;
      case 403:
        // Show permission denied message
        if (typeof window !== 'undefined') {
          console.error('Permission denied');
        }
        break;
      case 500:
        // Log server errors for monitoring
        console.error('Server error:', error);
        break;
    }
    
    throw error;
  },
});

// Create a default interceptor manager with common interceptors
export const createDefaultInterceptorManager = (): ApiInterceptorManager => {
  const manager = new ApiInterceptorManager();
  
  // Add common interceptors
  manager.addRequestInterceptor(createAuthInterceptor());
  manager.addRequestInterceptor(createLoggingInterceptor());
  manager.addResponseInterceptor(createLoggingInterceptor());
  manager.addResponseInterceptor(createErrorInterceptor());
  manager.addResponseInterceptor(createRateLimitInterceptor());
  
  return manager;
};