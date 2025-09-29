import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CircleAlert as AlertCircle, CircleCheck as CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { checkApiHealth, debugApiConfig } from '../../api/axios';
import { ApiDebugger } from '../../utils/apiDebug';

export function ApiStatus() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await checkApiHealth();
      setIsHealthy(healthy);
      setLastCheck(new Date());
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  const runDiagnostics = async () => {
    await ApiDebugger.runDiagnostics();
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (isHealthy === null) {
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isHealthy === null) return 'Unknown';
    return isHealthy ? 'Connected' : 'Disconnected';
  };

  const getStatusColor = () => {
    if (isChecking || isHealthy === null) return 'text-gray-600';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              API: {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={checkHealth}
              disabled={isChecking}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Debug info"
            >
              <Settings className="h-3 w-3" />
            </button>
          </div>
        </div>

        {showDebug && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <div className="text-xs text-gray-500">
              <div>URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</div>
              {lastCheck && (
                <div>Last check: {lastCheck.toLocaleTimeString()}</div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={runDiagnostics}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Run Diagnostics
              </button>
              <button
                onClick={() => debugApiConfig()}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Show Config
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}