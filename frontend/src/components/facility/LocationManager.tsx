import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Calendar, User, Eye, Edit2 as Edit, Trash2,X } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';
import { LocationDashboard } from './LocationDashboard';

interface Location {
  id: number;
  name: string;
  address: string;
  description: string;
  icon?: string;
  created_by_username: string;
  created_at: string;
  is_active: boolean;
  tank_count?: number;
  permit_count?: number;
}

interface LocationManagerProps {
  selectedFacility?: any;
}

export function LocationManager({ selectedFacility }: LocationManagerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'dashboard'>('list');
  
  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      console.log('🔍 LocationManager: Loading locations for user:', currentUser.username);
      loadLocations();
    }
  }, [currentUser]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 LocationManager: Calling API to load locations...');
      const data = await apiService.getLocations();
      console.log('🔍 LocationManager: Received locations data:', data);
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('🔍 LocationManager: Load locations error:', error);
      setError('Failed to load locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = (location: Location) => {
    setView('dashboard');
  };

  const handleDeleteLocation = async (locationId: number, locationName: string) => {
    if (window.confirm(`Are you sure you want to delete "${locationName}"? This action cannot be undone.`)) {
      try {
        await apiService.deleteLocation(locationId);
        await loadLocations(); // Refresh the list
      } catch (error) {
        setError('Failed to delete location');
      }
    }
  };

  // Filter locations by selected facility if provided
  const displayLocations = selectedFacility 
    ? locations.filter(location => location.id === selectedFacility.id)
    : locations;

  if (!currentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Building2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Authentication Required</h3>
        <p className="text-red-700">Please log in to view locations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading locations...</span>
      </div>
    );
  }

  if (view === 'dashboard' && selectedFacility) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Building2 className="h-4 w-4" />
            <span>Back to Locations</span>
          </button>
        </div>
        
        <LocationDashboard 
          locationId={selectedFacility.id} 
          locationName={selectedFacility.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedFacility ? `${selectedFacility.name} - Facility Details` : 'Facilities'}
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Selected Facility Details */}
      {selectedFacility ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedFacility.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedFacility.address}</span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedFacility.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedFacility.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Facility Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedFacility.tank_count || 0}</div>
              <div className="text-sm text-blue-800">Total Tanks</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{selectedFacility.permit_count || 0}</div>
              <div className="text-sm text-green-800">Active Permits</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-yellow-800">Expiring Soon</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">1</div>
              <div className="text-sm text-purple-800">Inspections Due</div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Manager: {selectedFacility.created_by_username || 'Not specified'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>Phone: Not specified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>Email: Not specified</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Facility Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Use the tabs on the left to view detailed information about tanks, permits, tank testing systems, and other facility-specific data.</p>
                <p className="text-xs text-gray-500 mt-4">
                  All data shown in other tabs will be filtered to show information for this facility only.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* All Locations Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    <p className="text-sm text-gray-500">Created by {location.created_by_username}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => console.log('View location', location.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View location"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {(currentUser?.is_superuser || hasPermission('edit_locations')) && (
                    <button
                      onClick={() => console.log('Edit location', location.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit location"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {(currentUser?.is_superuser || hasPermission('delete_locations')) && (
                    <button
                      onClick={() => handleDeleteLocation(location.id, location.name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete location"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {location.address && (
                <div className="flex items-start space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>
              )}

              {location.description && (
                <p className="text-sm text-gray-600 mb-4">{location.description}</p>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{location.tank_count || 0}</p>
                  <p className="text-xs text-gray-600">Tanks</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{location.permit_count || 0}</p>
                  <p className="text-xs text-gray-600">Permits</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Created {new Date(location.created_at).toLocaleDateString()}
                </span>
                
                <button
                  onClick={() => handleViewDashboard(location)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {displayLocations.length === 0 && !loading && !selectedFacility && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first location using the location button in the top menu.</p>
        </div>
      )}
    </div>
  );
}