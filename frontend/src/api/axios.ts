/**
 * Centralized Axios configuration for API requests
 * Handles authentication, error handling, token management, and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuration from environment variables
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
const ENABLE_LOGGING = import.meta.env.VITE_ENABLE_API_LOGGING === 'true';

// Token management
const TOKEN_STORAGE_KEY = 'access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
const USER_STORAGE_KEY = 'user';

/**
 * Create Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure we use HTTP in development
  withCredentials: false,
});

/**
 * Token management utilities
 */
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  /**
   * Clear all authentication data from storage
   * Use this when user logs out or session becomes invalid
   */
  clearAllAuthData: (): void => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any other auth-related items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('token') || key.includes('auth') || key.includes('user'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  isAuthenticated: (): boolean => {
    return !!(tokenManager.getAccessToken() && tokenManager.getRefreshToken());
  }
};

/**
 * Request interceptor to add authentication token and logging
 */
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for token refresh and error handling
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          // Create a new axios instance for refresh to avoid interceptor loops
          const refreshApi = axios.create({
            baseURL: API_BASE_URL,
            timeout: API_TIMEOUT,
          });

          const response = await refreshApi.post('/api/auth/token/refresh/', {
            refresh: refreshToken,
          });

          const { access, refresh: newRefresh } = response.data;
          
          // Update stored tokens
          tokenManager.setTokens(access, newRefresh || refreshToken);

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Check if backend explicitly requested token clearing
        const shouldClearTokens =
          refreshError?.response?.data?.action === 'clear_tokens' ||
          refreshError?.response?.data?.error === 'user_not_found' ||
          refreshError?.response?.data?.error === 'invalid_token' ||
          refreshError?.response?.data?.error === 'user_inactive';

        if (shouldClearTokens) {
          console.warn('🔒 Token refresh failed - clearing all auth data:', refreshError?.response?.data?.detail);

          // Clear all stored authentication data
          tokenManager.clearAllAuthData();

          // Dispatch custom event for auth failure
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: {
              reason: refreshError?.response?.data?.error || 'token_refresh_failed',
              message: refreshError?.response?.data?.detail || 'Session expired. Please log in again.'
            }
          }));
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      const enhancedError = new Error(
        `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the Django server is running.`
      );
      return Promise.reject(enhancedError);
    }

    // Handle SSL protocol errors specifically
    if (error.message.includes('ERR_SSL_PROTOCOL_ERROR')) {
      const enhancedError = new Error(
        `SSL Protocol Error: The backend server at ${API_BASE_URL} does not support HTTPS. Please check your API URL configuration.`
      );
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

/**
 * Token expiry monitoring
 */
export const startTokenExpiryMonitoring = () => {
  // Check token expiry every minute
  const checkInterval = setInterval(() => {
    const token = tokenManager.getAccessToken();
    if (token) {
      try {
        // Decode JWT token to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token expires in the next 5 minutes
        if (payload.exp && payload.exp - currentTime < 300) {
          // Try to refresh token
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            api.post('/api/auth/token/refresh/', { refresh: refreshToken })
              .then(response => {
                const { access, refresh: newRefresh } = response.data;
                tokenManager.setTokens(access, newRefresh || refreshToken);
              })
              .catch((error: any) => {
                // Handle token refresh failure gracefully
                const shouldClearTokens =
                  error?.response?.data?.action === 'clear_tokens' ||
                  error?.response?.data?.error === 'user_not_found' ||
                  error?.response?.data?.error === 'invalid_token' ||
                  error?.response?.data?.error === 'user_inactive';

                if (shouldClearTokens) {
                  tokenManager.clearAllAuthData();
                  window.dispatchEvent(new CustomEvent('auth:logout', {
                    detail: {
                      reason: error?.response?.data?.error || 'token_expired',
                      message: error?.response?.data?.detail || 'Session expired'
                    }
                  }));
                }
              });
          }
        }
        
        // Check if token is already expired
        if (payload.exp && payload.exp < currentTime) {
          tokenManager.clearAllAuthData();
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: {
              reason: 'token_expired',
              message: 'Your session has expired'
            }
          }));
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }, 60000); // Check every minute
  
  return () => clearInterval(checkInterval);
};
/**
 * API health check
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health/`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export default api;