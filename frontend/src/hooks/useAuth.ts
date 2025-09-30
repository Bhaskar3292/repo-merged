/**
 * Authentication hook for managing user authentication state
 * Provides login, logout, registration, and user management functions
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { startTokenExpiryMonitoring } from '../api/axios';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerification
} from '../types/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequest) => Promise<boolean>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<boolean>;
  verifyEmail: (data: EmailVerification) => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- FIX: MOVED LOGOUT AND REFRESHUSER FUNCTIONS UP -----
  
  /**
   * User logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getUserProfile();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      await logout();
    }
  }, [logout]);

  /**
   * Initialize authentication state from stored data
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          await refreshUser();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout, refreshUser]);

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
    
    const stopMonitoring = startTokenExpiryMonitoring();
    
    const handleAuthLogout = () => {
      logout();
    };
    
    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      stopMonitoring();
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [initializeAuth, logout]);
  
  // ----------------------------------------------------------------

  /**
   * User login
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login(credentials);
      setUser(response.user);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * User registration
   */
  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.register(data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset
   */
  const requestPasswordReset = async (data: PasswordResetRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.requestPasswordReset(data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirm password reset
   */
  const confirmPasswordReset = async (data: PasswordResetConfirm): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.confirmPasswordReset(data);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify email address
   */
  const verifyEmail = async (data: EmailVerification): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.verifyEmail(data);
      await refreshUser();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    if (user.is_superuser) return true;
    
    // This is a placeholder for a more robust permission system
    // In a real app, you would fetch and store user-specific permissions
    const rolePermissions = {
      admin: ['view_dashboard', 'view_admin_panel', 'edit_user', 'delete_user'],
      contributor: ['view_dashboard', 'edit_content'],
      viewer: ['view_dashboard']
    };
    
    const userRole = user.effective_role || user.role;
    return rolePermissions[userRole as keyof typeof rolePermissions]?.includes(permission) || false;
  }, [user]);

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    isAuthenticated: !!user && apiService.isAuthenticated(),
    isLoading,
    error,
    login,
    register,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    verifyEmail,
    clearError,
    refreshUser,
    hasPermission,
  };
}