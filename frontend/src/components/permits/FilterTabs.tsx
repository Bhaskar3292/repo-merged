import React from 'react';
import { PermitFilter } from '../../types/permit';

interface FilterTabsProps {
  currentFilter: PermitFilter;
  setCurrentFilter: (filter: PermitFilter) => void;
}

export function FilterTabs({ currentFilter, setCurrentFilter }: FilterTabsProps) {
  const tabs: { id: PermitFilter; label: string }[] = [
    { id: 'all', label: 'All Permits' },
    { id: 'active', label: 'Active' },
    { id: 'expiring', label: 'Expiring Soon' },
    { id: 'expired', label: 'Expired' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <nav className="flex border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentFilter(tab.id)}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              currentFilter === tab.id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
