/**
 * API service for handling HTTP requests to Django backend
 * Uses centralized Axios configuration with comprehensive error handling
 */

import api, { tokenManager } from '../api/axios';
import { 
  LoginRequest, 
  LoginResponse, 
  User,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerification
} from '../types/auth';

// FIX: Define a generic type for paginated API responses
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ApiService {
  /**
   * User registration
   */
  async register(data: RegisterRequest): Promise<any> {
    try {
      const response = await api.post('/api/auth/register/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  }

  /**
   * User login with comprehensive error handling
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post('/api/auth/login/', {
        email: data.email,
        password: data.password,
        totp_token: data.totp_token
      });

      const responseData = response.data;

      if (responseData.tokens) {
        tokenManager.setTokens(responseData.tokens.access, responseData.tokens.refresh);
      }
      
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }

      return responseData;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          throw new Error(errorData);
        } else if (errorData.error) {
          throw new Error(errorData.error);
        } else if (errorData.non_field_errors) {
          throw new Error(errorData.non_field_errors[0]);
        }
      } else if (error.response?.status === 401) {
        throw new Error('Invalid credentials');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Change password
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/password/change/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password change failed');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: { email: string }): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/password/reset/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password reset request failed');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: {
    uidb64: string;
    token: string;
    password: string;
    password_confirm: string;
  }): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/password/reset/confirm/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password reset confirmation failed');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: { token: string }): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/email/verify/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Email verification failed');
    }
  }
  /**
   * Setup Two-Factor Authentication
   */
  async setup2FA(): Promise<{
    secret: string;
    qr_code: string;
    backup_codes: string[];
  }> {
    try {
      const response = await api.get('/api/auth/2fa/setup/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || '2FA setup failed');
    }
  }

  /**
   * Enable Two-Factor Authentication
   */
  async enable2FA(totp_token: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/2fa/setup/', { totp_token });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || '2FA enable failed');
    }
  }

  /**
   * Disable Two-Factor Authentication
   */
  async disable2FA(): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/2fa/disable/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || '2FA disable failed');
    }
  }

  /**
   * Unlock user account (admin only)
   */
  async unlockUserAccount(userId: number): Promise<{ message: string }> {
    try {
      const response = await api.post(`/api/auth/users/${userId}/unlock/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Account unlock failed');
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post('/api/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      tokenManager.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<User> {
    try {
      const response = await api.get('/api/auth/profile/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get user profile');
    }
  }
  
  // ... other auth methods like password reset, etc.

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    if (user && user.is_superuser) {
      user.effective_role = 'admin';
    }
    return user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.get('/api/health/');
      return {
        status: 'success',
        message: 'Backend connection successful'
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Backend connection failed'
      };
    }
  }
  // --- FACILITY & USER MANAGEMENT METHODS ---

  /**
   * Get all locations
   */
  async getLocations(): Promise<PaginatedResponse<any>> {
    try {
      const response = await api.get('/api/facilities/locations/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get locations');
    }
  }

  /**
   * Create new location
   */
  async createLocation(data: any): Promise<any> {
    try {
      const response = await api.post('/api/facilities/locations/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to create location');
    }
  }

  /**
   * Update location
   */
  async updateLocation(id: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update location');
    }
  }

  /**
   * Delete location
   */
  async deleteLocation(id: number): Promise<void> {
    try {
      await api.delete(`/api/facilities/locations/${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete location');
    }
  }
  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<PaginatedResponse<User>> {
    try {
      const response = await api.get('/api/auth/users/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get users');
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: any): Promise<User> {
    try {
      const response = await api.post('/api/auth/users/create/', data);
      return response.data;
    } catch (error: any) {
        // More robust error handling
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
            const errorMessages = Object.entries(errorData)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            throw new Error(errorMessages);
        }
        throw new Error(error.message || 'Failed to create user');
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(id: number, data: any): Promise<User> {
    try {
      const response = await api.patch(`/api/auth/users/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update user');
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/api/auth/users/${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete user');
    }
  }

  // --- PERMISSIONS METHODS ---
  
  /**
   * Get permissions matrix (admin only)
   */
  async getPermissionsMatrix(): Promise<any> {
    try {
      const response = await api.get('/api/permissions/roles/permissions/matrix/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permissions matrix');
    }
  }

  /**
   * Update role permission (admin only)
   */
  async updateRolePermission(role: string, permissionId: number, isGranted: boolean): Promise<any> {
    try {
      const response = await api.post('/api/permissions/role-permissions/update/', { 
        role, 
        permission_id: permissionId,
        is_granted: isGranted
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update role permissions');
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(): Promise<any> {
    try {
      const response = await api.get('/api/permissions/user/permissions/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get user permissions');
    }
  }
  
  // --- TANK MANAGEMENT METHODS ---
  
  /**
   * Get all tanks
   */
  async getTanks(): Promise<any[]> {
    try {
      const response = await api.get('/api/facilities/tanks/');
      return response.data.results || response.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get tanks');
    }
  }

  /**
   * Get tanks by facility
   */
  async getTanksByFacility(facilityId: number): Promise<any> {
    try {
      const response = await api.get(`/api/facilities/locations/${facilityId}/tanks/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get facility tanks');
    }
  }

  /**
   * Get tanks by location ID (alias for getTanksByFacility)
   */
  async getTanksByLocationid(locationId: number): Promise<any[]> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/tanks/`);
      return response.data.results || response.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get tanks');
    }
  }

  /**
   * Get permits by location ID
   */
  async getPermits(locationId: number): Promise<any[]> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/permits/`);
      return response.data.results || response.data || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permits');
    }
  }

  /**
   * Get tank count for a location
   */
  async getTankCount(locationId: number): Promise<number> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/tanks/count/`);
      return response.data.count;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get tank count');
    }
  }

  /**
   * Get permit count for a location
   */
  async getPermitCount(locationId: number): Promise<number> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/permits/count/`);
      return response.data.count;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permit count');
    }
  }

  /**
   * Create new tank
   */
  async createTank(data: any): Promise<any> {
    try {
      const response = await api.post('/api/facilities/tanks/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to create tank');
    }
  }

  /**
   * Update tank
   */
  async updateTank(id: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/tanks/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update tank');
    }
  }

  /**
   * Delete tank
   */
  async deleteTank(id: number): Promise<void> {
    try {
      await api.delete(`/api/facilities/tanks/${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete tank');
    }
  }

  // --- DASHBOARD METHODS ---
  
  /**
   * Get location dashboard
   */
  async getLocationDashboard(locationId: number): Promise<any> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/dashboard/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get dashboard');
    }
  }

  /**
   * Update dashboard section
   */
  async updateDashboardSection(sectionId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/dashboard-section-data/${sectionId}/`, { data });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update dashboard section');
    }
  }

  /**
   * Get facility profile
   */
  async getFacilityProfile(locationId: number): Promise<any> {
    try {
      const response = await api.get(`/api/facilities/locations/${locationId}/profile/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get facility profile');
    }
  }

  /**
   * Update facility profile
   */
  async updateFacilityProfile(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/profile/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update facility profile');
    }
  }

  /**
   * Update facility profile - General Information section only
   */
  async updateProfileGeneralInfo(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/profile/general/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update general information');
    }
  }

  /**
   * Update facility profile - Operational Information section only
   */
  async updateProfileOperationalInfo(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/profile/operational/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update operational information');
    }
  }

  /**
   * Update facility profile - Facility Contacts section only
   */
  async updateProfileContacts(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/profile/contacts/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update facility contacts');
    }
  }

  /**
   * Update facility profile - Operation Hours section only
   */
  async updateProfileOperationHours(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/profile/operation-hours/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update operation hours');
    }
  }

  /**
   * Get permits by location
   */
  async getPermitsByLocation(locationId: number): Promise<PaginatedResponse<any>> {
    try {
      console.log('🔍 API: Getting permits for location:', locationId);
      console.log('🔍 API: Auth token exists:', !!tokenManager.getAccessToken());
      const response = await api.get(`/api/facilities/locations/${locationId}/permits/`);
      console.log('🔍 API: Permits response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔍 API: Get permits error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permits');
    }
  }

  /**
   * Create permit
   */
  async createPermit(locationId: number, data: any): Promise<any> {
    try {
      console.log('🔍 API: Creating permit for location:', locationId);
      console.log('🔍 API: Permit data:', data);
      console.log('🔍 API: Auth token exists:', !!tokenManager.getAccessToken());
      const response = await api.post(`/api/facilities/locations/${locationId}/permits/`, data);
      console.log('🔍 API: Create permit response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔍 API: Create permit error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to create permit');
    }
  }

  /**
   * Update permit
   */
  async updatePermit(id: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/permits/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update permit');
    }
  }

  /**
   * Delete permit
   */
  async deletePermit(id: number): Promise<void> {
    try {
      await api.delete(`/api/facilities/permits/${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete permit');
    }
  }
}

export const apiService = new ApiService();