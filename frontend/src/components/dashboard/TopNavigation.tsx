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
  X
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface TopNavigationProps {
  selectedFacility: any;
  onFacilitySelect: (facility: any) => void;
  onViewChange: (view: string) => void;
  refreshKey?: number;
}

export function TopNavigation({ selectedFacility, onFacilitySelect, onViewChange, refreshKey }: TopNavigationProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const { user, logout } = useAuthContext();

  useEffect(() => {
    loadLocations();
    
    // Listen for location creation events
    const handleLocationCreated = () => {
      loadLocations();
    };
    
    window.addEventListener('location:created', handleLocationCreated);
    
    return () => {
      window.removeEventListener('location:created', handleLocationCreated);
    };
  }, [refreshKey]);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const data = await apiService.getLocations();
      setLocations(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.street_address && location.street_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (location.city && location.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLocationSelect = (location: any) => {
    onFacilitySelect(location);
    setSearchTerm('');
    setShowFacilityDropdown(false);

    // Navigate to dashboard with facility ID
    navigate(`/dashboard?locationId=${location.id}`);
  };

  const handleClearFacility = () => {
    onFacilitySelect(null);
    setSearchTerm('');
    setShowFacilityDropdown(false);
    navigate('/dashboard');
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
                <span className="text-sm font-medium text-blue-900 truncate">{selectedFacility.name}</span>
                <button 
        onClick={handleClearFacility}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-blue-500 hover:text-red-700 hover:bg-blue-100 rounded"
      >
        <X size={32} />
      </button>
              </div>
            )}
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search and select location..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowFacilityDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Location Dropdown */}
              {showFacilityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {loadingLocations ? (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Loading locations...</span>
                    </div>
                  ) : filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:border-blue-200 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{location.name}</p>
                              <p className="text-xs text-gray-500">
                                {location.city}, {location.state}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100">
                            View →
                          </div>
                        </div>
                      </button>
                    ))
                  ) : searchTerm.length > 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching locations found.</div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">Start typing to search locations...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
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
    </div>
  );
}