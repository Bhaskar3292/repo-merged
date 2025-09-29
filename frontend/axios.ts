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

    // Log requests in development
    if (ENABLE_LOGGING) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    if (ENABLE_LOGGING) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for token refresh and error handling
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (ENABLE_LOGGING) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log errors in development
    if (ENABLE_LOGGING) {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
        config: originalRequest
      });
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          if (ENABLE_LOGGING) {
            console.log('🔄 Attempting token refresh...');
          }

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

          if (ENABLE_LOGGING) {
            console.log('✅ Token refreshed successfully, retrying request...');
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        if (ENABLE_LOGGING) {
          console.error('❌ Token refresh failed:', refreshError);
        }
        
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        
        // Dispatch custom event for auth failure
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
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
          console.log('🔄 Token expiring soon, attempting refresh...');
          
          // Try to refresh token
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            api.post('/api/auth/token/refresh/', { refresh: refreshToken })
              .then(response => {
                const { access, refresh: newRefresh } = response.data;
                tokenManager.setTokens(access, newRefresh || refreshToken);
                console.log('✅ Token refreshed successfully');
              })
              .catch(() => {
                console.log('❌ Token refresh failed, logging out...');
                tokenManager.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:logout'));
              });
          }
        }
        
        // Check if token is already expired
        if (payload.exp && payload.exp < currentTime) {
          console.log('❌ Token expired, logging out...');
          tokenManager.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
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
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Debug API configuration
 */
export const debugApiConfig = () => {
  console.log('🔧 API Configuration Debug:', {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    enableLogging: ENABLE_LOGGING,
    hasAccessToken: !!tokenManager.getAccessToken(),
    hasRefreshToken: !!tokenManager.getRefreshToken(),
    isAuthenticated: tokenManager.isAuthenticated()
  });
};

export default api;