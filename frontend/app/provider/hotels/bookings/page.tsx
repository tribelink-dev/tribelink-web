'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface Booking {
  _id: string;
  tripId: string;
  hotel: {
    _id: string;
    name: string;
    location: {
      district: string;
      state: string;
    };
  };
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: string;
  totalPrice: number;
  rooms: number;
  paymentStatus: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'upcoming' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'ACCOMMODATION_PROVIDER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchData();
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch hotels owned by this provider
      const hotelsResponse = await api.get('/hotels/owner/my-hotels');
      const myHotels = hotelsResponse.data.hotels || [];
      setHotels(myHotels);

      // Fetch bookings using the new endpoint
      const bookingsResponse = await api.get('/hotels/owner/bookings');
      const hotelBookings = bookingsResponse.data.bookings || [];
      setBookings(hotelBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Apply status filter
    if (filter === 'confirmed') {
      filtered = filtered.filter(b => b.status === 'confirmed');
    } else if (filter === 'pending') {
      filtered = filtered.filter(b => b.status === 'pending');
    } else if (filter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(b => {
        const checkIn = new Date(b.checkIn);
        return checkIn > now && b.status === 'confirmed';
      });
    } else if (filter === 'active') {
      const now = new Date();
      filtered = filtered.filter(b => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        return checkIn <= now && checkOut >= now && b.status === 'confirmed';
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.guestEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      'confirmed': 'bg-green-50 text-green-700 border-green-200',
      'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading bookings...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Hotel Bookings
              </h1>
              <p className="text-lg text-gray-600">Manage all your hotel reservations</p>
            </div>
            <Link
              href="/provider/hotels"
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by hotel name, guest name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2">
              {['all', 'confirmed', 'pending', 'upcoming', 'active'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === filterOption
                      ? 'bg-primary-600 text-white shadow-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="content-card">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery || filter !== 'all' ? 'No bookings found' : 'No bookings yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Bookings will appear here once guests make reservations at your hotels'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const checkIn = new Date(booking.checkIn);
              const checkOut = new Date(booking.checkOut);
              const now = new Date();
              const isActive = checkIn <= now && checkOut >= now && booking.status === 'confirmed';
              const isUpcoming = checkIn > now && booking.status === 'confirmed';

              return (
                <div
                  key={booking._id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🏨</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {booking.hotel.name}
                            </h3>
                            {getStatusBadge(booking.status)}
                            {isActive && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Active Stay
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Guest Information</p>
                              <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {booking.guestName}
                              </p>
                              <p className="flex items-center gap-2 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {booking.guestEmail}
                              </p>
                              {booking.guestPhone && (
                                <p className="flex items-center gap-2 mt-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {booking.guestPhone}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 mb-1">Booking Details</p>
                              <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Check-in: {checkIn.toLocaleDateString()}
                              </p>
                              <p className="flex items-center gap-2 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Check-out: {checkOut.toLocaleDateString()}
                              </p>
                              <p className="flex items-center gap-2 mt-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                {booking.hotel.location.district}, {booking.hotel.location.state}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-primary-600">
                          ${booking.totalPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment: {booking.paymentStatus}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary text-sm px-4 py-2">
                          View Details
                        </button>
                        {isActive && (
                          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                            Check-in
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

