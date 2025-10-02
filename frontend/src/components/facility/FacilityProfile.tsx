import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, ChevronRight, Edit2 as Edit, Save, X, MapPin, Settings, Users, Clock, Phone, Mail, Calendar, Hash, Globe } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';

interface FacilityProfileData {
  // General Information
  facilityName: string;
  internalId: string;
  stateIdNumber: string;
  address1: string;
  address2: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;

  // Operational Information
  storeOpenDate: string;
  operationalRegion: string;
  tosPosDate: string;
  gasBrand: string;
  storeOperatorType: string;
  category: string;
  operationalDistrict: string;
  facilityType: string;
  leaseOwn: string;
  ownerId: string;
  tankOwner: string;
  tankOperator: string;
  numAST: number;
  numUSTRegistered: number;
  numMPDs: number;
  insured: boolean;
  remodelCloseDate: string;
  remodelOpenDate: string;
  reasonForRemodel: string;
  channelOfTrade: string;
  carServiceCenter: string;
  truckServiceCenter: string;
  busMaintenance: string;
  defuelingSite: string;
  defuelingMethod: string;

  // Facility Contacts
  complianceManagerName: string;
  complianceManagerPhone: string;
  complianceManagerEmail: string;
  storeManagerName: string;
  storeManagerPhone: string;
  storeManagerEmail: string;
  testingVendorName: string;
  testingVendorPhone: string;
  testingVendorEmail: string;

  // Operating Hours
  operatingHours: {
    [key: string]: {
      closed: boolean;
      open: string;
      close: string;
    };
  };
}

interface FacilityProfileProps {
  selectedFacility?: any;
}

export function FacilityProfile({ selectedFacility }: FacilityProfileProps) {
  const [profileData, setProfileData] = useState<FacilityProfileData>({
    // General Information
    facilityName: '',
    internalId: '',
    stateIdNumber: '',
    address1: '',
    address2: '',
    city: '',
    county: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
    email: '',

    // Operational Information
    storeOpenDate: '',
    operationalRegion: '',
    tosPosDate: '',
    gasBrand: 'Phillips',
    storeOperatorType: '',
    category: '',
    operationalDistrict: '',
    facilityType: '',
    leaseOwn: '',
    ownerId: '',
    tankOwner: '',
    tankOperator: '',
    numAST: 0,
    numUSTRegistered: 0,
    numMPDs: 0,
    insured: false,
    remodelCloseDate: '',
    remodelOpenDate: '',
    reasonForRemodel: '',
    channelOfTrade: '',
    carServiceCenter: '',
    truckServiceCenter: '',
    busMaintenance: '',
    defuelingSite: '',
    defuelingMethod: '',

    // Facility Contacts
    complianceManagerName: '',
    complianceManagerPhone: '',
    complianceManagerEmail: '',
    storeManagerName: '',
    storeManagerPhone: '',
    storeManagerEmail: '',
    testingVendorName: '',
    testingVendorPhone: '',
    testingVendorEmail: '',

    // Operating Hours
    operatingHours: {
      monday: { closed: false, open: '08:00', close: '18:00' },
      tuesday: { closed: false, open: '08:00', close: '18:00' },
      wednesday: { closed: false, open: '08:00', close: '18:00' },
      thursday: { closed: false, open: '08:00', close: '18:00' },
      friday: { closed: false, open: '08:00', close: '18:00' },
      saturday: { closed: false, open: '09:00', close: '17:00' },
      sunday: { closed: true, open: '09:00', close: '17:00' }
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    general: true,
    operational: true,
    contacts: true,
    hours: true
  });

  const [editingSections, setEditingSections] = useState({
    general: false,
    operational: false,
    contacts: false,
    hours: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { hasPermission, user } = useAuthContext();

  useEffect(() => {
    if (selectedFacility) {
      loadFacilityProfile();
    }
  }, [selectedFacility]);

  const loadFacilityProfile = async () => {
    try {
      setLoading(true);
      const profile = await apiService.getFacilityProfile(selectedFacility.id);
      setProfileData(profile);
    } catch (error) {
      // If profile doesn't exist, use default data with facility name
      setProfileData(prev => ({
        ...prev,
        facilityName: selectedFacility.name,
        address1: selectedFacility.street_address || '',
        city: selectedFacility.city || '',
        state: selectedFacility.state || '',
        zip: selectedFacility.zip_code || '',
        country: selectedFacility.country || 'United States'
      }));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleEdit = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (section: keyof typeof editingSections) => {
    try {
      setLoading(true);
      await apiService.updateFacilityProfile(selectedFacility.id, profileData);
      setEditingSections(prev => ({
        ...prev,
        [section]: false
      }));
      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} information saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false
    }));
    loadFacilityProfile(); // Reload original data
  };

  const updateField = (field: keyof FacilityProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateOperatingHours = (day: string, field: 'closed' | 'open' | 'close', value: any) => {
    setProfileData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const setAllHours24_7 = () => {
    const newHours = { ...profileData.operatingHours };
    Object.keys(newHours).forEach(day => {
      newHours[day] = { closed: false, open: '00:00', close: '23:59' };
    });
    setProfileData(prev => ({ ...prev, operatingHours: newHours }));
  };

  const copyMondayToFriday = () => {
    const mondayHours = profileData.operatingHours.monday;
    const newHours = { ...profileData.operatingHours };
    ['tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      newHours[day] = { ...mondayHours };
    });
    setProfileData(prev => ({ ...prev, operatingHours: newHours }));
  };

  const closeWeekends = () => {
    const newHours = { ...profileData.operatingHours };
    newHours.saturday = { ...newHours.saturday, closed: true };
    newHours.sunday = { ...newHours.sunday, closed: true };
    setProfileData(prev => ({ ...prev, operatingHours: newHours }));
  };

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const facilityTypes = [
    'Gas Station', 'Truck Stop', 'Storage Facility', 'Distribution Center', 'Terminal', 'Convenience Store'
  ];

  const renderSectionHeader = (
    title: string, 
    icon: React.ReactNode, 
    section: keyof typeof expandedSections
  ) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => toggleSection(section)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {expandedSections[section] ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      
      {hasPermission('edit_facility_profile') && (
        <div className="flex items-center space-x-2">
          {editingSections[section] ? (
            <>
              <button
                onClick={() => handleSave(section)}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => handleCancel(section)}
                className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleEdit(section)}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderInput = (
    field: keyof FacilityProfileData,
    label: string,
    type: string = 'text',
    options?: string[],
    isEditing: boolean = false
  ) => {
    const value = profileData[field];
    
    if (!isEditing) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
            {value || <span className="text-gray-400 italic">Not set</span>}
          </div>
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <select
            value={value as string}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type="number"
            value={value as number}
            onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>
      );
    }

    if (type === 'toggle') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <div className="flex items-center">
            <button
              onClick={() => updateField(field, !value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-gray-600">{value ? 'Yes' : 'No'}</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={value as string}
          onChange={(e) => updateField(field, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    );
  };

  if (!selectedFacility) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
        <p className="text-blue-700">Please select a facility to view and edit its profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Profile</h1>
              <p className="text-sm text-gray-500">{selectedFacility.name}</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Save className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* 1. General Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderSectionHeader(
            'General Information',
            <MapPin className="h-5 w-5 text-blue-600" />,
            'general'
          )}
          
          {expandedSections.general && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {renderInput('facilityName', 'Facility Name', 'text', undefined, editingSections.general)}
                {renderInput('internalId', 'Internal ID', 'text', undefined, editingSections.general)}
                {renderInput('stateIdNumber', 'State ID Number', 'text', undefined, editingSections.general)}
                {renderInput('address1', 'Address 1', 'text', undefined, editingSections.general)}
                {renderInput('address2', 'Address 2', 'text', undefined, editingSections.general)}
                {renderInput('city', 'City', 'text', undefined, editingSections.general)}
                {renderInput('county', 'County', 'text', undefined, editingSections.general)}
                {renderInput('state', 'State', 'select', usStates, editingSections.general)}
                {renderInput('zip', 'ZIP Code', 'text', undefined, editingSections.general)}
                {renderInput('country', 'Country', 'text', undefined, editingSections.general)}
                {renderInput('phone', 'Phone', 'tel', undefined, editingSections.general)}
                {renderInput('email', 'Email', 'email', undefined, editingSections.general)}
              </div>
            </div>
          )}
        </div>

        {/* 2. Operational Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderSectionHeader(
            'Operational Information',
            <Settings className="h-5 w-5 text-green-600" />,
            'operational'
          )}
          
          {expandedSections.operational && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput('storeOpenDate', 'Store Open Date', 'date', undefined, editingSections.operational)}
                {renderInput('operationalRegion', 'Operational Region', 'text', undefined, editingSections.operational)}
                {renderInput('tosPosDate', 'TOS POS Date', 'date', undefined, editingSections.operational)}
                {renderInput('gasBrand', 'Gas Brand', 'text', undefined, editingSections.operational)}
                {renderInput('storeOperatorType', 'Store Operator Type', 'text', undefined, editingSections.operational)}
                {renderInput('category', 'Category', 'text', undefined, editingSections.operational)}
                {renderInput('operationalDistrict', 'Operational District', 'text', undefined, editingSections.operational)}
                {renderInput('facilityType', 'Facility Type', 'select', facilityTypes, editingSections.operational)}
                {renderInput('leaseOwn', 'Lease/Own', 'text', undefined, editingSections.operational)}
                {renderInput('ownerId', 'Owner ID', 'text', undefined, editingSections.operational)}
                {renderInput('tankOwner', 'Tank Owner', 'text', undefined, editingSections.operational)}
                {renderInput('tankOperator', 'Tank Operator', 'text', undefined, editingSections.operational)}
                {renderInput('numAST', 'Number of AST', 'number', undefined, editingSections.operational)}
                {renderInput('numUSTRegistered', 'Number of UST Registered', 'number', undefined, editingSections.operational)}
                {renderInput('numMPDs', 'Number of MPDs', 'number', undefined, editingSections.operational)}
                {renderInput('insured', 'Insured', 'toggle', undefined, editingSections.operational)}
                {renderInput('remodelCloseDate', 'Remodel Close Date', 'date', undefined, editingSections.operational)}
                {renderInput('remodelOpenDate', 'Remodel Open Date', 'date', undefined, editingSections.operational)}
                {renderInput('reasonForRemodel', 'Reason for Remodel', 'text', undefined, editingSections.operational)}
                {renderInput('channelOfTrade', 'Channel of Trade', 'text', undefined, editingSections.operational)}
                {renderInput('carServiceCenter', 'Car Service Center', 'text', undefined, editingSections.operational)}
                {renderInput('truckServiceCenter', 'Truck Service Center', 'text', undefined, editingSections.operational)}
                {renderInput('busMaintenance', 'Bus Maintenance', 'text', undefined, editingSections.operational)}
                {renderInput('defuelingSite', 'Defueling Site', 'text', undefined, editingSections.operational)}
                {renderInput('defuelingMethod', 'Defueling Method', 'text', undefined, editingSections.operational)}
              </div>
            </div>
          )}
        </div>

        {/* 3. Facility Contacts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderSectionHeader(
            'Facility Contacts',
            <Users className="h-5 w-5 text-purple-600" />,
            'contacts'
          )}
          
          {expandedSections.contacts && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Contact Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900">Compliance Manager</td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="text"
                            value={profileData.complianceManagerName}
                            onChange={(e) => updateField('complianceManagerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter name"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.complianceManagerName || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="tel"
                            value={profileData.complianceManagerPhone}
                            onChange={(e) => updateField('complianceManagerPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.complianceManagerPhone || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="email"
                            value={profileData.complianceManagerEmail}
                            onChange={(e) => updateField('complianceManagerEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.complianceManagerEmail || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900">Store Manager</td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="text"
                            value={profileData.storeManagerName}
                            onChange={(e) => updateField('storeManagerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter name"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.storeManagerName || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="tel"
                            value={profileData.storeManagerPhone}
                            onChange={(e) => updateField('storeManagerPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.storeManagerPhone || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="email"
                            value={profileData.storeManagerEmail}
                            onChange={(e) => updateField('storeManagerEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.storeManagerEmail || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900">Testing Vendor</td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="text"
                            value={profileData.testingVendorName}
                            onChange={(e) => updateField('testingVendorName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter name"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.testingVendorName || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="tel"
                            value={profileData.testingVendorPhone}
                            onChange={(e) => updateField('testingVendorPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.testingVendorPhone || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingSections.contacts ? (
                          <input
                            type="email"
                            value={profileData.testingVendorEmail}
                            onChange={(e) => updateField('testingVendorEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email"
                          />
                        ) : (
                          <span className="text-gray-900">{profileData.testingVendorEmail || <span className="text-gray-400 italic">Not set</span>}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 4. Operating Hours Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderSectionHeader(
            'Operating Hours',
            <Clock className="h-5 w-5 text-orange-600" />,
            'hours'
          )}
          
          {expandedSections.hours && (
            <div className="p-6">
              {editingSections.hours && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={setAllHours24_7}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Set 24/7
                  </button>
                  <button
                    onClick={copyMondayToFriday}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Copy Mon → Fri
                  </button>
                  <button
                    onClick={closeWeekends}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Close Weekends
                  </button>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Day</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Closed</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Open</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Close</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(profileData.operatingHours).map(([day, hours]) => (
                      <tr key={day}>
                        <td className="py-3 px-4 font-medium text-gray-900 capitalize">
                          {day.substring(0, 3)}
                        </td>
                        <td className="py-3 px-4">
                          {editingSections.hours ? (
                            <button
                              onClick={() => updateOperatingHours(day, 'closed', !hours.closed)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                hours.closed ? 'bg-red-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  hours.closed ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          ) : (
                            <span className={`text-sm font-medium ${hours.closed ? 'text-red-600' : 'text-green-600'}`}>
                              {hours.closed ? 'Closed' : 'Open'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingSections.hours ? (
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                              disabled={hours.closed}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          ) : (
                            <span className="text-gray-900">
                              {hours.closed ? '—' : new Date(`2000-01-01T${hours.open}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingSections.hours ? (
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                              disabled={hours.closed}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          ) : (
                            <span className="text-gray-900">
                              {hours.closed ? '—' : new Date(`2000-01-01T${hours.close}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}