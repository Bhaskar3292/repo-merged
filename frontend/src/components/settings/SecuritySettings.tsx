import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Smartphone, Key, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { TwoFactorAuth } from '../auth/TwoFactorAuth';
import { apiService } from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';

export function SecuritySettings() {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { user, refreshUser } = useAuthContext();

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (passwordData.new_password !== passwordData.confirm_password) {
        setError('New passwords do not match');
        return;
      }

      await apiService.changePassword(passwordData);
      
      setSuccess('Password changed successfully');
      setShowPasswordChange(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      try {
        await apiService.disable2FA();
        await refreshUser();
        setSuccess('Two-factor authentication disabled');
      } catch (error) {
        setError('Failed to disable 2FA');
      }
    }
  };

  const handle2FASuccess = async () => {
    await refreshUser();
    setSuccess('Two-factor authentication enabled successfully');
  };

  const updatePasswordData = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 3) return { strength: 'Weak', color: 'text-red-600', bg: 'bg-red-100' };
    if (score < 4) return { strength: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score < 5) return { strength: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { strength: 'Strong', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Password Security */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Password Security</h3>
          </div>
          {!showPasswordChange && (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordChange ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => updatePasswordData('current_password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => updatePasswordData('new_password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordData.new_password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Strength:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${passwordStrength.bg} ${passwordStrength.color}`}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li className={passwordData.new_password.length >= 12 ? 'text-green-600' : 'text-red-600'}>
                        At least 12 characters
                      </li>
                      <li className={/[A-Z]/.test(passwordData.new_password) ? 'text-green-600' : 'text-red-600'}>
                        Uppercase letter
                      </li>
                      <li className={/[a-z]/.test(passwordData.new_password) ? 'text-green-600' : 'text-red-600'}>
                        Lowercase letter
                      </li>
                      <li className={/\d/.test(passwordData.new_password) ? 'text-green-600' : 'text-red-600'}>
                        Number
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password) ? 'text-green-600' : 'text-red-600'}>
                        Special character
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={(e) => updatePasswordData('confirm_password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                  });
                  setError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading || passwordStrength.strength === 'Weak'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Password</span>
              <span className="text-sm text-gray-400">••••••••••••</span>
            </div>
            <div className="text-xs text-gray-500">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Minimum 12 characters</li>
                <li>Uppercase and lowercase letters</li>
                <li>Numbers and special characters</li>
                <li>No personal information</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${user?.two_factor_enabled ? 'text-green-600' : 'text-red-600'}`}>
              {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
            </span>
            {user?.two_factor_enabled ? (
              <button
                onClick={handleDisable2FA}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={() => setShow2FASetup(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Two-factor authentication adds an extra layer of security to your account by requiring a code from your mobile device in addition to your password.
          </p>
          
          {user?.role === 'admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Two-factor authentication is strongly recommended for administrator accounts
                </span>
              </div>
            </div>
          )}

          {user?.two_factor_enabled && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Your account is protected with two-factor authentication
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Security Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Key className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Account Security Status</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account Status</span>
            <span className={`text-sm font-medium ${user?.is_account_locked ? 'text-red-600' : 'text-green-600'}`}>
              {user?.is_account_locked ? 'Locked' : 'Active'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Two-Factor Authentication</span>
            <span className={`text-sm font-medium ${user?.two_factor_enabled ? 'text-green-600' : 'text-red-600'}`}>
              {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Login</span>
            <span className="text-sm text-gray-600">
              {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Failed Login Attempts</span>
            <span className={`text-sm font-medium ${(user as any)?.failed_login_attempts > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {(user as any)?.failed_login_attempts || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Security Best Practices</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Use a unique, strong password for this account</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Enable two-factor authentication for enhanced security</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Log out when using shared or public computers</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Keep your backup codes in a secure location</span>
          </li>
        </ul>
      </div>

      {/* Two-Factor Authentication Setup Modal */}
      <TwoFactorAuth
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onSuccess={handle2FASuccess}
      />
    </div>
  );
}