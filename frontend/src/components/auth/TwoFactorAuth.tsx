import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  Check, 
  X,
  Download,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../../services/api';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorAuth({ isOpen, onClose, onSuccess }: TwoFactorAuthProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && step === 'setup') {
      setup2FA();
    }
  }, [isOpen]);

  const setup2FA = async () => {
    try {
      setLoading(true);
      const response = await apiService.setup2FA();
      setQrCode(response.qr_code);
      setSecret(response.secret);
      setBackupCodes(response.backup_codes);
    } catch (error) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    try {
      setLoading(true);
      await apiService.enable2FA(verificationCode);
      setStep('complete');
    } catch (error) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `Facility Management System - Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facility-management-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setStep('setup');
    setVerificationCode('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {step === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Authenticator App</h3>
                <p className="text-sm text-gray-600">
                  Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <img src={qrCode} alt="QR Code" className="mx-auto border border-gray-200 rounded-lg" />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Manual entry key:</p>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm bg-white p-2 rounded border font-mono">
                        {secret}
                      </code>
                      <button
                        onClick={copySecret}
                        className="p-2 text-gray-600 hover:text-gray-800"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('verify')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Continue to Verification
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <Key className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Setup</h3>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={verify2FA}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2FA Enabled Successfully!</h3>
                <p className="text-sm text-gray-600">
                  Your account is now protected with two-factor authentication
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Save Your Backup Codes</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Store these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="text-center">{code}</div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={downloadBackupCodes}
                      className="flex items-center space-x-2 mt-3 text-sm text-yellow-700 hover:text-yellow-800"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Backup Codes</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}