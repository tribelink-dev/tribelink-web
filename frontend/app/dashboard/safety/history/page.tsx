'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';

interface EmergencyEvent {
  _id: string;
  eventType: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  message?: string;
  contactsNotified: Array<{
    name: string;
    phone: string;
    status: string;
  }>;
  resolved: boolean;
  createdAt: string;
  trip?: {
    district: string;
    state: string;
  };
}

export default function SOSHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/safety/sos/history');
      setEvents(response.data.events || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load SOS history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 h-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-below-nav pb-sos-clear">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                SOS History
              </h1>
              <p className="text-lg text-gray-600">View your emergency SOS activations</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}
        </div>

        {/* Events List */}
        <div className="content-card">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No SOS events yet</h3>
              <p className="text-gray-600">Your emergency SOS activations will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="border border-gray-200 rounded-xl p-6 hover:border-red-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🚨</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Emergency SOS</h3>
                        <p className="text-sm text-gray-600">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.resolved 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {event.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {event.location.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location.address}</span>
                      </div>
                    )}

                    {event.trip && (
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <span>{event.trip.district}, {event.trip.state}</span>
                      </div>
                    )}

                    {event.message && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <p className="font-medium mb-1">Message:</p>
                        <p>{event.message}</p>
                      </div>
                    )}

                    {event.contactsNotified && event.contactsNotified.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Contacts Notified ({event.contactsNotified.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.contactsNotified.map((contact, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium"
                            >
                              {contact.name}
                              <span className={`w-2 h-2 rounded-full ${
                                contact.status === 'sent' ? 'bg-green-500' : 
                                contact.status === 'failed' ? 'bg-red-500' : 
                                'bg-yellow-500'
                              }`}></span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

