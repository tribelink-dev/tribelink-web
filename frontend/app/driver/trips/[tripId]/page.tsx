'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
      duration: number;
      provider?: {
        name: string;
      };
    }>;
    hotel?: {
      name: string;
      address: string;
    };
    chauffeur: boolean;
    guide?: {
      name: string;
    };
  }>;
}

export default function DriverTripDetailsPage() {
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
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      if (tripId) {
        fetchTripDetails(parsedHost._id, tripId);
      }
    }
  }, [router, tripId]);

  const fetchTripDetails = async (driverId: string, tripId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/trips/${driverId}`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading trip details...</div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested trip could not be found.'}</p>
          <button
            onClick={() => router.push('/driver/schedule')}
            className="btn-primary"
          >
            Back to Schedule
          </button>
        </div>
      </div>
    );
  }

  const driverEarnings = trip.totalPrice * 0.8;
  const isUpcoming = new Date(trip.fromDate) > new Date();
  const isCompleted = new Date(trip.toDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/driver/schedule')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trip Details</h1>
              <p className="text-gray-600 mt-1">View complete trip information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Trip Overview</h2>
                    <p className="text-primary-100">
                      {format(new Date(trip.fromDate), 'MMMM d')} - {format(new Date(trip.toDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    isCompleted
                      ? 'bg-green-500'
                      : isUpcoming
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}>
                    {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'In Progress'}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{trip.district}, {trip.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {Math.ceil((new Date(trip.toDate).getTime() - new Date(trip.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Traveler Info */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Traveler Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{trip.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a href={`mailto:${trip.user.email}`} className="font-medium text-primary-600 hover:underline">
                      {trip.user.email}
                    </a>
                  </div>
                  {trip.user.phoneNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <a href={`tel:${trip.user.phoneNumber}`} className="font-medium text-primary-600 hover:underline">
                        {trip.user.phoneNumber}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              {trip.schedule && trip.schedule.length > 0 && (
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Itinerary</h3>
                  <div className="space-y-6">
                    {trip.schedule.map((day, dayIndex) => {
                      const dayDate = new Date(day.date);
                      const hasChauffeur = day.chauffeur;
                      
                      return (
                        <div
                          key={dayIndex}
                          className="border-2 border-gray-200 rounded-xl overflow-hidden"
                        >
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">
                                  Day {dayIndex + 1}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {format(dayDate, 'EEEE, MMMM d, yyyy')}
                                </p>
                              </div>
                              {hasChauffeur && (
                                <div className="flex items-center gap-2 bg-primary-100 px-3 py-1.5 rounded-full">
                                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-primary-700">Your Service Required</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-6 space-y-4">
                            {day.activities && day.activities.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">Activities</h5>
                                <div className="space-y-3">
                                  {day.activities.map((activity, actIndex) => (
                                    <div
                                      key={actIndex}
                                      className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <h6 className="font-semibold text-gray-900">{activity.title}</h6>
                                        <span className="text-sm font-medium text-blue-700">
                                          {activity.startTime} - {activity.endTime}
                                        </span>
                                      </div>
                                      {activity.provider && (
                                        <p className="text-sm text-gray-600">
                                          Host: {activity.provider.name}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {day.hotel && (
                              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                                <h6 className="font-semibold text-gray-900 mb-1">Hotel: {day.hotel.name}</h6>
                                {day.hotel.address && (
                                  <p className="text-sm text-gray-600">{day.hotel.address}</p>
                                )}
                              </div>
                            )}

                            {hasChauffeur && (
                              <div className="bg-primary-50 border-2 border-primary-200 p-4 rounded-lg">
                                <h6 className="font-semibold text-primary-900 mb-2">Your Instructions</h6>
                                <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                                  {day.activities && day.activities.length > 0 && (
                                    <li>Pick up traveler from {day.hotel ? day.hotel.name : 'accommodation'} before first activity</li>
                                  )}
                                  {day.activities?.map((activity, idx) => (
                                    <li key={idx}>
                                      Drive to {activity.title} by {activity.startTime}
                                    </li>
                                  ))}
                                  {day.hotel && (
                                    <li>Drop off at {day.hotel.name} after last activity</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Earnings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Trip Price</p>
                  <p className="text-2xl font-bold text-gray-900">${trip.totalPrice.toFixed(2)}</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Your Share (80%)</p>
                  <p className="text-3xl font-bold text-primary-600">${driverEarnings.toFixed(2)}</p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    trip.paymentStatus === 'Completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trip.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {trip.user.phoneNumber && (
                  <a
                    href={`tel:${trip.user.phoneNumber}`}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Traveler
                  </a>
                )}
                <a
                  href={`mailto:${trip.user.email}`}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Traveler
                </a>
                <button
                  onClick={() => router.push('/driver/schedule')}
                  className="w-full btn-secondary"
                >
                  Back to Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

