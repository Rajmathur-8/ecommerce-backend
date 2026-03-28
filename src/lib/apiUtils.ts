import { useState, useCallback } from 'react';

// Simple API Utilities for preventing duplicate calls

// Request deduplication to prevent multiple identical requests
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = requestFn();
  pendingRequests.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

// Create a unique request key
export const createRequestKey = (url: string, params?: Record<string, any>): string => {
  const sortedParams = params ? Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&') : '';
  return `${url}${sortedParams ? `?${sortedParams}` : ''}`;
};

// Simple hook for single API call with loading
export const useApiWithLoading = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async <T>(
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      
      const requestKey = createRequestKey(url, params);
      
      const result = await deduplicateRequest(requestKey, async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }
        return response.json();
      });

      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const resetLoading = useCallback(() => {
    setLoading(true);
    setData(null);
    setError(null);
  }, []);

  return { 
    fetchData, 
    loading, 
    data, 
    error, 
    resetLoading 
  };
};

// Simple hook for multiple API calls with loading
export const useMultipleApiWithLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [dataStates, setDataStates] = useState<Record<string, any>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  const fetchDataWithKey = useCallback(async <T>(
    key: string,
    url: string,
    options?: RequestInit,
    params?: Record<string, any>
  ): Promise<T> => {
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      setErrorStates(prev => ({ ...prev, [key]: null }));
      
      const requestKey = createRequestKey(url, params);
      
      const result = await deduplicateRequest(requestKey, async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.statusText}`);
        }
        return response.json();
      });

      setDataStates(prev => ({ ...prev, [key]: result }));
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setErrorStates(prev => ({ ...prev, [key]: errorMessage }));
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      throw err;
    }
  }, []);

  const resetLoadingForKey = useCallback((key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    setDataStates(prev => ({ ...prev, [key]: null }));
    setErrorStates(prev => ({ ...prev, [key]: null }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const getData = useCallback((key: string) => dataStates[key] || null, [dataStates]);
  const getError = useCallback((key: string) => errorStates[key] || null, [errorStates]);

  return { 
    fetchDataWithKey, 
    isLoading, 
    getData, 
    getError, 
    resetLoadingForKey 
  };
};
