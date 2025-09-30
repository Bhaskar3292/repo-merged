import React, { useState } from 'react';
import { FileText, Calendar,AlertTriangle, CheckCircle, Clock, Download, Upload, Plus, Eye, CreditCard as Edit, Save, X, Paperclip } from 'lucide-react';

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
    facility: '',
    type: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    status: 'Active',
    authority: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string[]>>({});
  const [downloadingPermit, setDownloadingPermit] = useState<number | null>(null);
  const [permits, setPermits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditPermit = (permit: any) => {
    setEditingPermit(permit.id);
    setEditedPermit(permit);
  };

  const handleSavePermit = () => {
    setPermits(prev => prev.map(permit => 
      permit.id === editingPermit ? { ...permit, ...editedPermit } : permit
    ));
    setEditingPermit(null);
    setEditedPermit({});
  };

  const handleAddPermit = () => {
    const newId = Math.max(...permits.map(p => p.id), 0) + 1;
    const permitToAdd = {
      ...newPermit,
      id: newId,
      facility: selectedFacility?.name || newPermit.facility
    };
    setPermits(prev => [...prev, permitToAdd]);
    setNewPermit({
      facility: '',
      type: '',
      number: '',
      issueDate: '',
      expiryDate: '',
      status: 'Active',
      authority: ''
    });
    setShowAddModal(false);
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
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Expiring Soon':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter permits by selected facility
  const facilityPermits = selectedFacility 
    ? permits.filter(permit => permit.facility === selectedFacility.name)
    : permits;

  const filteredPermits = permits.filter(permit => {
    if (filter === 'all') return true;
    if (filter === 'active') return permit.status === 'Active';
    if (filter === 'expiring') return permit.status === 'Expiring Soon';
    if (filter === 'expired') return permit.status === 'Expired';
    return true;
  });

  const filteredFacilityPermits = facilityPermits.filter(permit => {
    if (filter === 'all') return true;
    if (filter === 'active') return permit.status === 'Active';
    if (filter === 'expiring') return permit.status === 'Expiring Soon';
    if (filter === 'expired') return permit.status === 'Expired';
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
      value: facilityPermits.filter(p => p.status === 'Active').length.toString(),
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Expiring Soon',
      value: facilityPermits.filter(p => p.status === 'Expiring Soon').length.toString(),
      icon: Clock,
      color: 'yellow'
    },
    {
      title: 'Expired',
      value: facilityPermits.filter(p => p.status === 'Expired').length.toString(),
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
            {filteredFacilityPermits.map((permit) => {
              const daysUntilExpiry = getDaysUntilExpiry(permit.expiryDate);
              const isEditing = editingPermit === permit.id;
              const displayPermit = isEditing ? editedPermit : permit;
              
              return (
                <div key={permit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        {editingPermit === permit.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editedPermit.type || permit.type}
                              onChange={(e) => updateEditedPermit('type', e.target.value)}
                              className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                              placeholder="Permit Type"
                            />
                            <input
                              type="text"
                              value={editedPermit.facility || permit.facility}
                              onChange={(e) => updateEditedPermit('facility', e.target.value)}
                              className="text-sm text-gray-500 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                              placeholder="Facility Name"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900">{permit.type}</h3>
                            <p className="text-sm text-gray-500">{permit.facility}</p>
                          </>
                        )}
                      </div>
                    </div>
                    {editingPermit === permit.id ? (
                      <select
                        value={editedPermit.status || permit.status}
                        onChange={(e) => updateEditedPermit('status', e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(editedPermit.status || permit.status)}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                        <option value="Pending">Pending</option>
                      </select>
                    ) : (
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                        {getStatusIcon(permit.status)}
                        <span>{permit.status}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Permit Number:</span>
                      {editingPermit === permit.id ? (
                        <input
                          type="text"
                          value={editedPermit.number || permit.number}
                          onChange={(e) => updateEditedPermit('number', e.target.value)}
                          className="block w-full mt-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Permit Number"
                        />
                      ) : (
                        <p>{permit.number}</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Issue Date:</span>
                      {editingPermit === permit.id ? (
                        <input
                          type="date"
                          value={editedPermit.issueDate || permit.issueDate}
                          onChange={(e) => updateEditedPermit('issueDate', e.target.value)}
                          className="block w-full mt-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p>{new Date(permit.issueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Expiry Date:</span>
                      {editingPermit === permit.id ? (
                        <input
                          type="date"
                          value={editedPermit.expiryDate || permit.expiryDate}
                          onChange={(e) => updateEditedPermit('expiryDate', e.target.value)}
                          className="block w-full mt-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <>
                          <p>{new Date(permit.expiryDate).toLocaleDateString()}</p>
                          {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                            <p className="text-yellow-600 font-medium">({daysUntilExpiry} days remaining)</p>
                          )}
                          {daysUntilExpiry < 0 && (
                            <p className="text-red-600 font-medium">(Expired {Math.abs(daysUntilExpiry)} days ago)</p>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Authority:</span>
                      {editingPermit === permit.id ? (
                        <input
                          type="text"
                          value={editedPermit.authority || permit.authority}
                          onChange={(e) => updateEditedPermit('authority', e.target.value)}
                          className="block w-full mt-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Issuing Authority"
                        />
                      ) : (
                        <p>{permit.authority}</p>
                      )}
                    </div>
                  </div>

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
                          onClick={() => handleDownloadPermit(permit.id, permit.number)}
                          disabled={downloadingPermit === permit.id}
                          className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
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
                        {permit.status === 'Expiring Soon' && (
                          <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            <Calendar className="h-4 w-4" />
                            <span>Renew</span>
                          </button>
                        )}
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
                  Facility Name
                </label>
                <input
                  type="text"
                  value={newPermit.facility}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, facility: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Downtown Station A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Type
                </label>
                <input
                  type="text"
                  value={newPermit.type}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Operating Permit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permit Number
                </label>
                <input
                  type="text"
                  value={newPermit.number}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., OP-2024-001"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={newPermit.issueDate}
                    onChange={(e) => setNewPermit(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newPermit.expiryDate}
                    onChange={(e) => setNewPermit(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={newPermit.authority}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, authority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., State Environmental Agency"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newPermit.status}
                  onChange={(e) => setNewPermit(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Pending">Pending</option>
                </select>
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