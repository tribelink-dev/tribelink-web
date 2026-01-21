'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import api from '@/lib/api';
import Image from 'next/image';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';

export default function GoogleAuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [providerType, setProviderType] = useState<'EXPERIENCE_HOST' | 'GUIDE' | 'ACCOMMODATION_PROVIDER' | 'LOCAL_HOST' | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const googleId = searchParams.get('googleId') || '';
  const type = searchParams.get('type') || 'user';

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?[1-9]\d{9,14}$/.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phoneNumber) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (type === 'host' && !providerType) {
      setError('Please select a provider type');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +1234567890)');
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const response = await api.post('/auth/google/complete', {
        email,
        name,
        googleId,
        phoneNumber: formattedPhone,
        type,
        providerType: type === 'host' ? providerType : undefined,
        role: type === 'host' && providerType === 'EXPERIENCE_HOST' ? 'Host' : type === 'host' && providerType === 'GUIDE' ? 'Guide' : undefined
      });

      const { token, user, host } = response.data;

      // Store authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        if (type === 'user') {
          localStorage.setItem('user', JSON.stringify(user));
        } else if (type === 'host') {
          localStorage.setItem('host', JSON.stringify(host));
          localStorage.setItem('userType', 'host');
        }
      }

      // Redirect based on provider type
      if (type === 'user') {
        router.push('/dashboard');
      } else {
        const dashboardRoute = getProviderDashboard(host?.providerType || 'EXPERIENCE_HOST');
        router.push(dashboardRoute);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-tourism p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="content-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6 shadow-medium p-2">
              <Image 
                src={LOGO_PATH} 
                alt={LOGO_ALT_TEXT} 
                width={64} 
                height={64}
                className="w-full h-full"
              />
            </div>
            <h1 className="heading-primary text-gray-900">
              Complete Your Registration
            </h1>
            <p className="text-subtitle text-gray-600 mb-0">
              Just one more step to get started
            </p>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Email:</p>
            <p className="font-semibold text-gray-900">{email}</p>
            <p className="text-sm text-gray-600 mb-1 mt-3">Name:</p>
            <p className="font-semibold text-gray-900">{name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="+1234567890"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1.5">Use international format (e.g., +1234567890)</p>
            </div>

            {type === 'host' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What type of service provider are you? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-start p-4 rounded-xl cursor-pointer transition-all card-hover border-2 ${
                    providerType === 'EXPERIENCE_HOST' 
                      ? 'bg-primary-500 text-white shadow-medium border-primary-600' 
                      : 'bg-white border-gray-200 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      name="providerType"
                      value="EXPERIENCE_HOST"
                      checked={providerType === 'EXPERIENCE_HOST'}
                      onChange={(e) => setProviderType(e.target.value as 'EXPERIENCE_HOST')}
                      className="mt-1 mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1.5">Experience Host</div>
                      <div className={`text-sm ${providerType === 'EXPERIENCE_HOST' ? 'text-white/90' : 'text-gray-600'}`}>
                        Offer experiences
                      </div>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 rounded-xl cursor-pointer transition-all card-hover border-2 ${
                    providerType === 'GUIDE' 
                      ? 'bg-primary-500 text-white shadow-medium border-primary-600' 
                      : 'bg-white border-gray-200 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      name="providerType"
                      value="GUIDE"
                      checked={providerType === 'GUIDE'}
                      onChange={(e) => setProviderType(e.target.value as 'GUIDE')}
                      className="mt-1 mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1.5">Tour Guide</div>
                      <div className={`text-sm ${providerType === 'GUIDE' ? 'text-white/90' : 'text-gray-600'}`}>
                        Provide tours
                      </div>
                    </div>
                  </label>
                  <label className={`flex items-start p-4 rounded-xl cursor-pointer transition-all card-hover border-2 ${
                    providerType === 'ACCOMMODATION_PROVIDER' 
                      ? 'bg-primary-500 text-white shadow-medium border-primary-600' 
                      : 'bg-white border-gray-200 hover:border-primary-300'
                  }`}>
                    <input
                      type="radio"
                      name="providerType"
                      value="ACCOMMODATION_PROVIDER"
                      checked={providerType === 'ACCOMMODATION_PROVIDER'}
                      onChange={(e) => setProviderType(e.target.value as 'ACCOMMODATION_PROVIDER')}
                      className="mt-1 mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1.5">Hotel Owner</div>
                      <div className={`text-sm ${providerType === 'ACCOMMODATION_PROVIDER' ? 'text-white/90' : 'text-gray-600'}`}>
                        List hotels
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-4 h-4"></span>
                  Completing registration...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

