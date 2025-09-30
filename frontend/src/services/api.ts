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
      
      if (refreshToken) {
        const logoutData = { refresh_token: refreshToken };
        await api.post('/api/auth/logout/', logoutData);
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
    
    if (user && user.is_superuser) {
      user.effective_role = 'admin';
    }
    
    return user;
  }

  // Facility Management API methods

  /**
   * Get all locations
   */
  async getLocations(): Promise<any> { // Changed to any to handle paginated response
    try {
      const response = await api.get('/api/facilities/locations/');
      return response.data;
    } catch (error: any) {
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
   * Create facility contact
   */
  async createFacilityContact(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.post(`/api/facilities/locations/${locationId}/contacts/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to create contact');
    }
  }

  /**
   * Update facility contact
   */
  async updateFacilityContact(contactId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/contacts/${contactId}/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update contact');
    }
  }

  /**
   * Delete facility contact
   */
  async deleteFacilityContact(contactId: number): Promise<void> {
    try {
      await api.delete(`/api/facilities/contacts/${contactId}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete contact');
    }
  }

  /**
   * Update operating hours
   */
  async updateOperatingHours(locationId: number, data: any): Promise<any> {
    try {
      const response = await api.patch(`/api/facilities/locations/${locationId}/operating-hours/`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to update operating hours');
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
   * Update single role permission (admin only)
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
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    try {
      console.log('🔍 API: Getting users...');
      console.log('🔍 API: Current user:', this.getStoredUser());
      
      const response = await api.get('/api/auth/users/');
      console.log('🔍 API: Users response status:', response.status);
      console.log('🔍 API: Users response data:', response.data);
      
      // Return the users array directly
      return response.data ;
    } catch (error: any) {
      console.error('🔍 API: Get users error:', error);
      console.error('🔍 API: Error response:', error.response?.data);
      console.error('🔍 API: Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get users');
    }
  }

  /**
   * Create user (admin only)
   */
  async createUser(data: any): Promise<any> {
    try {
      const userData = {
        username: data.username,
        password: data.password,
        role: data.role,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || `${data.username}@facility.com`
      };
      
      const response = await api.post('/api/auth/users/create/', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only administrators can create users.');
      } else if (error.response?.data) {
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
  // ... (rest of the file remains the same)

}

export const apiService = new ApiService();