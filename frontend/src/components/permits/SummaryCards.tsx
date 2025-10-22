import React from 'react';
import { PermitStats, PermitFilter } from '../../types/permit';

interface SummaryCardsProps {
  stats: PermitStats;
  isLoading: boolean;
  onFilterChange: (filter: PermitFilter) => void;
}

export function SummaryCards({ stats, isLoading, onFilterChange }: SummaryCardsProps) {
  const cards: Array<{
    title: string;
    value: number;
    icon: string;
    bgColor: string;
    iconColor: string;
    textColor: string;
    filter: PermitFilter;
  }> = [
    {
      title: 'Total Permits',
      value: stats.total,
      icon: 'fa-file-alt',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-gray-800',
      filter: 'all'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: 'fa-check-circle',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-600',
      filter: 'active'
    },
    {
      title: 'Expiring Soon',
      value: stats.expiring,
      icon: 'fa-exclamation-triangle',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-600',
      filter: 'expiring'
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: 'fa-times-circle',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-600',
      filter: 'expired'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <button
          key={index}
          onClick={() => onFilterChange(card.filter)}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer text-left"
          title={`Click to view ${card.title.toLowerCase()}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{card.title}</p>
              <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                {isLoading ? '...' : card.value}
              </p>
            </div>
            <div className={`${card.bgColor} p-4 rounded-lg`}>
              <i className={`fas ${card.icon} ${card.iconColor} text-2xl`}></i>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
