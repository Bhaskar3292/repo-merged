import React from 'react';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Users 
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  facilities: string[];
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onView: (user: User) => void;
}

/**
 * UserTable Component
 * Displays users in a clean table format with action buttons
 * Reusable for different user management contexts
 */
export function UserTable({ users, onEdit, onDelete, onView }: UserTableProps) {
  const getStatusColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrator':
        return 'bg-purple-100 text-purple-800';
      case 'operator':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Last Login</div>
          <div className="col-span-2">Facilities</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {users.map((user) => (
          <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* User Info */}
              <div className="col-span-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                  {user.status}
                </span>
              </div>

              {/* Last Login */}
              <div className="col-span-2">
                <p className="text-sm text-gray-900">{new Date(user.lastLogin).toLocaleDateString()}</p>
              </div>

              {/* Facilities */}
              <div className="col-span-2">
                <div className="text-sm text-gray-900">
                  {user.facilities.length > 0 ? (
                    <span className="truncate" title={user.facilities.join(', ')}>
                      {user.facilities.length === 1 
                        ? user.facilities[0] 
                        : `${user.facilities.length} facilities`
                      }
                    </span>
                  ) : (
                    <span className="text-gray-400">None assigned</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onView(user)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View user"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit user"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Get started by adding your first user.</p>
        </div>
      )}
    </div>
  );
}