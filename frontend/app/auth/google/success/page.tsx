'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { getProviderDashboard } from '@/lib/providerUtils';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const providerType = searchParams.get('providerType');

    if (token) {
      // Store token and user info
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        if (type === 'user') {
          // Fetch user details to get ID
          api.get('/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setStatus('success');
            setLoading(false);
            setTimeout(() => {
              router.push('/explore');
            }, 2000);
          }).catch(err => {
            // Store basic info if API call fails
            localStorage.setItem('user', JSON.stringify({ email, name }));
            setStatus('success');
            setLoading(false);
            setTimeout(() => {
              router.push('/explore');
            }, 2000);
          });
        } else if (type === 'host') {
          // Store host data with providerType from URL if available
          const hostData = { 
            email, 
            name,
            providerType: providerType || undefined
          };
          localStorage.setItem('host', JSON.stringify(hostData));
          localStorage.setItem('userType', 'host');
          
          // Try to fetch full host data
          api.get('/hosts/me', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(response => {
            if (response.data?.host) {
              localStorage.setItem('host', JSON.stringify(response.data.host));
            }
            setStatus('success');
            setLoading(false);
            setTimeout(() => {
              const storedHost = localStorage.getItem('host');
              if (storedHost) {
                const parsed = JSON.parse(storedHost);
                if (parsed.providerType) {
                  const dashboardRoute = getProviderDashboard(parsed.providerType);
                  router.push(dashboardRoute);
                } else {
                  router.push('/host/dashboard');
                }
              } else {
                router.push('/host/dashboard');
              }
            }, 2000);
          }).catch(() => {
            // Fallback: use stored data
            setStatus('success');
            setLoading(false);
            setTimeout(() => {
              const storedHost = localStorage.getItem('host');
              if (storedHost) {
                const parsed = JSON.parse(storedHost);
                if (parsed.providerType) {
                  const dashboardRoute = getProviderDashboard(parsed.providerType);
                  router.push(dashboardRoute);
                } else {
                  router.push('/host/dashboard');
                }
              } else {
                router.push('/host/dashboard');
              }
            }, 2000);
          });
        }
      }
    } else {
      setError('Authentication failed. Please try again.');
      setStatus('error');
      setLoading(false);
    }
  }, [router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 relative overflow-hidden">
        {/* Animated Background */}
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

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full relative z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center mb-6"
          >
            <Loader2 className="w-16 h-16 text-heritage-gold" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Authenticating...
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600"
          >
            Please wait while we sign you in
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 relative overflow-hidden">
        {/* Animated Background */}
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
            className="absolute top-20 right-10 w-96 h-96 bg-red-100/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"
          >
            <XCircle className="w-12 h-12 text-red-500" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Authentication Failed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 mb-6"
          >
            {error || 'Something went wrong during authentication'}
          </motion.p>
          <motion.a
            href="/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Go to Login
          </motion.a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 relative overflow-hidden">
      {/* Animated Background */}
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
          className="absolute bottom-20 left-10 w-96 h-96 bg-green-100/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Authentication Successful!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          Redirecting you now...
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-heritage-gold"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">Welcome to Triberoutes!</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
