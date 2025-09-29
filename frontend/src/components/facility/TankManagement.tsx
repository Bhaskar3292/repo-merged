import React, { useState } from 'react';
import { Zap, Thermometer, Gauge, AlertTriangle, CheckCircle, Circle as XCircle, Plus, CreditCard as Edit, Eye, Save, X } from 'lucide-react';
import { TabNavigation } from '../common/TabNavigation';

interface TankManagementProps {
  selectedFacility?: any;
}

export function TankManagement({ selectedFacility }: TankManagementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTank, setEditingTank] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editedTankData, setEditedTankData] = useState<any>({});
  const [editedTitleData, setEditedTitleData] = useState<any>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [newTankData, setNewTankData] = useState({
    name: '',
    facility: selectedFacility?.name || '',
    product: '',
    capacity: '',
    current: '',
    status: 'Normal',
    temperature: '',
    pressure: '',
    lastInspection: '',
    tankNumber: '',
    currentStatus: 'Currently In Use',
    size: '',
    tankLined: 'Yes',
    manifoldedWith: '',
    pipingMaterial: '',
    compartment: 'No',
    tankMaterial: '',
    releaseDetection: '',
    atgId: '',
    pipingManifolded: '',
    pipingInstalled: '',
    trackReleaseDetection: 'Yes',
    installed: '',
    stpSumpsInstalled: 'Yes',
    pipingReleaseDetection: ''
  });
  const [tanks, setTanks] = useState([
    {
      id: 1,
      name: 'Tank A1',
      facility: 'Downtown Station A',
      product: 'Regular Gasoline',
      capacity: 12000,
      current: 8500,
      status: 'Normal',
      temperature: 68,
      pressure: 14.7,
      lastInspection: '2024-01-15',
      tankNumber: 'A1',
      currentStatus: 'Currently In Use',
      size: '12,000 gal',
      tankLined: 'Yes',
      manifoldedWith: 'Tank A2',
      pipingMaterial: 'Double Wall Steel',
      compartment: 'No',
      tankMaterial: 'Fiberglass',
      releaseDetection: 'Statistical Inventory Reconciliation',
      atgId: 'ATG-001',
      pipingManifolded: 'Tank A2, A3',
      pipingInstalled: '2020-01-15',
      trackReleaseDetection: 'Yes',
      installed: '2020-01-10',
      stpSumpsInstalled: 'Yes',
      pipingReleaseDetection: 'Monthly line testing with 0.1 GPH sensitivity'
    },
    {
      id: 2,
      name: 'Tank A2',
      facility: 'Downtown Station A',
      product: 'Premium Gasoline',
      capacity: 10000,
      current: 3200,
      status: 'Low Level',
      temperature: 72,
      pressure: 14.5,
      lastInspection: '2024-01-15',
      tankNumber: 'A2',
      currentStatus: 'Currently In Use',
      size: '10,000 gal',
      tankLined: 'Yes',
      manifoldedWith: 'Tank A1',
      pipingMaterial: 'Single Wall Steel',
      compartment: 'No',
      tankMaterial: 'Steel',
      releaseDetection: 'Interstitial Monitoring',
      atgId: 'ATG-002',
      pipingManifolded: 'Tank A1, A3',
      pipingInstalled: '2020-02-01',
      trackReleaseDetection: 'Yes',
      installed: '2020-01-25',
      stpSumpsInstalled: 'Yes',
      pipingReleaseDetection: 'Continuous interstitial monitoring'
    },
    {
      id: 3,
      name: 'Tank B1',
      facility: 'Highway 101 Facility',
      product: 'Diesel',
      capacity: 15000,
      current: 12800,
      status: 'Normal',
      temperature: 65,
      pressure: 14.8,
      lastInspection: '2024-01-10',
      tankNumber: 'B1',
      currentStatus: 'Currently In Use',
      size: '15,000 gal',
      tankLined: 'No',
      manifoldedWith: 'None',
      pipingMaterial: 'Double Wall Fiberglass',
      compartment: 'Yes - 2 compartments',
      tankMaterial: 'Fiberglass',
      releaseDetection: 'Groundwater Monitoring',
      atgId: 'ATG-003',
      pipingManifolded: 'None',
      pipingInstalled: '2019-12-15',
      trackReleaseDetection: 'Yes',
      installed: '2019-12-10',
      stpSumpsInstalled: 'No',
      pipingReleaseDetection: 'Quarterly groundwater monitoring'
    }
  ]);

  const tabs = [
    { id: 'overview', label: 'Tank Overview' },
    { id: 'info', label: 'Tank Info' },
    { id: 'monitoring', label: 'ATG Information' },
    { id: 'vapor', label: 'Vapor Recovery' }
  ];

  // Filter tanks by selected facility
  const filteredTanks = selectedFacility 
    ? tanks.filter(tank => tank.facility === selectedFacility.name)
    : tanks;

  const handleAddTank = () => {
    const newId = Math.max(...tanks.map(t => t.id)) + 1;
    const tankToAdd = {
      id: newId,
      ...newTankData,
      capacity: parseInt(newTankData.capacity) || 0,
      current: parseInt(newTankData.current) || 0,
      temperature: parseInt(newTankData.temperature) || 0,
      pressure: parseFloat(newTankData.pressure) || 0
    };
    setTanks(prev => [...prev, tankToAdd]);
    setNewTankData({
      name: '',
      facility: '',
      product: '',
      capacity: '',
      current: '',
      status: 'Normal',
      temperature: '',
      pressure: '',
      lastInspection: '',
      tankNumber: '',
      currentStatus: 'Currently In Use',
      size: '',
      tankLined: 'Yes',
      manifoldedWith: '',
      pipingMaterial: '',
      compartment: 'No',
      tankMaterial: '',
      releaseDetection: '',
      atgId: '',
      pipingManifolded: '',
      pipingInstalled: '',
      trackReleaseDetection: 'Yes',
      installed: '',
      stpSumpsInstalled: 'Yes',
      pipingReleaseDetection: ''
    });
    setShowAddModal(false);
  };

  const handleDeleteTank = (tankId: number) => {
    setTanks(prev => prev.filter(tank => tank.id !== tankId));
    setShowDeleteConfirm(null);
  };

  const updateNewTankField = (field: string, value: string) => {
    setNewTankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-100 text-green-800';
      case 'Low Level':
        return 'bg-yellow-100 text-yellow-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Normal':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Low Level':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Gauge className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEditTank = (tank: any) => {
    setEditingTank(tank.id);
    setEditedTankData({ ...tank });
  };

  const handleSaveTank = () => {
    setTanks(prev => 
      prev.map(tank => 
        tank.id === editingTank ? { ...tank, ...editedTankData } : tank
      )
    );
    setEditingTank(null);
    setEditedTankData({});
  };

  const handleCancelEdit = () => {
    setEditingTank(null);
    setEditedTankData({});
  };

  const updateTankField = (field: string, value: string) => {
    setEditedTankData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditTitle = (tank: any) => {
    setEditingTitle(tank.id);
    setEditedTitleData({
      name: tank.name,
      facility: tank.facility,
      product: tank.product
    });
  };

  const handleSaveTitle = () => {
    setTanks(prev => 
      prev.map(tank => 
        tank.id === editingTitle ? { ...tank, ...editedTitleData } : tank
      )
    );
    setEditingTitle(null);
    setEditedTitleData({});
  };

  const handleCancelTitleEdit = () => {
    setEditingTitle(null);
    setEditedTitleData({});
  };

  const updateTitleField = (field: string, value: string) => {
    setEditedTitleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderField = (label: string, field: string, tank: any, type: string = 'text') => {
    const value = editingTank === tank.id ? (editedTankData[field] || tank[field]) : tank[field];
    
    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {editingTank === tank.id ? (
          type === 'select-yesno' ? (
            <select
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          ) : type === 'select-status' ? (
            <select
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Currently In Use">Currently In Use</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          ) : type === 'select-material' ? (
            <select
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Fiberglass">Fiberglass</option>
              <option value="Steel">Steel</option>
              <option value="Concrete">Concrete</option>
              <option value="Composite">Composite</option>
            </select>
          ) : type === 'select-piping' ? (
            <select
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Double Wall Steel">Double Wall Steel</option>
              <option value="Single Wall Steel">Single Wall Steel</option>
              <option value="Double Wall Fiberglass">Double Wall Fiberglass</option>
              <option value="Single Wall Fiberglass">Single Wall Fiberglass</option>
              <option value="Flexible Piping">Flexible Piping</option>
            </select>
          ) : type === 'select-detection' ? (
            <select
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Statistical Inventory Reconciliation">Statistical Inventory Reconciliation</option>
              <option value="Interstitial Monitoring">Interstitial Monitoring</option>
              <option value="Groundwater Monitoring">Groundwater Monitoring</option>
              <option value="Vapor Monitoring">Vapor Monitoring</option>
              <option value="Manual Tank Gauging">Manual Tank Gauging</option>
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter detailed description..."
            />
          ) : type === 'date' ? (
            <input
              type="date"
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => updateTankField(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          )
        ) : (
          <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
            {field === 'pipingMaterial' && value.includes('Double Wall') ? (
              <span className="font-semibold text-blue-600">{value}</span>
            ) : (
              value
            )}
          </p>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tank Overview</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span>Add Tank</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTanks.map((tank) => {
                const fillPercentage = (tank.current / tank.capacity) * 100;
                
                return (
                  <div key={tank.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{tank.name}</h3>
                          <p className="text-sm text-gray-500">{tank.facility}</p>
                        </div>
                      </div>
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tank.status)}`}>
                        {getStatusIcon(tank.status)}
                        <span>{tank.status}</span>
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Product: {tank.product}</span>
                          <span>{fillPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              fillPercentage > 70 ? 'bg-green-500' : 
                              fillPercentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{tank.current.toLocaleString()} gal</span>
                          <span>{tank.capacity.toLocaleString()} gal</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Thermometer className="h-4 w-4 text-gray-400" />
                          <span>{tank.temperature}°F</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Gauge className="h-4 w-4 text-gray-400" />
                          <span>{tank.pressure} PSI</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Last inspection: {new Date(tank.lastInspection).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'info':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tank Information</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Tank</span>
              </button>
            </div>

            <div className="space-y-6">
              {filteredTanks.map((tank) => (
                <div key={tank.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        {editingTitle === tank.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editedTitleData.name || tank.name}
                              onChange={(e) => updateTitleField('name', e.target.value)}
                              className="text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              placeholder="Tank Name"
                            />
                            <input
                              type="text"
                              value={editedTitleData.product || tank.product}
                              onChange={(e) => updateTitleField('product', e.target.value)}
                              className="text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              placeholder="Product Type"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {tank.name}
                              </h3>
                              <p className="text-sm text-gray-500">{tank.product}</p>
                            </div>
                            <button
                              onClick={() => handleEditTitle(tank)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit tank title"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingTitle === tank.id ? (
                          <>
                            <button
                              onClick={handleSaveTitle}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelTitleEdit}
                              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : editingTank === tank.id ? (
                          <>
                            <button
                              onClick={handleSaveTank}
                              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(tank.id)}
                              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <X className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditTank(tank)}
                              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(tank.id)}
                              className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <X className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Basic Tank Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Tank Information
                        </h4>
                        {renderField('Tank Number', 'tankNumber', tank, 'text')}
                        {renderField('Status', 'currentStatus', tank, 'select-status')}
                        {renderField('Size', 'size', tank)}
                        {renderField('Tank Lined?', 'tankLined', tank, 'select-yesno')}
                        {renderField('Manifolded With', 'manifoldedWith', tank)}
                        {renderField('Tank Material', 'tankMaterial', tank, 'select-material')}
                        {renderField('Compartment?', 'compartment', tank)}
                        {renderField('Installed', 'installed', tank, 'date')}
                      </div>

                      {/* Piping Information */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Piping Information
                        </h4>
                        {renderField('Piping Material', 'pipingMaterial', tank, 'select-piping')}
                        {renderField('Piping Manifolded With', 'pipingManifolded', tank)}
                        {renderField('Piping Installed', 'pipingInstalled', tank, 'date')}
                        {renderField('STP Sumps Installed?', 'stpSumpsInstalled', tank, 'select-yesno')}
                      </div>

                      {/* Release Detection */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Release Detection
                        </h4>
                        {renderField('Release Detection', 'releaseDetection', tank, 'select-detection')}
                        {renderField('ATG ID', 'atgId', tank)}
                        {renderField('Track Release Detection?', 'trackReleaseDetection', tank, 'select-yesno')}
                        {renderField('Piping Release Detection', 'pipingReleaseDetection', tank, 'textarea')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'monitoring':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ATG Information</h3>
            <div className="space-y-6">
              {filteredTanks.map((tank) => (
                <div key={tank.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{tank.name} - ATG Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Product Level</p>
                      <p className="text-xl font-bold text-blue-600">{tank.current}</p>
                      <p className="text-xs text-gray-500">gallons</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="text-xl font-bold text-green-600">{tank.temperature}</p>
                      <p className="text-xs text-gray-500">°F</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Water Level</p>
                      <p className="text-xl font-bold text-purple-600">0.0</p>
                      <p className="text-xs text-gray-500">inches</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Pressure</p>
                      <p className="text-xl font-bold text-yellow-600">{tank.pressure}</p>
                      <p className="text-xs text-gray-500">PSI</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'vapor':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vapor Recovery Systems</h3>
            <div className="space-y-6">
              {tanks.map((tank) => (
                <div key={tank.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{tank.name} - Vapor Recovery</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">System Type</p>
                      <p className="text-gray-600">Stage II Vapor Recovery</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Efficiency</p>
                      <p className="text-gray-600">95%</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Last Test</p>
                      <p className="text-gray-600">{new Date(tank.lastInspection).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedFacility ? `${selectedFacility.name} - Tank Management` : 'Tank Management'}
          </h1>
          {selectedFacility && (
            <p className="text-sm text-gray-500 mt-1">{selectedFacility.address}</p>
          )}
        </div>
      </div>

      {!selectedFacility && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Zap className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
          <p className="text-blue-700">Please select a facility from the search bar above to view and manage tanks.</p>
        </div>
      )}

      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {selectedFacility && renderTabContent()}

      {selectedFacility && filteredTanks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tanks Found</h3>
          <p className="text-gray-600 mb-4">This facility doesn't have any tanks configured yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Tank</span>
          </button>
        </div>
      )}

      {/* Add Tank Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Tank</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form className="space-y-6">
              {/* Basic Tank Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tank Name</label>
                    <input
                      type="text"
                      value={newTankData.name}
                      onChange={(e) => updateNewTankField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Tank A1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                    <input
                      type="text"
                      value={newTankData.facility}
                      onChange={(e) => updateNewTankField('facility', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown Station A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <input
                      type="text"
                      value={newTankData.product}
                      onChange={(e) => updateNewTankField('product', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Regular Gasoline"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tank Number</label>
                    <input
                      type="text"
                      value={newTankData.tankNumber}
                      onChange={(e) => updateNewTankField('tankNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., A1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (gallons)</label>
                    <input
                      type="number"
                      value={newTankData.capacity}
                      onChange={(e) => updateNewTankField('capacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 12000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Level (gallons)</label>
                    <input
                      type="number"
                      value={newTankData.current}
                      onChange={(e) => updateNewTankField('current', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 8500"
                    />
                  </div>
                </div>
              </div>
            </form>
            
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTank}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Add Tank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <X className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Tank</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete this tank? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTank(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete Tank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}