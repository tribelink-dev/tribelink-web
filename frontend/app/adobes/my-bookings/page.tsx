'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AbodeSidebar from '@/components/AbodeSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Booking {
  _id: string;
  bookingType: 'ABODE_STAY' | 'EXPERIENCE' | 'EVENT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  createdAt: string;
  abodeStay?: {
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
  const [abodeId, setAbodeId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      if (host) {
        try {
          const hostData = JSON.parse(host);
          if (hostData.providerType !== 'LOCAL_HOST') {
            router.push('/host/dashboard');
            return;
          }
          fetchAbodeId();
        } catch (e) {
          router.push('/host/login');
        }
      } else {
        router.push('/host/login');
      }
    }
  }, [router]);

  const fetchAbodeId = async () => {
    try {
      const response = await api.get('/abodes/owner/my-abodes');
      if (response.data.abodes && response.data.abodes.length > 0) {
        setAbodeId(response.data.abodes[0]._id);
        fetchBookings(response.data.abodes[0]._id);
      } else {
        setError('No abode profile found. Please register your abode first.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching abode ID:', err);
      setError('Failed to load abode profile');
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

      const response = await api.get(`/abodes/${id}/bookings`, { params });
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (abodeId) {
      fetchBookings(abodeId);
    }
  }, [statusFilter, abodeId]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await api.put(`/bookings/${bookingId}`, { status: newStatus });
      toast.success('Booking status updated successfully');
      if (abodeId) {
        fetchBookings(abodeId);
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      toast.error(err.response?.data?.message || 'Failed to update booking status');
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
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '✓';
      case 'PENDING':
        return '⏳';
      case 'CANCELLED':
        return '✕';
      case 'COMPLETED':
        return '✓';
      default:
        return '•';
    }
  };

  if (loading && !abodeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AbodeSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-slate-900">Loading bookings...</div>
          </div>
        </div>
      </div>
    );
  }

  const filterButtons = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AbodeSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-700 to-slate-800 p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Bookings</h1>
                    <p className="text-white/90 text-lg">Manage all your abode bookings</p>
                  </div>
                </div>
                
                {bookings.length > 0 && (
                  <div className="mt-6 flex items-center gap-6">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Total Bookings</div>
                      <div className="text-white text-3xl font-bold">{bookings.length}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Total Revenue</div>
                      <div className="text-white text-3xl font-bold">
                        ₹{bookings.reduce((sum, b) => sum + b.totalPrice, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}

          {/* Status Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex flex-wrap gap-3"
          >
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-6 py-3 rounded-xl transition-all font-medium ${
                  statusFilter === filter.value
                    ? 'bg-gradient-to-r from-slate-600 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </motion.div>

          {/* Bookings List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-xl p-6 animate-pulse border border-slate-100">
                  <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl shadow-xl border border-slate-100"
            >
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                No bookings found
              </h3>
              <p className="text-slate-600 mb-6">
                {statusFilter === 'all'
                  ? "You don't have any bookings yet."
                  : `No ${statusFilter.toLowerCase()} bookings.`}
              </p>
              <button
                onClick={() => router.push('/adobes/register')}
                className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-medium rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Register Your Abode
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
                  className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 hover:shadow-2xl transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">
                            Booking #{booking._id.slice(-8).toUpperCase()}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                            </span>
                            {booking.abodeStay && (
                              <>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {format(new Date(booking.abodeStay.checkIn), 'MMM dd')} -{' '}
                                  {format(new Date(booking.abodeStay.checkOut), 'MMM dd, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  {booking.abodeStay.guests} guest{booking.abodeStay.guests !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 flex items-center gap-2 ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          <span>{getStatusIcon(booking.status)}</span>
                          {booking.status}
                        </span>
                      </div>

                      {/* Guest Info */}
                      <div className="mb-4 p-4 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Guest Information
                        </h4>
                        <div className="space-y-2 text-sm text-slate-700">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">Name:</span> {booking.user.name}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">Email:</span> {booking.user.email}
                          </p>
                          {booking.user.phoneNumber && (
                            <p className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">Phone:</span> {booking.user.phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-slate-900">
                          ₹{booking.totalPrice.toFixed(2)}
                        </span>
                        <span className="text-slate-500">total</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking._id, 'CONFIRMED')}
                            className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Booking
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking._id, 'CANCELLED')}
                            className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Booking
                          </button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(booking._id, 'COMPLETED')}
                          className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
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
                          className="px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
