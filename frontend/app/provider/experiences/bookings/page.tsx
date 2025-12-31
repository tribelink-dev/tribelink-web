'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

interface Booking {
  _id: string;
  ticketId: string;
  experience: {
    _id: string;
    title: string;
    imageUrl?: string;
  };
  experienceDetails: {
    title: string;
    price: number;
    duration: number;
    location: {
      district: string;
      state: string;
      country: string;
    };
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  trip: {
    _id: string;
    fromDate: string;
    toDate: string;
  };
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'verified' | 'cancelled' | 'expired';
  verifiedAt?: string;
  createdAt: string;
}

export default function ExperienceBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (dateFilter) {
        params.date = dateFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get('/tickets/provider/verifications', { params });
      const fetchedBookings = response.data.tickets || [];
      console.log(`Fetched ${fetchedBookings.length} bookings for provider`);
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    // Check if user is logged in as host
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'EXPERIENCE_HOST') {
        router.push('/host/dashboard');
        return;
      }
    }
    fetchBookings();
    
    // Refresh when page becomes visible (e.g., after new bookings)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings();
      }
    };
    
    // Refresh when window gains focus
    const handleFocus = () => {
      fetchBookings();
    };
    
    // Refresh bookings every 30 seconds
    const interval = setInterval(() => {
      fetchBookings();
    }, 30000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, dateFilter, statusFilter, fetchBookings]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter]);

  const filterBookings = () => {
    let filtered = [...bookings];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.experienceDetails.title.toLowerCase().includes(query) ||
        booking.ticketId.toLowerCase().includes(query) ||
        booking.user.name.toLowerCase().includes(query) ||
        booking.user.email.toLowerCase().includes(query)
      );
    }

    // Sort by date and time (upcoming first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });

    setFilteredBookings(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': 'bg-blue-50 text-blue-700 border-blue-200',
      'verified': 'bg-green-50 text-green-700 border-green-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
      'expired': 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['active'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };


  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    verified: bookings.filter(b => b.status === 'verified').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.experienceDetails.price || 0), 0)
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600">
                View and manage all bookings for your experiences
              </p>
            </div>
            <button
              onClick={() => router.push('/host/dashboard')}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card-professional p-4">
              <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="card-professional p-4">
              <div className="text-sm text-gray-600 mb-1">Active</div>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            </div>
            <div className="card-professional p-4">
              <div className="text-sm text-gray-600 mb-1">Verified</div>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </div>
            <div className="card-professional p-4">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-primary-600">${stats.totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="content-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by experience, ticket ID, or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="verified">Verified</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">
              {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
            </p>
            <p className="text-gray-500 mb-6">
              {bookings.length === 0 
                ? 'Bookings will appear here once customers book your experiences'
                : 'Try adjusting your search or filter criteria'}
            </p>
            {bookings.length === 0 && (
              <button
                onClick={() => router.push('/host/experiences/add')}
                className="btn-primary"
              >
                Create Your First Experience
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const imageUrl = getImageUrl(booking.experience?.imageUrl);
              const scheduledDateTime = new Date(booking.scheduledDate);
              const isUpcoming = scheduledDateTime >= new Date();
              
              return (
                <div
                  key={booking._id}
                  className="card-professional card-hover overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Experience Image */}
                    {imageUrl ? (
                      <div className="w-full md:w-48 h-48 bg-gray-100 flex items-center justify-center overflow-hidden rounded-xl flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={booking.experienceDetails.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-48 h-48 bg-gradient-primary flex items-center justify-center rounded-xl flex-shrink-0">
                        <span className="text-6xl">🎬</span>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.experienceDetails.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ticket ID: <span className="font-mono font-semibold">{booking.ticketId}</span>
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Customer</div>
                          <div className="font-semibold text-gray-900">{booking.user.name}</div>
                          <div className="text-sm text-gray-600">{booking.user.email}</div>
                          <div className="text-sm text-gray-600">{booking.user.phoneNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Scheduled Date & Time</div>
                          <div className="font-semibold text-gray-900">
                            {formatDate(booking.scheduledDate)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                          {isUpcoming && (
                            <div className="text-xs text-blue-600 mt-1">
                              {Math.ceil((scheduledDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Location</div>
                          <div className="font-semibold text-gray-900">
                            {booking.experienceDetails.location.district}, {booking.experienceDetails.location.state}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Price & Duration</div>
                          <div className="font-semibold text-primary-600">
                            ${booking.experienceDetails.price}
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.experienceDetails.duration} hours
                          </div>
                        </div>
                      </div>

                      {booking.verifiedAt && (
                        <div className="text-sm text-gray-600 mb-2">
                          ✓ Verified on {formatDate(booking.verifiedAt)}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => router.push(`/host/verify`)}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          View Verification
                        </button>
                        {booking.trip && (
                          <button
                            onClick={() => router.push(`/trips/schedule?tripId=${booking.trip._id}`)}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            View Trip Details
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

