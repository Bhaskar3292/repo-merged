import React from 'react';
import { PermitFilter, PermitStats } from '../../types/permit';

interface FilterTabsProps {
  currentFilter: PermitFilter;
  setCurrentFilter: (filter: PermitFilter) => void;
  stats: PermitStats;
  isLoading?: boolean;
}

export function FilterTabs({ currentFilter, setCurrentFilter, stats, isLoading }: FilterTabsProps) {
  const tabs: { id: PermitFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All Permits', count: stats.total },
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'expiring', label: 'Expiring Soon', count: stats.expiring },
    { id: 'expired', label: 'Expired', count: stats.expired }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <nav className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentFilter(tab.id)}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              currentFilter === tab.id
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                currentFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isLoading ? '...' : tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
