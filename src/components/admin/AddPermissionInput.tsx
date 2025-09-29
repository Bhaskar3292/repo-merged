import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

interface AddPermissionInputProps {
  onAdd: (permission: string) => void;
  existingPermissions: string[];
}

/**
 * AddPermissionInput Component
 * Inline input for adding new permissions to a role
 * Prevents duplicate permissions and validates input
 */
export function AddPermissionInput({ onAdd, existingPermissions }: AddPermissionInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPermission, setNewPermission] = useState('');
  const [error, setError] = useState('');

  const commonPermissions = [
    'Read',
    'Write', 
    'Delete',
    'Manage Users',
    'System Config',
    'Update Records',
    'View Reports',
    'Export Data',
    'Manage Settings'
  ];

  const availablePermissions = commonPermissions.filter(
    perm => !existingPermissions.includes(perm)
  );

  const handleAdd = () => {
    const trimmed = newPermission.trim();
    
    if (!trimmed) {
      setError('Permission name is required');
      return;
    }

    if (existingPermissions.includes(trimmed)) {
      setError('Permission already exists');
      return;
    }

    onAdd(trimmed);
    setNewPermission('');
    setIsAdding(false);
    setError('');
  };

  const handleCancel = () => {
    setNewPermission('');
    setIsAdding(false);
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleQuickAdd = (permission: string) => {
    onAdd(permission);
  };

  if (!isAdding) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 border-dashed rounded-full hover:bg-blue-100 transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add Permission</span>
        </button>
        
        {availablePermissions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-500">Quick add:</span>
            {availablePermissions.slice(0, 3).map(permission => (
              <button
                key={permission}
                onClick={() => handleQuickAdd(permission)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                {permission}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white border-2 border-blue-300 rounded-full">
        <input
          type="text"
          value={newPermission}
          onChange={(e) => {
            setNewPermission(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Permission name"
          className="text-xs font-medium bg-transparent border-none outline-none w-24 min-w-0"
          autoFocus
        />
        <button
          onClick={handleAdd}
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
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}