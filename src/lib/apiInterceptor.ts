import { getApiUrl } from './config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private onUnauthorized: (() => void) | null = null;

  private constructor() {}

  static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // Global handler for 401 errors - redirects to login
  private handleUnauthorized() {
    // Clear the expired token
    localStorage.removeItem('adminToken');
    
    // Call the unauthorized handler if set (e.g., from DashboardLayout)
    if (this.onUnauthorized) {
      this.onUnauthorized();
    } else {
      // Fallback: redirect to login page globally
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  async fetchWithAuth<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('adminToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        this.handleUnauthorized();
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      // Parse successful response
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async fetchFormDataWithAuth<T = any>(
    endpoint: string,
    formData: FormData,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('adminToken');
    
    const headers: HeadersInit = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(getApiUrl(endpoint), {
        ...options,
        method: 'POST',
        body: formData,
        headers,
      });

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        this.handleUnauthorized();
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }
}

export const apiInterceptor = ApiInterceptor.getInstance();
