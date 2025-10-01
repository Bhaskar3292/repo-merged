import React, { useState, useEffect } from 'react';
import { Zap, Plus, Search,  Grid3X3, List, Eye, CreditCard as Edit, Trash2, X, Save, ListFilter as Filter, Building2 } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

interface Tank {
  id: number;
  label: string;
  product: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Out of Service';
  size: string;
  tankLined: 'Yes' | 'No';
  compartment: 'Yes' | 'No';
  manifoldedWith: string;
  pipingManifoldedWith: string;
  trackReleaseDetection: 'Yes' | 'No';
  tankMaterial: string;
  releaseDetection: string;
  stpSumps: string;
  pipingDetection: string;
  pipingMaterial: string;
  atgId: string;
  installed: string;
  pipingInstalled: string;
  created_at?: string;
  updated_at?: string;
}

interface TankManagementProps {
  selectedFacility?: any;
}

export function TankManagement({ selectedFacility }: TankManagementProps) {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTank, setEditingTank] = useState<Tank | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newTank, setNewTank] = useState<Omit<Tank, 'id'>>({
    label: '',
    product: '',
    status: 'Active',
    size: '',
    tankLined: 'Yes',
    compartment: 'No',
    manifoldedWith: '',
    pipingManifoldedWith: '',
    trackReleaseDetection: 'Yes',
    tankMaterial: '',
    releaseDetection: '',
    stpSumps: '',
    pipingDetection: '',
    pipingMaterial: '',
    atgId: '',
    installed: '',
    pipingInstalled: ''
  });

  const { hasPermission, user: currentUser } = useAuthContext();

  useEffect(() => {
    if (selectedFacility) {
      loadTanks();
    }
  }, [selectedFacility]);

  const loadTanks = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - replace with actual API call
      const mockTanks: Tank[] = [
        {
          id: 1,
          label: 'Tank A1',
          product: 'Regular Gasoline',
          status: 'Active',
          size: '10,000 gallons',
          tankLined: 'Yes',
          compartment: 'No',
          manifoldedWith: 'Tank A2',
          pipingManifoldedWith: 'Line B',
          trackReleaseDetection: 'Yes',
          tankMaterial: 'Fiberglass',
          releaseDetection: 'Continuous ATG',
          stpSumps: 'Installed',
          pipingDetection: 'Line Leak Detector',
          pipingMaterial: 'HDPE',
          atgId: 'ATG-001',
          installed: '2020-01-15',
          pipingInstalled: '2020-01-20'
        },
        {
          id: 2,
          label: 'Tank B1',
          product: 'Premium Gasoline',
          status: 'Active',
          size: '8,000 gallons',
          tankLined: 'Yes',
          compartment: 'Yes',
          manifoldedWith: '',
          pipingManifoldedWith: 'Line A',
          trackReleaseDetection: 'Yes',
          tankMaterial: 'Steel',
          releaseDetection: 'Monthly Manual',
          stpSumps: 'Not Installed',
          pipingDetection: 'Pressure Test',
          pipingMaterial: 'Steel',
          atgId: 'ATG-002',
          installed: '2019-06-10',
          pipingInstalled: '2019-06-15'
        },
        {
          id: 3,
          label: 'Tank C1',
          product: 'Diesel',
          status: 'Maintenance',
          size: '12,000 gallons',
          tankLined: 'No',
          compartment: 'No',
          manifoldedWith: 'Tank C2',
          pipingManifoldedWith: '',
          trackReleaseDetection: 'No',
          tankMaterial: 'Concrete',
          releaseDetection: 'Visual Inspection',
          stpSumps: 'Installed',
          pipingDetection: 'None',
          pipingMaterial: 'PVC',
          atgId: '',
          installed: '2018-03-22',
          pipingInstalled: '2018-03-25'
        }
      ];
      setTanks(mockTanks);
    } catch (error) {
      setError('Failed to load tanks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTank = () => {
    if (!newTank.label.trim()) {
      setError('Tank label is required');
      return;
    }

    const tankToAdd: Tank = {
      ...newTank,
      id: Math.max(...tanks.map(t => t.id), 0) + 1
    };

    setTanks(prev => [...prev, tankToAdd]);
    setShowAddModal(false);
    resetForm();
    setSuccess(`Tank "${newTank.label}" created successfully`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateTank = (updatedTank: Tank) => {
    setTanks(prev => prev.map(tank => 
      tank.id === updatedTank.id ? updatedTank : tank
    ));
    setEditingTank(null);
    setSuccess(`Tank "${updatedTank.label}" updated successfully`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteTank = (tankId: number) => {
    const tank = tanks.find(t => t.id === tankId);
    if (tank && window.confirm(`Are you sure you want to delete "${tank.label}"?`)) {
      setTanks(prev => prev.filter(tank => tank.id !== tankId));
      setSuccess(`Tank "${tank.label}" deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const resetForm = () => {
    setNewTank({
      label: '',
      product: '',
      status: 'Active',
      size: '',
      tankLined: 'Yes',
      compartment: 'No',
      manifoldedWith: '',
      pipingManifoldedWith: '',
      trackReleaseDetection: 'Yes',
      tankMaterial: '',
      releaseDetection: '',
      stpSumps: '',
      pipingDetection: '',
      pipingMaterial: '',
      atgId: '',
      installed: '',
      pipingInstalled: ''
    });
    setError(null);
  };

  const updateNewTankField = (field: keyof Omit<Tank, 'id'>, value: string) => {
    setNewTank(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Search functionality
  const filteredTanks = tanks.filter(tank => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tank.label.toLowerCase().includes(searchLower) ||
      tank.product.toLowerCase().includes(searchLower) ||
      tank.tankMaterial.toLowerCase().includes(searchLower) ||
      tank.manifoldedWith.toLowerCase().includes(searchLower) ||
      tank.pipingManifoldedWith.toLowerCase().includes(searchLower) ||
      tank.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out of Service':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const facilityTypes = [
    { value: 'gas_station', label: 'Gas Station' },
    { value: 'truck_stop', label: 'Truck Stop' },
    { value: 'storage_facility', label: 'Storage Facility' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'convenience_store', label: 'Convenience Store' }
  ];

  const productOptions = [
    'Regular Gasoline',
    'Premium Gasoline',
    'Diesel',
    'Kerosene',
    'Heating Oil',
    'Motor Oil',
    'Hydraulic Fluid',
    'Other'
  ];

  const tankMaterialOptions = [
    'Fiberglass',
    'Steel',
    'Concrete',
    'Polyethylene',
    'Aluminum',
    'Other'
  ];

  const pipingMaterialOptions = [
    'HDPE',
    'Steel',
    'PVC',
    'Fiberglass',
    'Copper',
    'Other'
  ];

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTanks.map((tank) => (
        <div key={tank.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tank.label}</h3>
                <p className="text-sm text-gray-500">{tank.product}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setEditingTank(tank)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit tank"
              >
                <Edit className="h-4 w-4" />
              </button>
              {hasPermission('delete_tanks') && (
                <button
                  onClick={() => handleDeleteTank(tank.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete tank"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(tank.status)}`}>
                {tank.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Size:</span>
              <span className="text-sm font-medium text-gray-900">{tank.size}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Material:</span>
              <span className="text-sm font-medium text-gray-900">{tank.tankMaterial}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lined:</span>
              <span className={`text-sm font-medium ${tank.tankLined === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                {tank.tankLined}
              </span>
            </div>
            
            {tank.manifoldedWith && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Manifolded With:</span>
                <span className="text-sm font-medium text-gray-900">{tank.manifoldedWith}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Release Detection:</span>
              <span className={`text-sm font-medium ${tank.trackReleaseDetection === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                {tank.trackReleaseDetection}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tank Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specifications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTanks.map((tank) => (
              <tr key={tank.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tank.label}</div>
                    <div className="text-sm text-gray-500">{tank.product}</div>
                    {tank.atgId && (
                      <div className="text-xs text-gray-400">ATG: {tank.atgId}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(tank.status)}`}>
                    {tank.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div>Size: {tank.size}</div>
                    <div>Material: {tank.tankMaterial}</div>
                    <div>Lined: {tank.tankLined}</div>
                    {tank.compartment === 'Yes' && (
                      <div className="text-blue-600">Compartmentalized</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className={tank.trackReleaseDetection === 'Yes' ? 'text-green-600' : 'text-red-600'}>
                      {tank.trackReleaseDetection === 'Yes' ? 'Enabled' : 'Disabled'}
                    </div>
                    {tank.releaseDetection && (
                      <div className="text-xs text-gray-500">{tank.releaseDetection}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingTank(tank)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      title="Edit tank"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {hasPermission('delete_tanks') && (
                      <button
                        onClick={() => handleDeleteTank(tank.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete tank"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTankForm = (tank?: Tank) => {
    const isEditing = !!tank;
    const formData = isEditing ? tank : newTank;
    
    const updateField = (field: keyof Omit<Tank, 'id'>, value: string) => {
      if (isEditing) {
        setEditingTank(prev => prev ? { ...prev, [field]: value } : null);
      } else {
        updateNewTankField(field, value);
      }
    };

    const handleSave = () => {
      if (isEditing && editingTank) {
        handleUpdateTank(editingTank);
      } else {
        handleCreateTank();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Tank' : 'Add New Tank'}
              </h3>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  setEditingTank(null);
                } else {
                  setShowAddModal(false);
                  resetForm();
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-8">
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
                    Tank Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => updateField('label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tank A1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product
                  </label>
                  <select
                    value={formData.product}
                    onChange={(e) => updateField('product', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {productOptions.map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value as Tank['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => updateField('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10,000 gallons"
                  />
                </div>
              </div>
            </div>

            {/* Tank Configuration */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Tank Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tank Material
                  </label>
                  <select
                    value={formData.tankMaterial}
                    onChange={(e) => updateField('tankMaterial', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Material</option>
                    {tankMaterialOptions.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tank Lined
                  </label>
                  <select
                    value={formData.tankLined}
                    onChange={(e) => updateField('tankLined', e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compartment
                  </label>
                  <select
                    value={formData.compartment}
                    onChange={(e) => updateField('compartment', e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={formData.installed}
                    onChange={(e) => updateField('installed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Manifold Configuration */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Manifold Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manifolded With
                  </label>
                  <input
                    type="text"
                    value={formData.manifoldedWith}
                    onChange={(e) => updateField('manifoldedWith', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tank A2, Tank B1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piping Manifolded With
                  </label>
                  <input
                    type="text"
                    value={formData.pipingManifoldedWith}
                    onChange={(e) => updateField('pipingManifoldedWith', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Line A, Line B"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piping Material
                  </label>
                  <select
                    value={formData.pipingMaterial}
                    onChange={(e) => updateField('pipingMaterial', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Material</option>
                    {pipingMaterialOptions.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piping Installed Date
                  </label>
                  <input
                    type="date"
                    value={formData.pipingInstalled}
                    onChange={(e) => updateField('pipingInstalled', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Release Detection */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Release Detection</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Track Release Detection
                  </label>
                  <select
                    value={formData.trackReleaseDetection}
                    onChange={(e) => updateField('trackReleaseDetection', e.target.value as 'Yes' | 'No')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release Detection Method
                  </label>
                  <input
                    type="text"
                    value={formData.releaseDetection}
                    onChange={(e) => updateField('releaseDetection', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Continuous ATG, Monthly Manual"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    STP Sumps
                  </label>
                  <input
                    type="text"
                    value={formData.stpSumps}
                    onChange={(e) => updateField('stpSumps', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Installed, Not Installed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Piping Detection
                  </label>
                  <input
                    type="text"
                    value={formData.pipingDetection}
                    onChange={(e) => updateField('pipingDetection', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Line Leak Detector, Pressure Test"
                  />
                </div>
              </div>
            </div>

            {/* ATG Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">ATG Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ATG ID
                  </label>
                  <input
                    type="text"
                    value={formData.atgId}
                    onChange={(e) => updateField('atgId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ATG-001"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (isEditing) {
                  setEditingTank(null);
                } else {
                  setShowAddModal(false);
                  resetForm();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.label.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <Save className="h-4 w-4" />
                <span>{isEditing ? 'Update Tank' : 'Create Tank'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedFacility) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
        <p className="text-blue-700">Please select a facility to view and manage tanks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Zap className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tank Management</h2>
            <p className="text-sm text-gray-500">{selectedFacility.name}</p>
          </div>
        </div>
        
        {hasPermission('create_tanks') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Tank</span>
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tanks by label, product, material, or manifold..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'cards' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Card view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          Showing {filteredTanks.length} of {tanks.length} tanks
          <span className="ml-1">
            matching "<span className="font-medium">{searchTerm}</span>"
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading tanks...</span>
        </div>
      )}

      {/* Tank Content */}
      {!loading && (
        <>
          {filteredTanks.length > 0 ? (
            viewMode === 'cards' ? renderCardView() : renderTableView()
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No tanks found' : 'No tanks configured'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No tanks match your search for "${searchTerm}"`
                  : 'This facility doesn\'t have any tanks configured yet.'
                }
              </p>
              {!searchTerm && hasPermission('create_tanks') && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Tank</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Tank Modal */}
      {(showAddModal || editingTank) && renderTankForm(editingTank || undefined)}
    </div>
  );
}