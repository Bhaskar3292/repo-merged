import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Building2, Phone, Mail, User, CreditCard as Edit, Trash2, Eye, X, Save } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

interface Location {
  id: number;
  name: string;
  address: string;
  description: string;
  created_by_username: string;
  created_at: string;
  is_active: boolean;
  tank_count?: number;
  permit_count?: number;
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

export function LocationsPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [newLocation, setNewLocation] = useState<NewLocationData>({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'United States',
    phone: '',
    email: '',
    manager: '',
    description: '',
    facility_type: 'gas_station'
  });
  
  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      console.log('🔍 LocationsPage: Loading locations for user:', currentUser.username);
      loadLocations();
    }
  }, [currentUser]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 LocationsPage: Calling API to load locations...');
      const data = await apiService.getLocations();
      console.log('🔍 LocationsPage: Received locations data:', data);
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('🔍 LocationsPage: Load locations error:', error);
      setError('Failed to load locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    try {
      setFormLoading(true);
      setError(null);
      
      if (!newLocation.name.trim()) {
        setError('Location name is required');
        return;
      }

      // Combine address fields for backend
      const fullAddress = [
        newLocation.address,
        newLocation.city,
        newLocation.state,
        newLocation.pincode,
        newLocation.country
      ].filter(Boolean).join(', ');

      const locationData = {
        name: newLocation.name.trim(),
        address: fullAddress,
        description: [
          newLocation.description,
          newLocation.manager ? `Manager: ${newLocation.manager}` : '',
          newLocation.phone ? `Phone: ${newLocation.phone}` : '',
          newLocation.email ? `Email: ${newLocation.email}` : '',
          `Type: ${newLocation.facility_type.replace('_', ' ')}`
        ].filter(Boolean).join('\n')
      };
      
      const createdLocation = await apiService.createLocation(locationData);
      
      // Reload locations to get fresh data
      await loadLocations();
      
      setShowAddModal(false);
      resetForm();
      
      // Notify parent components about the new location
      window.dispatchEvent(new CustomEvent('location:created', { 
        detail: createdLocation 
      }));
      
    } catch (error) {
      console.error('Create location error:', error);
      setError('Failed to create location');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLocation = async (location: Location) => {
    try {
      const updatedLocation = await apiService.updateLocation(location.id, {
        name: location.name,
        address: location.address,
        description: location.description
      });
      
      setLocations(prev => prev.map(loc => 
        loc.id === location.id ? updatedLocation : loc
      ));
      setEditingLocation(null);
    } catch (error) {
      setError('Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await apiService.deleteLocation(locationId);
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
      } catch (error) {
        setError('Failed to delete location');
      }
    }
  };

  const resetForm = () => {
    setNewLocation({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'United States',
      phone: '',
      email: '',
      manager: '',
      description: '',
      facility_type: 'gas_station'
    });
    setError(null);
  };

  const updateNewLocationField = (field: keyof NewLocationData, value: string) => {
    setNewLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const facilityTypes = [
    { value: 'gas_station', label: 'Gas Station' },
    { value: 'truck_stop', label: 'Truck Stop' },
    { value: 'storage_facility', label: 'Storage Facility' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'convenience_store', label: 'Convenience Store' }
  ];

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  if (!currentUser) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
        </div>
        
        {(currentUser?.is_superuser || hasPermission('create_locations')) && (
          <button
            onClick={() => navigate('/facilities/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Location</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
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
                  onClick={() => navigate(`/facilities/${location.id}`)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View location"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {(currentUser?.is_superuser || hasPermission('edit_locations')) && (
                  <button
                    onClick={() => navigate(`/facilities/${location.id}`)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit location"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {(currentUser?.is_superuser || hasPermission('delete_locations')) && (
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
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
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first location.</p>
          {(currentUser?.is_superuser || hasPermission('create_locations')) && (
            <button
              onClick={() => navigate('/facilities/new')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Location</span>
            </button>
          )}
        </div>
      )}

                    <input
                      type="email"
                      value={newLocation.email}
                      onChange={(e) => updateNewLocationField('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., manager@facility.com"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newLocation.description}
                    onChange={(e) => updateNewLocationField('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder="Enter additional details about this location..."
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLocation}
                disabled={formLoading || !newLocation.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Location'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}