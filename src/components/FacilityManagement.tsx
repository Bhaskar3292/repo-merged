import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { TabNavigation } from './TabNavigation';

interface FacilityManagementProps {
  selectedFacility?: any;
}

export function FacilityManagement({ selectedFacility }: FacilityManagementProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    operational: true,
    contacts: false,
    hours: false
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState('EST');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [operatingHoursData, setOperatingHoursData] = useState<Record<string, {
    status: 'closed' | 'open24' | 'hours';
    openTime: string;
    closeTime: string;
  }>>({
    monday: { status: 'hours', openTime: '07:00', closeTime: '19:00' },
    tuesday: { status: 'hours', openTime: '07:00', closeTime: '19:00' },
    wednesday: { status: 'hours', openTime: '07:00', closeTime: '19:00' },
    thursday: { status: 'hours', openTime: '07:00', closeTime: '19:00' },
    friday: { status: 'hours', openTime: '07:00', closeTime: '19:00' },
    saturday: { status: 'hours', openTime: '08:00', closeTime: '18:00' },
    sunday: { status: 'hours', openTime: '09:00', closeTime: '17:00' }
  });
  const [facilityContacts, setFacilityContacts] = useState([
    {
      id: 1,
      type: 'Compliance Manager',
      name: '',
      phone: '',
      email: ''
    },
    {
      id: 2,
      type: 'Store Manager',
      name: '',
      phone: '',
      email: ''
    },
    {
      id: 3,
      type: 'Testing Vendor',
      name: '',
      phone: '',
      email: ''
    }
  ]);

  const tabs = [
    { id: 'info', label: 'Facility Info' },
    { id: 'contacts', label: 'Facility Contacts' },
    { id: 'hours', label: 'Operating Hours' },
    { id: 'groups', label: 'Facility Groups' }
  ];

  const facilities = [
    {
      id: 1,
      name: 'Downtown Station A',
      address: '123 Main St, Downtown, CA 90210',
      type: 'Gas Station',
      status: 'Active',
      manager: 'John Smith',
      phone: '(555) 123-4567',
      email: 'john.smith@facility.com'
    },
    {
      id: 2,
      name: 'Highway 101 Facility',
      address: '456 Highway 101, Midtown, CA 90211',
      type: 'Truck Stop',
      status: 'Active',
      manager: 'Sarah Johnson',
      phone: '(555) 234-5678',
      email: 'sarah.johnson@facility.com'
    },
    {
      id: 3,
      name: 'Industrial Park B',
      address: '789 Industrial Blvd, Industrial Area, CA 90212',
      type: 'Storage Facility',
      status: 'Maintenance',
      manager: 'Mike Davis',
      phone: '(555) 345-6789',
      email: 'mike.davis@facility.com'
    }
  ];

  const facilityData = {
    // General Information
    facilityName: 'Downtown Station A',
    facilityStatus: 'Active',
    internalId: 'DSA-001',
    stateIdNumber: 'CA-12345-67890',
    address1: '123 Main Street',
    address2: 'Suite 100',
    zip: '90210',
    city: 'Downtown',
    stateProvince: 'California',
    country: 'United States',
    county: 'Los Angeles County',
    phone: '(555) 123-4567',
    fax: '(555) 123-4568',
    email: 'downtown@facility.com',
    timeZone: 'Pacific Standard Time',

    // Operational Information
    storeOpenDate: '2020-01-15',
    facilityType: 'convenience',
    tosposDate: '2020-01-20',
    leaseOwn: 'Own',
    gasBrand: 'sunoco',
    storeOperatorType: 'commission'
  };

  const timeZones = [
    { value: 'EST', label: 'Eastern Standard Time (EST)', offset: 'UTC-5' },
    { value: 'CST', label: 'Central Standard Time (CST)', offset: 'UTC-6' },
    { value: 'MST', label: 'Mountain Standard Time (MST)', offset: 'UTC-7' },
    { value: 'PST', label: 'Pacific Standard Time (PST)', offset: 'UTC-8' },
    { value: 'AKST', label: 'Alaska Standard Time (AKST)', offset: 'UTC-9' },
    { value: 'HST', label: 'Hawaii Standard Time (HST)', offset: 'UTC-10' },
    { value: 'AST', label: 'Atlantic Standard Time (AST)', offset: 'UTC-4' }
  ];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 7; hour <= 21; hour++) { // 7 AM to 9 PM
      const time12 = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
      const time24 = `${hour.toString().padStart(2, '0')}:00`;
      times.push({ value: time24, label: time12 });
      
      // Add 30-minute intervals
      if (hour < 21) {
        const time12Half = hour > 12 ? `${hour - 12}:30 PM` : hour === 12 ? '12:30 PM' : `${hour}:30 AM`;
        const time24Half = `${hour.toString().padStart(2, '0')}:30`;
        times.push({ value: time24Half, label: time12Half });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const formatTimeDisplay = (time: string) => {
    const timeOption = timeOptions.find(t => t.value === time);
    return timeOption ? timeOption.label : time;
  };

  const updateOperatingHours = (day: string, updates: Partial<typeof operatingHoursData.monday>) => {
    setOperatingHoursData(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const updateContact = (id: number, updates: Partial<typeof facilityContacts[0]>) => {
    setFacilityContacts(prev => 
      prev.map(contact => 
        contact.id === id ? { ...contact, ...updates } : contact
      )
    );
  };

  const addNewContact = () => {
    const newId = Math.max(...facilityContacts.map(c => c.id)) + 1;
    setFacilityContacts(prev => [...prev, {
      id: newId,
      type: 'Additional Contact',
      name: '',
      phone: '',
      email: ''
    }]);
  };

  const removeContact = (id: number) => {
    setFacilityContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderExpandableSection = (title: string, sectionKey: string, children: React.ReactNode) => (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-6 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );

  const renderFormField = (label: string, value: string, type: string = 'text', options?: string[]) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === 'select' && options ? (
        <select
          defaultValue={value}
          disabled={!editMode}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          defaultValue={value}
          disabled={!editMode}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      ) : (
        <input
          type={type}
          defaultValue={value}
          disabled={!editMode}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-6">
            {!selectedFacility && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Building2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
                <p className="text-blue-700">Please select a facility from the search bar above to view and manage facility information.</p>
              </div>
            )}

            {selectedFacility && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{selectedFacility.name}</h2>
                      <p className="text-sm text-gray-500">{selectedFacility.address}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Facility</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedFacility && (
              <div className="space-y-4">
                {/* General Information */}
                {renderExpandableSection('General Information', 'general', (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFormField('Facility Name', facilityData.facilityName)}
                    {renderFormField('Facility Status', facilityData.facilityStatus, 'select', ['Active', 'Inactive', 'Maintenance', 'Closed'])}
                    {renderFormField('Internal ID', facilityData.internalId)}
                    {renderFormField('State ID Number', facilityData.stateIdNumber)}
                    {renderFormField('Address 1', facilityData.address1)}
                    {renderFormField('Address 2', facilityData.address2)}
                    {renderFormField('Zip', facilityData.zip)}
                    {renderFormField('City', facilityData.city)}
                    {renderFormField('State/Province', facilityData.stateProvince)}
                    {renderFormField('Country', facilityData.country)}
                    {renderFormField('County', facilityData.county)}
                    {renderFormField('Phone', facilityData.phone, 'tel')}
                    {renderFormField('Fax', facilityData.fax, 'tel')}
                    {renderFormField('Email', facilityData.email, 'email')}
                    {renderFormField('Time Zone', facilityData.timeZone, 'select', [
                      'Pacific Standard Time',
                      'Mountain Standard Time', 
                      'Central Standard Time',
                      'Eastern Standard Time'
                    ])}
                  </div>
                ))}

                {/* Operational Information */}
                {renderExpandableSection('Operational Information', 'operational', (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Open Date
                      </label>
                      <input
                        type="date"
                        defaultValue={facilityData.storeOpenDate}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TOS/POS Date
                      </label>
                      <input
                        type="date"
                        defaultValue={facilityData.tosposDate}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility Type
                      </label>
                      <select
                        defaultValue={facilityData.facilityType}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="convenience">Convenience</option>
                        <option value="mechanic">Mechanic</option>
                        <option value="garage">Garage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lease/Own
                      </label>
                      <select
                        defaultValue={facilityData.leaseOwn}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="Own">Own</option>
                        <option value="Lease">Lease</option>
                        <option value="Franchise">Franchise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gas Brand
                      </label>
                      <select
                        defaultValue={facilityData.gasBrand}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="sunoco">Sunoco</option>
                        <option value="p66">Phillips 66</option>
                        <option value="76">76</option>
                        <option value="liberty">Liberty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Operator Type
                      </label>
                      <select
                        defaultValue={facilityData.storeOperatorType}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="commission">Commission</option>
                        <option value="franchise">Franchise</option>
                        <option value="comp ops">Comp Ops</option>
                      </select>
                    </div>
                  </div>
                ))}

                {/* Facility Contacts */}
                {renderExpandableSection('Facility Contacts', 'contacts', (
                  <div className="space-y-6">
                    {/* Column Headers */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider py-3 bg-gray-50 rounded-lg px-4">
                      <div className="col-span-3">Contact Type</div>
                      <div className="col-span-3">Name</div>
                      <div className="col-span-3">Phone</div>
                      <div className="col-span-2">Email</div>
                      {editMode && <div className="col-span-1">Actions</div>}
                    </div>

                    {/* Contact Rows */}
                    <div className="divide-y divide-gray-200">
                      {facilityContacts.map((contact, index) => (
                        <div key={contact.id} className="py-4 hover:bg-gray-50">
                          <div className="grid grid-cols-12 gap-4 items-center px-4">
                            {/* Contact Type */}
                            <div className="col-span-3">
                              {editMode && index >= 3 ? (
                                <input
                                  type="text"
                                  value={contact.type}
                                  onChange={(e) => updateContact(contact.id, { type: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., Primary Contact"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{contact.type}</span>
                              )}
                            </div>

                            {/* Name */}
                            <div className="col-span-3">
                              {editMode ? (
                                <input
                                  type="text"
                                  value={contact.name}
                                  onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., John Doe"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">{contact.name || 'Not specified'}</span>
                              )}
                            </div>

                            {/* Phone */}
                            <div className="col-span-3">
                              {editMode ? (
                                <input
                                  type="tel"
                                  value={contact.phone}
                                  onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., (555) 123-4567"
                                  pattern="^\(\d{3}\) \d{3}-\d{4}$"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">{contact.phone || 'Not specified'}</span>
                              )}
                            </div>

                            {/* Email */}
                            <div className="col-span-2">
                              {editMode ? (
                                <input
                                  type="email"
                                  value={contact.email}
                                  onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="e.g., john@example.com"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">{contact.email || 'Not specified'}</span>
                              )}
                            </div>

                            {/* Actions */}
                            {editMode && (
                              <div className="col-span-1">
                                {index >= 3 && (
                                  <button
                                    onClick={() => removeContact(contact.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Contact Button */}
                    {editMode && (
                      <div className="pt-4">
                        <button
                          onClick={addNewContact}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Contact</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Operating Hours */}
                {renderExpandableSection('Operating Hours', 'hours', (
                  <div className="space-y-6">
                    {/* Time Zone Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">Facility Time Zone</h4>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 min-w-0">
                          Select Time Zone:
                        </label>
                        <select
                          value={selectedTimeZone}
                          onChange={(e) => setSelectedTimeZone(e.target.value)}
                          disabled={!editMode}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          {timeZones.map(tz => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label} ({tz.offset})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Daily Operating Hours */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Daily Operating Hours</h4>
                      <div className="text-xs text-gray-500 mb-4">
                        Operating hours are restricted to 7:00 AM – 9:00 PM
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(dayLabels).map(([day, label]) => {
                          const dayData = operatingHoursData[day];
                          return (
                            <div key={day} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">{label}</h5>
                                <div className="text-sm text-gray-600">
                                  {dayData.status === 'closed' ? (
                                    <span className="text-red-600">Closed</span>
                                  ) : dayData.status === 'open24' ? (
                                    <span className="text-green-600">Open 24 hours</span>
                                  ) : (
                                    <span>
                                      {formatTimeDisplay(dayData.openTime)} – {formatTimeDisplay(dayData.closeTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {editMode && (
                                <div className="space-y-3">
                                  {/* Status Selection */}
                                  <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        name={`${day}-status`}
                                        checked={dayData.status === 'closed'}
                                        onChange={() => updateOperatingHours(day, { status: 'closed' })}
                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Closed</span>
                                    </label>
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        name={`${day}-status`}
                                        checked={dayData.status === 'open24'}
                                        onChange={() => updateOperatingHours(day, { status: 'open24' })}
                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Open 24 hours</span>
                                    </label>
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        name={`${day}-status`}
                                        checked={dayData.status === 'hours'}
                                        onChange={() => updateOperatingHours(day, { status: 'hours' })}
                                        className="mr-2 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Set hours</span>
                                    </label>
                                  </div>

                                  {/* Time Selectors */}
                                  {dayData.status === 'hours' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Opening Time
                                        </label>
                                        <select
                                          value={dayData.openTime}
                                          onChange={(e) => updateOperatingHours(day, { openTime: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          {timeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Closing Time
                                        </label>
                                        <select
                                          value={dayData.closeTime}
                                          onChange={(e) => updateOperatingHours(day, { closeTime: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          {timeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Facility Contacts</h2>
                <div className="flex space-x-3">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Edit Contacts
                    </button>
                  )}
                </div>
              </div>

              {/* Column Headers */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Contact Type</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Phone</div>
                  <div className="col-span-2">Email</div>
                  {editMode && <div className="col-span-1">Actions</div>}
                </div>
              </div>

              {/* Contact Rows */}
              <div className="divide-y divide-gray-200">
                {facilityContacts.map((contact, index) => (
                  <div key={contact.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Contact Type */}
                      <div className="col-span-3">
                        {editMode && index >= 3 ? (
                          <input
                            type="text"
                            value={contact.type}
                            onChange={(e) => updateContact(contact.id, { type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Primary Contact"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{contact.type}</span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="col-span-3">
                        {editMode ? (
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., John Doe"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{contact.name || 'Not specified'}</span>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="col-span-3">
                        {editMode ? (
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., (555) 123-4567"
                            pattern="^\(\d{3}\) \d{3}-\d{4}$"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{contact.phone || 'Not specified'}</span>
                        )}
                      </div>

                      {/* Email */}
                      <div className="col-span-2">
                        {editMode ? (
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(contact.id, { email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., john@example.com"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{contact.email || 'Not specified'}</span>
                        )}
                      </div>

                      {/* Actions */}
                      {editMode && (
                        <div className="col-span-1">
                          {index >= 3 && (
                            <button
                              onClick={() => removeContact(contact.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Contact Button */}
              {editMode && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={addNewContact}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Contact</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-6">
            {/* Time Zone Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Operating Hours Configuration</h3>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    Facility Time Zone:
                  </label>
                  <select
                    value={selectedTimeZone}
                    onChange={(e) => setSelectedTimeZone(e.target.value)}
                    disabled={!editMode}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {timeZones.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-6 p-3 bg-blue-50 rounded-lg">
                <strong>Note:</strong> Operating hours are restricted to 7:00 AM – 9:00 PM. All times are displayed in the selected time zone.
              </div>

              {/* Daily Operating Hours */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Daily Operating Hours</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(dayLabels).map(([day, label]) => {
                    const dayData = operatingHoursData[day];
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">{label}</h5>
                          <div className="text-sm text-gray-600">
                            {dayData.status === 'closed' ? (
                              <span className="text-red-600 font-medium">Closed</span>
                            ) : dayData.status === 'open24' ? (
                              <span className="text-green-600 font-medium">Open 24 hours</span>
                            ) : (
                              <span className="font-medium">
                                {formatTimeDisplay(dayData.openTime)} – {formatTimeDisplay(dayData.closeTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {editMode && (
                          <div className="space-y-4">
                            {/* Status Selection */}
                            <div className="flex flex-wrap gap-6">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${day}-status`}
                                  checked={dayData.status === 'closed'}
                                  onChange={() => updateOperatingHours(day, { status: 'closed' })}
                                  className="mr-2 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Closed</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${day}-status`}
                                  checked={dayData.status === 'open24'}
                                  onChange={() => updateOperatingHours(day, { status: 'open24' })}
                                  className="mr-2 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Open 24 hours</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`${day}-status`}
                                  checked={dayData.status === 'hours'}
                                  onChange={() => updateOperatingHours(day, { status: 'hours' })}
                                  className="mr-2 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Set hours</span>
                              </label>
                            </div>

                            {/* Time Selectors */}
                            {dayData.status === 'hours' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opening Time
                                  </label>
                                  <select
                                    value={dayData.openTime}
                                    onChange={(e) => updateOperatingHours(day, { openTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {timeOptions.map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Closing Time
                                  </label>
                                  <select
                                    value={dayData.closeTime}
                                    onChange={(e) => updateOperatingHours(day, { closeTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {timeOptions.map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facility Groups</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Gas Stations</h4>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-600">Active facilities</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Truck Stops</h4>
                  <p className="text-2xl font-bold text-green-600">8</p>
                  <p className="text-sm text-gray-600">Active facilities</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Storage Facilities</h4>
                  <p className="text-2xl font-bold text-purple-600">4</p>
                  <p className="text-sm text-gray-600">Active facilities</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderTimeSelector = (label: string, value: string, onChange?: (value: string) => void) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={!editMode}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      >
        {timeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Add Facility</span>
        </button>
      </div>

      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
}