import React, { useState, useEffect } from 'react';
import { Building2, Zap, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';

interface FacilityDashboardProps {
  selectedFacility?: any;
  onViewChange?: (view: string) => void;
}

export function FacilityDashboard({ selectedFacility, onViewChange }: FacilityDashboardProps) {
  const [stats, setStats] = useState({
    activeTanks: 0,
    tankTestingIssues: 0,
    permitsDue: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedFacility?.id) {
      loadStats();
    } else {
      // Reset stats when no facility is selected
      setStats({
        activeTanks: 0,
        tankTestingIssues: 0,
        permitsDue: 0
      });
      setLastUpdated(null);
    }
  }, [selectedFacility?.id]);

  const loadStats = async () => {
    if (!selectedFacility?.id) return;

    try {
      setLoading(true);

      // Fetch tanks for this location using the correct method
      const tanksResponse = await apiService.getTanksByFacility(selectedFacility.id);
      const tanks = tanksResponse.results || [];

      // Count active tanks
      const activeTanks = tanks.filter((tank: any) => {
        const status = tank.status?.toLowerCase();
        return status === 'active' || status === 'operational';
      }).length;

      // Fetch permits for this location
      const permitsResponse = await apiService.getPermitsByLocation(selectedFacility.id);
      const permits = permitsResponse.results || [];

      // Count permits expiring within 90 days
      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
      const permitsDue = permits.filter((permit: any) => {
        if (!permit.expiration_date) return false;
        const expirationDate = new Date(permit.expiration_date);
        return expirationDate >= now && expirationDate <= ninetyDaysFromNow;
      }).length;

      // Count tank testing issues: tanks with testing enabled but no recent test
      const tankTestingIssues = tanks.filter((tank: any) => {
        const trackTesting = tank.track_release_detection === 'Yes' || tank.track_release_detection === true;
        if (!trackTesting) return false;

        if (!tank.last_test_date) return true;

        const lastTestDate = new Date(tank.last_test_date);
        const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        return lastTestDate < oneYearAgo;
      }).length;

      setStats({
        activeTanks,
        tankTestingIssues,
        permitsDue
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
  };

  const handleCardClick = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const metricCards = [
    {
      title: 'Active Tanks',
      value: loading ? '...' : stats.activeTanks.toString(),
      icon: Zap,
      color: 'green',
      onClick: () => handleCardClick('tanks')
    },
    {
      title: 'Tank Testing Issues',
      value: loading ? '...' : stats.tankTestingIssues.toString(),
      icon: AlertTriangle,
      color: 'red',
      onClick: () => handleCardClick('releases')
    },
    {
      title: 'Permits Due',
      value: loading ? '...' : stats.permitsDue.toString(),
      icon: FileText,
      color: 'yellow',
      onClick: () => handleCardClick('permits')
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
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {selectedFacility && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          };

          return (
            <button
              key={index}
              onClick={card.onClick}
              disabled={!selectedFacility}
              className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-left transition-all ${
                selectedFacility
                  ? 'hover:shadow-md hover:border-gray-300 cursor-pointer transform hover:-translate-y-0.5'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleCardClick('locations')}
            className="text-left p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Add New Location</span>
            </div>
          </button>
          <button
            onClick={() => handleCardClick('tanks')}
            className="text-left p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Add Tank</span>
            </div>
          </button>
          <button
            onClick={() => handleCardClick('permits')}
            className="text-left p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Add Permit</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
