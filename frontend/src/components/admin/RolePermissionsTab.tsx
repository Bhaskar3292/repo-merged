import React, { useState, useEffect } from 'react';
import { Shield, Save, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';

interface Permission {
  id: number;
  name: string;
  code: string;
  type: string;
  description: string;
  roles: {
    admin: boolean;
    contributor: boolean;
    viewer: boolean;
  };
}

interface PermissionCategory {
  id: number;
  description: string;
  permissions: Permission[];
}

interface PermissionsMatrix {
  [categoryName: string]: PermissionCategory;
}

export function RolePermissionsTab() {
  const [matrix, setMatrix] = useState<PermissionsMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalMatrix, setOriginalMatrix] = useState<PermissionsMatrix>({});
  
  const { user } = useAuthContext();

  useEffect(() => {
    loadPermissionsMatrix();
  }, []);

  const loadPermissionsMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 RolePermissions: Loading permissions matrix...');
      
      const data = await apiService.getPermissionsMatrix();
      console.log('🔍 RolePermissions: Received matrix data:', data);
      
      setMatrix(data);
      setOriginalMatrix(JSON.parse(JSON.stringify(data))); // Deep copy
      setHasChanges(false);
    } catch (error) {
      console.error('🔍 RolePermissions: Load error:', error);
      setError('Failed to load permissions matrix');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (categoryName: string, permissionId: number, role: string, granted: boolean) => {
    setMatrix(prev => {
      const updated = { ...prev };
      const category = updated[categoryName];
      if (category) {
        const permission = category.permissions.find(p => p.id === permissionId);
        if (permission) {
          permission.roles = {
            ...permission.roles,
            [role]: granted
          };
        }
      }
      return updated;
    });
    
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const changes = [];
      
      // Compare current matrix with original to find changes
      for (const [categoryName, category] of Object.entries(matrix)) {
        const originalCategory = originalMatrix[categoryName];
        if (!originalCategory) continue;
        
        for (const permission of category.permissions) {
          const originalPermission = originalCategory.permissions.find(p => p.id === permission.id);
          if (!originalPermission) continue;
          
          for (const [role, granted] of Object.entries(permission.roles)) {
            const originalGranted = originalPermission.roles[role as keyof typeof originalPermission.roles];
            if (granted !== originalGranted) {
              changes.push({
                permissionId: permission.id,
                role,
                granted,
                permissionName: permission.name
              });
            }
          }
        }
      }
      
      console.log('🔍 RolePermissions: Saving changes:', changes);
      
      // Save each change
      for (const change of changes) {
        await apiService.updateRolePermission(change.role, change.permissionId, change.granted);
      }
      
      setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
      setHasChanges(false);
      setSuccess(`Successfully updated ${changes.length} permission(s)`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('🔍 RolePermissions: Save error:', error);
      setError('Failed to save permission changes');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    setHasChanges(false);
    setError(null);
    setSuccess(null);
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
      case 'admin': return 'text-purple-600';
      case 'contributor': return 'text-blue-600';
      case 'viewer': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Role Permissions</h2>
            <p className="text-sm text-gray-600">Configure what each user role can access and modify</p>
          </div>
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

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Permissions Matrix</h3>
          <p className="text-sm text-gray-600 mt-1">
            Check the boxes to grant permissions to each role. Changes are saved when you click "Save Changes".
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider">
                  Administrator
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Contributor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                  Viewer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(matrix).map(([categoryName, category]) => (
                <React.Fragment key={categoryName}>
                  {/* Category Header */}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-6 py-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{categoryName}</span>
                        {category.description && (
                          <span className="text-sm text-gray-500">- {category.description}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Permissions in Category */}
                  {category.permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          {permission.description && (
                            <div className="text-sm text-gray-500">{permission.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Code: {permission.code} | Type: {permission.type}
                          </div>
                        </div>
                      </td>
                      
                      {/* Role Checkboxes */}
                      {['admin', 'contributor', 'viewer'].map((role) => (
                        <td key={role} className="px-4 py-4 text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={permission.roles[role as keyof typeof permission.roles]}
                              onChange={(e) => handlePermissionChange(
                                categoryName, 
                                permission.id, 
                                role, 
                                e.target.checked
                              )}
                              className={`rounded border-gray-300 focus:ring-2 focus:ring-blue-500 ${getRoleColor(role)}`}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {Object.keys(matrix).length === 0 && (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Found</h3>
            <p className="text-gray-600">
              No permissions have been configured yet. Run the setup command to create default permissions.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Permission Types:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-blue-800">Button/Action - Controls specific buttons and actions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-blue-800">Field Access - Controls access to specific data fields</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-blue-800">Section Access - Controls access to entire sections</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-blue-800">Page Access - Controls access to entire pages</span>
          </div>
        </div>
      </div>
    </div>
  );
}