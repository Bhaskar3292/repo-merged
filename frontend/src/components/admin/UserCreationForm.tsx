import React, { useState, useMemo } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Search, Check, Clock, Calendar } from 'lucide-react';

interface Location {
  id: number;
  name: string;
}

interface UserCreationFormProps {
  locations: Location[];
  onSubmit?: (userData: UserFormData) => void;
}

interface UserFormData {
  userType: 'permanent' | 'temporary';
  username: string;
  email: string;
  password: string;
  selectedLocationIds: number[];
  role: string;
  expirationDateTime?: string;
}

export function UserCreationForm({ locations, onSubmit }: UserCreationFormProps) {
  const [userType, setUserType] = useState<'permanent' | 'temporary'>('permanent');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('');

  const userRoles = [
    {
      value: 'viewer',
      title: 'Viewer',
      description: 'Can view data and reports but cannot make changes'
    },
    {
      value: 'contributor',
      title: 'Contributor',
      description: 'Can view and edit facility data and records'
    },
    {
      value: 'admin',
      title: 'Admin',
      description: 'Full access to all features and user management'
    }
  ];

  const filteredLocations = useMemo(() => {
    return locations.filter(location =>
      location.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locations, locationSearch]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredLocations.length === 0) return false;
    return filteredLocations.every(loc => selectedLocationIds.includes(loc.id));
  }, [filteredLocations, selectedLocationIds]);

  const handleToggleLocation = (locationId: number) => {
    setSelectedLocationIds(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = filteredLocations.map(loc => loc.id);
      setSelectedLocationIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const newIds = filteredLocations.map(loc => loc.id);
      setSelectedLocationIds(prev => [...new Set([...prev, ...newIds])]);
    }
  };

  const setQuickExpiration = (hours: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hours);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    setExpirationDate(`${year}-${month}-${day}`);
    setExpirationTime(`${hour}:${minute}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: UserFormData = {
      userType,
      username,
      email,
      password,
      selectedLocationIds,
      role: selectedRole
    };

    if (userType === 'temporary' && expirationDate && expirationTime) {
      formData.expirationDateTime = `${expirationDate}T${expirationTime}`;
    }

    console.log('User Creation Data:', formData);

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New User</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Type Toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              User Type
            </label>
            <div className="relative inline-flex items-center bg-gray-100 rounded-full p-1">
              <button
                type="button"
                onClick={() => setUserType('permanent')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  userType === 'permanent'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Permanent
              </button>
              <button
                type="button"
                onClick={() => setUserType('temporary')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  userType === 'temporary'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Temporary
              </button>
            </div>
          </div>

          {/* Temporary Access Expiration */}
          {userType === 'temporary' && (
            <div className="animate-fadeIn bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Access Expiration</h3>
              </div>

              {/* Quick Set Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQuickExpiration(1)}
                  className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => setQuickExpiration(24)}
                  className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setQuickExpiration(168)}
                  className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  7 Days
                </button>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={userType === 'temporary'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="time"
                      value={expirationTime}
                      onChange={(e) => setExpirationTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={userType === 'temporary'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email {userType === 'permanent' && '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required={userType === 'permanent'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Locations ({selectedLocationIds.length} selected)
              </h3>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search locations..."
              />
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="select-all"
                checked={isAllFilteredSelected}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({filteredLocations.length} locations)
              </label>
            </div>

            {/* Location List */}
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No locations found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredLocations.map((location) => (
                    <label
                      key={location.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationIds.includes(location.id)}
                        onChange={() => handleToggleLocation(location.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{location.name}</span>
                      {selectedLocationIds.includes(location.id) && (
                        <Check className="h-4 w-4 text-blue-600 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                      : 'border-gray-300 hover:border-gray-400 hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-semibold ${
                      selectedRole === role.value ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {role.title}
                    </h4>
                    {selectedRole === role.value && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setUsername('');
                setEmail('');
                setPassword('');
                setSelectedLocationIds([]);
                setSelectedRole('viewer');
                setExpirationDate('');
                setExpirationTime('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Create User
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
