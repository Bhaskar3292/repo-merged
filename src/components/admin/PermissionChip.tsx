import React, { useState } from 'react';
import { X, Edit2, Check } from 'lucide-react';

interface PermissionChipProps {
  permission: string;
  onEdit: (oldPermission: string, newPermission: string) => void;
  onRemove: (permission: string) => void;
  editable?: boolean;
  variant?: 'default' | 'compact';
}

/**
 * PermissionChip Component
 * Interactive permission display with inline editing and removal
 * Supports different variants and edit modes
 */
export function PermissionChip({ 
  permission, 
  onEdit, 
  onRemove, 
  editable = true,
  variant = 'default' 
}: PermissionChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(permission);

  const getPermissionColor = (perm: string) => {
    switch (perm.toLowerCase()) {
      case 'read':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'write':
      case 'update records':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manage users':
      case 'system config':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== permission) {
      onEdit(permission, editValue.trim());
    }
    setIsEditing(false);
    setEditValue(permission);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(permission);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white border-2 border-blue-300 rounded-full">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-xs font-medium bg-transparent border-none outline-none w-20 min-w-0"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-0.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-0.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <span className={`group inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border transition-all ${getPermissionColor(permission)} ${
      editable ? 'hover:shadow-sm cursor-pointer' : ''
    }`}>
      <span>{permission}</span>
      {editable && (
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
            title="Edit permission"
          >
            <Edit2 className="h-2.5 w-2.5" />
          </button>
          <button
            onClick={() => onRemove(permission)}
            className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
            title="Remove permission"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </span>
  );
}