import React, { useState } from 'react';
import { Plus, Search, Shield } from 'lucide-react';
import { RoleCard, Role } from './RoleCard';
import { EditRoleModal } from './EditRoleModal';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * RolesPermissionsManager Component
 * Complete roles and permissions management system
 * Handles CRUD operations for roles and their permissions
 */
export function RolesPermissionsManager() {
  // Mock data - replace with API calls in production
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 1,
      name: 'Administrator',
      description: 'Full system access and management capabilities including user management and system configuration',
      permissions: ['Read', 'Write', 'Delete', 'Manage Users', 'System Config'],
      userCount: 2,
      color: 'purple'
    },
    {
      id: 2,
      name: 'Operator',
      description: 'Facility operation and monitoring with write access to operational data and records',
      permissions: ['Read', 'Write', 'Update Records'],
      userCount: 5,
      color: 'blue'
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Read-only access to assigned facilities and basic reporting capabilities',
      permissions: ['Read'],
      userCount: 8,
      color: 'green'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleModalState, setRoleModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    role?: Role;
  }>({
    isOpen: false,
    mode: 'add'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    role?: Role;
  }>({
    isOpen: false
  });

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.permissions.some(permission => 
      permission.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // CRUD Operations
  const handleAddRole = (roleData: Omit<Role, 'id'>) => {
    const newRole: Role = {
      ...roleData,
      id: Math.max(...roles.map(r => r.id)) + 1
    };
    setRoles(prev => [...prev, newRole]);
  };

  const handleEditRole = (roleData: Role) => {
    setRoles(prev => prev.map(role => 
      role.id === roleData.id ? roleData : role
    ));
  };

  const handleDeleteRole = (roleId: number) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    setDeleteConfirm({ isOpen: false });
  };

  const handleUpdatePermissions = (roleId: number, permissions: string[]) => {
    setRoles(prev => prev.map(role =>
      role.id === roleId ? { ...role, permissions } : role
    ));
  };

  const handleUpdateRole = (roleId: number, updates: Partial<Role>) => {
    setRoles(prev => prev.map(role =>
      role.id === roleId ? { ...role, ...updates } : role
    ));
  };

  // Modal handlers
  const openRoleModal = (mode: 'add' | 'edit', role?: Role) => {
    setRoleModalState({ isOpen: true, mode, role });
  };

  const closeRoleModal = () => {
    setRoleModalState({ isOpen: false, mode: 'add' });
  };

  const handleRoleModalSave = (roleData: Omit<Role, 'id'> | Role) => {
    if (roleModalState.mode === 'add') {
      handleAddRole(roleData as Omit<Role, 'id'>);
    } else if (roleModalState.mode === 'edit') {
      handleEditRole(roleData as Role);
    }
  };

  const openDeleteConfirm = (role: Role) => {
    setDeleteConfirm({ isOpen: true, role });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false });
  };

  const getTotalUsers = () => {
    return roles.reduce((total, role) => total + role.userCount, 0);
  };

  const getTotalPermissions = () => {
    const allPermissions = new Set();
    roles.forEach(role => {
      role.permissions.forEach(permission => allPermissions.add(permission));
    });
    return allPermissions.size;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and their permissions • {roles.length} roles • {getTotalUsers()} users • {getTotalPermissions()} unique permissions
          </p>
        </div>
        <button
          onClick={() => openRoleModal('add')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles by name, description, or permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredRoles.length} of {roles.length} roles
          {searchTerm && (
            <span className="ml-1">
              matching "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onEdit={(role) => openRoleModal('edit', role)}
            onDelete={(roleId) => {
              const role = roles.find(r => r.id === roleId);
              if (role) openDeleteConfirm(role);
            }}
            onUpdatePermissions={handleUpdatePermissions}
            onUpdateRole={handleUpdateRole}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No roles found' : 'No roles yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No roles match your search for "${searchTerm}"`
              : 'Get started by creating your first role.'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => openRoleModal('add')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Role</span>
            </button>
          )}
        </div>
      )}

      {/* Role Modal */}
      <EditRoleModal
        role={roleModalState.role}
        isOpen={roleModalState.isOpen}
        onClose={closeRoleModal}
        onSave={handleRoleModalSave}
        mode={roleModalState.mode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Role"
        message={`Are you sure you want to delete the "${deleteConfirm.role?.name}" role? This will affect ${deleteConfirm.role?.userCount} user(s) and cannot be undone.`}
        confirmText="Delete Role"
        cancelText="Cancel"
        onConfirm={() => deleteConfirm.role && handleDeleteRole(deleteConfirm.role.id)}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}