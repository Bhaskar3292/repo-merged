import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Building2, Eye, CreditCard as Edit, Trash2, X, Save } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

interface Location {
  id: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  facility_type: string;
  created_by_username: string;
  created_at: string;
  is_active: boolean;
  tank_count?: number;
  permit_count?: number;
}

interface NewLocationData {
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  facility_type: string;
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [newLocation, setNewLocation] = useState<NewLocationData>({
    name: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    facility_type: 'gas_station'
  });
  
  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      loadLocations();
    }
  }, [currentUser]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getLocations();
      setLocations(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
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

      const locationData = {
        name: newLocation.name.trim(),
        street_address: newLocation.street_address.trim(),
        city: newLocation.city.trim(),
        state: newLocation.state,
        zip_code: newLocation.zip_code.trim(),
        country: newLocation.country,
        facility_type: newLocation.facility_type,
        description: `${newLocation.facility_type.replace('_', ' ')} facility`
      };
      
      await apiService.createLocation(locationData);
      
      await loadLocations();
      
      setShowAddModal(false);
      resetForm();
      
      window.dispatchEvent(new CustomEvent('location:created'));
      
    } catch (error) {
      setError('Failed to create location');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLocation = async (location: Location) => {
    try {
      await apiService.updateLocation(location.id, {
        name: location.name,
        street_address: location.street_address,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code,
        country: location.country,
        facility_type: location.facility_type
      });
      
      setLocations(prev => prev.map(loc => 
        loc.id === location.id ? location : loc
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
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States',
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
            onClick={() => setShowAddModal(true)}
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
                  <p className="text-sm text-gray-500 capitalize">
                    {location.facility_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('facility:select', { 
                    detail: location 
                  }))}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Select location"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {(currentUser?.is_superuser || hasPermission('edit_locations')) && (
                  <button
                    onClick={() => setEditingLocation(location)}
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

            <div className="space-y-2 mb-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{location.street_address}</p>
                  <p>{location.city}, {location.state} {location.zip_code}</p>
                  <p>{location.country}</p>
                </div>
              </div>
            </div>

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
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Location</span>
            </button>
          )}
        </div>
      )}

      {/* Simplified Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Add New Location</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={newLocation.name}
                      onChange={(e) => updateNewLocationField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Downtown Station A"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Type
                    </label>
                    <select
                      value={newLocation.facility_type}
                      onChange={(e) => updateNewLocationField('facility_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {facilityTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={newLocation.street_address}
                      onChange={(e) => updateNewLocationField('street_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={newLocation.city}
                      onChange={(e) => updateNewLocationField('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Los Angeles"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={newLocation.state}
                      onChange={(e) => updateNewLocationField('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select State</option>
                      {usStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={newLocation.zip_code}
                      onChange={(e) => updateNewLocationField('zip_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 90210"
                      pattern="[0-9]{5}(-[0-9]{4})?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={newLocation.country}
                      onChange={(e) => updateNewLocationField('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Mexico">Mexico</option>
                    </select>
                  </div>
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

      {/* Edit Location Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Edit Location</h3>
              </div>
              <button
                onClick={() => setEditingLocation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={editingLocation.name}
                      onChange={(e) => setEditingLocation({...editingLocation, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Type
                    </label>
                    <select
                      value={editingLocation.facility_type}
                      onChange={(e) => setEditingLocation({...editingLocation, facility_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {facilityTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editingLocation.street_address}
                      onChange={(e) => setEditingLocation({...editingLocation, street_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={editingLocation.city}
                      onChange={(e) => setEditingLocation({...editingLocation, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={editingLocation.state}
                      onChange={(e) => setEditingLocation({...editingLocation, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      {usStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={editingLocation.zip_code}
                      onChange={(e) => setEditingLocation({...editingLocation, zip_code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={editingLocation.country}
                      onChange={(e) => setEditingLocation({...editingLocation, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Mexico">Mexico</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setEditingLocation(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateLocation(editingLocation)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}