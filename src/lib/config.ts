import { apiInterceptor } from './apiInterceptor';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 10000, // 10 seconds
};

// API Helper Functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Global fetch wrapper that handles 401 errors automatically
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('adminToken');
  
  // Merge headers properly - user headers take precedence
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Merge with user-provided headers (user headers override defaults)
  const headers: HeadersInit = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized globally - but don't redirect immediately
  // Let the calling code handle the response first
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    
    // Use a small delay to allow response handling, then redirect
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }, 100);
  }

  return response;
};

// Legacy functions for backward compatibility
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const getFormDataHeaders = (): HeadersInit => {
  const token = localStorage.getItem('adminToken');
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// New API functions with automatic token expiration handling
export const apiCall = apiInterceptor.fetchWithAuth;
export const apiFormDataCall = apiInterceptor.fetchFormDataWithAuth;

// Initialize the API interceptor with unauthorized handler
export const initializeApiInterceptor = (onUnauthorized: () => void) => {
  apiInterceptor.setUnauthorizedHandler(onUnauthorized);
};

// Helper function to handle 401 errors and redirect to login
export const handleUnauthorized = (router: any) => {
  localStorage.removeItem('adminToken');
  router.push('/login');
};

// Format number with K (thousands) and M (millions) notation
// Only show K/M notation when value is 99K or more
export const formatNumber = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  if (value >= 1000000) {
    // For 1 Million and above, show in Millions (M)
    return `${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 99000) {
    // For 99K and above, show in Thousands (K)
    return `${(value / 1000).toFixed(2)}K`;
  } else {
    // For values less than 99K, show full number with Indian number format
    return new Intl.NumberFormat('en-IN').format(value);
  }
};

// Format currency with professional full price format
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  
  // Always show full amount in professional format
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}; 