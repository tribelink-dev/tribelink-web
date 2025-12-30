'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface Ticket {
  _id: string;
  ticketId: string;
  experience: {
    _id: string;
    title: string;
    imageUrl?: string;
    location?: {
      district: string;
      state: string;
    };
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
  provider: {
    _id: string;
    name: string;
  };
  trip: {
    _id: string;
    fromDate: string;
    toDate: string;
    district: string;
    state: string;
  };
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'verified' | 'cancelled' | 'expired';
  verifiedAt?: string;
  qrCode: string;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'active' | 'verified' | 'past'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
    
    // Refresh tickets every 30 seconds to catch newly created tickets
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000);
    
    // Refresh when page becomes visible (e.g., after redirect from payment)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTickets();
      }
    };
    
    // Refresh when window gains focus
    const handleFocus = () => {
      fetchTickets();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, filter, searchQuery]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/tickets/user');
      const fetchedTickets = response.data.tickets || [];
      console.log(`Fetched ${fetchedTickets.length} tickets`);
      setTickets(fetchedTickets);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Apply status filter
    if (filter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(ticket => {
        const scheduledDateTime = new Date(ticket.scheduledDate);
        const [hours, minutes] = ticket.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return scheduledDateTime >= now && ticket.status === 'active';
      });
    } else if (filter === 'past') {
      const now = new Date();
      filtered = filtered.filter(ticket => {
        const scheduledDateTime = new Date(ticket.scheduledDate);
        const [hours, minutes] = ticket.startTime.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return scheduledDateTime < now || ticket.status === 'verified';
      });
    } else if (filter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.experienceDetails.title.toLowerCase().includes(query) ||
        ticket.ticketId.toLowerCase().includes(query) ||
        ticket.provider.name.toLowerCase().includes(query) ||
        ticket.experienceDetails.location.district.toLowerCase().includes(query)
      );
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredTickets(filtered);
  };

  const getStatusBadge = (status: string, verifiedAt?: string) => {
    const statusConfig = {
      active: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🎫', label: 'Active' },
      verified: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '✅', label: 'Verified' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '❌', label: 'Cancelled' },
      expired: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '⏰', label: 'Expired' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        <span>{config.icon}</span>
        {config.label}
        {verifiedAt && (
          <span className="text-xs opacity-75 ml-1">
            ({format(new Date(verifiedAt), 'MMM d')})
          </span>
        )}
      </span>
    );
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading your tickets...</div>
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
                My Tickets <span className="text-primary-600">🎫</span>
              </h1>
              <p className="text-lg text-gray-600">View and manage your experience tickets</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
              <p className="text-sm text-blue-600 font-semibold mb-1">Total Tickets</p>
              <p className="text-2xl font-bold text-blue-900">{tickets.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
              <p className="text-sm text-green-600 font-semibold mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-green-900">
                {tickets.filter(t => {
                  const now = new Date();
                  const scheduledDateTime = new Date(t.scheduledDate);
                  const [hours, minutes] = t.startTime.split(':');
                  scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  return scheduledDateTime >= now && t.status === 'active';
                }).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
              <p className="text-sm text-purple-600 font-semibold mb-1">Verified</p>
              <p className="text-2xl font-bold text-purple-900">
                {tickets.filter(t => t.status === 'verified').length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
              <p className="text-sm text-orange-600 font-semibold mb-1">Active</p>
              <p className="text-2xl font-bold text-orange-900">
                {tickets.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="content-card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by experience, ticket ID, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All', icon: '📋' },
                  { value: 'upcoming', label: 'Upcoming', icon: '⏰' },
                  { value: 'active', label: 'Active', icon: '🎫' },
                  { value: 'verified', label: 'Verified', icon: '✅' },
                  { value: 'past', label: 'Past', icon: '📅' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      filter === option.value
                        ? 'bg-primary-600 text-white shadow-medium'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-xl">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <span className="text-5xl">🎫</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {tickets.length === 0
                ? 'Complete a trip payment to receive your experience tickets!'
                : 'Try adjusting your filters or search query.'}
            </p>
            {tickets.length === 0 && (
              <Link href="/trips/select" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Plan Your First Trip
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const imageUrl = getImageUrl(ticket.experience?.imageUrl);
              const scheduledDateTime = new Date(ticket.scheduledDate);
              const [hours, minutes] = ticket.startTime.split(':');
              scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              const isUpcoming = scheduledDateTime >= new Date();

              return (
                <div
                  key={ticket._id}
                  className="group content-card hover:shadow-large transition-all duration-300 border-2 border-gray-200 hover:border-primary-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    {imageUrl && (
                      <div className="md:w-48 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={ticket.experienceDetails.title}
                          className="w-full h-48 md:h-full object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                              {ticket.experienceDetails.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {ticket.provider.name}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {ticket.experienceDetails.location.district}, {ticket.experienceDetails.location.state}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {ticket.experienceDetails.duration} hours
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(ticket.status, ticket.verifiedAt)}
                        </div>

                        {/* Ticket Details */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ticket ID</p>
                              <p className="font-mono text-sm font-bold text-gray-900">{ticket.ticketId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Date & Time</p>
                              <p className="font-semibold text-gray-900">
                                {format(new Date(ticket.scheduledDate), 'MMM d, yyyy')}
                              </p>
                              <p className="text-sm text-gray-600">
                                {ticket.startTime} - {ticket.endTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Price</p>
                              <p className="font-bold text-primary-600 text-lg">
                                ${ticket.experienceDetails.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Trip Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span>
                            Part of trip to {ticket.trip.district}, {ticket.trip.state}
                          </span>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      {isUpcoming && ticket.status === 'active' && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-32 h-32 bg-white rounded-lg p-2 border-2 border-blue-300 flex items-center justify-center">
                                {ticket.qrCode ? (
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qrCode)}`}
                                    alt="QR Code"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <div className="text-center text-gray-400">
                                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    <p className="text-xs">QR Code</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-2">Verification QR Code</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Show this QR code to the host at the experience location for quick verification.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticket.qrCode || ticket.ticketId)}`;
                                    const link = document.createElement('a');
                                    link.href = qrUrl;
                                    link.download = `ticket-${ticket.ticketId}-qr.png`;
                                    link.click();
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download QR
                                </button>
                                <button
                                  onClick={() => window.print()}
                                  className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Print Ticket
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <Link
                          href={`/trips/schedule?tripId=${ticket.trip._id}`}
                          className="text-primary-600 font-semibold text-sm hover:text-primary-700 flex items-center gap-1.5"
                        >
                          View Trip
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => {
                            // Create printable ticket view
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>Ticket - ${ticket.ticketId}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
                                      .ticket { border: 2px dashed #333; padding: 20px; margin: 20px 0; }
                                      .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                                      .qr-code { text-align: center; margin: 20px 0; }
                                      .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
                                      .detail-item { padding: 10px; background: #f5f5f5; }
                                      .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="ticket">
                                      <div class="header">
                                        <h1>Experience Ticket</h1>
                                        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                                      </div>
                                      <div class="details">
                                        <div class="detail-item">
                                          <strong>Experience:</strong><br>
                                          ${ticket.experienceDetails.title}
                                        </div>
                                        <div class="detail-item">
                                          <strong>Provider:</strong><br>
                                          ${ticket.provider.name}
                                        </div>
                                        <div class="detail-item">
                                          <strong>Date:</strong><br>
                                          ${format(new Date(ticket.scheduledDate), 'MMM d, yyyy')}
                                        </div>
                                        <div class="detail-item">
                                          <strong>Time:</strong><br>
                                          ${ticket.startTime} - ${ticket.endTime}
                                        </div>
                                        <div class="detail-item">
                                          <strong>Location:</strong><br>
                                          ${ticket.experienceDetails.location.district}, ${ticket.experienceDetails.location.state}
                                        </div>
                                        <div class="detail-item">
                                          <strong>Price:</strong><br>
                                          $${ticket.experienceDetails.price.toFixed(2)}
                                        </div>
                                      </div>
                                      ${ticket.qrCode ? `
                                        <div class="qr-code">
                                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qrCode)}" alt="QR Code" />
                                          <p>Scan QR code for verification</p>
                                        </div>
                                      ` : ''}
                                      <div class="footer">
                                        <p>This ticket is valid for the scheduled date and time only.</p>
                                        <p>Please arrive on time and present this ticket or QR code to the host.</p>
                                      </div>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="text-primary-600 font-semibold text-sm hover:text-primary-700 flex items-center gap-1.5 ml-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print Ticket
                        </button>
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

