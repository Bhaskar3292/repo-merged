import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Mail, User, Clock, CreditCard as Edit, Save, X, Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';

interface FacilityContact {
  id?: number;
  contact_type: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  notes: string;
}

interface OperatingHours {
  id?: number;
  monday_open: string;
  monday_close: string;
  tuesday_open: string;
  tuesday_close: string;
  wednesday_open: string;
  wednesday_close: string;
  thursday_open: string;
  thursday_close: string;
  friday_open: string;
  friday_close: string;
  saturday_open: string;
  saturday_close: string;
  sunday_open: string;
  sunday_close: string;
  holiday_hours: string;
  notes: string;
}

interface FacilityData {
  id?: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  county: string;
  zip_code: string;
  country: string;
  facility_type: string;
  operational_status: string;
  capacity: string;
  description: string;
  contacts: FacilityContact[];
  operating_hours: OperatingHours | null;
}

export function FacilityInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuthContext();
  
  const [facility, setFacility] = useState<FacilityData>({
    name: '',
    street_address: '',
    city: '',
    state: '',
    county: '',
    zip_code: '',
    country: 'United States',
    facility_type: 'gas_station',
    operational_status: 'Active',
    capacity: '',
    description: '',
    contacts: [],
    operating_hours: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Section editing states
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({
    general: false,
    operational: false,
    contacts: false,
    hours: false
  });
  
  // Section data states
  const [sectionData, setSectionData] = useState<Record<string, any>>({
    general: {},
    operational: {},
    contacts: [],
    hours: {}
  });
  
  // Section collapse states
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    general: false,
    operational: false,
    contacts: false,
    hours: false
  });
  
  const isCreateMode = id === 'new';
  const isEditMode = !isCreateMode;

  // Dynamic data loading when facility ID changes
  useEffect(() => {
    if (isEditMode && id) {
      loadFacilityData(parseInt(id));
    } else if (isCreateMode) {
      // Reset to empty state for create mode
      resetToCreateMode();
    }
  }, [id, isEditMode]);

  const resetToCreateMode = () => {
    const emptyFacility: FacilityData = {
      name: '',
      street_address: '',
      city: '',
      state: '',
      county: '',
      zip_code: '',
      country: 'United States',
      facility_type: 'gas_station',
      operational_status: 'Active',
      capacity: '',
      description: '',
      contacts: [],
      operating_hours: null
    };
    
    setFacility(emptyFacility);
    setSectionData({
      general: { ...emptyFacility },
      operational: { ...emptyFacility },
      contacts: [],
      hours: {}
    });
    setEditingSections({
      general: false,
      operational: false,
      contacts: false,
      hours: false
    });
    setError(null);
    setSuccess(null);
  };

  const loadFacilityData = async (facilityId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🏢 Loading facility data for ID: ${facilityId}`);
      
      const data = await apiService.getLocation(facilityId);
      console.log('🏢 Received facility data:', data);
      
      setFacility(data);
      
      // Initialize section data with loaded data
      setSectionData({
        general: {
          name: data.name || '',
          street_address: data.street_address || '',
          city: data.city || '',
          state: data.state || '',
          county: data.county || '',
          zip_code: data.zip_code || '',
          country: data.country || 'United States'
        },
        operational: {
          facility_type: data.facility_type || 'gas_station',
          operational_status: data.operational_status || 'Active',
          capacity: data.capacity || '',
          description: data.description || ''
        },
        contacts: data.contacts || [],
        hours: data.operating_hours || {
          monday_open: '', monday_close: '',
          tuesday_open: '', tuesday_close: '',
          wednesday_open: '', wednesday_close: '',
          thursday_open: '', thursday_close: '',
          friday_open: '', friday_close: '',
          saturday_open: '', saturday_close: '',
          sunday_open: '', sunday_close: '',
          holiday_hours: '', notes: ''
        }
      });
      
    } catch (error) {
      console.error('🏢 Load facility error:', error);
      setError('Failed to load facility data');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionEdit = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
    setError(null);
    setSuccess(null);
  };

  const handleSectionSave = async (section: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isCreateMode) {
        // Create new facility with all data
        const facilityData = {
          ...sectionData.general,
          ...sectionData.operational
        };
        
        console.log('🏢 Creating facility with data:', facilityData);
        const createdFacility = await apiService.createLocation(facilityData);
        console.log('🏢 Facility created:', createdFacility);
        
        // Handle contacts and operating hours for new facility
        if (sectionData.contacts.length > 0) {
          for (const contact of sectionData.contacts) {
            if (contact.name.trim()) {
              await apiService.createFacilityContact(createdFacility.id, contact);
            }
          }
        }
        
        if (Object.values(sectionData.hours).some(value => value)) {
          await apiService.updateOperatingHours(createdFacility.id, sectionData.hours);
        }
        
        setSuccess('Facility created successfully');
        navigate(`/facilities/${createdFacility.id}`);
        
      } else {
        // Update existing facility section
        const facilityId = parseInt(id!);
        
        switch (section) {
          case 'general':
          case 'operational':
            console.log(`🏢 Updating ${section} section:`, sectionData[section]);
            await apiService.updateLocation(facilityId, sectionData[section]);
            break;
          case 'contacts':
            // Handle contact updates - this would need more complex logic
            console.log('🏢 Contact updates not yet implemented');
            break;
          case 'hours':
            console.log('🏢 Updating operating hours:', sectionData.hours);
            await apiService.updateOperatingHours(facilityId, sectionData.hours);
            break;
        }
        
        setSuccess(`${section} section updated successfully`);
        // Reload facility data to get fresh data
        await loadFacilityData(facilityId);
      }
      
      setEditingSections(prev => ({ ...prev, [section]: false }));
      
    } catch (error) {
      console.error(`🏢 Save ${section} section error:`, error);
      setError(`Failed to save ${section} section`);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionCancel = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    
    // Reset section data to original values
    if (isEditMode) {
      switch (section) {
        case 'general':
          setSectionData(prev => ({
            ...prev,
            general: {
              name: facility.name,
              street_address: facility.street_address,
              city: facility.city,
              state: facility.state,
              county: facility.county,
              zip_code: facility.zip_code,
              country: facility.country
            }
          }));
          break;
        case 'operational':
          setSectionData(prev => ({
            ...prev,
            operational: {
              facility_type: facility.facility_type,
              operational_status: facility.operational_status,
              capacity: facility.capacity,
              description: facility.description
            }
          }));
          break;
        case 'contacts':
          setSectionData(prev => ({
            ...prev,
            contacts: facility.contacts || []
          }));
          break;
        case 'hours':
          setSectionData(prev => ({
            ...prev,
            hours: facility.operating_hours || {}
          }));
          break;
      }
    }
    
    setError(null);
  };

  const updateSectionData = (section: string, field: string, value: any) => {
    setSectionData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addContact = () => {
    const newContact: FacilityContact = {
      contact_type: 'store_manager',
      name: '',
      title: '',
      phone: '',
      email: '',
      notes: ''
    };
    
    setSectionData(prev => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
  };

  const removeContact = (index: number) => {
    setSectionData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateContact = (index: number, field: string, value: string) => {
    setSectionData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact: any, i: number) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // US States
  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // Dynamic counties by state
  const countiesByState: Record<string, string[]> = {
    'California': ['Los Angeles', 'Orange', 'San Diego', 'San Francisco', 'Alameda', 'Sacramento', 'Riverside', 'San Bernardino'],
    'Texas': ['Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Fort Bend', 'Denton'],
    'Florida': ['Miami-Dade', 'Broward', 'Palm Beach', 'Orange', 'Hillsborough', 'Pinellas', 'Duval', 'Lee'],
    'New York': ['New York', 'Kings', 'Queens', 'Suffolk', 'Bronx', 'Nassau', 'Westchester', 'Erie'],
    'Pennsylvania': ['Philadelphia', 'Allegheny', 'Montgomery', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'York'],
    'Illinois': ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry', 'Winnebago', 'Madison'],
    'Ohio': ['Cuyahoga', 'Franklin', 'Hamilton', 'Montgomery', 'Summit', 'Lucas', 'Stark', 'Butler'],
    'Georgia': ['Fulton', 'Gwinnett', 'DeKalb', 'Cobb', 'Clayton', 'Cherokee', 'Henry', 'Forsyth'],
    'North Carolina': ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Cumberland', 'Durham', 'Union', 'Johnston'],
    'Michigan': ['Wayne', 'Oakland', 'Macomb', 'Kent', 'Genesee', 'Washtenaw', 'Ottawa', 'Ingham']
  };

  const facilityTypes = [
    { value: 'gas_station', label: 'Gas Station' },
    { value: 'truck_stop', label: 'Truck Stop' },
    { value: 'storage_facility', label: 'Storage Facility' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'convenience_store', label: 'Convenience Store' }
  ];

  const operationalStatuses = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Maintenance', label: 'Under Maintenance' },
    { value: 'Construction', label: 'Under Construction' }
  ];

  const contactTypes = [
    { value: 'store_manager', label: 'Store Manager' },
    { value: 'facility_manager', label: 'Facility Manager' },
    { value: 'operations_manager', label: 'Operations Manager' },
    { value: 'maintenance_contact', label: 'Maintenance Contact' },
    { value: 'emergency_contact', label: 'Emergency Contact' },
    { value: 'regulatory_contact', label: 'Regulatory Contact' }
  ];

  const renderSectionHeader = (title: string, section: string, icon: React.ReactNode) => {
    const isEditing = editingSections[section];
    const isCollapsed = collapsedSections[section];
    
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => toggleSection(section)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            )}
          </button>
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => handleSectionSave(section)}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => handleSectionCancel(section)}
                className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            hasPermission('edit_location') && (
              <button
                onClick={() => handleSectionEdit(section)}
                className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  const renderGeneralInformation = () => {
    const isEditing = editingSections.general;
    const isCollapsed = collapsedSections.general;
    const data = isEditing ? sectionData.general : facility;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {renderSectionHeader('General Information', 'general', <Building2 className="h-5 w-5 text-blue-600" />)}
        
        {!isCollapsed && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Name *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.name || ''}
                    onChange={(e) => updateSectionData('general', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter facility name"
                    required
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.name || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                {isEditing ? (
                  <select
                    value={data.country || 'United States'}
                    onChange={(e) => updateSectionData('general', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.country || 'United States'}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.street_address || ''}
                    onChange={(e) => updateSectionData('general', 'street_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter street address"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.street_address || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.city || ''}
                    onChange={(e) => updateSectionData('general', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.city || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                {isEditing ? (
                  <select
                    value={data.state || ''}
                    onChange={(e) => {
                      updateSectionData('general', 'state', e.target.value);
                      updateSectionData('general', 'county', ''); // Reset county when state changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select State</option>
                    {usStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.state || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  County
                </label>
                {isEditing ? (
                  <select
                    value={data.county || ''}
                    onChange={(e) => updateSectionData('general', 'county', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!data.state}
                  >
                    <option value="">Select County</option>
                    {data.state && countiesByState[data.state]?.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.county || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.zip_code || ''}
                    onChange={(e) => updateSectionData('general', 'zip_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ZIP code"
                    pattern="[0-9]{5}(-[0-9]{4})?"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{data.zip_code || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOperationalInformation = () => {
    const isEditing = editingSections.operational;
    const isCollapsed = collapsedSections.operational;
    const data = isEditing ? sectionData.operational : facility;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {renderSectionHeader('Operational Information', 'operational', <Building2 className="h-5 w-5 text-green-600" />)}
        
        {!isCollapsed && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Type
                </label>
                {isEditing ? (
                  <select
                    value={data.facility_type || 'gas_station'}
                    onChange={(e) => updateSectionData('operational', 'facility_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {facilityTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {facilityTypes.find(t => t.value === data.facility_type)?.label || 'Not specified'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operational Status
                </label>
                {isEditing ? (
                  <select
                    value={data.operational_status || 'Active'}
                    onChange={(e) => updateSectionData('operational', 'operational_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {operationalStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {operationalStatuses.find(s => s.value === data.operational_status)?.label || 'Active'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (gallons)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={data.capacity || ''}
                    onChange={(e) => updateSectionData('operational', 'capacity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter capacity"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {data.capacity ? `${data.capacity} gallons` : 'Not specified'}
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={data.description || ''}
                    onChange={(e) => updateSectionData('operational', 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter facility description"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {data.description || 'No description provided'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFacilityContacts = () => {
    const isEditing = editingSections.contacts;
    const isCollapsed = collapsedSections.contacts;
    const contacts = isEditing ? sectionData.contacts : facility.contacts || [];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {renderSectionHeader('Facility Contacts', 'contacts', <User className="h-5 w-5 text-purple-600" />)}
        
        {!isCollapsed && (
          <div className="p-6">
            {contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact: FacilityContact, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Type
                        </label>
                        {isEditing ? (
                          <select
                            value={contact.contact_type}
                            onChange={(e) => updateContact(index, 'contact_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {contactTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                            {contactTypes.find(t => t.value === contact.contact_type)?.label || contact.contact_type}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter contact name"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contact.name || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={contact.title}
                            onChange={(e) => updateContact(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter job title"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contact.title || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contact.phone || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email address"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contact.email || 'Not specified'}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        {isEditing ? (
                          <textarea
                            value={contact.notes}
                            onChange={(e) => updateContact(index, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Enter additional notes"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{contact.notes || 'No notes'}</p>
                        )}
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => removeContact(index)}
                          className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <button
                    onClick={addContact}
                    className="flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 w-full"
                  >
                    <Plus className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">Add Contact</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No contacts added yet</p>
                {isEditing && (
                  <button
                    onClick={addContact}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Contact</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOperatingHours = () => {
    const isEditing = editingSections.hours;
    const isCollapsed = collapsedSections.hours;
    const hours = isEditing ? sectionData.hours : facility.operating_hours || {};
    
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {renderSectionHeader('Operating Hours', 'hours', <Clock className="h-5 w-5 text-orange-600" />)}
        
        {!isCollapsed && (
          <div className="p-6">
            <div className="space-y-4">
              {days.map(day => (
                <div key={day.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{day.label}</label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Open</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={hours[`${day.key}_open`] || ''}
                        onChange={(e) => updateSectionData('hours', `${day.key}_open`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {hours[`${day.key}_open`] || 'Closed'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Close</label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={hours[`${day.key}_close`] || ''}
                        onChange={(e) => updateSectionData('hours', `${day.key}_close`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {hours[`${day.key}_close`] || 'Closed'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holiday Hours
                  </label>
                  {isEditing ? (
                    <textarea
                      value={hours.holiday_hours || ''}
                      onChange={(e) => updateSectionData('hours', 'holiday_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter holiday hours information"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {hours.holiday_hours || 'No special holiday hours'}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  {isEditing ? (
                    <textarea
                      value={hours.notes || ''}
                      onChange={(e) => updateSectionData('hours', 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter additional notes"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {hours.notes || 'No additional notes'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading facility information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isCreateMode ? 'Create New Facility' : `Edit ${facility.name}`}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isCreateMode ? 'Add a new facility to the system' : 'Update facility information'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Facility Sections */}
      {renderGeneralInformation()}
      {renderOperationalInformation()}
      {renderFacilityContacts()}
      {renderOperatingHours()}
      
      {/* Create Mode Save Button */}
      {isCreateMode && (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSectionSave('general')}
            disabled={loading || !sectionData.general.name}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Facility'}
          </button>
        </div>
      )}
    </div>
  );
}