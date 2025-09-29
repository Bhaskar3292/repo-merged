import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'role' | 'permission';
  className?: string;
}

/**
 * StatusBadge Component
 * Reusable badge component for displaying status, roles, permissions
 * Supports different variants with appropriate color schemes
 */
export function StatusBadge({ status, variant = 'default', className = '' }: StatusBadgeProps) {
  const getStatusColor = () => {
    if (variant === 'role') {
      switch (status.toLowerCase()) {
        case 'administrator':
          return 'bg-purple-100 text-purple-800';
        case 'operator':
          return 'bg-blue-100 text-blue-800';
        case 'viewer':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    if (variant === 'permission') {
      switch (status.toLowerCase()) {
        case 'read':
          return 'bg-green-100 text-green-800';
        case 'write':
        case 'update records':
          return 'bg-blue-100 text-blue-800';
        case 'delete':
          return 'bg-red-100 text-red-800';
        case 'manage users':
        case 'system config':
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    // Default variant for active/inactive status
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()} ${className}`}>
      {status}
    </span>
  );
}