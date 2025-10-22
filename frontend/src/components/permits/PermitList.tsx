import React from 'react';
import { Permit, PermitFilter } from '../../types/permit';
import { PermitCard } from './PermitCard';
import { filterPermits } from '../../utils/permitUtils';

interface PermitListProps {
  permits: Permit[];
  currentFilter: PermitFilter;
  isLoading: boolean;
  onRenew: (permitId: number, permitName: string) => void;
  onViewFiles: (permitId: number, permitName: string, documentUrl: string | null) => void;
  onViewHistory: (permitId: number, permitName: string) => void;
}

export function PermitList({
  permits,
  currentFilter,
  isLoading,
  onRenew,
  onViewFiles,
  onViewHistory
}: PermitListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
        <p>Loading permits...</p>
      </div>
    );
  }

  const filteredPermits = filterPermits(permits, currentFilter);

  if (filteredPermits.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-folder-open text-gray-300 text-5xl mb-4"></i>
        <p className="text-gray-500 text-lg">No permits found</p>
        <p className="text-gray-400 text-sm mt-1">
          {currentFilter !== 'all'
            ? 'Try adjusting your filters or add a new permit'
            : 'Add your first permit to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPermits.map(permit => (
        <PermitCard
          key={permit.id}
          permit={permit}
          onRenew={onRenew}
          onViewFiles={onViewFiles}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
}
