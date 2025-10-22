import React from 'react';
import { Permit } from '../../types/permit';
import { calculateStatus, getStatusBadge, getBorderColor, formatDate } from '../../utils/permitUtils';

interface PermitCardProps {
  permit: Permit;
  onViewHistory: (permitId: number, permitName: string) => void;
  onRenew: (permitId: number, permitName: string) => void;
}

export function PermitCard({ permit, onViewHistory, onRenew }: PermitCardProps) {
  const status = calculateStatus(permit);
  const statusBadge = getStatusBadge(status);
  const borderColor = getBorderColor(status);

  const handleDownload = () => {
    if (permit.documentUrl) {
      window.open(permit.documentUrl, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${borderColor} p-6`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 uppercase">{permit.name}</h3>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">License Number</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">{permit.number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Issue Date</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">{formatDate(permit.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Expiry Date</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">{formatDate(permit.expiryDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Issued By</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">{permit.issuedBy}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 justify-end">
          {permit.documentUrl && (
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download"
            >
              <i className="fas fa-download"></i>
            </button>
          )}

          <button
            onClick={() => onViewHistory(permit.id, permit.name)}
            className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
          >
            View History
          </button>

          {permit.renewalUrl && (status === 'expiring' || status === 'expired') && (
            <a
              href={permit.renewalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center whitespace-nowrap"
            >
              Renew Online
            </a>
          )}

          {(status === 'expiring' || status === 'expired') && (
            <button
              onClick={() => onRenew(permit.id, permit.name)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              Upload Renewal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
