import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { RoleBadge } from './RoleBadge';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  facilities: string[];
}

interface UserFormProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'> | User) => void;
  mode: 'add' | 'edit' | 'view';
}

/**
 * UserForm Component
 * Modal form for adding, editing, or viewing user details
 * Supports full CRUD operations with validation
 */
export function UserForm({ user, isOpen, onClose, onSave, mode }: UserFormProps) {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: 'Viewer',
    status: 'Active',
    lastLogin: new Date().toISOString().split('T')[0],
    facilities: []
  });

  const [facilityInput, setFacilityInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableRoles = ['Administrator', 'Operator', 'Viewer'];
  const availableFacilities = [
    'Downtown Station A',
    'Highway 101 Facility', 
    'Industrial Park B',
    'Westside Complex',
    'Eastside Terminal'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        facilities: [...user.facilities]
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Viewer',
        status: 'Active',
        lastLogin: new Date().toISOString().split('T')[0],
        facilities: []
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (user && mode === 'edit') {
      onSave({ ...user, ...formData });
    } else {
      onSave(formData);
    }
    
    onClose();
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addFacility = () => {
    if (facilityInput.trim() && !formData.facilities.includes(facilityInput.trim())) {
      updateFormData('facilities', [...formData.facilities, facilityInput.trim()]);
      setFacilityInput('');
    }
  };

  const removeFacility = (facility: string) => {
    updateFormData('facilities', formData.facilities.filter(f => f !== facility));
  };

  const getTitle = () => {
    switch (mode) {
      case 'add': return 'Add New User';
      case 'edit': return 'Edit User';
      case 'view': return 'User Details';
      default: return 'User Form';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              {mode === 'view' ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {formData.name}
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
              )}
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              {mode === 'view' ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {formData.email}
                </div>
              ) : (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              )}
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              {mode === 'view' ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <RoleBadge role={formData.role} />
                </div>
              ) : (
                <select
                  value={formData.role}
                  onChange={(e) => updateFormData('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {mode === 'view' ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <StatusBadge status={formData.status} />
                </div>
              ) : (
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              )}
            </div>
          </div>

          {/* Last Login */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Login
            </label>
            {mode === 'view' ? (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {new Date(formData.lastLogin).toLocaleDateString()}
              </div>
            ) : (
              <input
                type="date"
                value={formData.lastLogin}
                onChange={(e) => updateFormData('lastLogin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Facilities
            </label>
            
            {mode !== 'view' && (
              <div className="flex space-x-2 mb-3">
                <select
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a facility...</option>
                  {availableFacilities
                    .filter(facility => !formData.facilities.includes(facility))
                    .map(facility => (
                      <option key={facility} value={facility}>{facility}</option>
                    ))
                  }
                </select>
                <button
                  type="button"
                  onClick={addFacility}
                  disabled={!facilityInput}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-2">
              {formData.facilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {facility}
                      {mode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => removeFacility(facility)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No facilities assigned</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{mode === 'add' ? 'Add User' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}