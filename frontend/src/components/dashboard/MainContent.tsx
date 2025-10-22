import React, { useState } from 'react';
import { FacilityDashboard } from '../facility/FacilityDashboard';
import { LocationsPage } from '../../pages/LocationsPage';
import { LocationManager } from '../facility/LocationManager';
import { TankManagement } from '../facility/TankManagement';
import { ReleaseDetection } from '../facility/ReleaseDetection';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ProfilePanel } from '../settings/ProfilePanel';
import { FacilityProfile } from '../facility/FacilityProfile';
import CommanderInfo from '../facility/CommanderInfo';
import { PermitsDashboard } from '../permits/PermitsDashboard';

interface MainContentProps {
  activeView: string;
  selectedFacility?: any;
  refreshKey?: number;
  onViewChange?: (view: string) => void;
}

export function MainContent({ activeView, selectedFacility, refreshKey, onViewChange }: MainContentProps) {
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <FacilityDashboard selectedFacility={selectedFacility} onViewChange={onViewChange} />;
      case 'locations':
        return <LocationsPage key={refreshKey} />;
      case 'facilities':
        return <FacilityProfile selectedFacility={selectedFacility} />;
      case 'tanks':
        return <TankManagement selectedFacility={selectedFacility} />;
      case 'commanders':
        return <CommanderInfo selectedFacility={selectedFacility} />;
      case 'releases':
        return <ReleaseDetection selectedFacility={selectedFacility} />;
      case 'permits':
        return <PermitsDashboard selectedFacility={selectedFacility} />;
      case 'settings':
        return <SettingsPanel />;
      case 'profile':
        return <ProfilePanel />;
      default:
        return <FacilityDashboard selectedFacility={selectedFacility} onViewChange={onViewChange} />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {renderContent()}
    </div>
  );
}