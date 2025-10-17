import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';

export function PasswordResetConfirm() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 9) {
      setError('Password must be at least 9 characters long');
      return;
    }

    try {
      setLoading(true);
      
      await apiService.confirmPasswordReset({
        uidb64: uid!,
        token: token!,
        password,
        password_confirm: confirmPassword
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?reset=success');
      }, 3000);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score < 3) return { strength: 'Weak', color: 'text-red-600', bg: 'bg-red-100' };
    if (score < 4) return { strength: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score < 5) return { strength: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { strength: 'Strong', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const passwordStrength = getPasswordStrength(password);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
          <p className="text-gray-600 mb-6">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to login page in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Enter your new password"
                required
                minLength={12}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Strength:</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${passwordStrength.bg} ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li className={password.length >= 9 ? 'text-green-600' : 'text-red-600'}>
                      At least 9 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      Uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      Lowercase letter
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      Number
                    </li>
                    <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      Special character
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Confirm your new password"
                required
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
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password !== confirmPassword || passwordStrength.strength === 'Weak'}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Lock className="h-4 w-4 mr-2" />
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}