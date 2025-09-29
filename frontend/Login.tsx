/**
 * Login Page Component
 * Handles user authentication with email and password
 */

import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useAuthContext } from '../contexts/AuthContext';
import { User, Mail, Lock } from 'lucide-react';

/**
 * Login Page Component
 * Provides login form with validation and error handling
 */
export function Login() {
  const { login, isLoading, error, clearError } = useAuthContext();

  const loginFields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email' as const,
      placeholder: 'Enter your email',
      required: true,
      icon: Mail,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Enter your password',
      required: true,
      icon: Lock,
    },
  ];

  /**
   * Handle login form submission
   */
  const handleLogin = async (formData: Record<string, string>) => {
    clearError();
    
    const success = await login({
      email: formData.email,
      password: formData.password,
    });

    if (success) {
      // Navigation will be handled by the app's routing logic
      console.log('Login successful');
    }
  };

  return (
    <AuthForm
      title="Facility Management"
      subtitle="Sign in to your account"
      fields={loginFields}
      submitText="Sign In"
      isLoading={isLoading}
      error={error}
      onSubmit={handleLogin}
    >
      <div className="text-center space-y-4">
        <div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            onClick={() => {
              // Navigate to forgot password page
              console.log('Navigate to forgot password');
            }}
          >
            Forgot Password?
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            onClick={() => {
              // Navigate to registration page
              console.log('Navigate to registration');
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </AuthForm>
  );
}