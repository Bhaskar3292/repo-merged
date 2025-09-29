import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';
import { ActionButtons } from './ActionButtons';
import { UserForm, User } from './UserForm';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * UserTable Component
 * Complete user management interface with inline editing, CRUD operations
 * Includes search/filter, add user modal, delete confirmation
 */
export function UserTable() {
  // Mock data - replace with API calls in production
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'John Admin',
      email: 'admin@facility.com',
      role: 'Administrator',
      status: 'Active',
      lastLogin: '2024-01-16',
      facilities: ['All Facilities']
    },
    {
      id: 2,
      name: 'Jane Operator',
      email: 'operator@facility.com',
      role: 'Operator',
      status: 'Active',
      lastLogin: '2024-01-15',
      facilities: ['Downtown Station A', 'Highway 101 Facility']
    },
    {
      id: 3,
      name: 'Bob Viewer',
      email: 'viewer@facility.com',
      role: 'Viewer',
      status: 'Inactive',
      lastLogin: '2024-01-10',
      facilities: ['Industrial Park B']
    },
    {
      id: 4,
      name: 'Sarah Manager',
      email: 'sarah@facility.com',
      role: 'Operator',
      status: 'Active',
      lastLogin: '2024-01-16',
      facilities: ['Westside Complex', 'Eastside Terminal']
    },
    {
      id: 5,
      name: 'Mike Inspector',
      email: 'mike@facility.com',
      role: 'Viewer',
      status: 'Active',
      lastLogin: '2024-01-14',
      facilities: ['Downtown Station A']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [userFormState, setUserFormState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit' | 'view';
    user?: User;
  }>({
    isOpen: false,
    mode: 'add'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    user?: User;
  }>({
    isOpen: false
  });

  const availableRoles = ['Administrator', 'Operator', 'Viewer'];
  const availableStatuses = ['Active', 'Inactive'];

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      user.status.toLowerCase().includes(term) ||
      user.facilities.some(facility => facility.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  // CRUD Operations
  const handleUpdateUser = (userId: number, field: keyof User, value: any) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ));
  };

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Math.max(...users.map(u => u.id)) + 1
    };
    setUsers(prev => [...prev, newUser]);
  };

  const handleEditUser = (userData: User) => {
    setUsers(prev => prev.map(user => 
      user.id === userData.id ? userData : user
    ));
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    setDeleteConfirm({ isOpen: false });
  };

  // Modal handlers
  const openUserForm = (mode: 'add' | 'edit' | 'view', user?: User) => {
    setUserFormState({ isOpen: true, mode, user });
  };

  const closeUserForm = () => {
    setUserFormState({ isOpen: false, mode: 'add' });
  };

  const handleUserFormSave = (userData: Omit<User, 'id'> | User) => {
    if (userFormState.mode === 'add') {
      handleAddUser(userData as Omit<User, 'id'>);
    } else if (userFormState.mode === 'edit') {
      handleEditUser(userData as User);
    }
  };

  const openDeleteConfirm = (user: User) => {
    setDeleteConfirm({ isOpen: true, user });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, role, status, or facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => openUserForm('add')}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
          {searchTerm && (
            <span className="ml-1">
              matching "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facilities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <EditableCell
                        value={user.name}
                        onSave={(value) => handleUpdateUser(user.id, 'name', value)}
                        placeholder="Enter name"
                      />
                      <EditableCell
                        value={user.email}
                        onSave={(value) => handleUpdateUser(user.id, 'email', value)}
                        type="email"
                        placeholder="Enter email"
                        className="text-sm text-gray-600"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <EditableCell
                      value={user.role}
                      onSave={(value) => handleUpdateUser(user.id, 'role', value)}
                      type="select"
                      options={availableRoles}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <EditableCell
                      value={user.status}
                      onSave={(value) => handleUpdateUser(user.id, 'status', value as 'Active' | 'Inactive')}
                      type="select"
                      options={availableStatuses}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <EditableCell
                      value={user.lastLogin}
                      onSave={(value) => handleUpdateUser(user.id, 'lastLogin', value)}
                      type="date"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.facilities.length > 0 ? (
                        user.facilities.slice(0, 2).map((facility, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {facility}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">None assigned</span>
                      )}
                      {user.facilities.length > 2 && (
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{user.facilities.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ActionButtons
                      onView={() => openUserForm('view', user)}
                      onEdit={() => openUserForm('edit', user)}
                      onDelete={() => openDeleteConfirm(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <EditableCell
                      value={user.name}
                      onSave={(value) => handleUpdateUser(user.id, 'name', value)}
                      className="font-medium text-gray-900"
                    />
                    <EditableCell
                      value={user.email}
                      onSave={(value) => handleUpdateUser(user.id, 'email', value)}
                      type="email"
                      className="text-sm text-gray-600"
                    />
                  </div>
                </div>
                <ActionButtons
                  onView={() => openUserForm('view', user)}
                  onEdit={() => openUserForm('edit', user)}
                  onDelete={() => openDeleteConfirm(user)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Role:</span>
                  <div className="mt-1">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={user.status} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Last Login:</span>
                  <div className="mt-1">
                    <EditableCell
                      value={user.lastLogin}
                      onSave={(value) => handleUpdateUser(user.id, 'lastLogin', value)}
                      type="date"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Facilities:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.facilities.length > 0 ? (
                      user.facilities.slice(0, 1).map((facility, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {facility}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                    {user.facilities.length > 1 && (
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.facilities.length - 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No users match your search for "${searchTerm}"`
                : 'Get started by adding your first user.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => openUserForm('add')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add First User</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserForm
        user={userFormState.user}
        isOpen={userFormState.isOpen}
        onClose={closeUserForm}
        onSave={handleUserFormSave}
        mode={userFormState.mode}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.user?.name}? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={() => deleteConfirm.user && handleDeleteUser(deleteConfirm.user.id)}
        onCancel={closeDeleteConfirm}
        type="danger"
      />
    </div>
  );
}