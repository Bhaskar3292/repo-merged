import React from 'react';

interface StatusBadgeProps {
  status: 'Active' | 'Inactive';
  className?: string;
}

/**
 * StatusBadge Component
 * Displays user status with appropriate colors
 * Reusable for different status display contexts
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusStyles()} ${className}`}>
      {status}
    </span>
  );
}