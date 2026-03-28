'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkTokenExpiration: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if token is expired
  const checkTokenExpiration = (): boolean => {
    if (!token) return false;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        return true; // Token is expired
      }
      return false;
    } catch (error) {
      return true; // If we can't decode, consider it expired
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('adminToken');
      
      if (storedToken) {
        // Check if token is expired
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (payload.exp && payload.exp < currentTime) {
            // Token is expired, clear it and redirect to login
            localStorage.removeItem('adminToken');
            setToken(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            toast.error('Your session has expired. Please login again.');
            router.push('/login');
          } else {
            setToken(storedToken);
            setIsAuthenticated(true);
            setIsLoading(false);
          }
        } catch (error) {
          localStorage.removeItem('adminToken');
          setToken(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkInterval = setInterval(() => {
      if (checkTokenExpiration()) {
        logout();
        toast.error('Your session has expired. Please login again.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    router.push('/login');
  };

  const value: AuthContextType = {
    isAuthenticated,
    token,
    isLoading,
    login,
    logout,
    checkTokenExpiration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
