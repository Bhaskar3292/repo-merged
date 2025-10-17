import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserCreationForm } from './UserCreationForm';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'contributor' | 'viewer';
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user?: User }>({
    isOpen: false
  });
  const [formLoading, setFormLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer' as const,
    first_name: '',
    last_name: ''
  });

  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      loadUsers();
      loadLocations();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getUsers();
      setUsers(data.results || []);
    } catch (error) {
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await apiService.getLocations();
      const locationData = data.results || data;
      setLocations(Array.isArray(locationData) ? locationData : []);
    } catch (error) {
      console.error('Failed to load locations:', error);
      setLocations([]);
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
      
      if (!newUser.email.trim()) {
        setError('Email is required');
        return;
      }
      
      if (!newUser.password.trim()) {
        setError('Password is required');
        return;
      }
      
      if (newUser.password.length < 9) {
        setError('Password must be at least 9 characters long');
        return;
      }
      
      const createdUser = await apiService.createUser(newUser);
      
      // Reload the entire user list
      await loadUsers();
      
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'viewer',
        first_name: '',
        last_name: ''
      });
      
      setSuccess(`User "${newUser.username}" created successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      setError(null);
      console.log('Deleting user:', userId);
      
      await apiService.deleteUser(userId);
      console.log('User deleted successfully');
      
      // Reload the entire user list
      await loadUsers();
      setDeleteConfirm({ isOpen: false });
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Delete user error:', error);
      setError('Failed to delete user');
      setDeleteConfirm({ isOpen: false });
    }
  };

  const openDeleteConfirm = (user: User) => {
    setDeleteConfirm({ isOpen: true, user });
  };

  const handleEnhancedFormSubmit = async (userData: any) => {
    try {
      setFormLoading(true);
      setError(null);
      setSuccess(null);

      const userPayload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        first_name: '',
        last_name: '',
        is_temporary: userData.userType === 'temporary',
        expiration_datetime: userData.expirationDateTime,
        location_ids: userData.selectedLocationIds
      };

      await apiService.createUser(userPayload);
      await loadUsers();
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowEnhancedModal(false);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'contributor': return 'Contributor';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

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
    if (password.length >= 12) score++;
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
        
        {hasPermission('add_user') && (
          <button
            onClick={() => setShowEnhancedModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
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

      {/* Simplified Users Table */}
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.id !== currentUser.id && hasPermission('delete_user') && (
                    <button
                      onClick={() => openDeleteConfirm(user)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first user.</p>
            {hasPermission('add_user') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
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
                    email: '',
                    password: '',
                    role: 'viewer',
                    first_name: '',
                    last_name: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
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
                  minLength={12}
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
                  Must be 9+ characters with uppercase, lowercase, numbers, and symbols
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
                    email: '',
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
                disabled={formLoading || passwordStrength.strength === 'Weak' || !newUser.username || !newUser.email || !newUser.password}
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.isOpen && deleteConfirm.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete "{deleteConfirm.user.username}"? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.user!.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Creation Modal */}
      {showEnhancedModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowEnhancedModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <button
                onClick={() => setShowEnhancedModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <UserCreationForm
                locations={locations}
                onSubmit={handleEnhancedFormSubmit}
                onClose={() => setShowEnhancedModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}