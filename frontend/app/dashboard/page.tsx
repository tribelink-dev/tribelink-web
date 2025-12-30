'use client';

import { useState, useEffect } from 'react';
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Completed': 'bg-green-50 text-green-700 border-green-200',
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Failed': 'bg-red-50 text-red-700 border-red-200',
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading your dashboard...</div>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Welcome back, <span className="text-primary-500">{user?.name?.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-lg text-gray-600">Here's an overview of your travel journey</p>
            </div>
            <div className="flex items-center w-full md:w-auto justify-end gap-3">
              <Link
                href="/dashboard/tickets"
                aria-label="Open my tickets"
                className="relative inline-flex items-center gap-1.5 rounded-2xl border border-transparent bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-300 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-large"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/40 backdrop-blur-sm">
                  <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5.5 7.25a1 1 0 011-1H15a1 1 0 01.7.3l1.5 1.5 1.5-1.5a1 1 0 01.7-.3h.1a1 1 0 011 1v2A1.75 1.75 0 0121 11a1.75 1.75 0 01-1.5 1.75V15a1 1 0 01-1 1H6.5a1 1 0 01-1-1v-2.25A1.75 1.75 0 014 11c0-.86.64-1.58 1.5-1.75V7.25z"
                      fill="url(#softGoldTicketFill)"
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.25 9.75c0-.828.657-1.5 1.468-1.5h.532a1.5 1.5 0 110 3h-.5v1.5c0 .414-.336.75-.75.75h-.75c-.414 0-.75-.336-.75-.75v-3z"
                      fill="white"
                      stroke="white"
                      strokeWidth="0.15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.75 12.5c0 .69.56 1.25 1.25 1.25s1.25-.56 1.25-1.25-.56-1.25-1.25-1.25-1.25.56-1.25 1.25z"
                      fill="white"
                      stroke="white"
                      strokeWidth="0.25"
                    />
                    <defs>
                      <linearGradient id="softGoldTicketFill" x1="5" y1="6.5" x2="20" y2="15.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFE9A3" />
                        <stop offset="1" stopColor="#FCD34D" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <span className="text-[10px] uppercase tracking-wide">My Tickets</span>
              </Link>
              <Link 
                href="/trips/select" 
                className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-medium hover:shadow-large transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Plan New Trip
              </Link>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                {error.toLowerCase().includes('mongodb') || error.toLowerCase().includes('database') ? (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg">
                    <p className="text-xs font-semibold text-red-800 mb-1">Troubleshooting:</p>
                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                      <li>Ensure MongoDB is running: <code className="bg-red-200 px-1 rounded">sudo systemctl start mongod</code></li>
                      <li>Or check your MongoDB Atlas connection settings</li>
                      <li>Verify backend server is running and can connect to the database</li>
                    </ul>
                  </div>
                ) : null}
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label="Close error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6 animate-slide-down bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Success</p>
                <p className="text-green-700 text-sm mt-1">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-500 hover:text-green-700 transition-colors"
                aria-label="Close success"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Wallet Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-primary-500 to-ocean-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-white/80 text-sm font-medium">Wallet</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-primary-100 mb-1 font-medium">Current Balance</p>
                <p className="text-3xl font-bold">
                  {walletCurrency} {walletBalance.toFixed(2)}
                </p>
              </div>
              <Link 
                href="/dashboard/wallet" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                Top Up
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </div>

          {/* Trips Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-jade-500 to-ocean-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="text-white/80 text-sm font-medium">Trips</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-jade-100 mb-1 font-medium">Active Trips</p>
                <p className="text-3xl font-bold">{trips.length}</p>
                {trips.length > 0 && (
                  <p className="text-sm text-jade-100 mt-2">{trips.filter(t => t.paymentStatus === 'Completed').length} completed</p>
                )}
              </div>
              <Link 
                href="#trips" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          </div>

          {/* Preferences Card - Expandable */}
          <div className={`group relative overflow-hidden bg-gradient-to-br from-culture-500 to-indigo-600 rounded-2xl shadow-large transition-all duration-300 ${showKYTForm ? '' : 'transform hover:scale-105 hover:shadow-xl-soft'}`}>
            <div 
              onClick={() => !showKYTForm && setShowKYTForm(true)}
              className={`p-6 text-white transition-all duration-300 ${showKYTForm ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-white/80 text-sm font-medium">Settings</div>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-culture-100 mb-1 font-medium">Preferences</p>
                  {preferences.travelStyle && preferences.pace && preferences.transport ? (
                    <div className="space-y-3">
                      <p className="text-2xl font-bold text-white">Set ✓</p>
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <span className="text-base">{preferences.pace === 'fast' ? '⚡' : '🌿'}</span>
                          <span className="text-sm font-semibold text-white capitalize">{preferences.pace}</span>
                        </div>
                        <div className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <span className="text-base">{preferences.transport === 'native' ? '🚌' : '🚗'}</span>
                          <span className="text-sm font-semibold text-white">{preferences.transport === 'native' ? 'Native' : 'Luxury'}</span>
                        </div>
                        <div className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <span className="text-base">{preferences.travelStyle === 'flexible' ? '🔄' : '📦'}</span>
                          <span className="text-sm font-semibold text-white capitalize">{preferences.travelStyle === 'flexible' ? 'Flexible' : 'Fixed'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold">Not Set</p>
                  )}
                </div>
                {!showKYTForm && (
                  <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200">
                    {preferences.travelStyle && preferences.pace && preferences.transport ? 'Edit Preferences' : 'Set Preferences'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            </div>
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

        {/* Trips Section */}
        <div id="trips" className="content-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h2 className="heading-tertiary text-gray-900">My Trips</h2>
                {trips.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">{trips.length} {trips.length === 1 ? 'trip' : 'trips'} total</p>
                )}
              </div>
            </div>
            {trips.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Trips
              </button>
            )}
          </div>
          
          {trips.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Start planning your next adventure and create unforgettable memories!</p>
              <Link href="/trips/select" className="btn-primary inline-flex items-center gap-2 shadow-medium hover:shadow-large transition-all duration-300 transform hover:scale-105">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  className="group block bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <Link 
                      href={`/trips/schedule?tripId=${trip._id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                            {trip.district}, {trip.state}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(trip.fromDate).toLocaleDateString()} - {new Date(trip.toDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {trip.totalPrice.toFixed(2)} {walletCurrency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(trip.paymentStatus)}
                      <Link
                        href={`/trips/schedule?tripId=${trip._id}`}
                        className="text-primary-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                      >
                        View Details
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteTrip(trip._id, e)}
                        disabled={deletingTripId === trip._id}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {deletingTripId === trip._id ? (
                          <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}
