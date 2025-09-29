import React, { useState } from 'react';
import { Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Clock, Eye, FileText, Download } from 'lucide-react';
import { TabNavigation } from '../common/TabNavigation';

interface ReleaseDetectionProps {
  selectedFacility?: any;
}

export function ReleaseDetection({ selectedFacility }: ReleaseDetectionProps) {
  const [activeTab, setActiveTab] = useState('monitoring');

  const tabs = [
    { id: 'monitoring', label: 'Release Detection' },
    { id: 'alerts', label: 'Alerts & Incidents' },
    { id: 'reports', label: 'Reports' }
  ];

  const detectionSystems = [
    {
      id: 1,
      facility: 'Downtown Station A',
      tank: 'Tank A1',
      systemType: 'Statistical Inventory Reconciliation',
      status: 'Normal',
      lastTest: '2024-01-15',
      sensitivity: 'High',
      compliance: 'Compliant'
    },
    {
      id: 2,
      facility: 'Downtown Station A',
      tank: 'Tank A2',
      systemType: 'Interstitial Monitoring',
      status: 'Alert',
      lastTest: '2024-01-14',
      sensitivity: 'Medium',
      compliance: 'Under Review'
    },
    {
      id: 3,
      facility: 'Highway 101 Facility',
      tank: 'Tank B1',
      systemType: 'Groundwater Monitoring',
      status: 'Normal',
      lastTest: '2024-01-16',
      sensitivity: 'High',
      compliance: 'Compliant'
    }
  ];

  const incidents = [
    {
      id: 1,
      facility: 'Downtown Station A',
      tank: 'Tank A2',
      type: 'Inventory Discrepancy',
      severity: 'Medium',
      date: '2024-01-14',
      status: 'Investigating',
      description: 'Daily inventory reconciliation detected potential leak'
    },
    {
      id: 2,
      facility: 'Industrial Park B',
      tank: 'Tank C1',
      type: 'Sensor Malfunction',
      severity: 'Low',
      date: '2024-01-12',
      status: 'Resolved',
      description: 'Groundwater monitoring sensor offline'
    },
    {
      id: 3,
      facility: 'Highway 101 Facility',
      tank: 'Tank B2',
      type: 'Pressure Test Failure',
      severity: 'High',
      date: '2024-01-10',
      status: 'Action Required',
      description: 'Annual pressure test indicated potential leak'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal':
        return 'bg-green-100 text-green-800';
      case 'Alert':
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
      case 'Alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'Critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-sm text-gray-600">Systems Normal</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">1</p>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-600">Tests Due</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detection Systems Status</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {detectionSystems.map((system) => (
                    <div key={system.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{system.facility} - {system.tank}</h4>
                            <p className="text-sm text-gray-500">{system.systemType}</p>
                          </div>
                        </div>
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                          {getStatusIcon(system.status)}
                          <span>{system.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Last Test:</span>
                          <p>{new Date(system.lastTest).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Sensitivity:</span>
                          <p>{system.sensitivity}</p>
                        </div>
                        <div>
                          <span className="font-medium">Compliance:</span>
                          <p>{system.compliance}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">
                            <Eye className="h-3 w-3" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Incidents & Alerts</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{incident.type}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{incident.facility} - {incident.tank}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{new Date(incident.date).toLocaleDateString()}</p>
                        <span className={`text-xs font-medium ${
                          incident.status === 'Resolved' ? 'text-green-600' : 
                          incident.status === 'Investigating' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
                    <div className="flex space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                        <FileText className="h-4 w-4" />
                        <span>Generate Report</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Monthly Compliance Report</h4>
                  <p className="text-sm text-gray-600 mb-3">Comprehensive monthly compliance status for all facilities</p>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Incident Summary</h4>
                  <p className="text-sm text-gray-600 mb-3">Summary of all incidents and their resolution status</p>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">System Performance</h4>
                  <p className="text-sm text-gray-600 mb-3">Performance metrics for all detection systems</p>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
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
            {selectedFacility ? `${selectedFacility.name} - Release Detection` : 'Release Detection'}
          </h1>
          {selectedFacility && (
            <p className="text-sm text-gray-500 mt-1">{selectedFacility.address}</p>
          )}
        </div>
      </div>

      {!selectedFacility && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Facility Selected</h3>
          <p className="text-blue-700">Please select a facility from the search bar above to view release detection systems.</p>
        </div>
      )}

      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {selectedFacility && renderTabContent()}
    </div>
  );
}