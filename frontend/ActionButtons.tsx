import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

/**
 * ActionButtons Component
 * Provides consistent action buttons for table rows
 * Includes View, Edit, and Delete actions with hover states
 */
export function ActionButtons({ onView, onEdit, onDelete, className = '' }: ActionButtonsProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        onClick={onView}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="View user details"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={onEdit}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Edit user"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Delete user"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}