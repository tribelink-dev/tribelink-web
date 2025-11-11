'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getProviderDashboard } from '@/lib/providerUtils';
import api from '@/lib/api';

export default function HostSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    providerType: 'EXPERIENCE_HOST' as 'EXPERIENCE_HOST' | 'GUIDE' | 'ACCOMMODATION_PROVIDER' | 'DRIVER_PARTNER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password || !formData.providerType) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    // Validate phone number format
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

    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +1234567890)');
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      const response = await api.post('/auth/host/signup', {
        email: formData.email,
        phoneNumber: formattedPhone,
        password: formData.password,
        name: formData.name,
        providerType: formData.providerType
      });

      const { token, host } = response.data;
      
      // Store host authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('host', JSON.stringify(host));
        localStorage.setItem('userType', 'host');
      }

      // Redirect to provider-specific dashboard
      const dashboardRoute = getProviderDashboard(host.providerType || 'EXPERIENCE_HOST');
      router.push(dashboardRoute);
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Signup failed. Please try again.';
      setError(errorMessage);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-tourism p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <div className="content-card">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-6 shadow-medium p-2">
              <Image 
                src="/tribelink-logo.svg" 
                alt="Tribelink Logo" 
                width={80} 
                height={80}
                className="w-full h-full"
              />
            </div>
            <h1 className="heading-primary text-gray-900 text-4xl mb-3">
              Become a Service Provider
            </h1>
            <p className="text-subtitle text-gray-600 mb-0 text-lg">
              Join our platform and start offering your services
            </p>
          </div>
          
          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className="input-field text-base py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  className="input-field text-base py-3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  placeholder="+1234567890"
                  className="input-field text-base py-3"
                />
                <p className="text-xs text-gray-500 mt-1.5">Use international format (e.g., +1234567890)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="input-field text-base py-3"
                />
                <p className="text-xs text-gray-500 mt-1.5">Minimum 6 characters</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                What type of service provider are you? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.providerType === 'EXPERIENCE_HOST' 
                    ? 'bg-primary-50 border-primary-500 shadow-soft' 
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="providerType"
                      value="EXPERIENCE_HOST"
                      checked={formData.providerType === 'EXPERIENCE_HOST'}
                      onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'EXPERIENCE_HOST' })}
                      className="mt-1 w-5 h-5 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-2 text-lg">Experience Host</div>
                      <div className="text-sm text-gray-600">
                        Offer unique experiences and activities to travelers
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.providerType === 'GUIDE' 
                    ? 'bg-primary-50 border-primary-500 shadow-soft' 
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="providerType"
                      value="GUIDE"
                      checked={formData.providerType === 'GUIDE'}
                      onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'GUIDE' })}
                      className="mt-1 w-5 h-5 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-2 text-lg">Tour Guide</div>
                      <div className="text-sm text-gray-600">
                        Provide guided tours and travel companionship
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.providerType === 'ACCOMMODATION_PROVIDER' 
                    ? 'bg-primary-50 border-primary-500 shadow-soft' 
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="providerType"
                      value="ACCOMMODATION_PROVIDER"
                      checked={formData.providerType === 'ACCOMMODATION_PROVIDER'}
                      onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'ACCOMMODATION_PROVIDER' })}
                      className="mt-1 w-5 h-5 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-2 text-lg">Hotel Owner</div>
                      <div className="text-sm text-gray-600">
                        List and manage your hotel properties
                      </div>
                    </div>
                  </div>
                </label>
                
                <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                  formData.providerType === 'DRIVER_PARTNER' 
                    ? 'bg-primary-50 border-primary-500 shadow-soft' 
                    : 'bg-white border-gray-200 hover:border-primary-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      name="providerType"
                      value="DRIVER_PARTNER"
                      checked={formData.providerType === 'DRIVER_PARTNER'}
                      onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'DRIVER_PARTNER' })}
                      className="mt-1 w-5 h-5 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-2 text-lg">Driver Partner</div>
                      <div className="text-sm text-gray-600">
                        Provide chauffeur and transportation services
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Creating account...
                </span>
              ) : (
                `Create ${formData.providerType === 'EXPERIENCE_HOST' ? 'Host' : formData.providerType === 'GUIDE' ? 'Guide' : formData.providerType === 'ACCOMMODATION_PROVIDER' ? 'Hotel Owner' : 'Driver'} Account`
              )}
            </button>
          </form>

          <div className="divider">
            <span className="text-gray-500 text-sm">OR</span>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google/host`}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-soft mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </a>

          <div className="divider"></div>
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-600">
              Already have a host account?{' '}
              <Link href="/host/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in here
              </Link>
            </p>
            <p className="text-center text-sm text-gray-600">
              Looking to book trips?{' '}
              <Link href="/signup" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign up as a traveler
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

