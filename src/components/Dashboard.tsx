import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { MainContent } from './MainContent';
import { AdminDashboard } from './AdminDashboard';
import { useAuthContext } from '../contexts/AuthContext';

export function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { hasPermission, user } = useAuthContext();

  useEffect(() => {
    // Listen for location creation events
    const handleLocationCreated = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('location:created', handleLocationCreated);
    
    return () => {
      window.removeEventListener('location:created', handleLocationCreated);
    };
  }, []);
  const handleFacilitySelect = (facility: any) => {
    setSelectedFacility(facility);
    // Keep current view but update data for selected facility
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