'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { hostLogout } from '@/lib/providerUtils';

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
      _id: string;
      name: string;
    };
    guideHours?: {
      calculated?: number;
      adjusted?: number | null;
      final?: number;
    };
  }>;
}

export default function GuideTripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;

  const [host, setHost] = useState<any>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      if (tripId) {
        fetchTripDetails(parsedHost._id, tripId);
      }
    }
  }, [router, tripId]);

  const fetchTripDetails = async (guideId: string, tripId: string) => {
    try {
      setLoading(true);
      const response = await api.get('/hosts/guides/trips/me');
      const trips = response.data.trips || [];
      const foundTrip = trips.find((t: Trip) => t._id === tripId);
      
      if (foundTrip) {
        setTrip(foundTrip);
      } else {
        setError('Trip not found');
      }
    } catch (err: any) {
      console.error('Error fetching trip details:', err);
      setError(err.response?.data?.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
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
          <p className="text-white text-lg font-semibold">Loading trip details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-500/30 p-8 text-center max-w-md"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-black text-white mb-2">Trip Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'The trip you are looking for does not exist.'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/provider/guides/schedule')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold transition-all"
          >
            Back to Schedule
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const guideScheduleDays = trip.schedule?.filter(day => day.guide && day.guide._id === host?._id) || [];
  const totalHours = guideScheduleDays.reduce((sum, day) => 
    sum + (day.guideHours?.final || day.guideHours?.calculated || 8), 0
  );

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
                onClick={() => router.push('/provider/guides/schedule')}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">Trip Details</h1>
                <p className="text-emerald-200">{format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Traveler Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 border-b border-emerald-400/30">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Traveler Information
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-4">{trip.user.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Email</p>
                        <a href={`mailto:${trip.user.email}`} className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {trip.user.email}
                        </a>
                      </div>
                      {trip.user.phoneNumber && (
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Phone</p>
                          <a href={`tel:${trip.user.phoneNumber}`} className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {trip.user.phoneNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Schedule */}
            {guideScheduleDays.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 border-b border-emerald-400/30">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Your Schedule ({guideScheduleDays.length} days, {totalHours}h)
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {guideScheduleDays.map((day, index) => {
                    const dayDate = parseISO(day.date);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-slate-700/30 rounded-2xl p-6 border border-emerald-500/20"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center font-black text-white">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white">{format(dayDate, 'EEEE, MMMM dd')}</h3>
                              <p className="text-sm text-slate-400">{day.guideHours?.final || day.guideHours?.calculated || 8} hours</p>
                            </div>
                          </div>
                        </div>
                        {day.hotel && (
                          <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-teal-500/20">
                            <div className="flex items-center gap-2 text-teal-300 font-semibold mb-1">
                              <span>🏨</span>
                              <span>Hotel</span>
                            </div>
                            <p className="text-white font-medium">{day.hotel.name}</p>
                            <p className="text-sm text-slate-400">{day.hotel.address}</p>
                          </div>
                        )}
                        {day.activities && day.activities.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-emerald-300 mb-2">Activities:</p>
                            {day.activities.map((activity, actIndex) => (
                              <div key={actIndex} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                <div className="flex-1">
                                  <p className="text-white font-medium">{activity.title}</p>
                                  <p className="text-sm text-slate-400">
                                    {activity.startTime} - {activity.endTime} ({activity.duration}h)
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 border-b border-emerald-400/30">
                <h2 className="text-xl font-black text-white">Trip Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Location</p>
                  <p className="text-white font-semibold">{trip.district}, {trip.state}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Duration</p>
                  <p className="text-white font-semibold">
                    {format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Your Days</p>
                  <p className="text-white font-semibold">{guideScheduleDays.length} days</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Hours</p>
                  <p className="text-white font-semibold">{totalHours}h</p>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${
                    trip.paymentStatus === 'Completed'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {trip.paymentStatus}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

