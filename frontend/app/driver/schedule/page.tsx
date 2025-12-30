'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
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
    }>;
    hotel?: {
      name: string;
      address: string;
    };
  }>;
}

export default function DriverSchedulePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
      fetchTrips(parsedHost._id);
    }
  }, [router]);

  const fetchTrips = async (providerId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/trips/${providerId}`);
      setTrips(response.data.trips || []);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrips = () => {
    const now = new Date();
    let filtered = trips;

    if (filter === 'upcoming') {
      filtered = trips.filter(trip => new Date(trip.fromDate) > now);
    } else if (filter === 'completed') {
      filtered = trips.filter(trip => new Date(trip.toDate) < now);
    }

    return filtered.sort((a, b) => 
      new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
    );
  };

  const getTripsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return trips.filter(trip => {
      const fromDate = format(new Date(trip.fromDate), 'yyyy-MM-dd');
      const toDate = format(new Date(trip.toDate), 'yyyy-MM-dd');
      return dateStr >= fromDate && dateStr <= toDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading schedule...</div>
        </div>
      </div>
    );
  }

  const filteredTrips = getFilteredTrips();

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
                <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-gray-600 mt-1">View and manage your assigned trips</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/driver/availability')}
              className="btn-primary"
            >
              Set Availability
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              All Trips ({trips.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming ({trips.filter(t => new Date(t.fromDate) > new Date()).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({trips.filter(t => new Date(t.toDate) < new Date()).length})
            </button>
          </div>
        </div>

        {/* Trips List */}
        {filteredTrips.length > 0 ? (
          <div className="space-y-4">
            {filteredTrips.map((trip) => {
              const isUpcoming = new Date(trip.fromDate) > new Date();
              const isCompleted = new Date(trip.toDate) < new Date();
              
              return (
                <div
                  key={trip._id}
                  onClick={() => router.push(`/driver/trips/${trip._id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{trip.user.name}</h3>
                          <p className="text-sm text-gray-600">{trip.user.email}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isCompleted
                            ? 'bg-green-100 text-green-800'
                            : isUpcoming
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'In Progress'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">📍 Location</p>
                          <p className="font-medium text-gray-900">
                            {trip.district}, {trip.state}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">📅 Dates</p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(trip.fromDate), 'MMM dd, yyyy')} - {format(new Date(trip.toDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {trip.schedule && trip.schedule.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">📋 Activities</p>
                            <p className="font-medium text-gray-900">
                              {trip.schedule.reduce((acc, day) => acc + day.activities.length, 0)} activities scheduled
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">💰 Payment Status</p>
                          <p className={`font-medium ${
                            trip.paymentStatus === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {trip.paymentStatus}
                          </p>
                        </div>
                      </div>

                      {trip.user.phoneNumber && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <a
                            href={`tel:${trip.user.phoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {trip.user.phoneNumber}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${trip.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Driver Share: ${(trip.totalPrice * 0.8).toFixed(2)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/driver/trips/${trip._id}`);
                        }}
                        className="mt-4 btn-primary w-full md:w-auto"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'upcoming' 
                ? "You don't have any upcoming trips scheduled."
                : filter === 'completed'
                ? "You haven't completed any trips yet."
                : "You don't have any trips assigned yet."}
            </p>
            <button
              onClick={() => router.push('/driver/availability')}
              className="btn-primary"
            >
              Set Your Availability
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
