'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getProviderDashboard } from '@/lib/providerUtils';
import api from '@/lib/api';
import BrandLogo from '@/components/BrandLogo';
import PhoneInput from '@/components/PhoneInput';
import { Phone, Mail, User, Home, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GoogleAuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = searchParams.get('email') || '';
  const name = searchParams.get('name') || '';
  const googleId = searchParams.get('googleId') || '';
  const type = searchParams.get('type') || 'user';
  const profilePicture = searchParams.get('profilePicture') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    // PhoneInput component already formats with country code
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/google/complete', {
        email,
        name,
        googleId,
        phoneNumber: phoneNumber.trim(), // PhoneInput already formats it
        type,
        // providerType is optional - backend will default to EXPERIENCE_HOST
        profilePicture: profilePicture || undefined
      });

      const { token, user, host } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      // Store authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        if (type === 'user' && user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else if (type === 'host' && host) {
          localStorage.setItem('host', JSON.stringify(host));
          localStorage.setItem('userType', 'host');
        }
      }

      // Redirect based on provider type
      if (type === 'user') {
        router.push('/explore');
      } else if (host) {
        const dashboardRoute = getProviderDashboard(host.providerType || 'EXPERIENCE_HOST');
        router.push(dashboardRoute);
      } else {
        router.push('/host/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
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

      <div className="w-full max-w-2xl relative z-10">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex mb-4"
            >
              <BrandLogo size={64} priority />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Complete Your Registration
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg"
            >
              Just one more step to get started
            </motion.p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm flex-1">{error}</p>
              </motion.div>
            )}

            {/* Google Account Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-heritage-gold" />
                </div>
                <h3 className="font-semibold text-gray-900">Google Account</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900 flex-1">{email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="font-semibold text-gray-900 flex-1">{name}</span>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-heritage-gold" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 ml-1">We'll use this to verify your account</p>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Completing registration...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete Registration</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

