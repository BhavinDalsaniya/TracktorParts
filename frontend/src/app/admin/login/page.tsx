'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';

interface AdminLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      phone: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation states
  const isPhoneValid = phone.length === 10;
  const isPasswordValid = password.length > 0;
  const canSubmit = isPhoneValid && isPasswordValid && !loading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    console.log('🔐 Login attempt:', { phone, phoneLength: phone.length });

    // Validate inputs
    if (!phone || !password) {
      setError('મોબાઇલ નંબર અને પાસવર્ડ દાખલ કરો');
      return;
    }

    if (phone.length !== 10) {
      setError('માન્ય મોબાઇલ નંબર દાખલ કરો');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Sending API request...');
      const response = await api.post<AdminLoginResponse>('/api/auth/admin/login', {
        phone,
        password,
      });

      console.log('📥 Full API Response:', response);

      if (!response.data) {
        console.error('❌ No data in response:', response);
        throw new Error('No data in response');
      }

      const { accessToken, refreshToken, user } = response.data;

      if (!accessToken) {
        console.error('❌ No accessToken in response:', response.data);
        throw new Error('No access token received from server');
      }

      if (!user) {
        console.error('❌ No user in response:', response.data);
        throw new Error('No user data received from server');
      }

      // Store auth tokens in localStorage FIRST (before setting Zustand state)
      localStorage.setItem('auth_token', accessToken);
      console.log('✅ Token stored in localStorage:', accessToken.substring(0, 20) + '...');

      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
        console.log('✅ Refresh token stored');
      }

      // Set auth state in Zustand
      console.log('👤 Setting auth state:', user);
      setAuth(user, accessToken);

      // Use window.location.href for a full page reload to ensure
      // localStorage is read correctly by the new page
      console.log('🔄 Redirecting to /admin with full reload...');
      window.location.href = '/admin';
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'અમાન્ય પ્રમાણો';
      setError(errorMessage);
      setLoading(false);
    }
    // Note: No finally setLoading(false) here because if successful, we redirect
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 px-4 py-6">
        <h1 className="text-center text-2xl font-bold text-white">Admin Portal</h1>
        <p className="text-center text-primary-100">ટ્રેક્ટર પાર્ટ્સ - એડમિન લોગિન</p>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <span className="text-4xl">🔐</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Login</h2>
            <p className="mt-2 text-base text-gray-600">
              એડમિન પેનલ માટે લોગિન કરો
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="phone" className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                <span>મોબાઇલ નંબર</span>
                <span className={isPhoneValid ? 'text-green-600 font-bold' : 'text-orange-600'}>
                  {phone.length > 0 ? `${phone.length}/10 ${isPhoneValid ? '✓' : ''}` : ''}
                </span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className={'w-full rounded-2xl border-2 bg-white px-4 py-4 pr-12 text-center text-lg tracking-widest focus:outline-none ' +
                    (isPhoneValid ? 'border-green-500' : phone.length > 0 ? 'border-orange-400' : 'border-gray-200 focus:border-primary-500')}
                  autoFocus
                  required
                />
                {isPhoneValid && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-2xl">✓</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                <span>પાસવર્ડ</span>
                <span className={isPasswordValid ? 'text-green-600' : ''}>
                  {isPasswordValid ? '✓' : ''}
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="પાસવર્ડ દાખલ કરો"
                  className={'w-full rounded-2xl border-2 bg-white px-4 py-4 pr-12 text-center text-lg focus:outline-none ' +
                    (isPasswordValid ? 'border-green-500' : 'border-gray-200 focus:border-primary-500')}
                  required
                />
                {isPasswordValid && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-2xl">✓</span>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-center">
                <p className="text-base text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={'btn-xl w-full text-white transition-all ' +
                (canSubmit
                  ? 'bg-primary-600 hover:bg-primary-700 hover:scale-105 hover:shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed opacity-60')}
            >
              {loading ? 'લોગિન થઈ રહ્યું છે...' : 'લોગિન કરો'}
            </button>

            {/* Validation status */}
            {!canSubmit && (
              <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-center">
                <p className="text-sm font-semibold text-orange-700">
                  {!isPhoneValid && phone.length > 0 && 'મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ'}
                  {!isPhoneValid && phone.length === 0 && 'મોબાઇલ નંબર દાખલ કરો'}
                  {isPhoneValid && !isPasswordValid && 'કૃપા કરી પાસવર્ડ દાખલ કરો'}
                </p>
              </div>
            )}

            {/* Ready to submit indicator */}
            {canSubmit && !loading && (
              <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-center">
                <p className="text-sm font-semibold text-green-700">
                  ✓ તૈયાર! લોગિન કરવા માટે બટન દબાવો
                </p>
              </div>
            )}
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-3">
            <p className="mb-2 text-center text-sm font-semibold text-blue-800">
              📋 Demo Credentials (if seeded)
            </p>
            <div className="text-center text-sm text-blue-700">
              <p>Phone: <span className="font-mono font-bold">9876543210</span></p>
              <p>Password: <span className="font-mono font-bold">admin123</span></p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-base font-medium text-gray-600 hover:text-gray-900"
            >
              ← હોમ પર પાછા જાઓ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
