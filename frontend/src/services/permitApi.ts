import api from '../api/axios';
import { Permit, PermitHistory, PermitStats } from '../types/permit';

class PermitApiService {
  async fetchPermits(facilityId?: number): Promise<Permit[]> {
    try {
      const params = facilityId ? { facility: facilityId } : {};
      const response = await api.get('/api/permits/', { params });
      return response.data.results || response.data || [];
    } catch (error: any) {
      console.error('Error fetching permits:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch permits');
    }
  }

  async uploadNewPermit(file: File, facilityId: number): Promise<Permit> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('facility', facilityId.toString());

      const response = await api.post('/api/permits/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading permit:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload permit');
    }
  }

  async uploadRenewal(permitId: number, file: File): Promise<Permit> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('facility', '0');

      const response = await api.post(`/api/permits/${permitId}/renew/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error uploading renewal:', error);
      throw new Error(error.response?.data?.error || 'Failed to upload renewal');
    }
  }

  async fetchPermitHistory(permitId: number): Promise<PermitHistory[]> {
    try {
      const response = await api.get(`/api/permits/${permitId}/history/`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching permit history:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch permit history');
    }
  }

  async fetchPermitStats(facilityId?: number): Promise<PermitStats> {
    try {
      const params = facilityId ? { facility: facilityId } : {};
      const response = await api.get('/api/permits/stats/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching permit stats:', error);
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
