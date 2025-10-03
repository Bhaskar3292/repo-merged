import React, { useState, useEffect } from 'react';
import { FileText, Calendar, AlertTriangle,CheckCircle, Clock, Download, Upload, Plus, Eye, CreditCard as Edit, Save, X, Paperclip } from 'lucide-react';
import { apiService } from '../../services/api';

interface PermitsLicensesProps {
  selectedFacility?: any;
}

export function PermitsLicenses({ selectedFacility }: PermitsLicensesProps) {
  const [filter, setFilter] = useState('all');
  const [editingPermit, setEditingPermit] = useState<number | null>(null);
  const [editedPermit, setEditedPermit] = useState<any>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPermitForUpload, setSelectedPermitForUpload] = useState<number | null>(null);
  const [newPermit, setNewPermit] = useState({
    permit_type: 'operating',
    permit_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    description: '',
    renewal_required: true
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string[]>>({});
  const [downloadingPermit, setDownloadingPermit] = useState<number | null>(null);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFacility) {
      loadPermits();
    }
  }, [selectedFacility]);

  const loadPermits = async () => {
    if (!selectedFacility?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getPermits(selectedFacility.id);
      console.log('🔍 Loaded permits:', response);
      setPermits(response);
    } catch (error: any) {
      console.error('Failed to load permits:', error);
      setError(error.message || 'Failed to load permits');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermit = (permit: any) => {
    setEditingPermit(permit.id);
    setEditedPermit(permit);
  };

  const handleSavePermit = async () => {
    if (!editingPermit || !editedPermit) return;

    setLoading(true);
    setError(null);
    try {
      await apiService.updatePermit(editingPermit, {
        location: selectedFacility.id,
        permit_type: editedPermit.permit_type,
        permit_number: editedPermit.permit_number,
        issuing_authority: editedPermit.issuing_authority,
        issue_date: editedPermit.issue_date,
        expiry_date: editedPermit.expiry_date,
        description: editedPermit.description || '',
        renewal_required: editedPermit.renewal_required !== false
      });

      setEditingPermit(null);
      setEditedPermit({});
      setSuccess('Permit updated successfully');
      setTimeout(() => setSuccess(null), 5000);

      await loadPermits();
    } catch (error: any) {
      console.error('Failed to update permit:', error);
      setError(error.message || 'Failed to update permit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermit = async () => {
    if (!newPermit.permit_number.trim()) {
      setError('Permit number is required');
      return;
    }

    if (!selectedFacility?.id) {
      setError('No facility selected');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const permitData = {
        location: selectedFacility.id,
        permit_type: newPermit.permit_type,
        permit_number: newPermit.permit_number,
        issuing_authority: newPermit.issuing_authority,
        issue_date: newPermit.issue_date,
        expiry_date: newPermit.expiry_date,
        description: newPermit.description,
        renewal_required: newPermit.renewal_required
      };

      console.log('🔍 Creating permit:', permitData);
      await apiService.createPermit(selectedFacility.id, permitData);

      setShowAddModal(false);
      setNewPermit({
        permit_type: 'operating',
        permit_number: '',
        issuing_authority: '',
        issue_date: '',
        expiry_date: '',
        description: '',
        renewal_required: true
      });
      setSuccess(`Permit "${newPermit.permit_number}" created successfully`);
      setTimeout(() => setSuccess(null), 5000);

      await loadPermits();
    } catch (error: any) {
      console.error('Failed to create permit:', error);
      setError(error.message || 'Failed to create permit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermit = async (permitId: number, permitNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete permit "${permitNumber}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await apiService.deletePermit(permitId);

      setSuccess(`Permit "${permitNumber}" deleted successfully`);
      setTimeout(() => setSuccess(null), 5000);

      await loadPermits();
    } catch (error: any) {
      console.error('Failed to delete permit:', error);
      setError(error.message || 'Failed to delete permit');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && selectedPermitForUpload) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => ({
        ...prev,
        [selectedPermitForUpload]: [
          ...(prev[selectedPermitForUpload] || []),
          ...fileNames
        ]
      }));
      setShowUploadModal(false);
      setSelectedPermitForUpload(null);
    }
  };

  const handleDownloadPermit = async (permitId: number, permitNumber: string) => {
    setDownloadingPermit(permitId);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if permit has uploaded files
      const permitFiles = uploadedFiles[permitId];
      if (!permitFiles || permitFiles.length === 0) {
        alert('No documents available for download. Please upload permit documents first.');
        return;
      }
      
      // Simulate downloading the first uploaded file
      const fileName = permitFiles[0];
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      
      // Create a mock file blob based on file type
      let mimeType = 'application/pdf';
      let content = `Mock ${permitNumber} permit document content`;
      
      switch (fileExtension) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
          mimeType = `image/${fileExtension}`;
          break;
        case 'doc':
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          mimeType = 'application/octet-stream';
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again or contact support if the problem persists.');
    } finally {
      setDownloadingPermit(null);
    }
  };

  const openUploadModal = (permitId: number) => {
    setSelectedPermitForUpload(permitId);
    setShowUploadModal(true);
  };

  const handleCancelEdit = () => {
    setEditingPermit(null);
    setEditedPermit({});
  };

  const updateEditedPermit = (field: string, value: string) => {
    setEditedPermit(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expiring_soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Permits are already filtered by location from API
  const facilityPermits = permits;

  // Filter by status using calculated_status from backend
  const filteredFacilityPermits = facilityPermits.filter(permit => {
    if (filter === 'all') return true;
    if (filter === 'active') return permit.calculated_status === 'active';
    if (filter === 'expiring') return permit.calculated_status === 'expiring_soon';
    if (filter === 'expired') return permit.calculated_status === 'expired';
    return true;
  });

  const statsData = [
    {
      title: 'Total Permits',
      value: facilityPermits.length.toString(),
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Active Permits',
      value: facilityPermits.filter(p => p.calculated_status === 'active').length.toString(),
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Expiring Soon',
      value: facilityPermits.filter(p => p.calculated_status === 'expiring_soon').length.toString(),
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Expired',
      value: facilityPermits.filter(p => p.calculated_status === 'expired').length.toString(),
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedFacility ? `${selectedFacility.name} - Permits & Licenses` : 'Permits & Licenses'}
          </h1>
          {selectedFacility && (
            <p className="text-sm text-gray-500 mt-1">{selectedFacility.address}</p>
          )}
        </div>
        <div className="flex space-x-3">
          {selectedFacility && (
            <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
            <Plus className="h-4 w-4" />
            <span>Add Permit</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {!selectedFacility && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
          <p className="text-blue-700">Please select a facility from the search bar above to view permits and licenses.</p>
        </div>
      )}

      {/* Statistics Cards */}
      {selectedFacility && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            red: 'bg-red-100 text-red-600'
          };

          return (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Filter Tabs */}
      {selectedFacility && (
        <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'all', label: 'All Permits' },
            { id: 'active', label: 'Active' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'expired', label: 'Expired' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        </div>
      )}

      {/* Permits Table */}
      {selectedFacility && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading permits...</p>
              </div>
            )}

            {!loading && filteredFacilityPermits.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No permits found</p>
              </div>
            )}

            {!loading && filteredFacilityPermits.map((permit) => {
              const daysUntilExpiry = getDaysUntilExpiry(permit.expiry_date);
              const isEditing = editingPermit === permit.id;

              return (
                <div key={permit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {permit.permit_type?.replace('_', ' ') || 'Unknown Type'}
                        </h3>
                        <p className="text-sm text-gray-500">{permit.location_name || selectedFacility?.name}</p>
                      </div>
                    </div>
                    <span className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(permit.calculated_status)}`}>
                      {getStatusIcon(permit.calculated_status)}
                      <span>{getStatusLabel(permit.calculated_status)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">Permit Number:</span>
                      <p className="text-gray-900 mt-0.5">{permit.permit_number || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Issue Date:</span>
                      <p className="text-gray-900 mt-0.5">
                        {permit.issue_date ? new Date(permit.issue_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expiry Date:</span>
                      <div className="mt-0.5">
                        <p className="text-gray-900">
                          {permit.expiry_date ? new Date(permit.expiry_date).toLocaleDateString() : 'N/A'}
                        </p>
                        {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                          <p className="text-yellow-600 font-medium text-xs mt-1">
                            ⚠️ {daysUntilExpiry} days remaining
                          </p>
                        )}
                        {daysUntilExpiry <= 0 && (
                          <p className="text-red-600 font-medium text-xs mt-1">
                            ❌ Expired {Math.abs(daysUntilExpiry)} days ago
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Authority:</span>
                      <p className="text-gray-900 mt-0.5">{permit.issuing_authority || 'N/A'}</p>
                    </div>
                  </div>

                  {permit.description && (
                    <div className="text-sm mb-4">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 mt-0.5">{permit.description}</p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {editingPermit === permit.id ? (
                      <>
                        <button
                          onClick={handleSavePermit}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEditPermit(permit)}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPermit(permit.id, permit.permit_number)}
                          disabled={downloadingPermit === permit.id}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Download className={`h-4 w-4 ${downloadingPermit === permit.id ? 'animate-spin' : ''}`} />
                          <span>{downloadingPermit === permit.id ? 'Downloading...' : 'Download'}</span>
                        </button>
                        <button
                          onClick={() => openUploadModal(permit.id)}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                        </button>
                        {permit.calculated_status === 'expiring_soon' && (
                          <button className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                            <Calendar className="h-4 w-4" />
                            <span>Renew</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePermit(permit.id, permit.permit_number)}
                          disabled={loading}
                          className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                        {uploadedFiles[permit.id] && uploadedFiles[permit.id].length > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Paperclip className="h-3 w-3" />
                            <span>{uploadedFiles[permit.id].length} file(s)</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {selectedFacility && facilityPermits.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Permits Found</h3>
          <p className="text-gray-600 mb-4">This facility doesn't have any permits or licenses on file.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Permit</span>
          </button>
        </div>
      )}

      {/* Add Permit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Permit</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Type *
                </label>
                <select
                  value={newPermit.permit_type}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, permit_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="operating">Operating Permit</option>
                  <option value="environmental">Environmental Permit</option>
                  <option value="safety">Safety Permit</option>
                  <option value="construction">Construction Permit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Number *
                </label>
                <input
                  type="text"
                  value={newPermit.permit_number}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, permit_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., OP-2024-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={newPermit.issuing_authority}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, issuing_authority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., State Environmental Agency"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={newPermit.issue_date}
                    onChange={(e) => setNewPermit(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newPermit.expiry_date}
                    onChange={(e) => setNewPermit(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newPermit.description}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or details"
                  rows={3}
                />
              </div>
            </form>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPermit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Add Permit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedPermitForUpload(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload supporting documents for this permit. Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Choose Files
                </label>
              </div>
              
              {selectedPermitForUpload && uploadedFiles[selectedPermitForUpload] && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Previously uploaded files:</p>
                  {uploadedFiles[selectedPermitForUpload].map((fileName, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <Paperclip className="h-4 w-4" />
                      <span>{fileName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedPermitForUpload(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}