'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { hostLogout } from '@/lib/providerUtils';
import { format } from 'date-fns';

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
}

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
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchDashboardData(parsedHost._id);
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
      const upcomingTrips = tripsData.filter((trip: Trip) => new Date(trip.fromDate) > now);
      const completedTrips = tripsData.filter((trip: Trip) => 
        new Date(trip.toDate) < now && trip.paymentStatus === 'Completed'
      );
      
      const totalEarnings = completedTrips.reduce((sum: number, trip: Trip) => {
        // Calculate driver's share (assuming 80% of trip price goes to driver)
        return sum + (trip.totalPrice * 0.8);
      }, 0);

      setStats({
        totalTrips: tripsData.length,
        upcomingTrips: upcomingTrips.length,
        completedTrips: completedTrips.length,
        totalEarnings,
        averageRating: profile?.rating || 0,
        totalRatingCount: profile?.ratingCount || 0
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      // Clean up error message to prevent concatenation issues
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {host?.name || 'Driver'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your trips, schedule, and earnings
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-600 font-semibold">⭐</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.averageRating.toFixed(1)} ({stats.totalRatingCount} reviews)
                </span>
              </div>
              {driverProfile?.isVerified && (
                <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  ✓ Verified
                </div>
              )}
              <button
                onClick={hostLogout}
                className="btn-secondary text-sm px-4 py-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTrips}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">{stats.upcomingTrips}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedTrips}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ${stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Trips */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
                  <button
                    onClick={() => router.push('/driver/schedule')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All →
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
                        className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {trip.user.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                trip.paymentStatus === 'Completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {trip.paymentStatus}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              📍 {trip.district}, {trip.state}
                            </p>
                            <p className="text-sm text-gray-600">
                              📅 {format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ${trip.totalPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Driver Share</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📅</span>
                    </div>
                    <p className="text-gray-600 mb-4">No upcoming trips</p>
                    <button
                      onClick={() => router.push('/driver/availability')}
                      className="btn-primary"
                    >
                      Set Availability
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/driver/onboarding')}
                  className="w-full btn-primary text-left flex items-center gap-3"
                >
                  <span className="text-xl">📄</span>
                  <span>Complete Onboarding</span>
                </button>
                <button
                  onClick={() => router.push('/driver/availability')}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <span className="text-xl">📅</span>
                  <span>Set Availability</span>
                </button>
                <button
                  onClick={() => router.push('/driver/schedule')}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <span className="text-xl">📋</span>
                  <span>View Schedule</span>
                </button>
                <button
                  onClick={() => router.push('/driver/earnings')}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <span className="text-xl">💰</span>
                  <span>View Earnings</span>
                </button>
              </div>
            </div>

            {/* Vehicle Info */}
            {driverProfile?.vehicleDetails && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Vehicle Info</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{driverProfile.vehicleType}</span>
                  </div>
                  {driverProfile.vehicleDetails.make && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make/Model:</span>
                      <span className="font-medium">
                        {driverProfile.vehicleDetails.make} {driverProfile.vehicleDetails.model}
                      </span>
                    </div>
                  )}
                  {driverProfile.vehicleDetails.year && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{driverProfile.vehicleDetails.year}</span>
                    </div>
                  )}
                  {driverProfile.pricing && (
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-bold text-primary-600">
                        ${driverProfile.pricing.perDay}/{driverProfile.pricing.currency === 'USD' ? 'day' : 'day'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

