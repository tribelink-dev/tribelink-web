'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function KYTPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    travelStyle: '',
    pace: '',
    transport: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkingPreferences, setCheckingPreferences] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      fetchUserPreferences();
    }
  }, [user, authLoading, router]);

  const fetchUserPreferences = async () => {
    try {
      setCheckingPreferences(true);
      const response = await api.get('/user/me');
      if (response.data.user?.preferences?.travelStyle) {
        // User already has preferences, redirect to dashboard
        router.push('/dashboard');
        return;
      }
      // Load existing preferences if any (for editing)
      if (response.data.user?.preferences) {
        setPreferences({
          travelStyle: response.data.user.preferences.travelStyle || '',
          pace: response.data.user.preferences.pace || '',
          transport: response.data.user.preferences.transport || ''
        });
      }
    } catch (error) {
      // User might not have preferences yet, continue showing the form
      console.error('Error fetching preferences:', error);
    } finally {
      setCheckingPreferences(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!preferences.travelStyle || !preferences.pace || !preferences.transport) {
      setError('Please answer all questions');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/user/kyt', {
        preferences
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingPreferences) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-4xl">
        <div className="content-card">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6 shadow-medium">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="heading-primary text-gray-900">
              Know Your Traveller
            </h1>
            <p className="text-subtitle text-gray-600 mb-0">
              Help us create the perfect journey tailored just for you
            </p>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Travel Style */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                  <span className="text-2xl">🏨</span>
                </div>
                <h2 className="heading-tertiary text-gray-800 mb-0">
                  What's your travel style?
                </h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.travelStyle === 'flexible' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="travelStyle"
                    value="flexible"
                    checked={preferences.travelStyle === 'flexible'}
                    onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Flexible</div>
                    <div className={`text-sm ${preferences.travelStyle === 'flexible' ? 'text-white/90' : 'text-gray-600'}`}>
                      I want hotel recommendations to choose from and book through the platform
                    </div>
                  </div>
                </label>
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.travelStyle === 'fixed' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="travelStyle"
                    value="fixed"
                    checked={preferences.travelStyle === 'fixed'}
                    onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Fixed Package</div>
                    <div className={`text-sm ${preferences.travelStyle === 'fixed' ? 'text-white/90' : 'text-gray-600'}`}>
                      I prefer pre-booked hotels in a package/schedule
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Pace */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="heading-tertiary text-gray-800 mb-0">
                  What's your travel pace?
                </h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.pace === 'fast' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="pace"
                    value="fast"
                    checked={preferences.pace === 'fast'}
                    onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Fast Paced</div>
                    <div className={`text-sm ${preferences.pace === 'fast' ? 'text-white/90' : 'text-gray-600'}`}>
                      I want to visit more places in less time
                    </div>
                  </div>
                </label>
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.pace === 'slow' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="pace"
                    value="slow"
                    checked={preferences.pace === 'slow'}
                    onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Slow Paced</div>
                    <div className={`text-sm ${preferences.pace === 'slow' ? 'text-white/90' : 'text-gray-600'}`}>
                      I prefer spending more time at fewer places
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Transport */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                  <span className="text-2xl">🚗</span>
                </div>
                <h2 className="heading-tertiary text-gray-800 mb-0">
                  How do you prefer to travel?
                </h2>
              </div>
              <div className="space-y-3">
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.transport === 'native' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="transport"
                    value="native"
                    checked={preferences.transport === 'native'}
                    onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Native Experience</div>
                    <div className={`text-sm ${preferences.transport === 'native' ? 'text-white/90' : 'text-gray-600'}`}>
                      I want to experience local culture using regional or public transport options
                    </div>
                  </div>
                </label>
                <label className={`flex items-start p-5 rounded-xl cursor-pointer transition-all card-hover ${
                  preferences.transport === 'luxury' 
                    ? 'bg-primary-500 text-white shadow-medium border-2 border-primary-600' 
                    : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                }`}>
                  <input
                    type="radio"
                    name="transport"
                    value="luxury"
                    checked={preferences.transport === 'luxury'}
                    onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                    className="mt-1 mr-4 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1.5">Luxury Tourist</div>
                    <div className={`text-sm ${preferences.transport === 'luxury' ? 'text-white/90' : 'text-gray-600'}`}>
                      I prefer comfortable cab bookings for transfers
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving your preferences...
                </span>
              ) : (
                'Continue to Plan My Trip'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

