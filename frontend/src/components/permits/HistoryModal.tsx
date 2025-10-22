import React, { useEffect, useState } from 'react';
import { PermitHistory } from '../../types/permit';
import { permitApiService } from '../../services/permitApi';
import { formatDate } from '../../utils/permitUtils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  permitId: number | null;
  permitName: string;
}

export function HistoryModal({ isOpen, onClose, permitId, permitName }: HistoryModalProps) {
  const [history, setHistory] = useState<PermitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && permitId) {
      loadHistory();
    }
  }, [isOpen, permitId]);

  const loadHistory = async () => {
    if (!permitId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await permitApiService.fetchPermitHistory(permitId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Permit History</h2>
              <p className="text-sm text-gray-600 mt-1">{permitName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
              <p className="text-gray-500">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-circle text-3xl text-red-400 mb-3"></i>
              <p className="text-red-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-history text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">No history available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item, index) => (
                <div key={item.id} className="relative">
                  {index !== history.length - 1 && (
                    <div className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-file-alt text-blue-600 text-sm"></i>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(item.date)} by {item.userName || 'System'}
                        </p>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                      )}
                      {item.documentUrl && (
                        <a
                          href={item.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                        >
                          <i className="fas fa-download mr-1"></i> View Document
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
