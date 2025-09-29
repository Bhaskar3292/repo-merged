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

  const [detectionSystems, setDetectionSystems] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
                    <p className="text-2xl font-bold text-gray-900">0</p>
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
                    <p className="text-2xl font-bold text-gray-900">0</p>
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
                    <p className="text-2xl font-bold text-gray-900">0</p>
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
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No detection systems configured yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Detection systems will appear here when tanks are added to this facility.</p>
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
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No incidents or alerts to display.</p>
                <p className="text-sm text-gray-400 mt-2">Alerts and incidents will appear here when detected by the monitoring systems.</p>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h3>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No reports available yet.</p>
                <p className="text-sm text-gray-400 mt-2">Reports will be generated based on detection system data and incidents.</p>
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