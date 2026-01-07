'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { hostLogout } from '@/lib/providerUtils';
import { format } from 'date-fns';

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
      calculated: number;
      adjusted: number | null;
      final: number;
    };
  }>;
  guidePricingMode?: 'daily' | 'hourly';
}

interface DashboardStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalEarnings: number;
  averageRating: number;
  totalRatingCount: number;
}

export default function GuideDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    upcomingTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalRatingCount: 0
  });
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
      fetchDashboardData(parsedHost._id);
    }
  }, [router]);

  const fetchDashboardData = async (guideId: string) => {
    try {
      setLoading(true);
      
      // Fetch assigned trips
      const tripsResponse = await api.get(`/hosts/guides/trips/${guideId}`);
      const tripsData = tripsResponse.data.trips || [];
      setTrips(tripsData);

      // Calculate stats
      const now = new Date();
      const upcomingTrips = tripsData.filter((trip: Trip) => new Date(trip.fromDate) > now);
      const completedTrips = tripsData.filter((trip: Trip) => 
        new Date(trip.toDate) < now && trip.paymentStatus === 'Completed'
      );
      
      // Calculate earnings based on pricing mode
      // Guide gets 15% of trip price, but for hourly mode, calculate based on actual hours
      const totalEarnings = completedTrips.reduce((sum: number, trip: Trip) => {
        if (trip.guidePricingMode === 'hourly' && trip.schedule) {
          // Calculate hourly earnings
          let totalHours = 0;
          trip.schedule.forEach(day => {
            if (day.guide && day.guide._id === host?._id) {
              const hours = day.guideHours?.final || day.guideHours?.calculated || 0;
              totalHours += hours;
            }
          });
          
          // Get guide hourly rate (15% of hourly rate per hour, or use a fixed rate)
          // For now, use 15% of trip price divided by total hours if available
          if (totalHours > 0) {
            // Estimate hourly rate from trip price
            const estimatedHourlyRate = (trip.totalPrice * 0.15) / totalHours;
            return sum + (estimatedHourlyRate * totalHours);
          }
        }
        // Default: 15% of trip price (daily mode or fallback)
        return sum + (trip.totalPrice * 0.15);
      }, 0);

      setStats({
        totalTrips: tripsData.length,
        upcomingTrips: upcomingTrips.length,
        completedTrips: completedTrips.length,
        totalEarnings,
        averageRating: host?.rating || 0,
        totalRatingCount: host?.ratingCount || 0
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
      .slice(0, 5);
  };

  const getDaysWithGuide = (trip: Trip) => {
    if (!trip.schedule) return 0;
    return trip.schedule.filter(day => day.guide && day.guide._id === host?._id).length;
  };

  const getTotalHoursForTrip = (trip: Trip) => {
    if (!trip.schedule) return 0;
    let totalHours = 0;
    trip.schedule.forEach(day => {
      if (day.guide && day.guide._id === host?._id && day.guideHours) {
        totalHours += day.guideHours.final || day.guideHours.calculated || 0;
      }
    });
    return totalHours;
  };

  const getEarningsForTrip = (trip: Trip) => {
    if (trip.guidePricingMode === 'hourly') {
      const totalHours = getTotalHoursForTrip(trip);
      // Estimate hourly rate (15% of trip price / total hours)
      // In a real scenario, this would come from the guide's actual hourly rate
      if (totalHours > 0) {
        const estimatedHourlyRate = (trip.totalPrice * 0.15) / totalHours;
        return {
          mode: 'hourly',
          hours: totalHours,
          rate: estimatedHourlyRate,
          total: estimatedHourlyRate * totalHours
        };
      }
    }
    // Daily mode: 15% of trip price
    return {
      mode: 'daily',
      days: getDaysWithGuide(trip),
      rate: 50,
      total: trip.totalPrice * 0.15
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 opacity-25"></div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mt-4">Loading your dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Preparing your guide insights</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Welcome back, {host?.name || 'Guide'}!
                  </h1>
                  <p className="text-primary-100 mt-1">
                    Your professional guide dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                <span className="text-yellow-300 text-xl">⭐</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-primary-100">
                    {stats.totalRatingCount} reviews
                  </div>
                </div>
              </div>
              <button
                onClick={hostLogout}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 rounded-lg text-white font-medium transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards with Advanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Trips Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tours</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalTrips}</p>
                <p className="text-xs text-gray-500 mt-2">All time assignments</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🗺️</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Active guide</span>
              </div>
            </div>
          </div>

          {/* Upcoming Trips Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Tours</p>
                <p className="text-4xl font-bold text-primary-600 mt-2">{stats.upcomingTrips}</p>
                <p className="text-xs text-gray-500 mt-2">Scheduled ahead</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📅</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ready to guide</span>
              </div>
            </div>
          </div>

          {/* Completed Trips Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.completedTrips}</p>
                <p className="text-xs text-gray-500 mt-2">Successfully guided</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">✅</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Great work!</span>
              </div>
            </div>
          </div>

          {/* Earnings Card */}
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                <p className="text-4xl font-bold text-yellow-600 mt-2">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">From completed tours</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Keep it up!</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Trips Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Upcoming Tours</h2>
                      <p className="text-sm text-primary-100">Your next assignments</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/provider/guides/schedule')}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 rounded-lg text-white text-sm font-medium transition-all duration-200"
                  >
                    View All →
                  </button>
                </div>
              </div>
              <div className="p-6">
                {getUpcomingTrips().length > 0 ? (
                  <div className="space-y-4">
                    {getUpcomingTrips().map((trip) => {
                      const guideDays = getDaysWithGuide(trip);
                      const totalHours = getTotalHoursForTrip(trip);
                      const earnings = getEarningsForTrip(trip);
                      const isUpcoming = new Date(trip.fromDate) > new Date();
                      
                      return (
                        <div
                          key={trip._id}
                          onClick={() => router.push(`/provider/guides/trips/${trip._id}`)}
                          className="group p-5 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-white to-gray-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
                                  {trip.user.name}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  trip.paymentStatus === 'Completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {trip.paymentStatus}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>{trip.district}, {trip.state}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>
                                    {format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                {trip.guidePricingMode === 'hourly' && totalHours > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{totalHours} hour{totalHours !== 1 ? 's' : ''} @ ${earnings.rate.toFixed(2)}/hr</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{guideDays} day{guideDays !== 1 ? 's' : ''} @ $50/day</span>
                                  </div>
                                )}
                              </div>
                              {/* Earnings Display */}
                              {trip.paymentStatus === 'Completed' && (
                                <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Your Earnings:</span>
                                    <span className="text-lg font-bold text-green-600">
                                      ${earnings.total.toFixed(2)}
                                    </span>
                                  </div>
                                  {trip.guidePricingMode === 'hourly' && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {totalHours} hours × ${earnings.rate.toFixed(2)}/hr
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <span className="text-xl">→</span>
                              </div>
                            </div>
                          </div>
                          {trip.schedule && trip.schedule.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium">Activities:</span>
                                <span>
                                  {trip.schedule.reduce((acc, day) => acc + (day.activities?.length || 0), 0)} total
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">🗺️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming tours</h3>
                    <p className="text-gray-600 mb-6">You don't have any scheduled tours yet.</p>
                    <button
                      onClick={() => router.push('/host/availability')}
                      className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Set Availability
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Profile Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => router.push('/provider/guides/schedule')}
                  className="w-full p-4 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 border-2 border-primary-200 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">📅</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">View Schedule</div>
                    <div className="text-sm text-gray-600">See all your tours</div>
                  </div>
                  <svg className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => router.push('/host/availability')}
                  className="w-full p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-2 border-cyan-200 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">📆</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Set Availability</div>
                    <div className="text-sm text-gray-600">Update your schedule</div>
                  </div>
                  <svg className="w-5 h-5 text-cyan-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => router.push('/provider/guides/earnings')}
                  className="w-full p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-2 border-yellow-200 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">💰</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">View Earnings</div>
                    <div className="text-sm text-gray-600">Track your income</div>
                  </div>
                  <svg className="w-5 h-5 text-yellow-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => router.push('/provider/guides/reviews')}
                  className="w-full p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl">⭐</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">View Reviews</div>
                    <div className="text-sm text-gray-600">See traveler feedback</div>
                  </div>
                  <svg className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">👤</span>
                  Your Profile
                </h2>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-4xl">🗺️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{host?.name || 'Guide'}</h3>
                  <p className="text-sm text-gray-600 mt-1">Professional Tour Guide</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-xl">⭐</span>
                      <span className="font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Reviews</span>
                    <span className="font-bold text-gray-900">{stats.totalRatingCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Total Tours</span>
                    <span className="font-bold text-primary-600">{stats.totalTrips}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/host/dashboard')}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
