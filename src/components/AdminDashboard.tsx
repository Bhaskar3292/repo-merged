import React, { useState } from 'react';
import { 
  Users, 
  Shield,
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';
import { TabNavigation } from './TabNavigation';
import { UserManagement } from './UserManagement';
import { PermissionsManager } from './PermissionsManager';
import { DashboardAccessControl } from './DashboardAccessControl';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * AdminDashboard Component
 * Main admin interface with user management and role configuration
 * Modular design with reusable components for scalability
 */
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const { user: currentUser } = useAuthContext();

  const tabs = [
    { id: 'users', label: 'User Management' },
  ];

  // Ensure superusers can access admin dashboard
  if (!currentUser || (!currentUser.is_superuser && currentUser.role !== 'admin')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Access Denied</h3>
        <p className="text-red-700">You don't have permission to access the admin dashboard.</p>
      </div>
    );
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <UserManagement />
        );


      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and system settings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}