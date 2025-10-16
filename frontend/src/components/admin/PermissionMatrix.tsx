import React, { useState, useEffect } from 'react';
import { PermissionToggle } from './PermissionToggle';
import api from '../../api/axios';

interface Permission {
  code: string;
  name: string;
  description: string;
  category: string;
  permission_type: 'page' | 'button';
}

interface RolePermission {
  role: 'admin' | 'contributor' | 'viewer';
  permission_code: string;
  is_granted: boolean;
}

interface PermissionCategory {
  name: string;
  icon: string;
  permissions: Permission[];
}

export const PermissionMatrix: React.FC = () => {
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<string, RolePermission[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
  try {
    setLoading(true);
    const [permsResponse, rolePermsResponse] = await Promise.all([
      api.get('/api/permissions/permissions/'),
      api.get('/api/permissions/role-permissions/'),
    ]);

    // Debug: Check the actual response structure
    console.log('Permissions response:', permsResponse);
    console.log('Role permissions response:', rolePermsResponse);

    // FIX: Handle different response structures
    const permissionsData = permsResponse.data.results || permsResponse.data.permissions || permsResponse.data;
    const rolePermissionsData = rolePermsResponse.data.results || rolePermsResponse.data.role_permissions || rolePermsResponse.data;

    // Ensure we're working with arrays
    if (!Array.isArray(permissionsData)) {
      console.error('Permissions data is not an array:', permissionsData);
      showMessage('error', 'Invalid permissions data format');
      return;
    }

    if (!Array.isArray(rolePermissionsData)) {
      console.error('Role permissions data is not an array:', rolePermissionsData);
      showMessage('error', 'Invalid role permissions data format');
      return;
    }

    // Group permissions by category
    const grouped: { [key: string]: Permission[] } = {};
    permissionsData.forEach((perm: Permission) => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });

    // Create category structure with icons
    const categoryIcons: { [key: string]: string } = {
      'Locations': '📍',
      'Facilities': '🏢',
      'Tanks': '🛢️',
      'Permits': '📄',
      'Testing': '🧪',
      'Commander': '👤',
      'Settings': '⚙️',
      'Admin': '🔐',
    };

    const cats: PermissionCategory[] = Object.keys(grouped).map(catName => ({
      name: catName,
      icon: categoryIcons[catName] || '📋',
      permissions: grouped[catName].sort((a, b) => a.code.localeCompare(b.code)),
    }));

    setCategories(cats);

    // Map role permissions
    const rpMap = new Map<string, RolePermission[]>();
    rolePermissionsData.forEach((rp: RolePermission) => {
      const key = rp.permission_code;
      if (!rpMap.has(key)) {
        rpMap.set(key, []);
      }
      rpMap.get(key)!.push(rp);
    });

    setRolePermissions(rpMap);

    // Expand all categories by default
    setExpandedCategories(new Set(cats.map(c => c.name)));
  } catch (error: any) {
    console.error('Failed to load permissions:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to load permissions';
    showMessage('error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isPermissionGranted = (permissionCode: string, role: 'admin' | 'contributor' | 'viewer'): boolean => {
    const perms = rolePermissions.get(permissionCode) || [];
    const rolePerm = perms.find(rp => rp.role === role);
    return rolePerm?.is_granted || false;
  };

  const updatePermission = async (permissionCode: string, role: 'admin' | 'contributor' | 'viewer', granted: boolean) => {
    // Optimistic update
    const newMap = new Map(rolePermissions);
    const perms = newMap.get(permissionCode) || [];
    const existing = perms.find(rp => rp.role === role);

    if (existing) {
      existing.is_granted = granted;
    } else {
      perms.push({ role, permission_code: permissionCode, is_granted: granted });
    }

    newMap.set(permissionCode, perms);
    setRolePermissions(newMap);

    try {
      await api.post('/api/permissions/update-role-permission/', {
        role,
        permission_code: permissionCode,
        is_granted: granted,
      });
    } catch (error: any) {
      console.error('Failed to update permission:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update permission';
      // Revert on error
      loadPermissions();
      showMessage('error', errorMessage);
    }
  };

  const saveAllPermissions = async () => {
    try {
      setSaving(true);

      const updates: any[] = [];
      rolePermissions.forEach((perms, permCode) => {
        perms.forEach(rp => {
          updates.push({
            role: rp.role,
            permission_code: permCode,
            is_granted: rp.is_granted,
          });
        });
      });

      await api.post('/api/permissions/bulk-update/', { permissions: updates });
      showMessage('success', 'All permissions saved successfully');
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save permissions';
      showMessage('error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure access permissions for each role and application feature
          </p>
        </div>
        <button
          onClick={saveAllPermissions}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Role Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <div>
              <span className="text-sm font-medium text-gray-900">Administrator</span>
              <p className="text-xs text-gray-600">Full system access (locked)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <div>
              <span className="text-sm font-medium text-gray-900">Contributor</span>
              <p className="text-xs text-gray-600">Create & edit permissions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <div>
              <span className="text-sm font-medium text-gray-900">Viewer</span>
              <p className="text-xs text-gray-600">Read-only access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Categories */}
      <div className="space-y-4">
        {categories.map(category => {
          const isExpanded = expandedCategories.has(category.name);
          const readPermission = category.permissions.find(p => p.code.includes(':read'));
          const writePermission = category.permissions.find(p => p.code.includes(':write'));

          return (
            <div key={category.name} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.permissions.length} permissions</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Read Permission */}
                  {readPermission && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{readPermission.name}</h4>
                          <p className="text-xs text-gray-600">{readPermission.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-7">
                        <PermissionToggle
                          role="admin"
                          permission={readPermission.code}
                          enabled={true}
                          locked={true}
                          onChange={() => {}}
                        />
                        <PermissionToggle
                          role="contributor"
                          permission={readPermission.code}
                          enabled={isPermissionGranted(readPermission.code, 'contributor')}
                          onChange={(granted) => updatePermission(readPermission.code, 'contributor', granted)}
                        />
                        <PermissionToggle
                          role="viewer"
                          permission={readPermission.code}
                          enabled={isPermissionGranted(readPermission.code, 'viewer')}
                          onChange={(granted) => updatePermission(readPermission.code, 'viewer', granted)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Write Permission */}
                  {writePermission && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{writePermission.name}</h4>
                          <p className="text-xs text-gray-600">{writePermission.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-7">
                        <PermissionToggle
                          role="admin"
                          permission={writePermission.code}
                          enabled={true}
                          locked={true}
                          onChange={() => {}}
                        />
                        <PermissionToggle
                          role="contributor"
                          permission={writePermission.code}
                          enabled={isPermissionGranted(writePermission.code, 'contributor')}
                          onChange={(granted) => updatePermission(writePermission.code, 'contributor', granted)}
                        />
                        <PermissionToggle
                          role="viewer"
                          permission={writePermission.code}
                          enabled={isPermissionGranted(writePermission.code, 'viewer')}
                          onChange={(granted) => updatePermission(writePermission.code, 'viewer', granted)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Other permissions */}
                  {category.permissions
                    .filter(p => !p.code.includes(':read') && !p.code.includes(':write'))
                    .map(perm => (
                      <div key={perm.code} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">{perm.name}</h4>
                            <p className="text-xs text-gray-600">{perm.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-7">
                          <PermissionToggle
                            role="admin"
                            permission={perm.code}
                            enabled={true}
                            locked={true}
                            onChange={() => {}}
                          />
                          <PermissionToggle
                            role="contributor"
                            permission={perm.code}
                            enabled={isPermissionGranted(perm.code, 'contributor')}
                            onChange={(granted) => updatePermission(perm.code, 'contributor', granted)}
                          />
                          <PermissionToggle
                            role="viewer"
                            permission={perm.code}
                            enabled={isPermissionGranted(perm.code, 'viewer')}
                            onChange={(granted) => updatePermission(perm.code, 'viewer', granted)}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
