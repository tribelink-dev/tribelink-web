'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format, isToday, isTomorrow, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { hostLogout } from '@/lib/providerUtils';

interface Trip {
  _id: string;
  fromDate: string;
  toDate: string;
  country: string;
  state: string;
  district: string;
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
    }>;
    guide?: {
      _id: string;
      name: string;
    };
    guideHours?: {
      final?: number;
      calculated?: number;
    };
  }>;
}

export default function GuideSchedulePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'today'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

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
      fetchTrips(parsedHost._id);
    }
  }, [router]);

  const fetchTrips = async (guideId: string) => {
    try {
      setLoading(true);
      const response = await api.get('/hosts/guides/trips/me');
      const tripsData = response.data.trips || [];
      setTrips(tripsData);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrips = () => {
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        return trips.filter(t => new Date(t.fromDate) > now);
      case 'completed':
        return trips.filter(t => new Date(t.toDate) < now && t.paymentStatus === 'Completed');
      case 'today':
        return trips.filter(t => {
          const tripDate = new Date(t.fromDate);
          return isToday(tripDate);
        });
      default:
        return trips;
    }
  };

  const getDaysWithGuide = (trip: Trip) => {
    if (!trip.schedule) return 0;
    return trip.schedule.filter(day => day.guide && day.guide._id === host?._id).length;
  };

  const getTotalHours = (trip: Trip) => {
    if (!trip.schedule) return 0;
    return trip.schedule
      .filter(day => day.guide && day.guide._id === host?._id)
      .reduce((sum, day) => sum + (day.guideHours?.final || day.guideHours?.calculated || 8), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg font-semibold">Loading schedule...</p>
        </motion.div>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/provider/guides')}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">My Schedule</h1>
                <p className="text-emerald-200">Manage your tour schedule</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={hostLogout}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all"
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1">
              {(['all', 'upcoming', 'completed', 'today'] as const).map((f) => (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    filter === f
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1">
              {(['list', 'calendar'] as const).map((mode) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    viewMode === mode
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📅
            </motion.div>
            <h3 className="text-2xl font-black text-white mb-2">No tours found</h3>
            <p className="text-slate-400">You don't have any tours matching this filter.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredTrips.map((trip, index) => {
                const guideDays = getDaysWithGuide(trip);
                const totalHours = getTotalHours(trip);
                const tripDate = new Date(trip.fromDate);
                const daysUntil = differenceInDays(tripDate, new Date());
                
                return (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => router.push(`/provider/guides/trips/${trip._id}`)}
                    className="group bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-emerald-500/20 hover:border-emerald-400/50 p-6 cursor-pointer transition-all overflow-hidden relative"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl">👤</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-black text-white mb-1 group-hover:text-emerald-300 transition-colors">
                              {trip.user.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{trip.district}, {trip.state}</span>
                              </div>
                              <span>•</span>
                              <span>{format(tripDate, 'MMM dd, yyyy')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">{guideDays} days</span>
                              <span>•</span>
                              <span className="text-teal-400 font-semibold">{totalHours}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-slate-400 mb-1">Status</div>
                          <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                            trip.paymentStatus === 'Completed'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {trip.paymentStatus}
                          </span>
                          {daysUntil >= 0 && daysUntil <= 7 && (
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30">
                                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                              </span>
                            </div>
                          )}
                        </div>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="text-emerald-400"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

