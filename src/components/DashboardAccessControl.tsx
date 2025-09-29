import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Save, RotateCcw, Settings, Building2, Zap, FileText, Users, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

interface TabPermission {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: {
    admin: { visible: boolean; editable: boolean };
    contributor: { visible: boolean; editable: boolean };
    viewer: { visible: boolean; editable: boolean };
  };
}

export function DashboardAccessControl() {
  const { user: currentUser } = useAuthContext();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tabPermissions, setTabPermissions] = useState<TabPermission[]>([
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Main facility overview and statistics',
      icon: Building2,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: true, editable: true },
        viewer: { visible: true, editable: false }
      }
    },
    {
      id: 'facilities',
      name: 'Facilities',
      description: 'Facility management and information',
      icon: Building2,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: true, editable: true },
        viewer: { visible: true, editable: false }
      }
    },
    {
      id: 'tanks',
      name: 'Tank Management',
      description: 'Tank monitoring and management',
      icon: Zap,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: true, editable: true },
        viewer: { visible: true, editable: false }
      }
    },
    {
      id: 'releases',
      name: 'Release Detection',
      description: 'Environmental monitoring and alerts',
      icon: Shield,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: true, editable: false },
        viewer: { visible: false, editable: false }
      }
    },
    {
      id: 'permits',
      name: 'Permits & Licenses',
      description: 'Regulatory compliance management',
      icon: FileText,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: true, editable: true },
        viewer: { visible: true, editable: false }
      }
    },
    {
      id: 'admin',
      name: 'Admin Panel',
      description: 'User and system administration',
      icon: Users,
      roles: {
        admin: { visible: true, editable: true },
        contributor: { visible: false, editable: false },
        viewer: { visible: false, editable: false }
      }
    }
  ]);

  const [originalPermissions, setOriginalPermissions] = useState<TabPermission[]>([]);

  useEffect(() => {
    setOriginalPermissions(JSON.parse(JSON.stringify(tabPermissions)));
  }, []);

  const updatePermission = (
    tabId: string, 
    role: 'admin' | 'contributor' | 'viewer', 
    type: 'visible' | 'editable', 
    value: boolean
  ) => {
    setTabPermissions(prev => prev.map(tab => 
      tab.id === tabId 
        ? {
            ...tab,
            roles: {
              ...tab.roles,
              [role]: {
                ...tab.roles[role],
                [type]: value
              }
            }
          }
        : tab
    ));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // In a real app, this would save to the backend
      // await apiService.updateDashboardPermissions(tabPermissions);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalPermissions(JSON.parse(JSON.stringify(tabPermissions)));
      setHasChanges(false);
      setSuccess('Dashboard access permissions updated successfully');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setTabPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
    setError(null);
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

  if (!currentUser || (!currentUser.is_superuser && currentUser.role !== 'admin')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
        <p className="text-red-700">Only administrators can manage dashboard access permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Access Control</h2>
            <p className="text-gray-600">Configure tab visibility and edit permissions for each role</p>
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Definitions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Administrator</h4>
              <p className="text-sm text-gray-600">Full system access and management</p>
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
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Viewer</h4>
              <p className="text-sm text-gray-600">Read-only access to assigned facilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tab Access Permissions</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure which tabs each role can see and edit. Visible = can see the tab, Editable = can modify data.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dashboard Tab
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrator
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contributor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viewer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tabPermissions.map((tab) => {
                const Icon = tab.icon;
                
                return (
                  <tr key={tab.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tab.name}</div>
                          <div className="text-xs text-gray-500">{tab.description}</div>
                        </div>
                      </div>
                    </td>
                    
                    {(['admin', 'contributor', 'viewer'] as const).map((role) => (
                      <td key={role} className="px-6 py-4">
                        <div className="flex flex-col items-center space-y-2">
                          {/* Visibility Toggle */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updatePermission(tab.id, role, 'visible', !tab.roles[role].visible)}
                              className={`p-1 rounded transition-colors ${
                                tab.roles[role].visible 
                                  ? 'text-green-600 hover:bg-green-50' 
                                  : 'text-gray-400 hover:bg-gray-50'
                              }`}
                              title={`${tab.roles[role].visible ? 'Hide' : 'Show'} tab for ${role}`}
                            >
                              {tab.roles[role].visible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <span className="text-xs text-gray-500">Visible</span>
                          </div>
                          
                          {/* Edit Permission Toggle */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updatePermission(tab.id, role, 'editable', !tab.roles[role].editable)}
                              disabled={!tab.roles[role].visible}
                              className={`p-1 rounded transition-colors ${
                                tab.roles[role].editable && tab.roles[role].visible
                                  ? 'text-blue-600 hover:bg-blue-50' 
                                  : 'text-gray-400 hover:bg-gray-50'
                              } ${!tab.roles[role].visible ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={`${tab.roles[role].editable ? 'Disable' : 'Enable'} editing for ${role}`}
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-500">Editable</span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['admin', 'contributor', 'viewer'] as const).map((role) => {
            const visibleTabs = tabPermissions.filter(tab => tab.roles[role].visible);
            const editableTabs = tabPermissions.filter(tab => tab.roles[role].editable);
            
            return (
              <div key={role} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Visible Tabs:</span>
                    <p className="text-gray-600">{visibleTabs.length} of {tabPermissions.length}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Editable Tabs:</span>
                    <p className="text-gray-600">{editableTabs.length} of {tabPermissions.length}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Access Level:</span>
                    <p className="text-gray-600">
                      {editableTabs.length === visibleTabs.length ? 'Full Access' :
                       editableTabs.length > 0 ? 'Mixed Access' : 'Read Only'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">You have unsaved changes. Don't forget to save your modifications.</span>
          </div>
        </div>
      )}
    </div>
  );
}