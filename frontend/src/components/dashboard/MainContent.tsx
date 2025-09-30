import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { FacilityDashboard } from '../facility/FacilityDashboard';
import { LocationsPage } from '../../pages/LocationsPage';
import { LocationManager } from '../facility/LocationManager';
import { FacilityInfo } from '../facility/FacilityInfo';
import { TankManagement } from '../facility/TankManagement';
import { ReleaseDetection } from '../facility/ReleaseDetection';
import { PermitsLicenses } from '../facility/PermitsLicenses';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ProfilePanel } from '../settings/ProfilePanel';

interface MainContentProps {
  activeView: string;
  selectedFacility?: any;
  refreshKey?: number;
}

export function MainContent({ activeView, selectedFacility, refreshKey }: MainContentProps) {
  const { pathname } = useLocation();
  const params = useParams();
  
  // Check if we're on a facility-specific route
  const isFacilityRoute = pathname.startsWith('/facilities/');
  
  const renderContent = () => {
    // Handle facility-specific routes
    if (isFacilityRoute) {
      return <FacilityInfo />;
    }
    
    switch (activeView) {
      case 'dashboard':
        return <FacilityDashboard selectedFacility={selectedFacility} />;
      case 'locations':
        return <LocationsPage key={refreshKey} />;
      case 'facilities':
        return <LocationManager selectedFacility={selectedFacility} />;
      case 'tanks':
        return <TankManagement selectedFacility={selectedFacility} />;
      case 'releases':
        return <ReleaseDetection selectedFacility={selectedFacility} />;
      case 'permits':
        return <PermitsLicenses selectedFacility={selectedFacility} />;
      case 'settings':
        return <SettingsPanel />;
      case 'profile':
        return <ProfilePanel />;
      default:
        return <FacilityDashboard selectedFacility={selectedFacility} />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {renderContent()}
    </div>
  );
}