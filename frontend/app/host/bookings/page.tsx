'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface Booking {
  _id: string;
  ticketId: string;
  experience?: {
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
      country?: string;
    };
    date?: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  status: 'active' | 'verified' | 'cancelled' | 'expired' | 'pending' | 'unverified';
  verifiedAt?: string;
  createdAt: string;
  canVerify?: boolean;
}

type ViewMode = 'list' | 'verify';

export default function HostBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [verifyingTicketId, setVerifyingTicketId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [ticketSearchId, setTicketSearchId] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }
    }
    fetchBookings();
  }, [router]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, viewMode]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (dateFilter) {
        params.date = dateFilter;
      }
      const response = await api.get('/tickets/provider/verifications', { params });
      const fetchedBookings = response.data.tickets || [];
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, toast]);

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by view mode
    if (viewMode === 'verify') {
      filtered = filtered.filter(b => b.status === 'active' || b.status === 'pending' || b.status === 'unverified');
    }

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

    // Sort by date (upcoming first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.experienceDetails.date || a.createdAt);
      const dateB = new Date(b.scheduledDate || b.experienceDetails.date || b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredBookings(filtered);
  };

  const handleVerifyTicket = async (ticketId: string) => {
    try {
      setVerifyingTicketId(ticketId);
      setError('');
      const response = await api.post(`/tickets/verify/${ticketId}`);
      toast.success(`Ticket ${ticketId} verified successfully!`);
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify ticket');
    } finally {
      setVerifyingTicketId(null);
    }
  };

  const handleSearchTicket = async () => {
    if (!ticketSearchId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/tickets/search/${ticketSearchId.trim().toUpperCase()}`);
      
      if (response.data.ticket) {
        const existingTicket = bookings.find(t => t._id === response.data.ticket._id);
        if (!existingTicket) {
          setBookings([response.data.ticket, ...bookings]);
        }
        setShowSearchModal(false);
        setTicketSearchId('');
        toast.success('Ticket found!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ticket not found');
    } finally {
      setLoading(false);
    }
  };

  const isTicketValidForVerification = (booking: Booking) => {
    if (booking.status !== 'active' && booking.status !== 'pending' && booking.status !== 'unverified') return false;
    
    const scheduledDate = booking.scheduledDate || booking.experienceDetails.date;
    if (!scheduledDate || !booking.startTime) return true; // Allow if no date/time set
    
    const now = new Date();
    const scheduledDateTime = new Date(scheduledDate);
    const [hours, minutes] = booking.startTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Allow verification 30 minutes before start time
    const verificationStart = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000);
    const [endHours, endMinutes] = (booking.endTime || '23:59').split(':');
    const endDateTime = new Date(scheduledDateTime);
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    const verificationEnd = new Date(endDateTime.getTime() + 2 * 60 * 60 * 1000);
    
    return now >= verificationStart && now <= verificationEnd;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const configs: { [key: string]: { bg: string; text: string; border: string; icon: JSX.Element } } = {
      'verified': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
      'active': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Clock className="w-4 h-4" /> },
      'pending': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="w-4 h-4" /> },
      'unverified': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock className="w-4 h-4" /> },
      'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <XCircle className="w-4 h-4" /> },
      'expired': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: <XCircle className="w-4 h-4" /> },
    };
    const config = configs[status] || configs['active'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active' || b.status === 'pending' || b.status === 'unverified').length,
    verified: bookings.filter(b => b.status === 'verified').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'cancelled' && b.status !== 'expired')
      .reduce((sum, b) => sum + (b.experienceDetails.price || 0), 0)
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600 mb-3"></div>
            <p className="text-sm text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Bookings</h1>
                <p className="text-gray-600 text-sm">Manage and verify all your bookings</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Search Ticket
                </button>
                <button
                  onClick={fetchBookings}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-6">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'list'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setViewMode('verify')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'verify'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Verify Tickets ({stats.active})
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Total</div>
                <div className="text-xl font-semibold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Active</div>
                <div className="text-xl font-semibold text-blue-600">{stats.active}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Verified</div>
                <div className="text-xl font-semibold text-green-600">{stats.verified}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Revenue</div>
                <div className="text-xl font-semibold text-indigo-600">₹{stats.totalRevenue.toLocaleString()}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
              </p>
              <p className="text-gray-600 text-sm mb-6">
                {bookings.length === 0 
                  ? 'Bookings will appear here once customers book your experiences'
                  : 'Try adjusting your search or filter criteria'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const imageUrl = getImageUrl(booking.experience?.imageUrl ?? undefined) ?? undefined;
                const scheduledDate = booking.scheduledDate || booking.experienceDetails.date;
                const canVerify = isTicketValidForVerification(booking);
                const isUpcoming = scheduledDate ? new Date(scheduledDate) >= new Date() : false;

                return (
                  <div
                    key={booking._id}
                    className={`bg-white rounded-lg border-2 transition-all ${
                      booking.status === 'verified'
                        ? 'border-green-200 bg-green-50/30'
                        : canVerify && viewMode === 'verify'
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        {imageUrl && (
                          <div className="w-full md:w-40 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={imageUrl}
                              alt={booking.experienceDetails.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {booking.experienceDetails.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {booking.ticketId}
                                </span>
                                {scheduledDate && (
                                  <span>{formatDate(scheduledDate)}</span>
                                )}
                                {booking.startTime && booking.endTime && (
                                  <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Customer</div>
                              <div className="font-medium text-gray-900">{booking.user.name}</div>
                              <div className="text-sm text-gray-600">{booking.user.email}</div>
                              <div className="text-sm text-gray-600">{booking.user.phoneNumber}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Location</div>
                              <div className="font-medium text-gray-900">
                                {booking.experienceDetails.location.district}, {booking.experienceDetails.location.state}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                ₹{booking.experienceDetails.price} • {booking.experienceDetails.duration}h
                              </div>
                            </div>
                          </div>

                          {booking.verifiedAt && (
                            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                              ✓ Verified on {formatDate(booking.verifiedAt)}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                            {canVerify && (booking.status === 'active' || booking.status === 'pending' || booking.status === 'unverified') ? (
                              <button
                                onClick={() => handleVerifyTicket(booking.ticketId)}
                                disabled={verifyingTicketId === booking.ticketId}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              >
                                {verifyingTicketId === booking.ticketId ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Verifying...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Verify Ticket
                                  </>
                                )}
                              </button>
                            ) : booking.status === 'verified' ? (
                              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Already Verified
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {scheduledDate && new Date(scheduledDate) > new Date()
                                  ? 'Verification available 30 minutes before start time'
                                  : 'Verification window has passed'}
                              </div>
                            )}
                          </div>
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

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Search Ticket</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setTicketSearchId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Ticket ID
                </label>
                <input
                  type="text"
                  value={ticketSearchId}
                  onChange={(e) => setTicketSearchId(e.target.value)}
                  placeholder="e.g., TKT-1234567890-ABCD"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchTicket()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSearchTicket}
                  disabled={loading || !ticketSearchId.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setTicketSearchId('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

