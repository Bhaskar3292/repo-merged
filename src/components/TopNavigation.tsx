import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings,
  Building2,
  Plus,
  MapPin,
  X,
  Save
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface TopNavigationProps {
  selectedFacility: any;
  onFacilitySelect: (facility: any) => void;
  onViewChange: (view: string) => void;
  refreshKey?: number;
}

interface NewLocationData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  manager: string;
  description: string;
  facility_type: string;
}

export function TopNavigation({ selectedFacility, onFacilitySelect, onViewChange, refreshKey }: TopNavigationProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  
  const { user, logout, hasPermission } = useAuthContext();

  useEffect(() => {
    loadLocations();
  }, [refreshKey]);

  const loadLocations = async () => {
    try {
      const data = await apiService.getLocations();
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load locations:', error);
      setLocations([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const filteredFacilities = locations.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (facility.address && facility.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFacilitySelect = (facility: any) => {
    onFacilitySelect(facility);
    setSearchTerm('');
    setShowFacilityDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowFacilityDropdown(true);
  };


  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Current Facility Display */}
          <div className="flex items-center min-w-0 flex-1">
            {selectedFacility && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 truncate">{selectedFacility.name}</span>
              </div>
            )}
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search and select facility..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowFacilityDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Facility Dropdown */}
              {showFacilityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredFacilities.length > 0 ? (
                    filteredFacilities.map((facility) => (
                      <button
                        key={facility.id}
                        onClick={() => handleFacilitySelect(facility)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{facility.name}</p>
                            <p className="text-xs text-gray-500">{facility.address}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : searchTerm.length > 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching facilities found.</div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">Start typing to search facilities...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium truncate">{user?.organization || 'Facility Management'}</span>
            </div>

            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <button
                    onClick={() => {
                      onViewChange('profile');
                      setShowUserMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      onViewChange('settings');
                      setShowUserMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {showFacilityDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowFacilityDropdown(false)}
          />
        )}
      </header>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search and select facility..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowFacilityDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Facility Dropdown */}
              {showFacilityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredFacilities.length > 0 ? (
                    filteredFacilities.map((facility) => (
                      <button
                        key={facility.id}
                        onClick={() => handleFacilitySelect(facility)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{facility.name}</p>
                            <p className="text-xs text-gray-500">{facility.address}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : searchTerm.length > 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching facilities found.</div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">Start typing to search facilities...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}