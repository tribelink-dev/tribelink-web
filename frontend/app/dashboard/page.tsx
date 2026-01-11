'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

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

export default function TravelerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    travelStyle: '',
    pace: '',
    transport: ''
  });
  const [trips, setTrips] = useState<Trip[]>([]);
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      // Clean up error message to prevent concatenation issues
      setError(errorMessage);
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-heritage-gold border-t-transparent mb-6"></div>
          <div className="text-xl font-semibold text-charcoal-900 mb-2">Loading your dashboard...</div>
          <p className="text-sm text-charcoal-500">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl"></div>
        
        <div className="section-container-luxury relative z-10 pt-24 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
                  <div className="w-2 h-2 bg-heritage-gold rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white/90">Your Travel Dashboard</span>
                </div>
                <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-white mb-4 animate-fade-in-up">
                  Welcome back, <span className="text-heritage-gold">{user?.name?.split(' ')[0]}</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/80 font-light mb-8 leading-relaxed">
                  Your journey to authentic experiences starts here
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <Link
                  href="/dashboard/tickets"
                  aria-label="Open my tickets"
                  className="group relative inline-flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-white font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-luxury"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>My Tickets</span>
                </Link>
                <Link 
                  href="/trips/select" 
                  className="group px-6 py-3 bg-heritage-gold hover:bg-heritage-gold-dark text-charcoal-900 font-semibold rounded-xl transition-all duration-300 shadow-luxury hover:shadow-luxury-lg hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Plan New Trip</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="section-container-luxury -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Alerts */}
          <div className="mb-8">

            {error && (
              <div className="mb-6 animate-fade-in bg-red-50/80 border-2 border-red-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800 mb-1">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button 
                  onClick={() => setError('')} 
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  aria-label="Close error"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 animate-fade-in bg-green-50/80 border-2 border-green-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 mb-1">Success</p>
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
                <button 
                  onClick={() => setSuccess('')} 
                  className="text-green-500 hover:text-green-700 transition-colors p-1"
                  aria-label="Close success"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Wallet Card */}
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-charcoal-100 shadow-luxury p-8 transform transition-all duration-300 hover:shadow-luxury-lg hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-heritage-gold/10 to-heritage-gold/5 rounded-xl flex items-center justify-center border border-heritage-gold/20">
                  <svg className="w-8 h-8 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Wallet</span>
              </div>
              <div className="mb-6">
                <p className="text-sm text-charcoal-600 mb-2 font-medium">Current Balance</p>
                <p className="text-4xl font-bold text-charcoal-900">
                  {walletCurrency} {walletBalance.toFixed(2)}
                </p>
              </div>
              <Link 
                href="/dashboard/wallet" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-700 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:bg-heritage-gold/10 group-hover:text-heritage-gold-dark"
              >
                Top Up
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Trips Card */}
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-charcoal-100 shadow-luxury p-8 transform transition-all duration-300 hover:shadow-luxury-lg hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-ocean-500/10 to-ocean-600/5 rounded-xl flex items-center justify-center border border-ocean-500/20">
                  <svg className="w-8 h-8 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Trips</span>
              </div>
              <div className="mb-6">
                <p className="text-sm text-charcoal-600 mb-2 font-medium">Active Trips</p>
                <p className="text-4xl font-bold text-charcoal-900">{trips.length}</p>
                {trips.length > 0 && (
                  <p className="text-sm text-charcoal-500 mt-2">
                    {trips.filter(t => t.paymentStatus === 'Completed').length} completed
                  </p>
                )}
              </div>
              <Link 
                href="#trips" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-700 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:bg-ocean-50 group-hover:text-ocean-700"
              >
                View All
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Preferences Card */}
            <div className={`group relative overflow-hidden bg-white rounded-2xl border border-charcoal-100 shadow-luxury p-8 transition-all duration-300 ${showKYTForm ? '' : 'transform hover:shadow-luxury-lg hover:-translate-y-1 cursor-pointer'}`}
              onClick={() => !showKYTForm && setShowKYTForm(true)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Settings</span>
              </div>
              <div className="mb-6">
                <p className="text-sm text-charcoal-600 mb-2 font-medium">Preferences</p>
                {preferences.travelStyle && preferences.pace && preferences.transport ? (
                  <div className="space-y-3">
                    <p className="text-3xl font-bold text-charcoal-900">Set ✓</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-charcoal-50 px-3 py-1.5 rounded-lg border border-charcoal-100">
                        <span className="text-sm font-semibold text-charcoal-700 capitalize">{preferences.pace}</span>
                      </div>
                      <div className="bg-charcoal-50 px-3 py-1.5 rounded-lg border border-charcoal-100">
                        <span className="text-sm font-semibold text-charcoal-700">{preferences.transport === 'native' ? 'Native' : 'Luxury'}</span>
                      </div>
                      <div className="bg-charcoal-50 px-3 py-1.5 rounded-lg border border-charcoal-100">
                        <span className="text-sm font-semibold text-charcoal-700 capitalize">{preferences.travelStyle === 'flexible' ? 'Flexible' : 'Fixed'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-charcoal-400">Not Set</p>
                )}
              </div>
              {!showKYTForm && (
                <div className="inline-flex items-center gap-2 px-5 py-3 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-700 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                  {preferences.travelStyle && preferences.pace && preferences.transport ? 'Edit Preferences' : 'Set Preferences'}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          </div>


        {/* Preferences Form - Expands below when opened */}
        {showKYTForm && (
          <div className="content-card mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-tertiary text-gray-900 mb-1">Travel Preferences</h2>
                <p className="text-sm text-gray-600">Customize your travel experience to get personalized recommendations</p>
              </div>
              <button
                onClick={() => setShowKYTForm(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              {/* Travel Pace */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Travel Pace</label>
                <p className="text-sm text-gray-500 mb-4">How quickly do you want to move between destinations?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { 
                      value: 'fast', 
                      label: 'Fast Pace', 
                      desc: 'Visit more places in less time',
                      icon: '⚡'
                    },
                    { 
                      value: 'slow', 
                      label: 'Slow Pace', 
                      desc: 'Spend more time at fewer places',
                      icon: '🌿'
                    }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-lg cursor-pointer border transition-all ${
                        preferences.pace === option.value 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pace"
                        value={option.value}
                        checked={preferences.pace === option.value}
                        onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                        className="mt-0.5 mr-3 w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.icon}</span>
                          <span className="font-semibold text-gray-900">{option.label}</span>
                        </div>
                        <span className="text-sm text-gray-600">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transport Preference */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Transport Preference</label>
                <p className="text-sm text-gray-500 mb-4">How do you prefer to travel between places?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { 
                      value: 'native', 
                      label: 'Native Experience', 
                      desc: 'Use local/regional transport',
                      icon: '🚌'
                    },
                    { 
                      value: 'luxury', 
                      label: 'Luxury Tourist', 
                      desc: 'Comfortable cab bookings',
                      icon: '🚗'
                    }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-lg cursor-pointer border transition-all ${
                        preferences.transport === option.value 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="transport"
                        value={option.value}
                        checked={preferences.transport === option.value}
                        onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                        className="mt-0.5 mr-3 w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.icon}</span>
                          <span className="font-semibold text-gray-900">{option.label}</span>
                        </div>
                        <span className="text-sm text-gray-600">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">Travel Style</label>
                <p className="text-sm text-gray-500 mb-4">Choose how you want to book your accommodation</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { 
                      value: 'flexible', 
                      label: 'Flexible', 
                      desc: 'Choose hotels from recommendations',
                      icon: '🔄'
                    },
                    { 
                      value: 'fixed', 
                      label: 'Fixed Package', 
                      desc: 'Pre-booked hotels in package',
                      icon: '📦'
                    }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-lg cursor-pointer border transition-all ${
                        preferences.travelStyle === option.value 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="travelStyle"
                        value={option.value}
                        checked={preferences.travelStyle === option.value}
                        onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                        className="mt-0.5 mr-3 w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{option.icon}</span>
                          <span className="font-semibold text-gray-900">{option.label}</span>
                        </div>
                        <span className="text-sm text-gray-600">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowKYTForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreferences || !preferences.travelStyle || !preferences.pace || !preferences.transport}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingPreferences ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Preferences
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

          {/* Premium Trips Section */}
          <div id="trips" className="bg-white rounded-2xl border border-charcoal-100 shadow-luxury p-8 md:p-10">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-charcoal-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-charcoal-900 mb-1">My Trips</h2>
                  {trips.length > 0 && (
                    <p className="text-sm text-charcoal-500">{trips.length} {trips.length === 1 ? 'trip' : 'trips'} total</p>
                  )}
                </div>
              </div>
              {trips.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-300 hover:shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All
                </button>
              )}
            </div>
            
            {trips.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-charcoal-50 rounded-full mb-6 border border-charcoal-100">
                  <svg className="w-12 h-12 text-charcoal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-charcoal-900 mb-3">No trips yet</h3>
                <p className="text-charcoal-600 mb-8 max-w-md mx-auto text-lg">Start planning your next adventure and create unforgettable memories!</p>
                <Link href="/trips/select" className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal-700 hover:bg-charcoal-800 text-white font-semibold rounded-xl shadow-luxury hover:shadow-luxury-lg transition-all duration-300 transform hover:scale-105">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Plan Your First Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trips.map((trip) => (
                  <div
                    key={trip._id}
                    className="group relative bg-white rounded-xl border-2 border-charcoal-100 hover:border-charcoal-200 p-6 shadow-sm hover:shadow-luxury transition-all duration-300"
                  >
                    <Link 
                      href={`/trips/schedule?tripId=${trip._id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-heritage-gold/10 to-heritage-gold/5 rounded-xl flex items-center justify-center border border-heritage-gold/20 flex-shrink-0">
                          <svg className="w-7 h-7 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-charcoal-900 mb-2 group-hover:text-heritage-gold-dark transition-colors truncate">
                            {trip.district}, {trip.state}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-charcoal-600">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(trip.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {trip.totalPrice.toFixed(2)} {walletCurrency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between pt-4 border-t border-charcoal-100">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          trip.paymentStatus === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          trip.paymentStatus === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {trip.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/trips/schedule?tripId=${trip._id}`}
                          className="text-charcoal-700 hover:text-heritage-gold-dark font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                          View Details
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                        <button
                          onClick={(e) => handleDeleteTrip(trip._id, e)}
                          disabled={deletingTripId === trip._id}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete trip"
                        >
                          {deletingTripId === trip._id ? (
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete All Trips Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slide-up">
              <div className="p-6">
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  Delete All Trips?
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete all <span className="font-semibold text-gray-900">{trips.length}</span> {trips.length === 1 ? 'trip' : 'trips'}? This action cannot be undone and will permanently remove all your trip data.
                </p>

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-red-800 mb-1">This action is permanent</p>
                      <p className="text-sm text-red-700">All trip schedules, bookings, and related data will be permanently deleted.</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteAllModal(false)}
                    disabled={deletingAllTrips}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllTrips}
                    disabled={deletingAllTrips}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deletingAllTrips ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
