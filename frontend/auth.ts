/**
 * Authentication related TypeScript interfaces
 * Defines types for user data, tokens, and API responses
 */

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'contributor' | 'viewer';
  is_superuser?: boolean;
  effective_role?: string;
  organization?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  two_factor_enabled?: boolean;
  is_account_locked?: boolean;
  last_login?: string;
  
  // Computed properties
  name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp_token?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  organization?: string;
  phone?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: any;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  password_confirm: string;
}

export interface EmailVerification {
  token: string;
}