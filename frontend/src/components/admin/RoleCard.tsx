import React, { useState } from 'react';
import { Shield, Settings, Users, Edit2, Trash2 } from 'lucide-react';
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

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (roleId: number) => void;
  onUpdatePermissions: (roleId: number, permissions: string[]) => void;
  onUpdateRole: (roleId: number, updates: Partial<Role>) => void;
}

/**
 * RoleCard Component
 * Interactive role display card with inline editing capabilities
 * Supports permission management, role editing, and deletion
 */
export function RoleCard({ 
  role, 
  onEdit, 
  onDelete, 
  onUpdatePermissions,
  onUpdateRole 
}: RoleCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editName, setEditName] = useState(role.name);
  const [editDescription, setEditDescription] = useState(role.description);

  const getRoleIcon = (roleName: string, color?: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      gray: 'bg-gray-100 text-gray-600'
    };

    return colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== role.name) {
      onUpdateRole(role.id, { name: editName.trim() });
    }
    setIsEditingName(false);
    setEditName(role.name);
  };

  const handleSaveDescription = () => {
    if (editDescription.trim() && editDescription !== role.description) {
      onUpdateRole(role.id, { description: editDescription.trim() });
    }
    setIsEditingDescription(false);
    setEditDescription(role.description);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditName(role.name);
  };

  const handleCancelDescriptionEdit = () => {
    setIsEditingDescription(false);
    setEditDescription(role.description);
  };

  const handleAddPermission = (permission: string) => {
    if (!role.permissions.includes(permission)) {
      onUpdatePermissions(role.id, [...role.permissions, permission]);
    }
  };

  const handleEditPermission = (oldPermission: string, newPermission: string) => {
    const updatedPermissions = role.permissions.map(p => 
      p === oldPermission ? newPermission : p
    );
    onUpdatePermissions(role.id, updatedPermissions);
  };

  const handleRemovePermission = (permission: string) => {
    onUpdatePermissions(role.id, role.permissions.filter(p => p !== permission));
  };

  const handleKeyDown = (e: React.KeyboardEvent, saveHandler: () => void, cancelHandler: () => void) => {
    if (e.key === 'Enter') {
      saveHandler();
    } else if (e.key === 'Escape') {
      cancelHandler();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg flex-shrink-0 ${getRoleIcon(role.name, role.color)}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Role Name */}
            {isEditingName ? (
              <div className="mb-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSaveName, handleCancelNameEdit)}
                  onBlur={handleSaveName}
                  className="text-lg font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2 mb-1 group/name">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{role.name}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover/name:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                  title="Edit role name"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* User Count */}
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{role.userCount} {role.userCount === 1 ? 'user' : 'users'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(role)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit role settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(role.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete role"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        {isEditingDescription ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveDescription();
              } else if (e.key === 'Escape') {
                handleCancelDescriptionEdit();
              }
            }}
            onBlur={handleSaveDescription}
            className="w-full text-sm text-gray-600 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <div className="group/desc">
            <p 
              className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
              onClick={() => setIsEditingDescription(true)}
              title="Click to edit description"
            >
              {role.description}
              <Edit2 className="h-3 w-3 inline ml-2 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
            </p>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Permissions:</p>
          <span className="text-xs text-gray-500">{role.permissions.length} permissions</span>
        </div>
        
        <div className="space-y-2">
          {/* Current Permissions */}
          {role.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission, index) => (
                <PermissionChip
                  key={`${role.id}-${permission}-${index}`}
                  permission={permission}
                  onEdit={handleEditPermission}
                  onRemove={handleRemovePermission}
                  editable={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No permissions assigned</p>
          )}

          {/* Add Permission */}
          <AddPermissionInput
            onAdd={handleAddPermission}
            existingPermissions={role.permissions}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(role)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Edit Role Settings
        </button>
      </div>
    </div>
  );
}