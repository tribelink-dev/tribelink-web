'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getProviderDashboard } from '@/lib/providerUtils';

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

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
            setLoading(false);
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }).catch(err => {
            // Store basic info if API call fails
            localStorage.setItem('user', JSON.stringify({ email, name }));
            setLoading(false);
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          });
        } else if (type === 'host') {
          // Fetch provider data to get providerType
          api.get('/hosts/experiences', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(() => {
            // If we have a valid token, fetch full provider data
            // For now, store basic info and redirect - providerType will be in localStorage from login response
            const hostData = { email, name };
            localStorage.setItem('host', JSON.stringify(hostData));
            localStorage.setItem('userType', 'host');
            setLoading(false);
            setTimeout(() => {
              // Check if providerType is available, otherwise redirect to default
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
            }, 1500);
          }).catch(() => {
            // Fallback: store basic info and redirect to default dashboard
            localStorage.setItem('host', JSON.stringify({ email, name }));
            localStorage.setItem('userType', 'host');
            setLoading(false);
            setTimeout(() => {
              router.push('/host/dashboard');
            }, 1500);
          });
        }
      }
    } else {
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="content-card max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <h2 className="heading-secondary mb-2">Authenticating...</h2>
          <p className="text-gray-600">Please wait while we sign you in</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="content-card max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="heading-secondary mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/login" className="btn-primary">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
      <div className="content-card max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="heading-secondary mb-2">Authentication Successful!</h2>
        <p className="text-gray-600">Redirecting you now...</p>
      </div>
    </div>
  );
}
