'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getProviderDashboard } from '@/lib/providerUtils';
import api from '@/lib/api';
import PhoneInput from '@/components/PhoneInput';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';

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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password || !formData.providerType) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    if (formData.phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // PhoneInput component already formats with country code
      const response = await api.post('/auth/host/signup', {
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber,
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

      // Redirect based on provider type
      if (host.providerType === 'DRIVER_PARTNER') {
        router.push('/driver/signup');
      } else {
        const dashboardRoute = getProviderDashboard(host.providerType || 'EXPERIENCE_HOST');
        router.push(dashboardRoute);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getProviderTypeLabel = (type: string): string => {
    switch (type) {
      case 'EXPERIENCE_HOST': return 'Host';
      case 'GUIDE': return 'Guide';
      case 'ACCOMMODATION_PROVIDER': return 'Hotel Owner';
      case 'DRIVER_PARTNER': return 'Driver';
      default: return 'Account';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
              <Image 
                src={LOGO_PATH} 
                alt={LOGO_ALT_TEXT} 
                width={48} 
                height={48}
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Become a Service Provider
            </h1>
            <p className="text-blue-100 text-base">
              Join our platform and start offering your services
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm font-medium flex-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <PhoneInput
                    value={formData.phoneNumber}
                    onChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
                    placeholder="Enter phone number"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Minimum 6 characters
                  </p>
                </div>
              </div>

              {/* Provider Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  What type of service provider are you? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.providerType === 'EXPERIENCE_HOST' 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="providerType"
                        value="EXPERIENCE_HOST"
                        checked={formData.providerType === 'EXPERIENCE_HOST'}
                        onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'EXPERIENCE_HOST' })}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-2 text-lg">Experience Host</div>
                        <div className="text-sm text-slate-600">
                          Offer unique experiences and activities to travelers
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.providerType === 'GUIDE' 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="providerType"
                        value="GUIDE"
                        checked={formData.providerType === 'GUIDE'}
                        onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'GUIDE' })}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-2 text-lg">Tour Guide</div>
                        <div className="text-sm text-slate-600">
                          Provide guided tours and travel companionship
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.providerType === 'ACCOMMODATION_PROVIDER' 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="providerType"
                        value="ACCOMMODATION_PROVIDER"
                        checked={formData.providerType === 'ACCOMMODATION_PROVIDER'}
                        onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'ACCOMMODATION_PROVIDER' })}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-2 text-lg">Hotel Owner</div>
                        <div className="text-sm text-slate-600">
                          List and manage your hotel properties
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`block p-6 rounded-xl cursor-pointer transition-all border-2 ${
                    formData.providerType === 'DRIVER_PARTNER' 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <div className="flex items-start gap-4">
                      <input
                        type="radio"
                        name="providerType"
                        value="DRIVER_PARTNER"
                        checked={formData.providerType === 'DRIVER_PARTNER'}
                        onChange={(e) => setFormData({ ...formData, providerType: e.target.value as 'DRIVER_PARTNER' })}
                        className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 mb-2 text-lg">Driver Partner</div>
                        <div className="text-sm text-slate-600">
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
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {getProviderTypeLabel(formData.providerType)} Account</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-4 text-sm text-slate-500 font-medium">OR</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            {/* Google Sign In */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google/host`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow-md mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </a>

            {/* Footer Links */}
            <div className="mt-8 space-y-3 text-center pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Already have a host account?{' '}
                <Link href="/host/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in here
                </Link>
              </p>
              <p className="text-sm text-slate-500">
                Looking to book trips?{' '}
                <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Sign up as a traveler
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
