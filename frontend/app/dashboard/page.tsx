'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface Trip {
  _id: string;
  fromDate: string;
  toDate: string;
  country: string;
  state: string;
  district: string;
  totalPrice: number;
  paymentStatus: string;
}

interface Preferences {
  travelStyle: string;
  pace: string;
  transport: string;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  location?: {
    state: string;
    district: string;
  };
  provider?: {
    name: string;
    rating: number;
  };
  averageRating?: number;
}

type TabType = 'overview' | 'abodes' | 'experiences' | 'trips';

export default function TravelerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [preferences, setPreferences] = useState<Preferences>({
    travelStyle: '',
    pace: '',
    transport: ''
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [favoriteExperiences, setFavoriteExperiences] = useState<Experience[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showKYTForm, setShowKYTForm] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAllTrips, setDeletingAllTrips] = useState(false);
  const [removingFavoriteId, setRemovingFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/me');
      const userData = response.data.user;
      
      if (userData.preferences) {
        setPreferences({
          travelStyle: userData.preferences.travelStyle || '',
          pace: userData.preferences.pace || '',
          transport: userData.preferences.transport || ''
        });
      }
      
      setTrips(userData.bookings || []);
      setWalletBalance(userData.tripWallet?.balance || 0);
      setWalletCurrency(userData.tripWallet?.currency || 'USD');
      
      await fetchFavoriteExperiences();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteExperiences = async () => {
    try {
      const response = await api.get('/user/bucketlist?populate=true');
      setFavoriteExperiences(response.data.bucketlist || []);
    } catch (err: any) {
      console.error('Error fetching favorite experiences:', err);
    }
  };

  const handleRemoveFavorite = async (experienceId: string) => {
    try {
      setRemovingFavoriteId(experienceId);
      await api.delete(`/user/bucketlist/${experienceId}`);
      setFavoriteExperiences(favoriteExperiences.filter(exp => exp._id !== experienceId));
      setSuccess('Removed from favorites');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove from favorites');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRemovingFavoriteId(null);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingPreferences(true);

    try {
      await api.post('/user/kyt', { preferences });
      setSuccess('Preferences updated successfully!');
      setShowKYTForm(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingTripId(tripId);
      await api.delete(`/trips/${tripId}`);
      setTrips(trips.filter(t => t._id !== tripId));
      setSuccess('Trip deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete trip');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleDeleteAllTrips = async () => {
    try {
      setDeletingAllTrips(true);
      const response = await api.delete('/trips/all');
      setTrips([]);
      setSuccess(response.data.message || 'All trips deleted successfully');
      setTimeout(() => setSuccess(''), 4000);
      setShowDeleteAllModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete all trips');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDeletingAllTrips(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-off-white to-cream-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block w-16 h-16 border-4 border-heritage-gold border-t-transparent rounded-full animate-spin mb-6"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium text-charcoal-700"
          >
            Loading your dashboard...
          </motion.p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'abodes' as TabType, label: 'Abodes', icon: '🏠' },
    { id: 'experiences' as TabType, label: 'Experiences', icon: '🎭' },
    { id: 'trips' as TabType, label: 'My Trips', icon: '✈️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-off-white to-cream-100">
      {/* Simplified Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-charcoal-100/50 sticky top-0 z-40">
        <div className="section-container-luxury">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-charcoal-900">
                  Welcome back, <span className="text-heritage-gold">{user?.name?.split(' ')[0]}</span>
                </h1>
              <p className="text-sm text-charcoal-500 mt-1">Your travel dashboard</p>
              </div>
            <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/profile"
                  className="px-4 py-2 text-sm font-medium text-charcoal-700 hover:text-heritage-gold transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/dashboard/tickets"
                className="px-4 py-2 text-sm font-medium text-charcoal-700 hover:text-heritage-gold transition-colors"
                >
                Tickets
                </Link>
                <Link 
                  href="/trips/select" 
                className="px-5 py-2.5 bg-heritage-gold hover:bg-heritage-gold-dark text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                Plan Trip
                </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container-luxury py-8">
        {/* Toast Notifications */}
        <AnimatePresence>
            {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </motion.div>
            )}
            {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </motion.div>
            )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-charcoal-100/50 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-heritage-gold text-white shadow-md'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-charcoal-100/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-heritage-gold/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                    <Link href="/dashboard/wallet" className="text-xs text-charcoal-500 hover:text-heritage-gold">
                      Top Up →
                    </Link>
              </div>
                  <p className="text-xs text-charcoal-500 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-charcoal-900">
                  {walletCurrency} {walletBalance.toFixed(2)}
                </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-charcoal-100/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-ocean-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
                    <button onClick={() => setActiveTab('trips')} className="text-xs text-charcoal-500 hover:text-ocean-600">
                      View All →
                    </button>
                </div>
                  <p className="text-xs text-charcoal-500 mb-1">Active Trips</p>
                  <p className="text-2xl font-bold text-charcoal-900">{trips.length}</p>
                {trips.length > 0 && (
                    <p className="text-xs text-charcoal-400 mt-1">
                    {trips.filter(t => t.paymentStatus === 'Completed').length} completed
                  </p>
                )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-charcoal-100/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setShowKYTForm(!showKYTForm)}
            >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                    <span className="text-xs text-charcoal-500">Settings</span>
              </div>
                  <p className="text-xs text-charcoal-500 mb-1">Preferences</p>
                {preferences.travelStyle && preferences.pace && preferences.transport ? (
                    <p className="text-lg font-bold text-charcoal-900">Configured ✓</p>
                  ) : (
                    <p className="text-lg font-bold text-charcoal-400">Not Set</p>
                  )}
                </motion.div>
                      </div>

              {/* Two Main Booking Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => router.push('/abodes')}
                  className="group relative overflow-hidden bg-gradient-to-br from-heritage-gold/5 via-cream-500/30 to-heritage-gold-light/5 rounded-2xl border border-heritage-gold/20 p-8 cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-heritage-gold/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-heritage-gold/20 rounded-xl flex items-center justify-center border border-heritage-gold/30">
                        <span className="text-3xl">🏠</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-charcoal-900">Experience Abodes</h3>
                        <p className="text-sm text-charcoal-600">Stay with local families</p>
                      </div>
                    </div>
                    <p className="text-charcoal-700 mb-6 text-sm leading-relaxed">
                      Immerse yourself in authentic cultural experiences by staying with local families.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-charcoal-700">
                          Cultural Immersion
                        </span>
                        <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-charcoal-700">
                          Local Guides
                        </span>
                  </div>
                      <div className="flex items-center gap-2 text-heritage-gold-dark font-semibold group-hover:translate-x-1 transition-transform">
                        <span className="text-sm">Explore</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
              </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => router.push('/trips/experiences')}
                  className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl border border-indigo-500/20 p-8 cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                        <span className="text-3xl">🎭</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-charcoal-900">Book Experiences</h3>
                        <p className="text-sm text-charcoal-600">Artisans, Performers & Events</p>
                      </div>
                    </div>
                    <p className="text-charcoal-700 mb-6 text-sm leading-relaxed">
                      Discover unique experiences from local artisans and performers.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-charcoal-700">
                          Workshops
                        </span>
                        <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium text-charcoal-700">
                          Events
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-700 font-semibold group-hover:translate-x-1 transition-transform">
                        <span className="text-sm">Explore</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
            </div>
                  </div>
                </motion.div>
          </div>

              {/* Preferences Form */}
        {showKYTForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-charcoal-100/50 mb-8"
                >
            <div className="flex items-center justify-between mb-6">
              <div>
                      <h3 className="text-lg font-semibold text-charcoal-900 mb-1">Travel Preferences</h3>
                      <p className="text-sm text-charcoal-500">Customize your travel experience</p>
              </div>
              <button
                onClick={() => setShowKYTForm(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-charcoal-100 transition-colors"
              >
                      <svg className="w-5 h-5 text-charcoal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-2">Travel Pace</label>
                        <select
                          value={preferences.pace}
                        onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                          className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                        >
                          <option value="">Select pace</option>
                          <option value="fast">Fast Pace</option>
                          <option value="slow">Slow Pace</option>
                        </select>
                        </div>
              <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-2">Transport</label>
                        <select
                          value={preferences.transport}
                        onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                          className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                        >
                          <option value="">Select transport</option>
                          <option value="native">Native Experience</option>
                          <option value="luxury">Luxury Tourist</option>
                        </select>
                        </div>
              <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-2">Travel Style</label>
                        <select
                          value={preferences.travelStyle}
                        onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                          className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                        >
                          <option value="">Select style</option>
                          <option value="flexible">Flexible</option>
                          <option value="fixed">Fixed Package</option>
                        </select>
                        </div>
                      </div>
                    <div className="flex gap-3 pt-4 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setShowKYTForm(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-charcoal-700 bg-charcoal-50 hover:bg-charcoal-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreferences || !preferences.travelStyle || !preferences.pace || !preferences.transport}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-heritage-gold hover:bg-heritage-gold-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingPreferences ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
                </motion.div>
              )}
            </motion.div>
        )}

          {activeTab === 'abodes' && (
            <motion.div
              key="abodes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-charcoal-100/50">
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏠</div>
                  <h3 className="text-2xl font-semibold text-charcoal-900 mb-3">Explore Abodes</h3>
                  <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
                    Discover authentic cultural experiences by staying with local families
                  </p>
                  <button
                    onClick={() => router.push('/abodes')}
                    className="px-8 py-3 bg-heritage-gold hover:bg-heritage-gold-dark text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Browse Abodes
                  </button>
                </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-charcoal-100/50">
            {favoriteExperiences.length === 0 ? (
              <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎭</div>
                    <h3 className="text-2xl font-semibold text-charcoal-900 mb-3">No favorites yet</h3>
                    <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
                      Start exploring experiences and save your favorites for later!
                    </p>
                    <button
                      onClick={() => router.push('/trips/experiences')}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                  Explore Experiences
                    </button>
              </div>
            ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-charcoal-900">
                        Favorite Experiences ({favoriteExperiences.length})
                      </h3>
                      <button
                        onClick={() => router.push('/trips/experiences')}
                        className="text-sm text-heritage-gold hover:text-heritage-gold-dark font-medium"
                      >
                        Browse More →
                      </button>
                    </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteExperiences.map((experience, index) => (
                        <motion.div
                    key={experience._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group bg-white rounded-xl border border-charcoal-100 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {experience.imageUrl && (
                            <div className="relative h-40 overflow-hidden bg-charcoal-100">
                        <img
                                src={getImageUrl(experience.imageUrl) || ''}
                          alt={experience.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <button
                          onClick={() => handleRemoveFavorite(experience._id)}
                          disabled={removingFavoriteId === experience._id}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-sm"
                        >
                                <svg className="w-4 h-4 text-heritage-gold" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                      </div>
                    )}
                          <div className="p-4">
                            <h4 className="font-semibold text-charcoal-900 mb-2 line-clamp-2">{experience.title}</h4>
                            <p className="text-sm text-charcoal-600 mb-3 line-clamp-2">{experience.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-heritage-gold">${experience.price}</span>
                        {experience.provider && (
                                <span className="text-xs text-charcoal-500">{experience.provider.name}</span>
                            )}
                          </div>
                      </div>
                        </motion.div>
                ))}
              </div>
                  </>
            )}
          </div>
            </motion.div>
          )}

          {activeTab === 'trips' && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-charcoal-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-charcoal-900">My Trips</h3>
              {trips.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete All
                </button>
              )}
            </div>
            
            {trips.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">✈️</div>
                <h3 className="text-2xl font-semibold text-charcoal-900 mb-3">No trips yet</h3>
                    <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
                      Start planning your next adventure and create unforgettable memories!
                    </p>
                    <button
                      onClick={() => router.push('/trips/select')}
                      className="px-8 py-3 bg-charcoal-700 hover:bg-charcoal-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                    >
                  Plan Your First Trip
                    </button>
              </div>
            ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {trips.map((trip, index) => (
                      <motion.div
                    key={trip._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white rounded-xl border border-charcoal-100 p-5 hover:shadow-md transition-all"
                  >
                        <Link href={`/trips/schedule?tripId=${trip._id}`} className="block">
                      <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-heritage-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-charcoal-900 mb-1 truncate">
                            {trip.district}, {trip.state}
                              </h4>
                              <div className="flex flex-wrap gap-3 text-xs text-charcoal-500">
                                <span>
                                  {new Date(trip.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                                <span>•</span>
                                <span>{trip.totalPrice.toFixed(2)} {walletCurrency}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between pt-4 border-t border-charcoal-100">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            trip.paymentStatus === 'Completed' ? 'bg-green-50 text-green-700' :
                            trip.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700' :
                            'bg-yellow-50 text-yellow-700'
                        }`}>
                          {trip.paymentStatus}
                        </span>
                          <div className="flex items-center gap-2">
                        <Link
                          href={`/trips/schedule?tripId=${trip._id}`}
                              className="text-sm text-charcoal-600 hover:text-heritage-gold font-medium"
                        >
                              View →
                        </Link>
                        <button
                          onClick={(e) => handleDeleteTrip(trip._id, e)}
                          disabled={deletingTripId === trip._id}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-all disabled:opacity-50"
                        >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                      </div>
                    </div>
                      </motion.div>
                ))}
              </div>
            )}
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              <h3 className="text-xl font-bold text-charcoal-900 mb-2">Delete All Trips?</h3>
              <p className="text-sm text-charcoal-600">
                This will permanently delete all {trips.length} {trips.length === 1 ? 'trip' : 'trips'}. This action cannot be undone.
                </p>
                    </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    disabled={deletingAllTrips}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-charcoal-700 bg-charcoal-50 hover:bg-charcoal-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllTrips}
                    disabled={deletingAllTrips}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                {deletingAllTrips ? 'Deleting...' : 'Delete All'}
                  </button>
                </div>
          </motion.div>
          </div>
        )}
      </div>
  );
}
