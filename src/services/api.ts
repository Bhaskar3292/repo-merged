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

      // Store tokens and user data
      if (responseData.tokens) {
        tokenManager.setTokens(responseData.tokens.access, responseData.tokens.refresh);
      }
      
      if (responseData.user) {
        localStorage.setItem('user', JSON.stringify(responseData.user));
      }

      return responseData;
    } catch (error: any) {
      // Enhanced error handling for common login issues
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
      
      // Only call logout endpoint if we have a refresh token
      if (refreshToken) {
        const logoutData = { refresh_token: refreshToken };
        
        console.log('Logout request data:', logoutData);
        
        const response = await api.post('/api/auth/logout/', logoutData);
        console.log('Logout response:', response.data);
      } else {
        console.log('No refresh token available, skipping API call');
      }
      
    } catch (error) {
      console.error('Logout API error:', error);
      // Don't throw error - logout should always succeed on frontend
    } finally {
      // Always clear tokens regardless of API response
      tokenManager.clearTokens();
      console.log('Tokens cleared from localStorage');
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

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/password-reset/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password reset request failed');
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/password-reset/confirm/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Password reset failed');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: EmailVerification): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/verify-email/', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Email verification failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    
    // Ensure superuser status is properly handled
    if (user && user.is_superuser) {
      user.effective_role = 'admin';
    }
    
    return user;
  }

  // Facility Management API methods

  /**
   * Get all locations
   */
  async getLocations(): Promise<any[]> {
    try {
      const response = await api.get('/api/facilities/locations/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Get locations error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get locations');
    }
  }

  /**
   * Create a new location
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
   * Get location details
   */
  async getLocation(id: number): Promise<any> {
    try {
      const response = await api.get(`/api/facilities/locations/${id}/`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get location');
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
   * Update dashboard section data
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
   * Get user permissions
   */
  async getUserPermissions(): Promise<any> {
    try {
      const response = await api.get('/api/permissions/user/permissions/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permissions');
    }
  }

  /**
   * Check specific permissions
   */
  async checkPermissions(permissionCodes: string[]): Promise<any> {
    try {
      const params = new URLSearchParams();
      permissionCodes.forEach(code => params.append('permission_codes', code));
      const response = await api.get(`/api/permissions/user/check/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to check permissions');
    }
  }

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
   * Update role permissions (admin only)
   */
  async updateRolePermissions(role: string, permissions: any[]): Promise<any> {
    try {
      const response = await api.post('/api/permissions/roles/permissions/bulk-update/', { 
        role, 
        permissions 
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update role permissions');
    }
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<any[]> {
    try {
      const response = await api.get('/api/auth/users/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Get users error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get users');
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: any): Promise<any> {
    try {
      // Ensure we only send required fields
      const userData = {
        username: data.username,
        password: data.password,
        role: data.role,
        first_name: data.first_name || '',
        last_name: data.last_name || ''
      };
      
      console.log('Creating user with data:', userData);
      console.log('Current auth token:', tokenManager.getAccessToken() ? 'Present' : 'Missing');
      
      const response = await api.post('/api/auth/users/create/', userData);
      console.log('User creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('User creation error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can create users.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.data) {
        // Handle field-specific errors
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(errorMessages);
        }
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Failed to create user');
    }
  }

  /**
   * Update user (admin only)
   */
  async updateUser(id: number, data: any): Promise<any> {
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

  /**
   * Get tanks for a location
   */
  async getTanks(locationId?: number): Promise<any[]> {
    try {
      const endpoint = locationId 
        ? `/api/facilities/locations/${locationId}/tanks/`
        : '/api/facilities/tanks/';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get tanks');
    }
  }

  /**
   * Create tank
   */
  async createTank(data: any, locationId?: number): Promise<any> {
    try {
      const endpoint = locationId 
        ? `/api/facilities/locations/${locationId}/tanks/`
        : '/api/facilities/tanks/';
      const response = await api.post(endpoint, data);
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

  /**
   * Get permits for a location
   */
  async getPermits(locationId?: number): Promise<any[]> {
    try {
      const endpoint = locationId 
        ? `/api/facilities/locations/${locationId}/permits/`
        : '/api/facilities/permits/';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get permits');
    }
  }

  /**
   * Create permit
   */
  async createPermit(data: any, locationId?: number): Promise<any> {
    try {
      const endpoint = locationId 
        ? `/api/facilities/locations/${locationId}/permits/`
        : '/api/facilities/permits/';
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error: any) {
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

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    try {
      const response = await api.get('/api/facilities/stats/');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get dashboard stats');
    }
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
}

export const apiService = new ApiService();