import React, { useState, useEffect } from 'react';
import { Users, Plus, CreditCard as Edit, Trash2, Save, X, UserPlus, Search, Shield, Lock, TriangleAlert as AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'contributor' | 'viewer';
  is_active: boolean;
  created_at: string;
  two_factor_enabled?: boolean;
  is_account_locked?: boolean;
  failed_login_attempts?: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'viewer' as const,
    first_name: '',
    last_name: ''
  });
  
  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users from API...');
      const data = await apiService.getUsers();
      console.log('Users loaded:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Users load error:', error);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setFormLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate required fields
      if (!newUser.username.trim()) {
        setError('Username is required');
        return;
      }
      
      if (!newUser.password.trim()) {
        setError('Password is required');
        return;
      }
      
      if (newUser.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      
      // Check if user is authenticated
      if (!currentUser) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Check permissions
      if (!currentUser.is_superuser && !hasPermission('create_users')) {
        setError('You do not have permission to create users.');
        return;
      }
      
      console.log('Creating user with data:', newUser);
      
      const createdUser = await apiService.createUser(newUser);
      console.log('User created successfully:', createdUser);
      
      // Reload the entire user list to ensure consistency
      await loadUsers();
      
      setShowCreateModal(false);
      setNewUser({
        username: '',
        password: '',
        role: 'viewer',
        first_name: '',
        last_name: ''
      });
      
      setSuccess(`User "${newUser.username}" created successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Create user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      setError(null);
      console.log('Updating user:', user);
      
      const updatedUser = await apiService.updateUser(user.id, {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active
      });
      
      console.log('User updated successfully:', updatedUser);
      
      // Reload the entire user list to ensure consistency
      await loadUsers();
      setEditingUser(null);
      setSuccess('User updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Update user error:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        setError(null);
        console.log('Deleting user:', userId);
        
        await apiService.deleteUser(userId);
        console.log('User deleted successfully');
        
        // Reload the entire user list to ensure consistency
        await loadUsers();
        setSuccess(`User "${username}" deleted successfully!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
      } catch (error) {
        console.error('Delete user error:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleUnlockAccount = async (userId: number, username: string) => {
    try {
      setError(null);
      await apiService.unlockUserAccount(userId);
      await loadUsers(); // Refresh user list
      setSuccess(`Account "${username}" unlocked successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Unlock account error:', error);
      setError('Failed to unlock account');
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'contributor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score < 3) return { strength: 'Weak', color: 'text-red-600' };
    if (score < 4) return { strength: 'Fair', color: 'text-yellow-600' };
    if (score < 5) return { strength: 'Good', color: 'text-blue-600' };
    return { strength: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(newUser.password);

  if (!currentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Required</h3>
        <p className="text-red-700">Please log in to view users.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
        
        {(currentUser?.is_superuser || hasPermission('create_users')) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
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
                Security
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingUser?.id === user.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Username"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editingUser.first_name}
                          onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="First name"
                        />
                        <input
                          type="text"
                          value={editingUser.last_name}
                          onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      {user.email && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                      <div className="text-sm text-gray-500">{user.first_name} {user.last_name}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingUser?.id === user.id ? (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="admin">Administrator</option>
                      <option value="contributor">Contributor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'admin' ? 'Administrator' : user.role === 'contributor' ? 'Contributor' : 'Viewer'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setEditingUser({...editingUser, is_active: e.target.value === 'active'})}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                    {user.is_account_locked && (
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Locked
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        2FA: {user.two_factor_enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                    {user.failed_login_attempts && user.failed_login_attempts > 0 && (
                      <div className="text-xs text-yellow-600">
                        {user.failed_login_attempts} failed attempts
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {editingUser?.id === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateUser(editingUser)}
                          className="text-green-600 hover:text-green-800"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Cancel edit"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {user.is_account_locked && (currentUser?.is_superuser || hasPermission('edit_users')) && (
                          <button
                            onClick={() => handleUnlockAccount(user.id, user.username)}
                            className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1 border border-yellow-300 rounded"
                            title="Unlock Account"
                          >
                            <Lock className="h-3 w-3 inline mr-1" />
                            Unlock
                          </button>
                        )}
                        {(currentUser?.is_superuser || hasPermission('edit_users')) && (
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {(currentUser?.is_superuser || hasPermission('delete_users')) && user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? `No users match your search for "${searchTerm}"`
                : 'Get started by creating your first user.'
              }
            </p>
            {!searchTerm && (currentUser?.is_superuser || hasPermission('create_users')) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create First User</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  setNewUser({
                    username: '',
                    password: '',
                    role: 'viewer',
                    first_name: '',
                    last_name: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  Username must be unique and contain only letters, numbers, and underscores
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  minLength={8}
                  required
                />
                {newUser.password && (
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Must be 12+ characters with uppercase, lowercase, numbers, and symbols
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="contributor">Contributor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  setNewUser({
                    username: '',
                    password: '',
                    role: 'viewer',
                    first_name: '',
                    last_name: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={formLoading || passwordStrength.strength === 'Weak' || !newUser.username || !newUser.password}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}