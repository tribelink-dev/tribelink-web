'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Trip {
  _id: string;
  fromDate: string;
  toDate: string;
  totalPrice: number;
  paymentStatus: string;
  user: {
    name: string;
  };
}

interface EarningsData {
  totalEarnings: number;
  completedTrips: number;
  pendingEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  trips: Trip[];
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    completedTrips: 0,
    pendingEarnings: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    trips: []
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

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
      fetchEarnings(parsedHost._id);
    }
  }, [router]);

  const fetchEarnings = async (providerId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/trips/${providerId}`);
      const trips = response.data.trips || [];

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const completedTrips = trips.filter((trip: Trip) => 
        trip.paymentStatus === 'Completed' && new Date(trip.toDate) < now
      );

      const pendingTrips = trips.filter((trip: Trip) => 
        trip.paymentStatus === 'Pending'
      );

      const thisMonthTrips = completedTrips.filter((trip: Trip) => {
        const tripDate = new Date(trip.toDate);
        return tripDate.getMonth() === thisMonth && tripDate.getFullYear() === thisYear;
      });

      const lastMonthTrips = completedTrips.filter((trip: Trip) => {
        const tripDate = new Date(trip.toDate);
        return tripDate.getMonth() === lastMonth && tripDate.getFullYear() === lastMonthYear;
      });

      const calculateEarnings = (tripList: Trip[]) => {
        return tripList.reduce((sum, trip) => sum + (trip.totalPrice * 0.8), 0);
      };

      setEarnings({
        totalEarnings: calculateEarnings(completedTrips),
        completedTrips: completedTrips.length,
        pendingEarnings: calculateEarnings(pendingTrips),
        thisMonthEarnings: calculateEarnings(thisMonthTrips),
        lastMonthEarnings: calculateEarnings(lastMonthTrips),
        trips: trips
      });
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrips = () => {
    const now = new Date();
    let filtered = earnings.trips;

    if (filter === 'completed') {
      filtered = earnings.trips.filter((trip: Trip) => 
        trip.paymentStatus === 'Completed' && new Date(trip.toDate) < now
      );
    } else if (filter === 'pending') {
      filtered = earnings.trips.filter((trip: Trip) => 
        trip.paymentStatus === 'Pending'
      );
    }

    return filtered.sort((a: Trip, b: Trip) => 
      new Date(b.toDate).getTime() - new Date(a.toDate).getTime()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading earnings...</div>
        </div>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();
  const driverShareRate = 0.8; // 80% to driver

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/driver/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Earnings & Analytics</h1>
                <p className="text-gray-600 mt-1">Track your earnings and performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm font-medium mb-2">Total Earnings</p>
            <p className="text-3xl font-bold">${earnings.totalEarnings.toFixed(2)}</p>
            <p className="text-green-100 text-xs mt-2">{earnings.completedTrips} completed trips</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-2">This Month</p>
            <p className="text-3xl font-bold">${earnings.thisMonthEarnings.toFixed(2)}</p>
            <p className="text-blue-100 text-xs mt-2">
              {earnings.lastMonthEarnings > 0 && (
                <span>
                  {earnings.thisMonthEarnings > earnings.lastMonthEarnings ? '↑' : '↓'}{' '}
                  {Math.abs(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(1)}% vs last month
                </span>
              )}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-yellow-100 text-sm font-medium mb-2">Pending Earnings</p>
            <p className="text-3xl font-bold">${earnings.pendingEarnings.toFixed(2)}</p>
            <p className="text-yellow-100 text-xs mt-2">Awaiting payment</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-purple-100 text-sm font-medium mb-2">Last Month</p>
            <p className="text-3xl font-bold">${earnings.lastMonthEarnings.toFixed(2)}</p>
            <p className="text-purple-100 text-xs mt-2">Previous period</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Trips
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({earnings.completedTrips})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({earnings.trips.filter((t: Trip) => t.paymentStatus === 'Pending').length})
            </button>
          </div>
        </div>

        {/* Earnings List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Trip Earnings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip: Trip) => {
                const driverEarnings = trip.totalPrice * driverShareRate;
                const isCompleted = trip.paymentStatus === 'Completed';
                
                return (
                  <div
                    key={trip._id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{trip.user.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {trip.paymentStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(new Date(trip.fromDate), 'MMM dd')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${driverEarnings.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${trip.totalPrice.toFixed(2)} total
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-gray-600">No trips found</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How Earnings Work</h3>
              <p className="text-sm text-blue-800">
                You receive {driverShareRate * 100}% of the total trip price as your driver share. 
                Earnings are calculated when trips are completed and payment is received. 
                Pending earnings will be paid out once the traveler completes payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

