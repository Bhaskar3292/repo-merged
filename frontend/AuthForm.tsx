/**
 * Shared Authentication Form Component
 * Reusable form component for login and registration with validation
 */

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Building2 } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel';
  placeholder: string;
  required: boolean;
  icon: React.ComponentType<{ className?: string }>;
  validation?: (value: string) => string | null;
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: FormField[];
  submitText: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (data: Record<string, string>) => void;
  children?: React.ReactNode;
}

/**
 * AuthForm Component
 * Provides consistent form UI for authentication flows
 */
export function AuthForm({
  title,
  subtitle,
  fields,
  submitText,
  isLoading,
  error,
  onSubmit,
  children
}: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  /**
   * Handle input change with validation
   */
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate individual field
   */
  const validateField = (field: FormField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    // Built-in validations
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    return null;
  };

  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name] || '';
      const error = validateField(field, value);
      if (error) {
        errors[field.name] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => {
            const Icon = field.icon;
            const isPassword = field.type === 'password';
            const showPassword = showPasswords[field.name];
            const fieldError = fieldErrors[field.name];

            return (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={field.placeholder}
                    disabled={isLoading}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.name)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600">{fieldError}</p>
                )}
              </div>
            );
          })}

          {/* Global Error */}
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              submitText
            )}
          </button>
        </form>

        {/* Additional Content */}
        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}