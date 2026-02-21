'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, Users, MapPin, CreditCard, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface Booking {
  _id: string;
  bookingType: 'ABODE_STAY' | 'EXPERIENCE' | 'EVENT';
  status: string;
  paymentStatus: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  abodeStay?: {
    localHost?: {
      abodeDetails?: {
        title: string;
      };
      location?: {
        state: string;
        district: string;
      };
    };
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
  };
  experience?: {
    experienceId?: {
      title: string;
    };
    date: string;
    startTime: string;
    numberOfParticipants: number;
  };
  event?: {
    eventId?: {
      title: string;
    };
    ticketCount: number;
    ticketTier?: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/bookings')}`);
      return;
    }
    fetchBookings();
  }, [user, router]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Refresh bookings after successful checkout
      fetchBookings();
    }
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        params.bookingType = typeFilter;
      }

      const response = await api.get('/bookings', { params });
      setBookings(response.data.bookings || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (bookingId: string) => {
    sessionStorage.setItem('bookingId', bookingId);
    router.push(`/bookings/payment?id=${bookingId}`);
  };

  const getBookingTitle = (booking: Booking) => {
    switch (booking.bookingType) {
      case 'ABODE_STAY':
        return booking.abodeStay?.localHost?.abodeDetails?.title || 'Abode Stay';
      case 'EXPERIENCE':
        return booking.experience?.experienceId?.title || 'Experience';
      case 'EVENT':
        return booking.event?.eventId?.title || 'Event';
      default:
        return 'Booking';
    }
  };

  const getBookingDetails = (booking: Booking) => {
    switch (booking.bookingType) {
      case 'ABODE_STAY':
        return {
          icon: '🏠',
          details: [
            { label: 'Check-in', value: booking.abodeStay?.checkIn ? new Date(booking.abodeStay.checkIn).toLocaleDateString() : 'N/A' },
            { label: 'Check-out', value: booking.abodeStay?.checkOut ? new Date(booking.abodeStay.checkOut).toLocaleDateString() : 'N/A' },
            { label: 'Guests', value: booking.abodeStay?.numberOfGuests || 1 },
            { label: 'Location', value: booking.abodeStay?.localHost?.location ? `${booking.abodeStay.localHost.location.district}, ${booking.abodeStay.localHost.location.state}` : 'N/A' }
          ]
        };
      case 'EXPERIENCE':
        return {
          icon: '🎯',
          details: [
            { label: 'Date', value: booking.experience?.date ? new Date(booking.experience.date).toLocaleDateString() : 'N/A' },
            { label: 'Time', value: booking.experience?.startTime || 'N/A' },
            { label: 'Participants', value: booking.experience?.numberOfParticipants || 1 }
          ]
        };
      case 'EVENT':
        return {
          icon: '🎪',
          details: [
            { label: 'Tickets', value: booking.event?.ticketCount || 1 },
            { label: 'Tier', value: booking.event?.ticketTier || 'General' }
          ]
        };
      default:
        return { icon: '📋', details: [] };
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Paid
        </span>
      );
    }
    if (paymentStatus === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Payment Failed
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3" />
        Pending Payment
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
          <div className="text-2xl font-semibold text-white">Loading bookings...</div>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && booking.paymentStatus !== 'Pending') return false;
      if (statusFilter === 'paid' && booking.paymentStatus !== 'Completed') return false;
      if (statusFilter === 'cancelled' && booking.status !== 'Cancelled') return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        <div className="mb-8">
          <h1 className="heading-primary text-gray-900 mb-2">My Bookings</h1>
          <p className="text-subtitle text-gray-600">View and manage all your bookings</p>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="content-card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchBookings();
                }}
                className="input-field w-full"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  fetchBookings();
                }}
                className="input-field w-full"
              >
                <option value="all">All Types</option>
                <option value="ABODE_STAY">Abode Stays</option>
                <option value="EXPERIENCE">Experiences</option>
                <option value="EVENT">Events</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="content-card text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="heading-secondary text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start exploring and make your first booking!'}
            </p>
            {statusFilter === 'all' && typeFilter === 'all' && (
              <button
                onClick={() => router.push('/explore')}
                className="btn-primary"
              >
                Explore Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const details = getBookingDetails(booking);
              return (
                <div key={booking._id} className="content-card">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-4xl">{details.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="heading-tertiary text-gray-900">
                              {getBookingTitle(booking)}
                            </h3>
                            {getStatusBadge(booking.status, booking.paymentStatus)}
                          </div>
                          <p className="text-sm text-gray-500 mb-4">
                            Booking ID: {booking._id.slice(-8).toUpperCase()}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {details.details.map((detail, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {detail.label === 'Check-in' || detail.label === 'Date' ? (
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                ) : detail.label === 'Guests' || detail.label === 'Participants' || detail.label === 'Tickets' ? (
                                  <Users className="w-4 h-4 text-gray-400" />
                                ) : detail.label === 'Location' ? (
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                ) : null}
                                <span className="text-gray-600 font-medium">{detail.label}:</span>
                                <span className="text-gray-900">{detail.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-64 flex flex-col justify-between gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {booking.currency || 'USD'} {booking.totalPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment: {booking.paymentStatus}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {booking.paymentStatus === 'Pending' && (
                          <button
                            onClick={() => handlePay(booking._id)}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </button>
                        )}
                        {booking.paymentStatus === 'Completed' && (
                          <button
                            onClick={() => router.push(`/bookings/${booking._id}`)}
                            className="btn-secondary w-full flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

