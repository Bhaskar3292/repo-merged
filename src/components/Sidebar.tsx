import React from 'react';
import { Hop as Home, Building2, Zap, Shield, FileText, Settings, Users, MapPin, Menu } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
  onToggleSidebar: () => void;
}

export function Sidebar({ collapsed, activeView, onViewChange, onToggleSidebar }: SidebarProps) {
  const { hasPermission, user } = useAuthContext();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'facilities', label: 'Facilities', icon: Building2 },
    { id: 'tanks', label: 'Tank Management', icon: Zap },
    { id: 'releases', label: 'Release Detection', icon: Shield },
    { id: 'permits', label: 'Permits & Licenses', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Show admin panel for superusers or users with manage_users permission
  if (user?.is_superuser || hasPermission('manage_users')) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: Users });
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