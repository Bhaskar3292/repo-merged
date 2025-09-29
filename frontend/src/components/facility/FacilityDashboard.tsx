import React from 'react';
import { Building2, Zap, TriangleAlert as AlertTriangle, FileText, Activity } from 'lucide-react';

interface FacilityDashboardProps {
  selectedFacility?: any;
}

export function FacilityDashboard({ selectedFacility }: FacilityDashboardProps) {
  const stats = [
    {
      title: 'Total Facilities',
      value: '24',
      change: '+2.5%',
      icon: Building2,
      color: 'blue'
    },
    {
      title: 'Active Tanks',
      value: '156',
      change: '+1.2%',
      icon: Zap,
      color: 'green'
    },
    {
      title: 'Pending Issues',
      value: '3',
      change: '-15.3%',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Permits Due',
      value: '8',
      change: '+4.1%',
      icon: FileText,
      color: 'yellow'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Tank inspection completed',
      facility: 'Downtown Station A',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: 2,
      action: 'Permit renewal reminder',
      facility: 'Highway 101 Facility',
      time: '4 hours ago',
      status: 'warning'
    },
    {
      id: 3,
      action: 'New facility registered',
      facility: 'Westside Complex',
      time: '1 day ago',
      status: 'info'
    },
    {
      id: 4,
      action: 'Leak detection alert',
      facility: 'Industrial Park B',
      time: '2 days ago',
      status: 'error'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedFacility ? `${selectedFacility.name} Dashboard` : 'Facility Management Dashboard'}
          </h1>
          {selectedFacility && (
            <p className="text-sm text-gray-500 mt-1">{selectedFacility.address}</p>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {!selectedFacility && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome to Facility Management</h3>
          <p className="text-blue-700">Select a facility from the search bar above to view detailed dashboard information.</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          };

          return (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const statusColors = {
                  success: 'bg-green-100 text-green-800',
                  warning: 'bg-yellow-100 text-yellow-800',
                  info: 'bg-blue-100 text-blue-800',
                  error: 'bg-red-100 text-red-800'
                };

                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[activity.status as keyof typeof statusColors]}`}>
                      {activity.status}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.facility}</p>
                    </div>
                    <div className="text-xs text-gray-400">{activity.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Add New Facility</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Schedule Inspection</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Generate Report</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Data Sync</span>
                <span className="text-sm font-medium text-green-600">Up to date</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alerts</span>
                <span className="text-sm font-medium text-yellow-600">3 pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}