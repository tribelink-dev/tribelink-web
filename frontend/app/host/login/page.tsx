'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getProviderDashboard } from '@/lib/providerUtils';
import api from '@/lib/api';
import PhoneInput from '@/components/PhoneInput';
import BrandLogo from '@/components/BrandLogo';
import { Home, Lock, Mail, Phone } from 'lucide-react';

export default function HostLoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (loginMethod === 'email') {
      if (!email || !password) {
        setError('Please fill all fields');
        setLoading(false);
        return;
      }
    } else {
      if (!phoneNumber || !password) {
        setError('Please fill all fields');
        setLoading(false);
        return;
      }
      if (phoneNumber.length < 10) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }
    }

    try {
      const payload: { password: string; email?: string; phoneNumber?: string } = { password };
      
      if (loginMethod === 'email') {
        payload.email = email.trim();
      } else {
        payload.phoneNumber = phoneNumber;
      }

      const response = await api.post('/auth/host/login', payload);
      
      if (!response?.data) {
        throw new Error('Invalid response from server');
      }
      
      const { token, host } = response.data;
      
      if (!token || !host) {
        throw new Error('Invalid login response');
      }
      
      // Store host authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('host', JSON.stringify(host));
        localStorage.setItem('userType', 'host');
      }

      // Redirect to provider-specific dashboard
      const providerType = host.providerType || 'EXPERIENCE_HOST';
      const dashboardRoute = getProviderDashboard(providerType);
      setLoading(false);
      window.location.href = dashboardRoute;
      
    } catch (err: any) {
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network') || err.message?.includes('timeout')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background Elements - Matching Explore Page */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-10 w-96 h-96 bg-heritage-gold/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-10 w-96 h-96 bg-cream-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50"
        >
          {/* Header Section with Heritage Gold Gradient */}
          <div className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50/80 to-heritage-gold-light/5 px-8 py-10 text-center overflow-hidden border-b border-heritage-gold/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.1),transparent_50%)]"></div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block mb-6"
              >
                <BrandLogo size={80} priority />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
              >
                Host Login
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600"
              >
                Sign in to manage your experiences and bookings
              </motion.p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8 bg-white">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm font-medium flex-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Login Method Toggle - Matching Explore Page Style */}
            <div className="mb-6">
              <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('email');
                    setError('');
                  }}
                  className={`relative flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    loginMethod === 'email'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {loginMethod === 'email' && (
                    <motion.div
                      layoutId="loginMethod"
                      className="absolute inset-0 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('phone');
                    setError('');
                  }}
                  className={`relative flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    loginMethod === 'phone'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {loginMethod === 'phone' && (
                    <motion.div
                      layoutId="loginMethod"
                      className="absolute inset-0 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold rounded-xl shadow-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <PhoneInput
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    placeholder="Enter phone number"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-heritage-gold focus:ring-4 focus:ring-heritage-gold/20 outline-none transition-all text-gray-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
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
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold hover:from-heritage-gold-dark hover:to-heritage-gold-dark text-white font-bold text-base rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Google Sign In */}
            <motion.a
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}/api/auth/google/host`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-heritage-gold/50 transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.a>

            {/* Footer Links */}
            <div className="mt-8 space-y-3 text-center">
              <p className="text-sm text-gray-600">
                Don't have a host account?{' '}
                <Link href="/host/signup" className="font-bold text-heritage-gold hover:text-heritage-gold-dark transition-colors">
                  Sign up here
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                Looking to book trips?{' '}
                <Link href="/login" className="font-semibold text-heritage-gold hover:text-heritage-gold-dark transition-colors">
                  Sign in as a traveler
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
