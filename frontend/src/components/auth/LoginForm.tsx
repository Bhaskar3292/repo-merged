import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Building2, ArrowLeft, UserPlus, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export function LoginForm() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { 
    login, 
    requestPasswordReset, 
    isLoading, 
    error: authError,
    clearError 
  } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    clearError();

    try {
      if (currentView === 'login') {
        const loginSuccess = await login({ 
          email, 
          password,
          totp_token: totpToken 
        });
        if (loginSuccess) {
          // Redirect to locations on successful login
          navigate('/locations', { replace: true });
        } else {
          const errorMsg = authError || 'Login failed. Please check your credentials.';
          setError(errorMsg);
          
          // Check if 2FA is required
          if (errorMsg.includes('Two-factor authentication token required')) {
            setShow2FAInput(true);
          }
        }
      } else if (currentView === 'forgot') {
        const resetSuccess = await requestPasswordReset({ email });
        if (resetSuccess) {
          setSuccess('Password reset instructions have been sent to your email');
        } else {
          setError(authError || 'Password reset request failed');
        }
      }
    } catch (err) {
      setError('Operation failed. Please try again.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setTotpToken('');
    setShow2FAInput(false);
    setError('');
    setSuccess('');
    clearError();
  };

  const switchView = (view: 'login' | 'forgot') => {
    resetForm();
    setCurrentView(view);
  };

  const renderLoginForm = () => (
    <>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="text-right mt-2">
            <button
              type="button"
              onClick={() => switchView('forgot')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {show2FAInput && (
          <div>
            <label htmlFor="totpToken" className="block text-sm font-medium text-gray-700 mb-2">
              Two-Factor Authentication Code
            </label>
            <input
              id="totpToken"
              type="text"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 text-center text-lg font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000000"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code from your authenticator app or use a backup code
            </p>
          </div>
        )}

        {(error || authError) && (
          <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
            {error || authError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <LogIn className="h-4 w-4 mr-2" />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

    </>
  );

  if (currentView === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          {(error || authError) && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="space-y-4">
          {success && (
            <div className="text-green-600 text-sm text-center bg-green-50 py-2 px-3 rounded-md">
              {success}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => switchView('login')}
              className="flex items-center justify-center mx-auto text-sm text-gray-600 hover:text-gray-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {renderLoginForm()}
      </div>
    </div>
  );
}