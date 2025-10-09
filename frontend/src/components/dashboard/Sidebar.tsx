import React from 'react';
import { Hop as Home, Building2, Zap, Shield, FileText, Settings, Users, MapPin, Menu, Server } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
  onToggleSidebar: () => void;
}

export function Sidebar({ collapsed, activeView, onViewChange, onToggleSidebar }: SidebarProps) {
  const { hasPermission, user } = useAuthContext();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, permission: 'view_dashboard' },
    { id: 'locations', label: 'Locations', icon: MapPin, permission: 'view_locations' },
    { id: 'facilities', label: 'Facility Profile', icon: Building2, permission: 'view_facilities' },
    { id: 'tanks', label: 'Tank Management', icon: Zap, permission: 'view_tank_management' },
    { id: 'commanders', label: 'Commander Info', icon: Server, permission: 'view_tank_management' },
    { id: 'releases', label: 'Release Detection', icon: Shield, permission: 'view_release_detection' },
    { id: 'permits', label: 'Permits & Licenses', icon: FileText, permission: 'view_permits' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'view_settings' },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => hasPermission(item.permission));

  // Show admin panel for users with admin panel access
  if (hasPermission('view_admin_panel')) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Users, permission: 'view_admin_panel' });
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } flex flex-col`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">FacilityOS</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-600" />
              </button>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}