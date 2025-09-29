import React from 'react';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

/**
 * RoleBadge Component
 * Displays user role with semantic colors
 * Supports Administrator, Operator, Viewer roles
 */
export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const getRoleStyles = () => {
    switch (role.toLowerCase()) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'operator':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleStyles()} ${className}`}>
      {role}
    </span>
  );
}