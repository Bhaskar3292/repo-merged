/**
 * API debugging utilities for development
 */

import { apiService } from '../services/api';
import { debugApiConfig, checkApiHealth } from '../api/axios';

export class ApiDebugger {
  /**
   * Run comprehensive API diagnostics
   */
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 Running API Diagnostics...\n');

    // 1. Check configuration
    console.log('1. Configuration Check:');
    debugApiConfig();
    console.log('');

    // 2. Test backend connectivity
    console.log('2. Backend Connectivity:');
    const isHealthy = await checkApiHealth();
    console.log(`   Health Check: ${isHealthy ? '✅ Passed' : '❌ Failed'}`);
    
    if (!isHealthy) {
      console.log('   ⚠️  Backend server may not be running or accessible');
      console.log('   💡 Try: cd backend && python manage.py runserver');
    }
    console.log('');

    // 3. Test API connection
    console.log('3. API Connection Test:');
    try {
      const connectionTest = await apiService.testConnection();
      console.log(`   Status: ${connectionTest.status === 'success' ? '✅' : '❌'} ${connectionTest.message}`);
    } catch (error) {
      console.log(`   Status: ❌ ${error}`);
    }
    console.log('');

    // 4. Check authentication state
    console.log('4. Authentication State:');
    const isAuth = apiService.isAuthenticated();
    const user = apiService.getStoredUser();
    console.log(`   Authenticated: ${isAuth ? '✅' : '❌'}`);
    console.log(`   User Data: ${user ? '✅ Present' : '❌ Missing'}`);
    if (user) {
      console.log(`   User: ${user.username} (${user.role})`);
    }
    console.log('');

    // 5. Environment check
    console.log('5. Environment Variables:');
    console.log(`   VITE_API_URL: ${import.meta.env.VITE_API_URL || 'Not set (using default)'}`);
    console.log(`   VITE_API_TIMEOUT: ${import.meta.env.VITE_API_TIMEOUT || 'Not set (using default)'}`);
    console.log(`   VITE_ENABLE_API_LOGGING: ${import.meta.env.VITE_ENABLE_API_LOGGING || 'Not set (using default)'}`);
    console.log('');

    console.log('🏁 Diagnostics Complete');
  }

  /**
   * Test specific API endpoint
   */
  static async testEndpoint(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<void> {
    console.log(`🧪 Testing ${method} ${endpoint}...`);
    
    try {
      let response;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Add auth header if available
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      switch (method) {
        case 'GET':
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${endpoint}`, {
            headers
          });
          break;
        case 'POST':
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data || {})
          });
          break;
      }
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.text();
      console.log(`   Response:`, responseData);
      
    } catch (error) {
      console.error(`   Error:`, error);
    }
  }

  /**
   * Test logout functionality specifically
   */
  static async testLogout(): Promise<void> {
    console.log('🧪 Testing Logout Functionality...\n');

    const refreshToken = localStorage.getItem('refresh_token');
    console.log(`Refresh token available: ${!!refreshToken}`);
    
    if (refreshToken) {
      console.log(`Refresh token: ${refreshToken.substring(0, 20)}...`);
    }

    // Test logout with current tokens
    await this.testEndpoint('/api/auth/logout/', 'POST', {
      refresh_token: refreshToken
    });
  }

  /**
   * Monitor API calls in real-time
   */
  static startApiMonitoring(): () => void {
    console.log('📡 Starting API monitoring...');
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();
      
      console.log(`📤 Outgoing: ${options?.method || 'GET'} ${url}`);
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        console.log(`📥 Response: ${response.status} ${response.statusText} (${duration}ms)`);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`📥 Error: ${error} (${duration}ms)`);
        throw error;
      }
    };

    // Return cleanup function
    return () => {
      window.fetch = originalFetch;
      console.log('📡 API monitoring stopped');
    };
  }
}

// Make debugger available globally in development
if (import.meta.env.DEV) {
  (window as any).apiDebugger = ApiDebugger;
  console.log('🔧 API Debugger available as window.apiDebugger');
  console.log('💡 Try: apiDebugger.runDiagnostics()');
}