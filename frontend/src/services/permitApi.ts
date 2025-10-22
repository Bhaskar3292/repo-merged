import api from '../api/axios';
import { Permit, PermitHistory, PermitStats } from '../types/permit';

/**
 * Transform snake_case API response to camelCase frontend format
 */
function transformPermitData(apiData: any): Permit {
  console.log('[PermitAPI] Raw API data:', apiData);

  const transformed: Permit = {
    id: apiData.id,
    name: apiData.name || 'Unknown Permit',
    number: apiData.number || 'N/A',
    issueDate: apiData.issue_date || null,
    expiryDate: apiData.expiry_date || apiData.expiryDate,
    issuedBy: apiData.issued_by || apiData.issuedBy || 'Unknown Authority',
    isActive: apiData.is_active !== undefined ? apiData.is_active : apiData.isActive !== undefined ? apiData.isActive : true,
    parentId: apiData.parent_id || apiData.parentId || null,
    renewalUrl: apiData.renewal_url || apiData.renewalUrl || null,
    documentUrl: apiData.document_url || apiData.documentUrl || null,
    facility: apiData.facility,
    facilityName: apiData.facility_name || apiData.facilityName,
    uploadedBy: apiData.uploaded_by || apiData.uploadedBy,
    uploadedByUsername: apiData.uploaded_by_username || apiData.uploadedByUsername,
    status: apiData.status || 'active',
    createdAt: apiData.created_at || apiData.createdAt,
    updatedAt: apiData.updated_at || apiData.updatedAt,
  };

  console.log('[PermitAPI] Transformed data:', transformed);
  console.log('[PermitAPI] Date fields:', {
    issueDate: transformed.issueDate,
    expiryDate: transformed.expiryDate,
    issuedBy: transformed.issuedBy
  });

  return transformed;
}

/**
 * Transform snake_case history API response to camelCase
 */
function transformHistoryData(apiData: any): PermitHistory {
  return {
    id: apiData.id,
    permit: apiData.permit,
    action: apiData.action,
    user: apiData.user,
    userName: apiData.user_name || apiData.userName,
    notes: apiData.notes,
    documentUrl: apiData.document_url || apiData.documentUrl,
    date: apiData.date,
    createdAt: apiData.created_at || apiData.createdAt,
  };
}

class PermitApiService {
  async fetchPermits(facilityId?: number): Promise<Permit[]> {
    try {
      console.log('[PermitAPI] Fetching permits for facility:', facilityId);
      console.log('[PermitAPI] Facility ID type:', typeof facilityId);
      console.log('[PermitAPI] Facility ID truthy:', !!facilityId);

      // If no facility is selected, return empty array
      if (!facilityId) {
        console.log('[PermitAPI] No facility selected, returning empty permits array');
        return [];
      }

      const params = { facility: facilityId };
      console.log('[PermitAPI] Request params:', params);

      const response = await api.get('/api/permits/', { params });

      console.log('[PermitAPI] Raw API response:', response.data);
      console.log('[PermitAPI] Response contains results:', !!response.data.results);
      console.log('[PermitAPI] Number of permits:', (response.data.results || response.data || []).length);

      const rawData = response.data.results || response.data || [];
      const transformedData = rawData.map(transformPermitData);

      console.log('[PermitAPI] Transformed permits count:', transformedData.length);
      console.log('[PermitAPI] Transformed permits:', transformedData);

      return transformedData;
    } catch (error: any) {
      console.error('[PermitAPI] Error fetching permits:', error);
      console.error('[PermitAPI] Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to fetch permits');
    }
  }

  async uploadNewPermit(file: File, facilityId: number): Promise<Permit> {
    try {
      console.log('[PermitAPI] Uploading new permit for facility:', facilityId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('facility', facilityId.toString());

      const response = await api.post('/api/permits/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[PermitAPI] Upload response:', response.data);

      const transformed = transformPermitData(response.data);
      console.log('[PermitAPI] Transformed upload response:', transformed);

      return transformed;
    } catch (error: any) {
      console.error('[PermitAPI] Error uploading permit:', error);
      console.error('[PermitAPI] Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to upload permit');
    }
  }

  async uploadRenewal(permitId: number, file: File): Promise<Permit> {
    try {
      console.log('[PermitAPI] Uploading renewal for permit:', permitId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('facility', '0');

      const response = await api.post(`/api/permits/${permitId}/renew/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[PermitAPI] Renewal response:', response.data);

      const transformed = transformPermitData(response.data);
      console.log('[PermitAPI] Transformed renewal response:', transformed);

      return transformed;
    } catch (error: any) {
      console.error('[PermitAPI] Error uploading renewal:', error);
      console.error('[PermitAPI] Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to upload renewal');
    }
  }

  async fetchPermitHistory(permitId: number): Promise<PermitHistory[]> {
    try {
      console.log('[PermitAPI] Fetching history for permit:', permitId);

      const response = await api.get(`/api/permits/${permitId}/history/`);

      console.log('[PermitAPI] History response:', response.data);

      const rawData = response.data || [];
      const transformedData = rawData.map(transformHistoryData);

      console.log('[PermitAPI] Transformed history:', transformedData);

      return transformedData;
    } catch (error: any) {
      console.error('[PermitAPI] Error fetching permit history:', error);
      console.error('[PermitAPI] Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to fetch permit history');
    }
  }

  async fetchPermitStats(facilityId?: number): Promise<PermitStats> {
    try {
      console.log('[PermitAPI] Fetching permit stats for facility:', facilityId);

      // If no facility is selected, return zero stats
      if (!facilityId) {
        console.log('[PermitAPI] No facility selected, returning zero stats');
        return { total: 0, active: 0, expiring: 0, expired: 0 };
      }

      const params = { facility: facilityId };
      console.log('[PermitAPI] Stats request params:', params);

      const response = await api.get('/api/permits/stats/', { params });

      console.log('[PermitAPI] Stats response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('[PermitAPI] Error fetching permit stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch permit stats');
    }
  }

  async deletePermit(permitId: number): Promise<void> {
    try {
      await api.delete(`/api/permits/${permitId}/`);
    } catch (error: any) {
      console.error('Error deleting permit:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete permit');
    }
  }
}

export const permitApiService = new PermitApiService();
