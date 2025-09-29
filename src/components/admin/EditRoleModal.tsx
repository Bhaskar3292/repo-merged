import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Users, Plus } from 'lucide-react';
import { PermissionChip } from './PermissionChip';
import { AddPermissionInput } from './AddPermissionInput';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  color?: string;
}

interface EditRoleModalProps {
  role?: Role;
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id'> | Role) => void;
  mode: 'add' | 'edit';
}

/**
 * EditRoleModal Component
 * Comprehensive modal for adding and editing roles
 * Includes permission management, validation, and user assignment
 */
export function EditRoleModal({ role, isOpen, onClose, onSave, mode }: EditRoleModalProps) {
  const [formData, setFormData] = useState<Omit<Role, 'id'>>({
    name: '',
    description: '',
    permissions: [],
    userCount: 0,
    color: 'blue'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleColors = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-800' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-800' },
    { value: 'green', label: 'Green', class: 'bg-green-100 text-green-800' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-800' },
    { value: 'red', label: 'Red', class: 'bg-red-100 text-red-800' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
        userCount: role.userCount,
        color: role.color || 'blue'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        userCount: 0,
        color: 'blue'
      });
    }
    setErrors({});
  }, [role, isOpen, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Role description is required';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (role && mode === 'edit') {
      onSave({ ...role, ...formData });
    } else {
      onSave(formData);
    }
    
    onClose();
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddPermission = (permission: string) => {
    if (!formData.permissions.includes(permission)) {
      updateFormData('permissions', [...formData.permissions, permission]);
    }
  };

  const handleEditPermission = (oldPermission: string, newPermission: string) => {
    const updatedPermissions = formData.permissions.map(p => 
      p === oldPermission ? newPermission : p
    );
    updateFormData('permissions', updatedPermissions);
  };

  const handleRemovePermission = (permission: string) => {
    updateFormData('permissions', formData.permissions.filter(p => p !== permission));
  };

  const getTitle = () => {
    return mode === 'add' ? 'Add New Role' : 'Edit Role';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Administrator"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Color
              </label>
              <select
                value={formData.color}
                onChange={(e) => updateFormData('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleColors.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the role's responsibilities and access level..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* User Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Current Users
            </label>
            <input
              type="number"
              value={formData.userCount}
              onChange={(e) => updateFormData('userCount', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions *
            </label>
            
            {/* Current Permissions */}
            <div className="space-y-3">
              {formData.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((permission, index) => (
                    <PermissionChip
                      key={`${permission}-${index}`}
                      permission={permission}
                      onEdit={handleEditPermission}
                      onRemove={handleRemovePermission}
                      editable={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No permissions assigned</p>
              )}

              {/* Add Permission */}
              <AddPermissionInput
                onAdd={handleAddPermission}
                existingPermissions={formData.permissions}
              />
            </div>

            {errors.permissions && (
              <p className="mt-1 text-sm text-red-600">{errors.permissions}</p>
            )}
          </div>

          {/* Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  roleColors.find(c => c.value === formData.color)?.class || 'bg-blue-100 text-blue-600'
                }`}>
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{formData.name || 'Role Name'}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>{formData.userCount} {formData.userCount === 1 ? 'user' : 'users'}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{formData.description || 'Role description'}</p>
              <div className="flex flex-wrap gap-1">
                {formData.permissions.map((permission, index) => (
                  <PermissionChip
                    key={`preview-${permission}-${index}`}
                    permission={permission}
                    onEdit={() => {}}
                    onRemove={() => {}}
                    editable={false}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{mode === 'add' ? 'Create Role' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}