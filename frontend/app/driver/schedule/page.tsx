'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Trip {
  _id: string;
  user: {
    _id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  fromDate: string;
  toDate: string;
  country: string;
  state: string;
  district: string;
  locations: Array<{ state: string; district: string }>;
  schedule: Array<{
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
  totalPrice: number;
  paymentStatus: string;
}

export default function DriverSchedulePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
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
      fetchAssignedTrips(parsedHost._id);
    }
  }, [router]);

  const fetchAssignedTrips = async (driverId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/trips/${driverId}`);
      setTrips(response.data.trips || []);
      
      // Auto-select first trip if available
      if (response.data.trips && response.data.trips.length > 0) {
        setSelectedTrip(response.data.trips[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load trips');
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/provider/drivers')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                <p className="text-sm text-gray-600">View and manage your assigned trips</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Active Trips</p>
                <p className="text-xl font-bold text-primary-600">{trips.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-soft border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Trips Assigned</h3>
            <p className="text-gray-600 mb-6">You don't have any trips assigned yet. Complete your onboarding to start receiving trip requests.</p>
            <button
              onClick={() => router.push('/driver/onboarding')}
              className="btn-primary"
            >
              Complete Onboarding
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trips List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Assigned Trips</h2>
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all ${
                    selectedTrip?._id === trip._id
                      ? 'border-primary-500 bg-primary-50/30 shadow-medium'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {trip.locations[0]?.district || trip.district}, {trip.locations[0]?.state || trip.state}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(trip.fromDate), 'MMM d')} - {format(new Date(trip.toDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      trip.paymentStatus === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {trip.paymentStatus}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{trip.user.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trip Details */}
            {selectedTrip && (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-large border border-gray-200 overflow-hidden">
                  {/* Trip Header */}
                  <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Trip Schedule</h2>
                        <p className="text-primary-100">
                          {format(new Date(selectedTrip.fromDate), 'MMMM d')} - {format(new Date(selectedTrip.toDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary-100">Traveler</p>
                        <p className="text-lg font-bold">{selectedTrip.user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedTrip.locations[0]?.district || selectedTrip.district}, {selectedTrip.locations[0]?.state || selectedTrip.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{Math.ceil((new Date(selectedTrip.toDate).getTime() - new Date(selectedTrip.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Traveler Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <a href={`tel:${selectedTrip.user.phoneNumber}`} className="text-sm font-medium text-primary-600 hover:underline">
                          {selectedTrip.user.phoneNumber}
                        </a>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <a href={`mailto:${selectedTrip.user.email}`} className="text-sm font-medium text-primary-600 hover:underline">
                          {selectedTrip.user.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Schedule */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Itinerary</h3>
                    <div className="space-y-6">
                      {selectedTrip.schedule.map((day, dayIndex) => {
                        const dayDate = new Date(day.date);
                        const hasChauffeur = day.chauffeur;
                        const hasActivities = day.activities && day.activities.length > 0;
                        
                        return (
                          <div
                            key={dayIndex}
                            className="border-2 border-gray-200 rounded-xl overflow-hidden"
                          >
                            {/* Day Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
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

                            {/* Day Content */}
                            <div className="p-6 space-y-4">
                              {/* Activities */}
                              {hasActivities ? (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Activities ({day.activities.length})
                                  </h5>
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
                                        <p className="text-xs text-gray-500 mt-1">
                                          Duration: {activity.duration} hours
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                  <p className="text-sm text-gray-500">No activities scheduled for this day</p>
                                </div>
                              )}

                              {/* Hotel */}
                              {day.hotel && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                                  <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <div className="flex-1">
                                      <h6 className="font-semibold text-gray-900 mb-1">Hotel: {day.hotel.name}</h6>
                                      {day.hotel.address && (
                                        <p className="text-sm text-gray-600">{day.hotel.address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Guide */}
                              {day.guide && (
                                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                                  <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div>
                                      <h6 className="font-semibold text-gray-900">Guide: {day.guide.name}</h6>
                                      <p className="text-sm text-gray-600">Local guide will accompany the traveler</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Chauffeur Instructions */}
                              {hasChauffeur && (
                                <div className="bg-primary-50 border-2 border-primary-200 p-4 rounded-lg">
                                  <h6 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Your Instructions
                                  </h6>
                                  <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
                                    {hasActivities && (
                                      <li>Pick up traveler from {day.hotel ? day.hotel.name : 'accommodation'} before first activity</li>
                                    )}
                                    {day.activities.map((activity, idx) => (
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

