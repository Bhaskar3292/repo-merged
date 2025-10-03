import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { AdminDashboard } from '../admin/AdminDashboard';
import { useAuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { hasPermission, user } = useAuthContext();

  useEffect(() => {
    const locationId = searchParams.get('locationId');
    if (locationId) {
      loadLocationById(locationId);
    } else {
      setSelectedFacility(null);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed}
        activeView={activeView}
        onViewChange={setActiveView}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation 
          selectedFacility={selectedFacility}
          onFacilitySelect={handleFacilitySelect}
          onViewChange={setActiveView}
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