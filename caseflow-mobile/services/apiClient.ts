import { getApiConfig } from '../config/environment';
import { authService } from './authService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private config = getApiConfig();
  private requestQueue: Map<string, Promise<Response>> = new Map();

  /**
   * Make an authenticated API request
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      retries = 3,
      retryDelay = 1000,
      ...requestConfig
    } = config;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.makeRequest(endpoint, {
          ...requestConfig,
          timeout,
        });

        const data = await response.json();

        if (response.ok) {
          return data;
        } else {
          // Handle specific error cases
          if (response.status === 401) {
            // Token expired, auth service will handle refresh
            throw new Error('Authentication required');
          } else if (response.status >= 500 && attempt < retries) {
            // Server error, retry
            await this.delay(retryDelay * Math.pow(2, attempt));
            continue;
          } else {
            return data;
          }
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries && this.isRetryableError(error as Error)) {
          await this.delay(retryDelay * Math.pow(2, attempt));
          continue;
        } else {
          break;
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message || 'Network request failed',
        details: { retries, lastError: lastError?.toString() },
      },
    };
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(
    endpoint: string,
    config: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const requestId = `${config.method || 'GET'}_${url}`;

    // Prevent duplicate requests
    if (this.requestQueue.has(requestId)) {
      return this.requestQueue.get(requestId)!;
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    // Add authorization header if token exists
    const token = await authService.getAccessToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestConfig: RequestInit = {
      ...config,
      headers: {
        ...defaultHeaders,
        ...config.headers,
      },
    };

    // Create request promise
    const requestPromise = this.fetchWithTimeout(url, requestConfig, config.timeout);
    
    // Store in queue
    this.requestQueue.set(requestId, requestPromise);

    try {
      const response = await requestPromise;
      
      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await authService.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          requestConfig.headers = {
            ...requestConfig.headers,
            'Authorization': `Bearer ${refreshed}`,
          };
          const retryResponse = await this.fetchWithTimeout(url, requestConfig, config.timeout);
          this.requestQueue.delete(requestId);
          return retryResponse;
        }
      }

      this.requestQueue.delete(requestId);
      return response;
    } catch (error) {
      this.requestQueue.delete(requestId);
      throw error;
    }
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'Network request failed',
      'Request timeout',
      'Failed to fetch',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
    ];

    return retryableErrors.some(retryableError =>
      error.message.includes(retryableError)
    );
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    endpoint: string,
    file: File | Blob,
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'body'>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    // Remove Content-Type header to let browser set it with boundary
    const { headers, ...restConfig } = config || {};
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      ...restConfig,
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
    });
  }

  /**
   * Download file
   */
  async download(endpoint: string, config?: RequestConfig): Promise<Blob | null> {
    try {
      const response = await this.makeRequest(endpoint, {
        ...config,
        method: 'GET',
      });

      if (response.ok) {
        return await response.blob();
      } else {
        console.error('Download failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  /**
   * Clear request queue (useful for cleanup)
   */
  clearQueue(): void {
    this.requestQueue.clear();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
