import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Eye, CreditCard as Edit, Trash2, FileCheck, Fuel } from 'lucide-react';
import { apiService } from '../../services/api';

interface Location {
  id: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  facility_type: string;
  created_by_username: string;
  created_at: string;
  is_active: boolean;
}

interface LocationCardProps {
  location: Location;
  onEdit?: (location: Location) => void;
  onDelete?: (locationId: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function LocationCard({ location, onEdit, onDelete, canEdit, canDelete }: LocationCardProps) {
  const navigate = useNavigate();
  const [tankCount, setTankCount] = useState<number>(0);
  const [permitCount, setPermitCount] = useState<number>(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    loadCounts();
  }, [location.id]);

  const loadCounts = async () => {
    try {
      setLoadingCounts(true);
      const [tanks, permits] = await Promise.all([
        apiService.getTanksByLocationid(location.id),
        apiService.getPermits(location.id)
      ]);
      setTankCount(Array.isArray(tanks) ? tanks.length : 0);
      setPermitCount(Array.isArray(permits) ? permits.length : 0);
    } catch (error) {
      console.error('Failed to load counts:', error);
      setTankCount(0);
      setPermitCount(0);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/dashboard?locationId=${location.id}`);
  };

  const handleTanksClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard?locationId=${location.id}&tab=tanks`);
  };

  const handlePermitsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard?locationId=${location.id}&tab=permits`);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dashboard?locationId=${location.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(location);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(location.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {location.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {location.facility_type.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleViewClick}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View dashboard"
            >
              <Eye className="h-4 w-4" />
            </button>
            {canEdit && (
              <button
                onClick={handleEditClick}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit location"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete location"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="mb-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              {location.street_address && <p>{location.street_address}</p>}
              <p>
                {location.city}
                {location.city && location.state && ', '}
                {location.state} {location.zip_code}
              </p>
              {location.country && <p>{location.country}</p>}
            </div>
          </div>
        </div>

        {/* Counts - Interactive */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleTanksClick}
            className="text-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 hover:shadow-md transition-all duration-200 group/tanks"
            title="View tanks"
          >
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Fuel className="h-4 w-4 text-blue-600 group-hover/tanks:scale-110 transition-transform" />
              {loadingCounts ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              ) : (
                <p className="text-xl font-bold text-blue-600">{tankCount}</p>
              )}
            </div>
            <p className="text-xs text-gray-600 font-medium">Tanks</p>
          </button>

          <button
            onClick={handlePermitsClick}
            className="text-center p-3 bg-green-50 rounded-lg hover:bg-green-100 hover:shadow-md transition-all duration-200 group/permits"
            title="View permits"
          >
            <div className="flex items-center justify-center space-x-2 mb-1">
              <FileCheck className="h-4 w-4 text-green-600 group-hover/permits:scale-110 transition-transform" />
              {loadingCounts ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
              ) : (
                <p className="text-xl font-bold text-green-600">{permitCount}</p>
              )}
            </div>
            <p className="text-xs text-gray-600 font-medium">Permits</p>
          </button>
        </div>
      </div>
    </div>
  );
}
