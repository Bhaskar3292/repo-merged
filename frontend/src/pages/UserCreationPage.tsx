import React, { useState, useEffect } from 'react';
import { UserCreationForm } from '../components/admin/UserCreationForm';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

export function UserCreationPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getLocations();

      const locationData = data.results || data;
      setLocations(Array.isArray(locationData) ? locationData : []);
    } catch (err: any) {
      console.error('Failed to load locations:', err);
      setError('Failed to load locations. Using empty list.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (userData: any) => {
    try {
      console.log('Creating user with data:', userData);

      const userPayload = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        first_name: '',
        last_name: '',
        is_temporary: userData.userType === 'temporary',
        expiration_datetime: userData.expirationDateTime,
        location_ids: userData.selectedLocationIds
      };

      await apiService.createUser(userPayload);

      alert('User created successfully!');
      navigate('/admin');
    } catch (err: any) {
      console.error('Failed to create user:', err);
      alert(`Failed to create user: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Admin Dashboard</span>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        {/* User Creation Form */}
        <UserCreationForm
          locations={locations}
          onSubmit={handleUserSubmit}
        />
      </div>
    </div>
  );
}
