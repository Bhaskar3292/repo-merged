import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Save, 
  RotateCcw,
  Users,
  Settings,
  Check,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

interface Permission {
  id: number;
  name: string;
  code: string;
  category: string;
  type: string;
  roles: {
    admin: boolean;
    contributor: boolean;
    viewer: boolean;
  };
}

interface PermissionsMatrix {
  [category: string]: {
    permissions: Permission[];
  };
}

export function PermissionsManager() {
  const [matrix, setMatrix] = useState<PermissionsMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalMatrix, setOriginalMatrix] = useState<PermissionsMatrix>({});
  
  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      loadPermissionsMatrix();
    }
  }, [currentUser]);

  const loadPermissionsMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPermissionsMatrix();
      setMatrix(data);
      setOriginalMatrix(JSON.parse(JSON.stringify(data))); // Deep copy
    } catch (error) {
      setError('Failed to load permissions');
      console.error('Permissions load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (category: string, permissionId: number, role: string, granted: boolean) => {
    setMatrix(prev => {
      const updated = { ...prev };
      const permission = updated[category].permissions.find(p => p.id === permissionId);
      if (permission) {
        permission.roles = {
          ...permission.roles,
          [role]: granted
        };
      }
      return updated;
    });
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      // Prepare updates for each role
      const roles = ['admin', 'contributor', 'viewer'];
      
      for (const role of roles) {
        const permissions: any[] = [];
        
        Object.values(matrix).forEach(category => {
          category.permissions.forEach(permission => {
            permissions.push({
              permission_id: permission.id,
              is_granted: permission.roles[role as keyof typeof permission.roles]
            });
          });
        });
        
        await apiService.updateRolePermissions(role, permissions);
      }
      
      setHasChanges(false);
      setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
    } catch (error) {
      setError('Failed to save permissions');
      console.error('Save permissions error:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    setHasChanges(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100';
      case 'contributor':
        return 'text-blue-600 bg-blue-100';
      case 'viewer':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!currentUser) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Required</h3>
          <p className="text-red-700">Please log in to manage permissions.</p>
        </div>
      );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <X className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-3">
            <button
              onClick={resetChanges}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Administrator</h4>
              <p className="text-sm text-gray-600">Full system access and user management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Contributor</h4>
              <p className="text-sm text-gray-600">Can create and edit facility data</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Viewer</h4>
              <p className="text-sm text-gray-600">Read-only access to assigned facilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-6">
        {Object.entries(matrix).map(([categoryName, category]) => (
          <div key={categoryName} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Administrator
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Viewer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {category.permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.code}</div>
                        </div>
                      </td>
                      
                      {(['admin', 'contributor', 'viewer'] as const).map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={permission.roles[role]}
                              onChange={(e) => updatePermission(categoryName, permission.id, role, e.target.checked)}
                              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                            />
                            <span className="sr-only">{role} access to {permission.name}</span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">You have unsaved changes. Don't forget to save your modifications.</span>
          </div>
        </div>
      )}
    </div>
  );
}