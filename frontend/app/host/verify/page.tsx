'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { getImageUrl } from '@/lib/imageUtils';
import HostSidebar from '@/components/HostSidebar';

interface Ticket {
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
    };
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'verified' | 'cancelled' | 'expired';
  verifiedAt?: string;
  canVerify?: boolean;
}

export default function VerifyTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [verifyingTicketId, setVerifyingTicketId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [ticketSearchId, setTicketSearchId] = useState('');

  useEffect(() => {
    // Check if user is logged in as provider
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      if (!hostData) {
        router.push('/host/login');
        return;
      }
    }
    fetchTickets();
  }, [router]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, selectedDate]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDate) {
        params.date = selectedDate;
      }
      const response = await api.get('/tickets/provider/verifications', { params });
      setTickets(response.data.tickets || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.experienceDetails.title.toLowerCase().includes(query) ||
        ticket.ticketId.toLowerCase().includes(query) ||
        ticket.user.name.toLowerCase().includes(query) ||
        ticket.user.email.toLowerCase().includes(query)
      );
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });

    setFilteredTickets(filtered);
  };

  const handleVerifyTicket = async (ticketId: string) => {
    try {
      setVerifyingTicketId(ticketId);
      setError('');
      setSuccess('');
      
      const response = await api.post(`/tickets/verify/${ticketId}`);
      setSuccess(`Ticket ${ticketId} verified successfully!`);
      
      // Refresh tickets
      await fetchTickets();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify ticket');
      setTimeout(() => setError(''), 5000);
    } finally {
      setVerifyingTicketId(null);
    }
  };

  const handleSearchTicket = async () => {
    if (!ticketSearchId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/tickets/search/${ticketSearchId.trim().toUpperCase()}`);
      
      if (response.data.ticket) {
        // Check if ticket is already in the list
        const existingTicket = tickets.find(t => t._id === response.data.ticket._id);
        if (!existingTicket) {
          setTickets([response.data.ticket, ...tickets]);
        }
        setShowSearchModal(false);
        setTicketSearchId('');
        setSuccess('Ticket found!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ticket not found or you do not have permission to view it');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };


  const isTicketValidForVerification = (ticket: Ticket) => {
    if (ticket.status !== 'active') return false;
    
    const now = new Date();
    const scheduledDateTime = new Date(ticket.scheduledDate);
    const [hours, minutes] = ticket.startTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Allow verification 30 minutes before start time
    const verificationStart = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000);
    const [endHours, endMinutes] = ticket.endTime.split(':');
    const endDateTime = new Date(scheduledDateTime);
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    const verificationEnd = new Date(endDateTime.getTime() + 2 * 60 * 60 * 1000);
    
    return now >= verificationStart && now <= verificationEnd;
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-slate-600 border-t-transparent mb-6"></div>
            <div className="text-xl font-medium text-gray-700">Loading tickets...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Verify Tickets <span className="text-primary-600">✅</span>
              </h1>
              <p className="text-lg text-gray-600">Verify traveler tickets for your experiences</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Ticket
              </button>
              <button
                onClick={fetchTickets}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down">
              <span className="text-xl">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6 animate-slide-down">
              <span className="text-xl">✅</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="content-card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by ticket ID, traveler name, or experience..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      fetchTickets();
                    }
                  }}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <span className="text-5xl">🎫</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {tickets.length === 0
                ? 'No tickets have been issued for your experiences yet.'
                : 'Try adjusting your search or date filter.'}
            </p>
            <button
              onClick={() => setShowSearchModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search by Ticket ID
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const imageUrl = getImageUrl(ticket.experience?.imageUrl ?? undefined) ?? undefined;
              const canVerify = isTicketValidForVerification(ticket);
              const scheduledDateTime = new Date(ticket.scheduledDate);
              const [hours, minutes] = ticket.startTime.split(':');
              scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

              return (
                <div
                  key={ticket._id}
                  className={`content-card border-2 transition-all duration-300 ${
                    ticket.status === 'verified'
                      ? 'border-green-300 bg-green-50/30'
                      : canVerify
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-gray-200'
                  }`}
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
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {ticket.experienceDetails.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {ticket.user.name}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {ticket.user.email}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {ticket.user.phoneNumber}
                              </span>
                            </div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            ticket.status === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : ticket.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.status === 'verified' ? '✅ Verified' : ticket.status === 'active' ? '🎫 Active' : ticket.status}
                          </div>
                        </div>

                        {/* Ticket Details */}
                        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
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
                              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                              <p className="font-semibold text-gray-900">
                                {ticket.experienceDetails.location.district}, {ticket.experienceDetails.location.state}
                              </p>
                            </div>
                          </div>
                        </div>

                        {ticket.verifiedAt && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              <span className="font-semibold">Verified on:</span> {format(new Date(ticket.verifiedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        {canVerify && ticket.status === 'active' ? (
                          <button
                            onClick={() => handleVerifyTicket(ticket.ticketId)}
                            disabled={verifyingTicketId === ticket.ticketId}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingTicketId === ticket.ticketId ? (
                              <>
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Verify Ticket
                              </>
                            )}
                          </button>
                        ) : ticket.status === 'verified' ? (
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Already Verified
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {scheduledDateTime > new Date()
                              ? 'Verification available 30 minutes before start time'
                              : 'Verification window has passed'}
                          </div>
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

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl-soft max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Search Ticket</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setTicketSearchId('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Ticket ID
                </label>
                <input
                  type="text"
                  value={ticketSearchId}
                  onChange={(e) => setTicketSearchId(e.target.value)}
                  placeholder="e.g., TKT-1234567890-ABCD"
                  className="input-field w-full font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchTicket()}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSearchTicket}
                  disabled={loading || !ticketSearchId.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setTicketSearchId('');
                    setError('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

