import React from 'react';

interface PermitHeaderProps {
  onAddNew: () => void;
}

export function PermitHeader({ onAddNew }: PermitHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-gray-800">Permits & Licenses</h1>
      <button
        onClick={onAddNew}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
      >
        <i className="fas fa-plus"></i>
        <span>Add New Permit</span>
      </button>
    </div>
  );
}
