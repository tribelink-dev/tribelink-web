'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Booking {
  _id: string;
  bookingType: 'ADOBE_STAY' | 'EXPERIENCE' | 'EVENT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  createdAt: string;
  adobeStay?: {
    localHost: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  trip?: {
    _id: string;
    destination: string;
  };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adobeId, setAdobeId] = useState<string | null>(null);

  useEffect(() => {
    // Get adobe ID from localStorage or query params
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      if (host) {
        try {
          const hostData = JSON.parse(host);
          // We'll need to fetch the LocalHost profile to get the ID
          fetchAdobeId();
        } catch (e) {
          router.push('/host/login');
        }
      } else {
        router.push('/host/login');
      }
    }
  }, [router]);

  const fetchAdobeId = async () => {
    try {
      // Fetch the host's adobe profile
      const response = await api.get('/adobes', {
        params: { limit: 1 },
      });
      
      if (response.data.localHosts && response.data.localHosts.length > 0) {
        setAdobeId(response.data.localHosts[0]._id);
        fetchBookings(response.data.localHosts[0]._id);
      } else {
        setError('No adobe profile found. Please register your adobe first.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching adobe ID:', err);
      setError('Failed to load adobe profile');
      setLoading(false);
    }
  };

  const fetchBookings = async (id: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get(`/adobes/${id}/bookings`, { params });
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adobeId) {
      fetchBookings(adobeId);
    }
  }, [statusFilter, adobeId]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus });
      if (adobeId) {
        fetchBookings(adobeId);
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-charcoal-100 text-charcoal-700 border-charcoal-200';
    }
  };

  if (loading && !adobeId) {
    return (
      <div className="min-h-screen bg-off-white pt-24 pb-16">
        <div className="section-container-luxury">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-charcoal-200 rounded-lg w-1/3"></div>
            <div className="h-64 bg-charcoal-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-16">
      <div className="section-container-luxury">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-display-md font-serif text-charcoal-700 mb-4">
            My Bookings
          </h1>
          <p className="text-lg text-charcoal-600">
            Manage bookings for your adobe
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-2"
        >
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-heritage-gold text-white'
                : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-heritage-gold text-white'
                : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'CONFIRMED'
                ? 'bg-heritage-gold text-white'
                : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-heritage-gold text-white'
                : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'CANCELLED'
                ? 'bg-heritage-gold text-white'
                : 'bg-white text-charcoal-700 border border-charcoal-200 hover:bg-charcoal-50'
            }`}
          >
            Cancelled
          </button>
        </motion.div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-luxury p-6 animate-pulse">
                <div className="h-6 bg-charcoal-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-charcoal-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-2xl shadow-luxury"
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-semibold text-charcoal-700 mb-2">
              No bookings found
            </h3>
            <p className="text-charcoal-600 mb-6">
              {statusFilter === 'all'
                ? "You don't have any bookings yet."
                : `No ${statusFilter.toLowerCase()} bookings.`}
            </p>
            <button
              onClick={() => router.push('/adobes/register')}
              className="px-6 py-3 bg-heritage-gold text-white font-medium rounded-lg hover:bg-heritage-gold-dark transition-all"
            >
              Register Your Adobe
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-luxury p-6 border border-charcoal-100"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-charcoal-700 mb-2">
                          Booking #{booking._id.slice(-8).toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-charcoal-600 mb-4">
                          <span>
                            {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                          </span>
                          {booking.adobeStay && (
                            <>
                              <span>
                                {format(new Date(booking.adobeStay.checkIn), 'MMM dd')} -{' '}
                                {format(new Date(booking.adobeStay.checkOut), 'MMM dd, yyyy')}
                              </span>
                              <span>{booking.adobeStay.guests} guest{booking.adobeStay.guests !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Guest Info */}
                    <div className="mb-4 p-4 bg-cream-50 rounded-lg">
                      <h4 className="font-medium text-charcoal-700 mb-2">Guest Information</h4>
                      <div className="space-y-1 text-sm text-charcoal-600">
                        <p>
                          <span className="font-medium">Name:</span> {booking.user.name}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {booking.user.email}
                        </p>
                        {booking.user.phoneNumber && (
                          <p>
                            <span className="font-medium">Phone:</span> {booking.user.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-charcoal-700">
                        ₹{booking.totalPrice.toFixed(2)}
                      </span>
                      <span className="text-charcoal-500">total</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(booking._id, 'CONFIRMED')}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                        >
                          Confirm Booking
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking._id, 'CANCELLED')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          Cancel Booking
                        </button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(booking._id, 'COMPLETED')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {booking.trip?._id && (
                      <button
                        onClick={() => {
                          const tripId = booking.trip?._id;
                          if (tripId) {
                            router.push(`/trips/${tripId}`);
                          }
                        }}
                        className="px-4 py-2 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-all"
                      >
                        View Trip
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

