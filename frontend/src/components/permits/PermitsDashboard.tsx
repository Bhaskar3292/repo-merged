import React, { useState, useEffect } from 'react';
import { Permit, PermitFilter, PermitStats } from '../../types/permit';
import { permitApiService } from '../../services/permitApi';
import { PermitHeader } from './PermitHeader';
import { SummaryCards } from './SummaryCards';
import { FilterTabs } from './FilterTabs';
import { PermitList } from './PermitList';
import { UploadModal } from './UploadModal';
import { HistoryModal } from './HistoryModal';
import { FileViewerModal } from './FileViewerModal';

interface PermitsDashboardProps {
  selectedFacility?: { id: number; name: string };
}

export function PermitsDashboard({ selectedFacility }: PermitsDashboardProps) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [stats, setStats] = useState<PermitStats>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<PermitFilter>('all');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [fileViewerModalOpen, setFileViewerModalOpen] = useState(false);

  const [currentRenewalPermit, setCurrentRenewalPermit] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [currentHistoryPermit, setCurrentHistoryPermit] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [currentFileViewerPermit, setCurrentFileViewerPermit] = useState<{
    id: number;
    name: string;
    documentUrl: string | null;
  } | null>(null);

  useEffect(() => {
    console.log('[PermitsDashboard] selectedFacility changed:', selectedFacility);
    console.log('[PermitsDashboard] Facility ID:', selectedFacility?.id);
    console.log('[PermitsDashboard] Facility name:', selectedFacility?.name);
    fetchPermits();
  }, [selectedFacility]);

  const fetchPermits = async () => {
    console.log('[PermitsDashboard] fetchPermits called');
    console.log('[PermitsDashboard] Current selectedFacility:', selectedFacility);

    setIsLoading(true);
    setError(null);

    try {
      const facilityId = selectedFacility?.id;
      console.log('[PermitsDashboard] Fetching with facility ID:', facilityId);

      const [permitsData, statsData] = await Promise.all([
        permitApiService.fetchPermits(facilityId),
        permitApiService.fetchPermitStats(facilityId)
      ]);

      console.log('[PermitsDashboard] Received permits:', permitsData.length);
      console.log('[PermitsDashboard] Received stats:', statsData);

      setPermits(permitsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permits');
      console.error('[PermitsDashboard] Error fetching permits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!selectedFacility) {
      alert('Please select a facility first');
      return;
    }
    setUploadModalOpen(true);
  };

  const handleUploadNew = async (file: File) => {
    if (!selectedFacility) {
      throw new Error('No facility selected');
    }

    await permitApiService.uploadNewPermit(file, selectedFacility.id);
    await fetchPermits();
  };

  const handleRenew = (permitId: number, permitName: string) => {
    setCurrentRenewalPermit({ id: permitId, name: permitName });
    setRenewalModalOpen(true);
  };

  const handleUploadRenewal = async (file: File) => {
    if (!currentRenewalPermit) {
      throw new Error('No permit selected for renewal');
    }

    await permitApiService.uploadRenewal(currentRenewalPermit.id, file);
    await fetchPermits();
  };

  const handleViewHistory = (permitId: number, permitName: string) => {
    setCurrentHistoryPermit({ id: permitId, name: permitName });
    setHistoryModalOpen(true);
  };

  const handleViewFiles = (permitId: number, permitName: string, documentUrl: string | null) => {
    setCurrentFileViewerPermit({ id: permitId, name: permitName, documentUrl });
    setFileViewerModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
  };

  const closeRenewalModal = () => {
    setRenewalModalOpen(false);
    setCurrentRenewalPermit(null);
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    setCurrentHistoryPermit(null);
  };

  const closeFileViewerModal = () => {
    setFileViewerModalOpen(false);
    setCurrentFileViewerPermit(null);
  };

  // Show message when no facility is selected
  if (!selectedFacility) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <i className="fas fa-info-circle text-blue-500 text-4xl mb-4"></i>
          <h3 className="text-xl font-medium text-blue-900 mb-2">Select a Location</h3>
          <p className="text-blue-700">
            Please select a location from the dropdown above to view and manage permits for that facility.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Permits</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchPermits}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PermitHeader onAddNew={handleAddNew} />

      <SummaryCards stats={stats} isLoading={isLoading} />

      <FilterTabs
        currentFilter={currentFilter}
        setCurrentFilter={setCurrentFilter}
        stats={stats}
        isLoading={isLoading}
      />

      <PermitList
        permits={permits}
        currentFilter={currentFilter}
        isLoading={isLoading}
        onViewHistory={handleViewHistory}
        onRenew={handleRenew}
        onViewFiles={handleViewFiles}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={closeUploadModal}
        onUpload={handleUploadNew}
        title="Upload New Permit"
        subtitle={
          selectedFacility
            ? `Upload permit for ${selectedFacility.name}`
            : 'Upload a permit document for AI extraction'
        }
      />

      <UploadModal
        isOpen={renewalModalOpen}
        onClose={closeRenewalModal}
        onUpload={handleUploadRenewal}
        title="Upload Renewal Document"
        subtitle={currentRenewalPermit ? `Renewing: ${currentRenewalPermit.name}` : undefined}
      />

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={closeHistoryModal}
        permitId={currentHistoryPermit?.id || null}
        permitName={currentHistoryPermit?.name || ''}
      />

      <FileViewerModal
        isOpen={fileViewerModalOpen}
        onClose={closeFileViewerModal}
        permitId={currentFileViewerPermit?.id || null}
        permitName={currentFileViewerPermit?.name || ''}
        mainDocumentUrl={currentFileViewerPermit?.documentUrl || null}
      />
    </div>
  );
}
