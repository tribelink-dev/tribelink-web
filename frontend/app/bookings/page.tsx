'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/CurrencyContext';
import {
  Calendar,
  Users,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
  FileText,
} from 'lucide-react';

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
      abodeDetails?: { title: string };
      location?: { state: string; district: string };
    };
    checkIn: string;
    checkOut: string;
    numberOfGuests: number;
  };
  experience?: {
    experienceId?: { title: string };
    date: string;
    startTime: string;
    numberOfParticipants: number;
  };
  event?: {
    eventId?: { title: string };
    ticketCount: number;
    ticketTier?: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
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
    if (searchParams.get('success') === 'true') fetchBookings();
  }, [searchParams]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.bookingType = typeFilter;
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
            { label: 'Location', value: booking.abodeStay?.localHost?.location ? `${booking.abodeStay.localHost.location.district}, ${booking.abodeStay.localHost.location.state}` : 'N/A' },
          ],
        };
      case 'EXPERIENCE':
        return {
          icon: '🎯',
          details: [
            { label: 'Date', value: booking.experience?.date ? new Date(booking.experience.date).toLocaleDateString() : 'N/A' },
            { label: 'Time', value: booking.experience?.startTime || 'N/A' },
            { label: 'Participants', value: booking.experience?.numberOfParticipants || 1 },
          ],
        };
      case 'EVENT':
        return {
          icon: '🎪',
          details: [
            { label: 'Tickets', value: booking.event?.ticketCount || 1 },
            { label: 'Tier', value: booking.event?.ticketTier || 'General' },
          ],
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
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-charcoal-100 text-charcoal-600">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3" />
        Pending Payment
      </span>
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && booking.paymentStatus !== 'Pending') return false;
      if (statusFilter === 'paid' && booking.paymentStatus !== 'Completed') return false;
      if (statusFilter === 'cancelled' && booking.status !== 'Cancelled') return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-heritage-gold border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-heritage-gold/10 p-4 rounded-2xl">
              <FileText className="w-8 h-8 text-heritage-gold" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">View and manage your bookings</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchBookings();
                }}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Payment</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  fetchBookings();
                }}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
              >
                <option value="all">All Types</option>
                <option value="ABODE_STAY">Abode Stays</option>
                <option value="EXPERIENCE">Experiences</option>
                <option value="EVENT">Events</option>
              </select>
            </div>
          </div>
        </motion.div>

        {filteredBookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-200"
          >
            <FileText className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-charcoal-700 mb-4">No bookings found</h2>
            <p className="text-charcoal-600 mb-8">
              {statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Book an abode or experience to see it here.'}
            </p>
            {statusFilter === 'all' && typeFilter === 'all' && (
              <motion.button
                onClick={() => router.push('/explore')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Explore
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking, index) => {
              const details = getBookingDetails(booking);
              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{details.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-charcoal-700">
                              {getBookingTitle(booking)}
                            </h3>
                            {getStatusBadge(booking.status, booking.paymentStatus)}
                          </div>
                          <p className="text-sm text-charcoal-400 mb-4">
                            ID: {booking._id.slice(-8).toUpperCase()}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {details.details.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-charcoal-600">
                                {d.label === 'Check-in' || d.label === 'Date' ? (
                                  <Calendar className="w-4 h-4 text-heritage-gold flex-shrink-0" />
                                ) : d.label === 'Guests' || d.label === 'Participants' || d.label === 'Tickets' ? (
                                  <Users className="w-4 h-4 text-heritage-gold flex-shrink-0" />
                                ) : d.label === 'Location' ? (
                                  <MapPin className="w-4 h-4 text-heritage-gold flex-shrink-0" />
                                ) : null}
                                <span className="font-medium">{d.label}:</span>
                                <span className="text-charcoal-700">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-56 flex flex-col justify-between gap-4 md:border-l md:border-gray-200 md:pl-6">
                      <div>
                        <p className="text-sm text-charcoal-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-heritage-gold">
                          {formatPrice(booking.totalPrice, booking.currency || 'USD')}
                        </p>
                        <p className="text-xs text-charcoal-400 mt-1">
                          Payment: {booking.paymentStatus}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {booking.paymentStatus === 'Pending' && (
                          <motion.button
                            onClick={() => handlePay(booking._id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Pay Now
                          </motion.button>
                        )}
                        {booking.paymentStatus === 'Completed' && (
                          <button
                            onClick={() => router.push(`/bookings/${booking._id}`)}
                            className="w-full px-4 py-3 border-2 border-charcoal-200 text-charcoal-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
