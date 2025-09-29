/**
 * Registration Page Component
 * Handles new user account creation with validation
 */

import React from 'react';
import { AuthForm } from '../components/AuthForm';
import { useAuthContext } from '../contexts/AuthContext';
import { User, Mail, Lock, Phone, Building2 } from 'lucide-react';

/**
 * Register Page Component
 * Provides registration form with comprehensive validation
 */
export function Register() {
  const { register, isLoading, error, clearError } = useAuthContext();

  const registerFields = [
    {
      name: 'first_name',
      label: 'First Name',
      type: 'text' as const,
      placeholder: 'Enter your first name',
      required: true,
      icon: User,
    },
    {
      name: 'last_name',
      label: 'Last Name',
      type: 'text' as const,
      placeholder: 'Enter your last name',
      required: true,
      icon: User,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text' as const,
      placeholder: 'Choose a username',
      required: true,
      icon: User,
      validation: (value: string) => {
        if (value.length < 3) {
          return 'Username must be at least 3 characters long';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return 'Username can only contain letters, numbers, and underscores';
        }
        return null;
      },
    },
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
      placeholder: 'Create a password',
      required: true,
      icon: Lock,
      validation: (value: string) => {
        if (value.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return null;
      },
    },
    {
      name: 'password_confirm',
      label: 'Confirm Password',
      type: 'password' as const,
      placeholder: 'Confirm your password',
      required: true,
      icon: Lock,
    },
    {
      name: 'organization',
      label: 'Organization',
      type: 'text' as const,
      placeholder: 'Enter your organization (optional)',
      required: false,
      icon: Building2,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel' as const,
      placeholder: 'Enter your phone number (optional)',
      required: false,
      icon: Phone,
      validation: (value: string) => {
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          return 'Please enter a valid phone number';
        }
        return null;
      },
    },
  ];

  /**
   * Handle registration form submission
   */
  const handleRegister = async (formData: Record<string, string>) => {
    clearError();

    // Validate password confirmation
    if (formData.password !== formData.password_confirm) {
      // This should be handled by the form validation, but double-check
      return;
    }

    const success = await register({
      email: formData.email,
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      password: formData.password,
      password_confirm: formData.password_confirm,
      organization: formData.organization || '',
      phone: formData.phone || '',
    });

    if (success) {
      // Show success message or navigate to verification page
      console.log('Registration successful - check email for verification');
    }
  };

  return (
    <AuthForm
      title="Create Account"
      subtitle="Join our facility management platform"
      fields={registerFields}
      submitText="Create Account"
      isLoading={isLoading}
      error={error}
      onSubmit={handleRegister}
    >
      <div className="text-center">
        <div className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            onClick={() => {
              // Navigate to login page
              console.log('Navigate to login');
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </AuthForm>
  );
}