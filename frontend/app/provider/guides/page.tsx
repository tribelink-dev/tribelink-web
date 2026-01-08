'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { hostLogout } from '@/lib/providerUtils';
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Trip {
  _id: string;
  fromDate: string;
  toDate: string;
  country: string;
  state: string;
  district: string;
  locations?: Array<{
    state: string;
    district: string;
  }>;
  totalPrice: number;
  paymentStatus: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  schedule?: Array<{
    date: string;
    activities: Array<{
      title: string;
      startTime: string;
      endTime: string;
      duration: number;
      provider?: {
        name: string;
      };
    }>;
    hotel?: {
      name: string;
      address: string;
    };
    guide?: {
      name: string;
      _id: string;
    };
    guideHours?: {
      calculated?: number;
      adjusted?: number | null;
      final?: number;
    };
  }>;
}

interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalEarnings: number;
  totalHours: number;
  travelersGuided: number;
  averageRating: number;
  totalRatingCount: number;
  nextTourDate: string | null;
}

export default function GuideDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [servicedExperiencesCount, setServicedExperiencesCount] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    totalHours: 0,
    travelersGuided: 0,
    averageRating: 0,
    totalRatingCount: 0,
    nextTourDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchServicedExperiencesCount = async (guideId: string) => {
    try {
      const response = await api.get('/hosts/guides/experiences');
      const count = response.data.count || 0;
      setServicedExperiencesCount(count);
      console.log('Serviced experiences count:', count);
    } catch (err: any) {
      console.error('Error fetching serviced experiences count:', err);
      setServicedExperiencesCount(0);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'GUIDE') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchDashboardData(parsedHost._id);
      fetchServicedExperiencesCount(parsedHost._id);
    }
  }, [router]);

  const fetchDashboardData = async (guideId: string) => {
    try {
      setLoading(true);
      
      // Fetch assigned trips - use the authenticated guide's own trips
      const tripsResponse = await api.get(`/hosts/guides/trips/me`);
      const tripsData = tripsResponse.data.trips || [];
      setTrips(tripsData);

      // Calculate stats
      const now = new Date();
      const upcomingTrips = tripsData.filter((trip: Trip) => new Date(trip.fromDate) > now);
      const completedTrips = tripsData.filter((trip: Trip) => 
        new Date(trip.toDate) < now && trip.paymentStatus === 'Completed'
      );
      
      // Calculate total hours worked
      let totalHours = 0;
      completedTrips.forEach((trip: Trip) => {
        if (trip.schedule) {
          trip.schedule.forEach(day => {
            if (day.guide && day.guide._id === guideId) {
              const hours = day.guideHours?.final || day.guideHours?.calculated || 8;
              totalHours += hours;
            }
          });
        }
      });
      
      // Calculate earnings (assuming guide gets 15% of trip price or hourly rate)
      const totalEarnings = completedTrips.reduce((sum: number, trip: Trip) => {
        return sum + (trip.totalPrice * 0.15);
      }, 0);

      // Get next tour date
      const nextTour = upcomingTrips.sort((a: Trip, b: Trip) => 
        new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
      )[0];

      // Count unique travelers
      const uniqueTravelers = new Set(completedTrips.map((trip: Trip) => trip.user._id));

      setStats({
        totalTrips: tripsData.length,
        upcomingTrips: upcomingTrips.length,
        completedTrips: completedTrips.length,
        totalEarnings,
        totalHours,
        travelersGuided: uniqueTravelers.size,
        averageRating: host?.rating || 0,
        totalRatingCount: host?.ratingCount || 0,
        nextTourDate: nextTour ? nextTour.fromDate : null
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingTrips = () => {
    const now = new Date();
    return trips
      .filter(trip => new Date(trip.fromDate) > now)
      .sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime())
      .slice(0, 3);
  };

  const getDaysWithGuide = (trip: Trip) => {
    if (!trip.schedule) return 0;
    return trip.schedule.filter(day => day.guide && day.guide._id === host?._id).length;
  };

  const getTotalHoursForTrip = (trip: Trip) => {
    if (!trip.schedule) return 0;
    return trip.schedule
      .filter(day => day.guide && day.guide._id === host?._id)
      .reduce((sum, day) => {
        const hours = day.guideHours?.final || day.guideHours?.calculated || 8;
        return sum + hours;
      }, 0);
  };

  const formatDateRelative = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <motion.div
              className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 w-20 h-20 border-4 border-emerald-500/30 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-2xl">🧭</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-2"
          >
            Preparing Your Journey
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400"
          >
            Loading your guide dashboard...
          </motion.div>
          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-emerald-400 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Unique Header - Dark Adventure Theme with Compass */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-5 mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 12 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  whileHover={{ rotate: 0, scale: 1.1 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ rotate: [12, 372] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20"
                  >
                    <motion.span
                      animate={{ rotate: [-12, -372] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="text-5xl"
                    >
                      🧭
                    </motion.span>
                  </motion.div>
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Orbiting particles */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-emerald-300 rounded-full"
                      animate={{
                        rotate: [0, 360],
                        x: [0, Math.cos((i * 120 * Math.PI) / 180) * 30],
                        y: [0, Math.sin((i * 120 * Math.PI) / 180) * 30],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                      style={{
                        left: '50%',
                        top: '50%',
                        marginLeft: '-4px',
                        marginTop: '-4px',
                      }}
                    />
                  ))}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight"
                  >
                    {host?.name || 'Guide'}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-emerald-200 text-xl font-medium"
                  >
                    Professional Tour Guide
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-4 mt-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                    >
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="text-yellow-300 text-lg"
                      >
                        ⭐
                      </motion.span>
                      <span className="text-white font-bold">{stats.averageRating.toFixed(1)}</span>
                      <span className="text-emerald-200 text-sm">({stats.totalRatingCount})</span>
                    </motion.div>
                    {stats.nextTourDate && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-3 py-1 bg-emerald-500/30 backdrop-blur-sm rounded-lg border border-emerald-400/30"
                      >
                        <motion.svg
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 text-emerald-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </motion.svg>
                        <span className="text-white font-semibold text-sm">
                          Next: {formatDateRelative(stats.nextTourDate)}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={hostLogout}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Advanced Stats Cards with Animations */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Experiences Card with Progress Ring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative bg-gradient-to-br from-emerald-800/50 to-teal-800/50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 shadow-xl cursor-pointer overflow-hidden group"
            onClick={() => router.push('/provider/guides/experiences')}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Progress Ring */}
            <div className="absolute top-2 right-2 w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.2)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.8)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - Math.min(servicedExperiencesCount / 20, 1)) }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </svg>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="text-emerald-300 text-xs font-semibold mb-2 uppercase tracking-wider">Experiences</div>
                <motion.div
                  key={servicedExperiencesCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="text-4xl font-black text-white mb-1"
                >
                  {servicedExperiencesCount}
                </motion.div>
                <div className="text-xs text-emerald-400/80">Selected</div>
              </div>
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 bg-emerald-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-emerald-400/30"
              >
                <span className="text-2xl">🗺️</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Tours Card with Pulse Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative bg-gradient-to-br from-cyan-800/50 to-blue-800/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Animated pulse indicator */}
            {stats.upcomingTrips > 0 && (
              <motion.div
                className="absolute top-3 right-3 w-3 h-3 bg-cyan-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="text-cyan-300 text-xs font-semibold mb-2 uppercase tracking-wider">Tours</div>
                <motion.div
                  key={stats.totalTrips}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="text-4xl font-black text-white mb-1"
                >
                  {stats.totalTrips}
                </motion.div>
                <div className="text-xs text-cyan-400/80">{stats.upcomingTrips} upcoming</div>
              </div>
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 bg-cyan-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-cyan-400/30"
              >
                <span className="text-2xl">📋</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Hours Card with Animated Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative bg-gradient-to-br from-indigo-800/50 to-purple-800/50 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30 shadow-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-900/50">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.totalHours / 100) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="text-indigo-300 text-xs font-semibold mb-2 uppercase tracking-wider">Hours</div>
                <motion.div
                  key={stats.totalHours}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="text-4xl font-black text-white mb-1"
                >
                  {stats.totalHours}
                </motion.div>
                <div className="text-xs text-indigo-400/80">~{Math.round(stats.totalHours / 8)} days</div>
              </div>
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
                className="w-14 h-14 bg-indigo-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-indigo-400/30"
              >
                <span className="text-2xl">⏰</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Travelers Card with Icon Animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative bg-gradient-to-br from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Floating icons */}
            <div className="absolute top-2 left-2 opacity-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                className="text-2xl">👤</motion.div>
            </div>
            <div className="absolute top-4 right-4 opacity-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="text-2xl">👤</motion.div>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wider">Travelers</div>
                <motion.div
                  key={stats.travelersGuided}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="text-4xl font-black text-white mb-1"
                >
                  {stats.travelersGuided}
                </motion.div>
                <div className="text-xs text-purple-400/80">Unique</div>
              </div>
              <motion.div
                whileHover={{ scale: 1.2 }}
                className="w-14 h-14 bg-purple-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-400/30"
              >
                <span className="text-2xl">👥</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Earnings Card with Sparkle Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative bg-gradient-to-br from-amber-800/50 to-yellow-800/50 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30 shadow-xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Sparkle effects */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{
                  top: `${20 + i * 30}%`,
                  left: `${15 + i * 25}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="text-amber-300 text-xs font-semibold mb-2 uppercase tracking-wider">Earnings</div>
                <motion.div
                  key={Math.floor(stats.totalEarnings)}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="text-4xl font-black text-white mb-1"
                >
                  ${stats.totalEarnings.toFixed(0)}
                </motion.div>
                <div className="text-xs text-amber-400/80">Total</div>
              </div>
              <motion.div
                whileHover={{ rotate: [0, -15, 15, -15, 0] }}
                transition={{ duration: 0.5 }}
                className="w-14 h-14 bg-amber-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-amber-400/30"
              >
                <span className="text-2xl">💰</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Main Content - Itinerary-Focused Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Tours - Day-by-Day Itinerary View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-5 border-b border-emerald-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                      <span className="text-3xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Upcoming Itineraries</h2>
                      <p className="text-emerald-100 text-sm mt-1">Day-by-day tour schedule</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/provider/guides/schedule')}
                    className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/30 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-105"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="p-6">
                {getUpcomingTrips().length > 0 ? (
                  <div className="space-y-6">
                    <AnimatePresence>
                      {getUpcomingTrips().map((trip, index) => {
                      const guideDays = getDaysWithGuide(trip);
                      const totalHours = getTotalHoursForTrip(trip);
                      const tripDate = new Date(trip.fromDate);
                      const daysUntil = differenceInDays(tripDate, new Date());
                      const guideScheduleDays = trip.schedule?.filter(day => day.guide && day.guide._id === host?._id) || [];
                      
                      return (
                        <motion.div
                          key={trip._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -5 }}
                          onClick={() => router.push(`/provider/guides/trips/${trip._id}`)}
                          className="group relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                          {/* Animated background gradient on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100"
                            transition={{ duration: 0.3 }}
                          />
                          {/* Traveler Header */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-emerald-400/30">
                                <span className="text-3xl">👤</span>
                              </div>
                              <div>
                                <h3 className="text-xl font-black text-white mb-1 group-hover:text-emerald-300 transition-colors">
                                  {trip.user.name}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium">{trip.district}, {trip.state}</span>
                                  </div>
                                  <span className="text-slate-500">•</span>
                                  <span>{format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                                trip.paymentStatus === 'Completed' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {trip.paymentStatus}
                              </span>
                              {daysUntil >= 0 && daysUntil <= 7 && (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30">
                                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                                </span>
                              )}
                            </div>
                          </div>

                              {/* Day-by-Day Preview with Animations */}
                              {guideScheduleDays.length > 0 && (
                                <div className="space-y-3 mb-4">
                                  <div className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-2">
                                    <span>Your Schedule ({guideDays} days, {totalHours}h):</span>
                                    <motion.div
                                      animate={{ rotate: [0, 360] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4"
                                    >
                                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </motion.div>
                                  </div>
                                  <AnimatePresence>
                                    {guideScheduleDays.slice(0, 3).map((day, dayIdx) => {
                                      const dayDate = parseISO(day.date);
                                      const activities = day.activities || [];
                                      return (
                                        <motion.div
                                          key={dayIdx}
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3, delay: dayIdx * 0.1 }}
                                          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
                                        >
                                          <div className="flex items-center gap-3 mb-2">
                                            <motion.div
                                              whileHover={{ scale: 1.2 }}
                                              className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-300 font-bold text-sm"
                                            >
                                              {dayIdx + 1}
                                            </motion.div>
                                            <div className="text-sm font-semibold text-white">{format(dayDate, 'EEE, MMM dd')}</div>
                                            {day.guideHours && (
                                              <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="ml-auto text-xs text-slate-400"
                                              >
                                                {day.guideHours.final || day.guideHours.calculated || 8}h
                                              </motion.div>
                                            )}
                                          </div>
                                          {activities.length > 0 && (
                                            <div className="ml-11 space-y-1">
                                              {activities.slice(0, 2).map((activity, actIdx) => (
                                                <motion.div
                                                  key={actIdx}
                                                  initial={{ opacity: 0, x: -10 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  transition={{ delay: actIdx * 0.1 }}
                                                  className="text-xs text-slate-300 flex items-center gap-2"
                                                >
                                                  <motion.span
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: actIdx * 0.5 }}
                                                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                                  />
                                                  <span>{activity.startTime} - {activity.title}</span>
                                                </motion.div>
                                              ))}
                                              {activities.length > 2 && (
                                                <motion.div
                                                  initial={{ opacity: 0 }}
                                                  animate={{ opacity: 1 }}
                                                  className="text-xs text-slate-400"
                                                >
                                                  +{activities.length - 2} more activities
                                                </motion.div>
                                              )}
                                            </div>
                                          )}
                                        </motion.div>
                                      );
                                    })}
                                  </AnimatePresence>
                                  {guideScheduleDays.length > 3 && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-center text-sm text-slate-400 pt-2"
                                    >
                                      +{guideScheduleDays.length - 3} more days
                                    </motion.div>
                                  )}
                                </div>
                              )}

                          {/* Quick Actions with Animations */}
                          <div className="relative flex items-center gap-3 pt-4 border-t border-slate-700/50">
                            <motion.a
                              href={`tel:${trip.user.phoneNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm font-semibold text-center transition-all relative overflow-hidden group"
                            >
                              <motion.div
                                className="absolute inset-0 bg-emerald-500/20"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                📞 Call
                              </span>
                            </motion.a>
                            <motion.a
                              href={`mailto:${trip.user.email}`}
                              onClick={(e) => e.stopPropagation()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm font-semibold text-center transition-all relative overflow-hidden"
                            >
                              <motion.div
                                className="absolute inset-0 bg-cyan-500/20"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                ✉️ Email
                              </span>
                            </motion.a>
                            <motion.div
                              whileHover={{ scale: 1.05, x: 5 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-slate-700/50 rounded-lg text-slate-300 text-sm font-semibold cursor-pointer"
                            >
                              View Details →
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/30 relative"
                    >
                      <span className="text-5xl relative z-10">🗺️</span>
                      {/* Pulsing rings */}
                      {[...Array(2)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-2 border-emerald-400/30 rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                        />
                      ))}
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-black text-white mb-2"
                    >
                      No Upcoming Tours
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-slate-400 mb-8"
                    >
                      You don't have any scheduled tours yet.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/provider/guides/availability')}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-2xl border-2 border-emerald-400/30 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      <span className="relative z-10 flex items-center gap-2">
                        Set Your Availability
                        <motion.svg
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </motion.svg>
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Sidebar - Guide Tools & Performance */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 border-b border-emerald-400/30">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/guides/experiences')}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-2 border-emerald-500/30 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  >
                    <span className="text-xl">🗺️</span>
                  </motion.div>
                  <div className="flex-1 relative z-10">
                    <div className="font-bold text-white">Select Experiences</div>
                    <div className="text-sm text-slate-300">Choose experiences to guide</div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/guides/schedule')}
                  className="w-full p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border-2 border-cyan-500/30 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  >
                    <span className="text-xl">📅</span>
                  </motion.div>
                  <div className="flex-1 relative z-10">
                    <div className="font-bold text-white">My Schedule</div>
                    <div className="text-sm text-slate-300">View all tours</div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/guides/availability')}
                  className="w-full p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border-2 border-indigo-500/30 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  >
                    <span className="text-xl">📆</span>
                  </motion.div>
                  <div className="flex-1 relative z-10">
                    <div className="font-bold text-white">Availability</div>
                    <div className="text-sm text-slate-300">Update schedule</div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/guides/earnings')}
                  className="w-full p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border-2 border-amber-500/30 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  >
                    <span className="text-xl">💰</span>
                  </motion.div>
                  <div className="flex-1 relative z-10">
                    <div className="font-bold text-white">Earnings</div>
                    <div className="text-sm text-slate-300">Track income</div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/guides/reviews')}
                  className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border-2 border-purple-500/30 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <motion.div
                    whileHover={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg relative z-10"
                  >
                    <span className="text-xl">⭐</span>
                  </motion.div>
                  <div className="flex-1 relative z-10">
                    <div className="font-bold text-white">Reviews</div>
                    <div className="text-sm text-slate-300">Traveler feedback</div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="relative z-10"
                  >
                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>
              </div>
            </div>

            {/* Performance Card with Advanced Visualizations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 border-b border-purple-400/30">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-2xl"
                  >
                    📊
                  </motion.span>
                  Performance
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Rating with Visual Progress */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30 overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
                        >
                          <span className="text-xl">⭐</span>
                        </motion.div>
                        <div>
                          <div className="text-sm text-slate-300">Rating</div>
                          <motion.div
                            key={stats.averageRating}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="text-2xl font-black text-white"
                          >
                            {stats.averageRating.toFixed(1)}
                          </motion.div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-300">Reviews</div>
                        <motion.div
                          key={stats.totalRatingCount}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="text-2xl font-black text-white"
                        >
                          {stats.totalRatingCount}
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Rating Progress Bar */}
                    <div className="mt-3 relative z-10">
                      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.averageRating / 5) * 100}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-slate-400">
                        <span>0</span>
                        <span>5.0</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Trip Stats with Animated Bars */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Upcoming</div>
                        <motion.div
                          key={stats.upcomingTrips}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="text-3xl font-black text-emerald-400 mb-2"
                        >
                          {stats.upcomingTrips}
                        </motion.div>
                        {/* Progress indicator */}
                        <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stats.upcomingTrips / Math.max(stats.totalTrips, 1)) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Completed</div>
                        <motion.div
                          key={stats.completedTrips}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="text-3xl font-black text-green-400 mb-2"
                        >
                          {stats.completedTrips}
                        </motion.div>
                        {/* Progress indicator */}
                        <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stats.completedTrips / Math.max(stats.totalTrips, 1)) * 100, 100)}%` }}
                            transition={{ duration: 1, delay: 1.1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Completion Rate Visualization */}
                  {stats.totalTrips > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="pt-4 border-t border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Completion Rate</span>
                        <span className="text-sm font-bold text-white">
                          {Math.round((stats.completedTrips / stats.totalTrips) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(stats.completedTrips / stats.totalTrips) * 100}%` }}
                          transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}


