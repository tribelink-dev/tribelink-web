'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import { hostLogout } from '@/lib/providerUtils';

interface Trip {
  _id: string;
  fromDate: string;
  toDate: string;
  totalPrice: number;
  paymentStatus: string;
  schedule?: Array<{
    guide?: {
      _id: string;
    };
    guideHours?: {
      final?: number;
      calculated?: number;
    };
  }>;
}

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: Array<{ month: string; amount: number }>;
  weeklyEarnings: Array<{ week: string; amount: number }>;
  completedTrips: number;
  totalHours: number;
  averagePerTrip: number;
  averagePerHour: number;
}

export default function GuideEarningsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'week' | 'all'>('month');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    monthlyEarnings: [],
    weeklyEarnings: [],
    completedTrips: 0,
    totalHours: 0,
    averagePerTrip: 0,
    averagePerHour: 0
  });

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
      calculateEarnings(tripsData, guideId);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = (tripsData: Trip[], guideId: string) => {
    const now = new Date();
    const completedTrips = tripsData.filter(t => 
      new Date(t.toDate) < now && t.paymentStatus === 'Completed'
    );

    // Calculate total hours
    let totalHours = 0;
    completedTrips.forEach(trip => {
      if (trip.schedule) {
        trip.schedule.forEach(day => {
          if (day.guide && day.guide._id === guideId) {
            totalHours += day.guideHours?.final || day.guideHours?.calculated || 8;
          }
        });
      }
    });

    // Calculate earnings (15% of trip price)
    const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.totalPrice * 0.15), 0);
    const averagePerTrip = completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0;
    const averagePerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

    // Monthly earnings (last 6 months)
    const monthlyEarnings: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(monthStart);
      const monthTrips = completedTrips.filter(t => {
        const tripDate = new Date(t.toDate);
        return tripDate >= monthStart && tripDate <= monthEnd;
      });
      const monthAmount = monthTrips.reduce((sum, trip) => sum + (trip.totalPrice * 0.15), 0);
      monthlyEarnings.push({
        month: format(monthStart, 'MMM yyyy'),
        amount: monthAmount
      });
    }

    // Weekly earnings (last 8 weeks)
    const weeklyEarnings: Array<{ week: string; amount: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i));
      const weekEnd = endOfWeek(weekStart);
      const weekTrips = completedTrips.filter(t => {
        const tripDate = new Date(t.toDate);
        return tripDate >= weekStart && tripDate <= weekEnd;
      });
      const weekAmount = weekTrips.reduce((sum, trip) => sum + (trip.totalPrice * 0.15), 0);
      weeklyEarnings.push({
        week: format(weekStart, 'MMM dd'),
        amount: weekAmount
      });
    }

    setEarningsData({
      totalEarnings,
      monthlyEarnings,
      weeklyEarnings,
      completedTrips: completedTrips.length,
      totalHours,
      averagePerTrip,
      averagePerHour
    });
  };

  const getMaxEarnings = () => {
    if (period === 'month') {
      return Math.max(...earningsData.monthlyEarnings.map(e => e.amount), 1);
    } else if (period === 'week') {
      return Math.max(...earningsData.weeklyEarnings.map(e => e.amount), 1);
    }
    return earningsData.totalEarnings || 1;
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
          <p className="text-white text-lg font-semibold">Loading earnings...</p>
        </motion.div>
      </div>
    );
  }

  const maxEarnings = getMaxEarnings();
  const displayData = period === 'month' ? earningsData.monthlyEarnings : 
                     period === 'week' ? earningsData.weeklyEarnings : [];

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
                <h1 className="text-4xl font-black text-white mb-2">Earnings</h1>
                <p className="text-emerald-200">Track your income and performance</p>
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">💰</span>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">💵</span>
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Earnings</p>
            <p className="text-3xl font-black text-white">₹{earningsData.totalEarnings.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-cyan-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📊</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">📈</span>
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Completed Trips</p>
            <p className="text-3xl font-black text-white">{earningsData.completedTrips}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">⏱️</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-2xl">🕐</span>
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Total Hours</p>
            <p className="text-3xl font-black text-white">{earningsData.totalHours}h</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-500/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📉</span>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">💹</span>
              </motion.div>
            </div>
            <p className="text-slate-400 text-sm mb-1">Avg per Hour</p>
            <p className="text-3xl font-black text-white">₹{earningsData.averagePerHour.toFixed(2)}</p>
          </motion.div>
        </div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-6 mb-6"
        >
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1 w-fit">
            {(['month', 'week', 'all'] as const).map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  period === p
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Earnings Chart */}
        {displayData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 border-b border-emerald-400/30">
              <h2 className="text-xl font-black text-white">
                {period === 'month' ? 'Monthly' : period === 'week' ? 'Weekly' : 'All Time'} Earnings
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between gap-4 h-64">
                {displayData.map((item, index) => {
                  const height = (item.amount / maxEarnings) * 100;
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-lg relative overflow-hidden cursor-pointer"
                        style={{ height: `${height}%`, minHeight: '8px' }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-emerald-400/50 to-transparent"
                          animate={{ y: ['0%', '100%', '0%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <div className="text-xs text-slate-400 font-semibold text-center">
                        {period === 'month' ? item.month : item.week}
                      </div>
                      <div className="text-xs text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{item.amount.toFixed(2)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

