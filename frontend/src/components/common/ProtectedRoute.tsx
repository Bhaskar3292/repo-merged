/**
 * Protected Route Component
 * Wrapper component that ensures only authenticated users can access protected content
 * Automatically redirects to login if user is not authenticated
 */

import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute Component
 * Renders children only if user is authenticated and has required permissions
 */
export function ProtectedRoute({ 
  children, 
  requiredPermission,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuthContext();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return fallback || <Navigate to="/login" replace />;
  }

  // Check required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Access Denied!</strong>
            <span className="block sm:inline"> You don't have permission to access this page.</span>
          </div>
          <Navigate to="/locations" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}