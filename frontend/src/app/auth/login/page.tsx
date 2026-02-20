'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setError('માન્ય મોબાઇલ નંબર દાખલ કરો');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/send-otp', { phone });
      setStep('otp');
      startResendTimer();
    } catch {
      setError('OTP મોકલવામાં નિષ્ફળ');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('માન્ય OTP દાખલ કરો');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/api/auth/verify-otp', { phone, otp });
      setAuth(response.user, response.token);
      router.push(redirectTo);
    } catch {
      setError('અમાન્ય OTP');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/api/auth/send-otp', { phone });
      startResendTimer();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-primary-500 px-4 py-6">
        <h1 className="text-center text-2xl font-bold text-white">ટ્રેક્ટર પાર્ટ્સ</h1>
        <p className="text-center text-primary-100">લોગિન કરો</p>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          {step === 'phone' ? (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
                  <span className="text-4xl">📱</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">મોબાઇલ નંબર દાખલ કરો</h2>
                <p className="mt-2 text-base text-gray-600">તમારા ફોન પર OTP મોકલાશે</p>
              </div>

              <div className="space-y-4">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="મોબાઇલ નંબર"
                  maxLength={10}
                  className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 text-center text-lg tracking-widest focus:border-primary-500 focus:outline-none"
                  autoFocus
                />

                {error && (
                  <p className="text-center text-base text-red-600">{error}</p>
                )}

                <button
                  onClick={sendOtp}
                  disabled={loading || phone.length !== 10}
                  className="btn-xl w-full bg-primary-500 text-white disabled:bg-gray-300"
                >
                  {loading ? 'મોકલી રહ્યા છીએ...' : 'OTP મોકલો'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
                  <span className="text-4xl">🔐</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">OTP દાખલ કરો</h2>
                <p className="mt-2 text-base text-gray-600">
                  {phone.slice(0, 4)}****** પર OTP મોકલાયેલ
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="OTP દાખલ કરો"
                  maxLength={6}
                  className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 text-center text-2xl tracking-[0.5em] focus:border-primary-500 focus:outline-none"
                  autoFocus
                />

                {error && (
                  <p className="text-center text-base text-red-600">{error}</p>
                )}

                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="btn-xl w-full bg-primary-500 text-white disabled:bg-gray-300"
                >
                  {loading ? 'પુષ્ટિ થઈ રહી છે...' : 'પુષ્ટિ કરો'}
                </button>

                <div className="text-center">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="text-base font-medium text-primary-600 disabled:text-gray-400"
                  >
                    {resendTimer > 0 ? `${resendTimer} સેકન્ડ` : 'ફરી OTP મોકલો'}
                  </button>
                  <span className="mx-2 text-gray-400">|</span>
                  <button
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                    }}
                    className="text-base font-medium text-gray-600"
                  >
                    નંબર બદલો
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
