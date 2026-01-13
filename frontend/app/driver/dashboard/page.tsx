'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { hostLogout } from '@/lib/providerUtils';
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

interface DriverProfile {
  _id: string;
  vehicleType: string;
  licenseNumber: string;
  rating: number;
  ratingCount: number;
  pricing: {
    perDay: number;
    currency: string;
  };
  vehicleDetails?: {
    make?: string;
    model?: string;
    year?: number;
    registrationNumber?: string;
    capacity?: number;
  };
  isVerified: boolean;
  documents: Array<{
    type: string;
    name: string;
    url: string;
  }>;
}

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
    activities: Array<any>;
  }>;
}

interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalEarnings: number;
  averageRating: number;
  totalRatingCount: number;
  thisWeekEarnings: number;
  todayEarnings: number;
  weeklyEarnings: Array<{ day: string; earnings: number }>;
  monthlyEarnings: Array<{ month: string; earnings: number }>;
}

// Professional Icon Components
const CarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export default function DriverDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalRatingCount: 0,
    thisWeekEarnings: 0,
    todayEarnings: 0,
    weeklyEarnings: [],
    monthlyEarnings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
        router.push('/host/dashboard');
        return;
      }

      // Validate and normalize _id
      if (!parsedHost._id) {
        console.error('Host data missing _id:', parsedHost);
        setError('Invalid host data. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Ensure _id is a string (handle different formats)
      let hostId: string;
      if (typeof parsedHost._id === 'string') {
        hostId = parsedHost._id;
      } else if (parsedHost._id && typeof parsedHost._id === 'object' && parsedHost._id.$oid) {
        // Handle MongoDB extended JSON format
        hostId = parsedHost._id.$oid;
      } else if (parsedHost._id?.toString) {
        hostId = parsedHost._id.toString();
      } else {
        hostId = String(parsedHost._id);
      }
      
      // Update parsedHost with normalized _id
      parsedHost._id = hostId;
      setHost(parsedHost);
      fetchDashboardData(hostId);
    }
  }, [router]);

  const fetchDashboardData = async (providerId: string) => {
    try {
      setLoading(true);
      
      // Fetch driver profile
      const profileResponse = await api.get(`/drivers/profile/${providerId}`);
      const profile = profileResponse.data.driverProfile;
      setDriverProfile(profile);

      // Fetch assigned trips
      const tripsResponse = await api.get(`/drivers/trips/${providerId}`);
      const tripsData = tripsResponse.data.trips || [];
      setTrips(tripsData);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const upcomingTrips = tripsData.filter((trip: Trip) => new Date(trip.fromDate) > now);
      const completedTrips = tripsData.filter((trip: Trip) => 
        new Date(trip.toDate) < now && trip.paymentStatus === 'Completed'
      );
      
      const totalEarnings = completedTrips.reduce((sum: number, trip: Trip) => {
        return sum + (trip.totalPrice * 0.8);
      }, 0);

      const thisWeekTrips = completedTrips.filter((trip: Trip) => {
        const tripDate = new Date(trip.toDate);
        return tripDate >= weekAgo && tripDate <= now;
      });

      const thisWeekEarnings = thisWeekTrips.reduce((sum: number, trip: Trip) => {
        return sum + (trip.totalPrice * 0.8);
      }, 0);

      const todayTrips = completedTrips.filter((trip: Trip) => {
        const tripDate = new Date(trip.toDate);
        return tripDate >= today && tripDate <= now;
      });

      const todayEarnings = todayTrips.reduce((sum: number, trip: Trip) => {
        return sum + (trip.totalPrice * 0.8);
      }, 0);

      // Calculate weekly earnings (last 7 days)
      const weeklyEarningsData: Array<{ day: string; earnings: number }> = [];
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayTrips = completedTrips.filter((trip: Trip) => {
          const tripDate = new Date(trip.toDate);
          return tripDate >= dayStart && tripDate < dayEnd;
        });
        
        const dayEarnings = dayTrips.reduce((sum: number, trip: Trip) => {
          return sum + (trip.totalPrice * 0.8);
        }, 0);
        
        weeklyEarningsData.push({
          day: daysOfWeek[date.getDay()],
          earnings: dayEarnings
        });
      }

      // Calculate monthly earnings (last 6 months)
      const monthlyEarningsData: Array<{ month: string; earnings: number }> = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        
        const monthTrips = completedTrips.filter((trip: Trip) => {
          const tripDate = new Date(trip.toDate);
          return tripDate >= monthStart && tripDate < monthEnd;
        });
        
        const monthEarnings = monthTrips.reduce((sum: number, trip: Trip) => {
          return sum + (trip.totalPrice * 0.8);
        }, 0);
        
        monthlyEarningsData.push({
          month: `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`,
          earnings: monthEarnings
        });
      }

      setStats({
        totalTrips: tripsData.length,
        upcomingTrips: upcomingTrips.length,
        completedTrips: completedTrips.length,
        totalEarnings,
        averageRating: profile?.rating || 0,
        totalRatingCount: profile?.ratingCount || 0,
        thisWeekEarnings,
        todayEarnings,
        weeklyEarnings: weeklyEarningsData,
        monthlyEarnings: monthlyEarningsData
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
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

  const formatTripDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-black border-t-transparent mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">Loading your dashboard...</div>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Uber-style Top Navigation Bar */}
      <div className="bg-black text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">Driver Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3">
                {driverProfile?.isVerified && (
                  <div className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    Verified
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">{host?.name?.charAt(0) || 'D'}</span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold">{host?.name || 'Driver'}</div>
                    <div className="text-xs text-gray-400">Driver Partner</div>
                  </div>
                </div>
                <button
                  onClick={hostLogout}
                  className="px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {host?.name || 'Driver'}!
          </h2>
          <p className="text-gray-600">Here's your earnings and trip overview</p>
        </div>

        {/* Earnings Overview - Uber Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Today's Earnings</span>
              <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.todayEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Available now</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">This Week</span>
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.thisWeekEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Earnings</span>
              <CurrencyDollarIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>
        </div>

        {/* Stats Grid - Uber Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingTrips}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTrips}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Earnings Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Weekly Earnings</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            {stats.weeklyEarnings.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-2 h-48">
                  {stats.weeklyEarnings.map((item, index) => {
                    const maxEarnings = Math.max(...stats.weeklyEarnings.map(e => e.earnings), 1);
                    const height = (item.earnings / maxEarnings) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex flex-col items-center relative">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500 cursor-pointer"
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                            title={`$${item.earnings.toFixed(2)}`}
                          />
                          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
                            ${item.earnings.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-gray-600 text-center">
                          {item.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No earnings data available</p>
              </div>
            )}
          </div>

          {/* Monthly Earnings Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Monthly Earnings</h3>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            {stats.monthlyEarnings.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-2 h-48">
                  {stats.monthlyEarnings.map((item, index) => {
                    const maxEarnings = Math.max(...stats.monthlyEarnings.map(e => e.earnings), 1);
                    const height = (item.earnings / maxEarnings) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex flex-col items-center relative">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                            title={`$${item.earnings.toFixed(2)}`}
                          />
                          <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap">
                            ${item.earnings.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-gray-600 text-center">
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No earnings data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Trips - Uber Style */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Trips</h3>
                  <button
                    onClick={() => router.push('/driver/schedule')}
                    className="text-sm font-semibold text-black hover:text-gray-700 transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {getUpcomingTrips().length > 0 ? (
                  <div className="space-y-4">
                    {getUpcomingTrips().map((trip) => (
                      <div
                        key={trip._id}
                        onClick={() => router.push(`/driver/trips/${trip._id}`)}
                        className="p-5 border-2 border-gray-100 rounded-xl hover:border-black hover:shadow-md transition-all cursor-pointer bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {trip.user.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{trip.user.name}</h4>
                                <p className="text-xs text-gray-500">{trip.user.phoneNumber}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <LocationIcon className="w-4 h-4" />
                              <span>{trip.district}, {trip.state}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <ClockIcon className="w-4 h-4" />
                              <span>{formatTripDate(trip.fromDate)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-black">
                              ${(trip.totalPrice * 0.8).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Your earnings</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            trip.paymentStatus === 'Completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trip.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2 font-medium">No upcoming trips</p>
                    <p className="text-sm text-gray-500 mb-6">Set your availability to start receiving bookings</p>
                    <button
                      onClick={() => router.push('/driver/availability')}
                      className="px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-lg"
                    >
                      Set Availability
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Vehicle Info - Uber Style */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => router.push('/driver/availability')}
                  className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all text-left flex items-center gap-3"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>Set Availability</span>
                </button>
                <button
                  onClick={() => router.push('/driver/schedule')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-black transition-all text-left flex items-center gap-3"
                >
                  <ClockIcon className="w-5 h-5" />
                  <span>View Schedule</span>
                </button>
                <button
                  onClick={() => router.push('/driver/earnings')}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-black transition-all text-left flex items-center gap-3"
                >
                  <CurrencyDollarIcon className="w-5 h-5" />
                  <span>View Earnings</span>
                </button>
              </div>
            </div>

            {/* Vehicle Info */}
            {driverProfile?.vehicleDetails && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Vehicle</h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-4">
                      <CarIcon className="w-16 h-16 text-gray-400" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">
                      {driverProfile.vehicleDetails.make} {driverProfile.vehicleDetails.model}
                    </h4>
                    <p className="text-sm text-gray-600">{driverProfile.vehicleType} • {driverProfile.vehicleDetails.year}</p>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rate per day</span>
                      <span className="font-bold text-lg text-black">
                        ${driverProfile.pricing.perDay}
                      </span>
                    </div>
                    {driverProfile.vehicleDetails.capacity && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Capacity</span>
                        <span className="font-semibold text-gray-900">
                          {driverProfile.vehicleDetails.capacity} passengers
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

