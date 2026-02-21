'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Calendar, Users, MapPin, CreditCard, CheckCircle, XCircle, Clock, ArrowLeft, Building, Ticket } from 'lucide-react';

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/bookings/${params.id}`)}`);
      return;
    }
    fetchBooking();
  }, [params.id, user, router]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${params.id}`);
      setBooking(response.data.booking);
      setError('');
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError(err.response?.data?.message || 'Failed to load booking');
      if (err.response?.status === 404) {
        setTimeout(() => router.push('/bookings'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    sessionStorage.setItem('bookingId', booking._id);
    router.push(`/bookings/payment?id=${booking._id}`);
  };

  const getBookingTitle = () => {
    if (!booking) return 'Booking';
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

  const getStatusBadge = () => {
    if (!booking) return null;
    if (booking.paymentStatus === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-4 h-4" />
          Paid & Confirmed
        </span>
      );
    }
    if (booking.paymentStatus === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          <XCircle className="w-4 h-4" />
          Payment Failed
        </span>
      );
    }
    if (booking.status === 'Cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-4 h-4" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
        <Clock className="w-4 h-4" />
        Pending Payment
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
          <div className="text-2xl font-semibold text-white">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="page-container">
        <div className="section-container max-w-4xl">
          <div className="alert-error">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error || 'Booking not found'}</span>
          </div>
          <button onClick={() => router.push('/bookings')} className="btn-secondary mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-4xl">
        <button
          onClick={() => router.push('/bookings')}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </button>

        <div className="content-card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="heading-primary text-gray-900 mb-2">{getBookingTitle()}</h1>
              <p className="text-gray-600">Booking ID: {booking._id.slice(-8).toUpperCase()}</p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Booking Type</p>
              <p className="font-semibold text-gray-900">
                {booking.bookingType === 'ABODE_STAY' ? '🏠 Abode Stay' :
                 booking.bookingType === 'EXPERIENCE' ? '🎯 Experience' :
                 booking.bookingType === 'EVENT' ? '🎪 Event' : '📋 Booking'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary-600">
                {booking.currency || 'USD'} {booking.totalPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {booking.bookingType === 'ABODE_STAY' && booking.abodeStay && (
            <div className="space-y-4">
              <h2 className="heading-secondary">Stay Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-semibold">
                      {booking.abodeStay.checkIn ? new Date(booking.abodeStay.checkIn).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-semibold">
                      {booking.abodeStay.checkOut ? new Date(booking.abodeStay.checkOut).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Number of Guests</p>
                    <p className="font-semibold">{booking.abodeStay.numberOfGuests || 1}</p>
                  </div>
                </div>
                {booking.abodeStay.localHost?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">
                        {booking.abodeStay.localHost.location.district}, {booking.abodeStay.localHost.location.state}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {booking.abodeStay.specialRequests && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                  <p className="text-gray-900">{booking.abodeStay.specialRequests}</p>
                </div>
              )}
            </div>
          )}

          {booking.bookingType === 'EXPERIENCE' && booking.experience && (
            <div className="space-y-4">
              <h2 className="heading-secondary">Experience Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">
                      {booking.experience.date ? new Date(booking.experience.date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-semibold">{booking.experience.startTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p className="font-semibold">{booking.experience.numberOfParticipants || 1}</p>
                  </div>
                </div>
              </div>
              {booking.experience.specialRequests && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Special Requests</p>
                  <p className="text-gray-900">{booking.experience.specialRequests}</p>
                </div>
              )}
            </div>
          )}

          {booking.bookingType === 'EVENT' && booking.event && (
            <div className="space-y-4">
              <h2 className="heading-secondary">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Number of Tickets</p>
                    <p className="font-semibold">{booking.event.ticketCount || 1}</p>
                  </div>
                </div>
                {booking.event.ticketTier && (
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Ticket Tier</p>
                      <p className="font-semibold">{booking.event.ticketTier}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="heading-secondary mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <p className="font-semibold text-gray-900">{booking.paymentStatus}</p>
              </div>
              {booking.paymentDate && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {booking.paymentMethod && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900">{booking.paymentMethod}</p>
                </div>
              )}
              {booking.transactionId && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-semibold text-gray-900 font-mono text-sm">{booking.transactionId}</p>
                </div>
              )}
            </div>
          </div>

          {booking.paymentStatus === 'Pending' && (
            <div className="mt-6">
              <button
                onClick={handlePay}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Pay Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

