/**
 * Authentication hook for managing user authentication state
 * Provides login, logout, registration, and user management functions
 */

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { startTokenExpiryMonitoring } from '../api/axios';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  RegisterResponse,
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

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
    
    // Start token expiry monitoring
    const stopMonitoring = startTokenExpiryMonitoring();
    
    // Listen for auth logout events
    const handleAuthLogout = () => {
      logout();
    };
    
    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      stopMonitoring();
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  /**
   * Initialize authentication state from stored data
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          // Optionally refresh user data from server
          await refreshUser();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear invalid stored data
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

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

      const response = await apiService.register(data);
      // Don't automatically log in after registration
      // User may need to verify email first
      
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
   * User logout
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Starting logout process...');
      await apiService.logout();
      console.log('Logout API call completed');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't prevent logout on error - always clear local state
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
      console.log('Logout process completed - user state cleared');
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
      
      // Refresh user data to update verification status
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
   * Refresh user data from server
   */
  const refreshUser = async (): Promise<void> => {
    try {
      if (apiService.isAuthenticated()) {
        const userData = await apiService.getUserProfile();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to re-authenticate
      await logout();
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Superusers have all permissions
    if (user.is_superuser) return true;
    
    // Check against stored permissions from API
    const storedPermissions = localStorage.getItem('user_permissions');
    if (storedPermissions) {
      try {
        const permissions = JSON.parse(storedPermissions);
        return permissions[permission]?.granted || false;
      } catch (error) {
        console.error('Error parsing stored permissions:', error);
      }
    }
    
    // Fallback to role-based permissions
    const rolePermissions = {
      admin: [
        'view_dashboard', 'view_locations', 'view_facilities', 'view_tank_management',
        'view_release_detection', 'view_permits', 'view_admin_panel', 'view_users',
        'add_location', 'edit_location', 'delete_location', 'add_tank', 'edit_tank',
        'delete_tank', 'add_permit', 'edit_permit', 'delete_permit', 'add_user',
        'edit_user', 'delete_user', 'manage_permissions', 'system_config'
      ],
      contributor: [
        'view_dashboard', 'view_locations', 'view_facilities', 'view_tank_management',
        'view_release_detection', 'view_permits', 'add_location', 'edit_location',
        'add_tank', 'edit_tank', 'add_permit', 'edit_permit', 'edit_facility_dashboard'
      ],
      viewer: [
        'view_dashboard', 'view_locations', 'view_facilities', 'view_tank_management',
        'view_release_detection', 'view_permits'
      ]
    };
    
    const userRole = user.effective_role || user.role;
    return rolePermissions[userRole as keyof typeof rolePermissions]?.includes(permission) || false;
  };

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