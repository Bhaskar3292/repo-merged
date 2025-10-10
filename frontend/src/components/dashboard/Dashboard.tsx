import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { AdminDashboard } from '../admin/AdminDashboard';
import { useAuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export function Dashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const defaultView = (location.state as any)?.defaultView || 'locations';
  const [activeView, setActiveView] = useState(defaultView);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { hasPermission, user } = useAuthContext();

  useEffect(() => {
    const locationId = searchParams.get('locationId');
    const tab = searchParams.get('tab');

    if (locationId) {
      loadLocationById(locationId);
    } else {
      setSelectedFacility(null);
    }

    // Set active view based on tab parameter
    if (tab) {
      setActiveView(tab);
    } else if (locationId) {
      setActiveView('dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleLocationCreated = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('location:created', handleLocationCreated);

    return () => {
      window.removeEventListener('location:created', handleLocationCreated);
    };
  }, []);

  const loadLocationById = async (locationId: string) => {
    try {
      const locations = await apiService.getLocations();
      const response=locations.results;
      const location = response.find((loc: any) => loc.id.toString() === locationId);
      if (location) {
        setSelectedFacility(location);
      }
    } catch (error) {
      console.error('Failed to load location:', error);
    }
  };
  
  const handleFacilitySelect = (facility: any) => {
    if (facility) {
      setSearchParams({ locationId: facility.id.toString() });
    } else {
      setSearchParams({});
    }
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);

    // Update URL with tab parameter if a facility is selected
    const locationId = searchParams.get('locationId');
    if (locationId && view !== 'dashboard' && view !== 'admin' && view !== 'locations') {
      setSearchParams({ locationId, tab: view });
    } else if (locationId && view === 'dashboard') {
      setSearchParams({ locationId });
    } else {
      // No facility selected, just change view without URL params
      setSearchParams({});
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        activeView={activeView}
        onViewChange={handleViewChange}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation
          selectedFacility={selectedFacility}
          onFacilitySelect={handleFacilitySelect}
          onViewChange={handleViewChange}
          refreshKey={refreshKey}
        />
        
        <main className="flex-1 overflow-auto">
          {activeView === 'admin' && (user?.is_superuser || hasPermission('manage_users')) ? (
            <AdminDashboard />
          ) : (
            <MainContent 
              activeView={activeView} 
              selectedFacility={selectedFacility}
              refreshKey={refreshKey}
            />
          )}
        </main>
      </div>
    </div>
  );
}