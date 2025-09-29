import React, { useState, useEffect } from 'react';
import { Building2, CreditCard as Edit, Save, X, Trash2, Plus, CircleAlert as AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';

interface LocationDashboardProps {
  locationId: number;
  locationName: string;
}

interface DashboardSection {
  id: number;
  section: number;
  section_name: string;
  section_type: string;
  field_schema: {
    fields: Array<{
      name: string;
      type: string;
      label: string;
      required?: boolean;
      options?: string[];
    }>;
  };
  data: Record<string, any>;
  last_updated_by_username?: string;
  updated_at: string;
}

export function LocationDashboard({ locationId, locationName }: LocationDashboardProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  
  const { user, hasPermission } = useAuthContext();

  useEffect(() => {
    loadDashboard();
    loadPermissions();
  }, [locationId]);

  const loadPermissions = async () => {
    try {
      const userPermissions = await apiService.getUserPermissions();
      setPermissions(userPermissions);
      
      // Superusers get all permissions
      if (user?.is_superuser) {
        setPermissions(prev => ({
          ...prev,
          edit_dashboard: true,
          delete_locations: true,
          create_locations: true,
          view_locations: true
        }));
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await apiService.getLocationDashboard(locationId);
      setDashboard(dashboardData);
      setSections(dashboardData.sections || []);
    } catch (error) {
      setError('Failed to load dashboard');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (section: DashboardSection) => {
    if (!permissions.edit_dashboard) {
      return;
    }
    
    setEditingSection(section.id);
    setEditData({ ...section.data });
  };

  const handleSaveSection = async (sectionId: number) => {
    try {
      await apiService.updateDashboardSection(sectionId, editData);
      
      // Update local state
      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, data: editData, last_updated_by_username: user?.username }
          : section
      ));
      
      setEditingSection(null);
      setEditData({});
    } catch (error) {
      console.error('Failed to save section:', error);
      setError('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!permissions.delete_locations) {
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        // Reset section data to empty
        await apiService.updateDashboardSection(sectionId, {});
        
        setSections(prev => prev.map(section => 
          section.id === sectionId 
            ? { ...section, data: {} }
            : section
        ));
      } catch (error) {
        console.error('Failed to delete section:', error);
        setError('Failed to delete section');
      }
    }
  };

  const updateEditData = (fieldName: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: any, value: any, isEditing: boolean) => {
    const fieldValue = value || '';
    
    if (!isEditing) {
      if (!fieldValue && fieldValue !== 0) {
        return <span className="text-gray-400 italic">Not set</span>;
      }
      
      switch (field.type) {
        case 'date':
          return new Date(fieldValue).toLocaleDateString();
        case 'textarea':
          return <div className="whitespace-pre-wrap">{fieldValue}</div>;
        default:
          return fieldValue;
      }
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={fieldValue}
            onChange={(e) => updateEditData(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder={field.label}
          />
        );
      
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => updateEditData(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={fieldValue}
            onChange={(e) => updateEditData(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.label}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={fieldValue}
            onChange={(e) => updateEditData(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      default:
        return (
          <input
            type={field.type}
            value={fieldValue}
            onChange={(e) => updateEditData(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.label}
          />
        );
    }
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'info':
        return '📋';
      case 'metrics':
        return '📊';
      case 'status':
        return '🔍';
      case 'controls':
        return '⚙️';
      case 'reports':
        return '📈';
      default:
        return '📄';
    }
  };

  const isEmpty = (data: Record<string, any>) => {
    return Object.keys(data).length === 0 || Object.values(data).every(value => !value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{locationName} Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const isEditing = editingSection === section.id;
          const sectionIsEmpty = isEmpty(section.data);
          
          return (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSectionIcon(section.section_type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
                    {section.last_updated_by_username && (
                      <p className="text-xs text-gray-500">
                        Last updated by {section.last_updated_by_username}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveSection(section.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                      {permissions.delete_locations && (
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </>
                  ) : (
                    permissions.edit_dashboard && (
                      <button
                        onClick={() => handleEditSection(section)}
                        className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="p-4">
                {sectionIsEmpty && !isEditing ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Plus className="h-8 w-8 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-4">No data available</p>
                    {permissions.edit_dashboard && (
                      <button
                        onClick={() => handleEditSection(section)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add information
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {section.field_schema.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-sm text-gray-900">
                          {renderField(
                            field, 
                            isEditing ? editData[field.name] : section.data[field.name], 
                            isEditing
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}