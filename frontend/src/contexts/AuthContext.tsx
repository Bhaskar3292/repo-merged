/**
 * Authentication Context Provider
 * Provides global authentication state and functions throughout the app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  LoginRequest, 
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerification
} from '../types/auth';

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps the app to provide authentication context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  
  // Handle automatic logout on token expiry
  React.useEffect(() => {
    const handleAutoLogout = async () => {
      console.log('🔒 Auto-logout triggered due to token expiry');
      await auth.logout();
      navigate('/login', { replace: true });
    };
    
    window.addEventListener('auth:logout', handleAutoLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, [auth, navigate]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };