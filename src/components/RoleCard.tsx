import React from 'react';
import { Shield, Settings, Users } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
}

/**
 * RoleCard Component
 * Displays role information in a card format with permissions
 * Reusable for different role management contexts
 */
export function RoleCard({ role, onEdit }: RoleCardProps) {
  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'administrator':
        return 'bg-purple-100 text-purple-600';
      case 'operator':
        return 'bg-blue-100 text-blue-600';
      case 'viewer':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission.toLowerCase()) {
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
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getRoleIcon(role.name)}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{role.userCount} {role.userCount === 1 ? 'user' : 'users'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onEdit(role)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit role"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{role.description}</p>

      {/* Permissions */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Permissions:</p>
        <div className="flex flex-wrap gap-2">
          {role.permissions.map((permission, index) => (
            <span
              key={index}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(permission)}`}
            >
              {permission}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onEdit(role)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit Role Settings
        </button>
      </div>
    </div>
  );
}