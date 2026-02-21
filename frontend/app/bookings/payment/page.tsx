'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function BookingPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [wallet, setWallet] = useState({ balance: 0, currency: 'USD' });
  const [fundAmount, setFundAmount] = useState('');
  const [fundCurrency, setFundCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = searchParams.get('id') || sessionStorage.getItem('bookingId');
    if (!id) {
      router.push('/bookings');
      return;
    }
    setBookingId(id);
    sessionStorage.setItem('bookingId', id);
  }, [searchParams, router]);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
      fetchWallet();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    if (!bookingId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
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

  const fetchWallet = async () => {
    try {
      const response = await api.get('/user/me');
      if (response.data.user?.tripWallet) {
        setWallet(response.data.user.tripWallet);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      await api.post('/trips/wallet/fund', {
        amount: parseFloat(fundAmount),
        currency: fundCurrency
      });
      setMessage('Wallet funded successfully!');
      setFundAmount('');
      await fetchWallet();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fund wallet');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !bookingId) {
      setError('Booking information is missing. Please try again.');
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      console.log('Processing payment for booking:', bookingId);
      const response = await api.post(`/bookings/${bookingId}/pay`);
      
      console.log('Payment response:', response.data);
      
      const remainingBalance = response.data.remainingBalance;
      
      // Update wallet balance
      if (remainingBalance !== undefined) {
        setWallet(prev => ({ ...prev, balance: remainingBalance }));
      }
      
      // Refresh wallet to get updated balance
      await fetchWallet();
      
      // Clear bookingId from session storage
      sessionStorage.removeItem('bookingId');
      
      setMessage('Payment successful! Your booking is confirmed.');
      
      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push('/bookings');
      }, 2000);
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
      setError(errorMessage);
      
      // If insufficient balance, suggest funding wallet
      if (err.response?.status === 400 && errorMessage.includes('balance')) {
        setError(`${errorMessage}. Please add funds to your wallet.`);
      }
    } finally {
      setProcessing(false);
    }
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

  const getBookingDetails = () => {
    if (!booking) return null;
    
    switch (booking.bookingType) {
      case 'ABODE_STAY':
        return {
          type: 'Abode Stay',
          icon: '🏠',
          details: [
            {
              label: 'Check-in',
              value: booking.abodeStay?.checkIn 
                ? new Date(booking.abodeStay.checkIn).toLocaleDateString()
                : 'N/A'
            },
            {
              label: 'Check-out',
              value: booking.abodeStay?.checkOut 
                ? new Date(booking.abodeStay.checkOut).toLocaleDateString()
                : 'N/A'
            },
            {
              label: 'Guests',
              value: booking.abodeStay?.numberOfGuests || 1
            }
          ]
        };
      case 'EXPERIENCE':
        return {
          type: 'Experience',
          icon: '🎯',
          details: [
            {
              label: 'Date',
              value: booking.experience?.date 
                ? new Date(booking.experience.date).toLocaleDateString()
                : 'N/A'
            },
            {
              label: 'Time',
              value: booking.experience?.startTime || 'N/A'
            },
            {
              label: 'Participants',
              value: booking.experience?.numberOfParticipants || 1
            }
          ]
        };
      case 'EVENT':
        return {
          type: 'Event',
          icon: '🎪',
          details: [
            {
              label: 'Tickets',
              value: booking.event?.ticketCount || 1
            },
            {
              label: 'Tier',
              value: booking.event?.ticketTier || 'General'
            }
          ]
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
          <div className="text-2xl font-semibold text-white">Loading payment details...</div>
        </div>
      </div>
    );
  }

  const bookingDetails = getBookingDetails();
  const bookingTitle = getBookingTitle();
  const priceInWalletCurrency = booking?.totalPrice || 0;

  return (
    <div className="page-container">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6 shadow-medium">
            <span className="text-4xl">💳</span>
          </div>
          <h1 className="heading-primary text-gray-900">
            Secure Payment
          </h1>
          <p className="text-subtitle text-gray-600 mb-0">
            Complete your booking payment
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-primary-600">💳</span>
            <span className="text-sm font-semibold text-primary-700">Payment via Tribelink Wallet</span>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {message && (
          <div className="alert-success mb-6">
            <span className="text-lg">✅</span>
            <span className="flex-1">{message}</span>
          </div>
        )}

        {booking && (
          <>
            <div className="content-card mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{bookingDetails?.icon || '📋'}</span>
                <h2 className="heading-secondary mb-0">Booking Summary</h2>
              </div>
              <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Booking Type</p>
                    <p className="font-semibold text-gray-900 mt-1">{bookingDetails?.type || 'Booking'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏷️</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Title</p>
                    <p className="font-semibold text-gray-900 mt-1">{bookingTitle}</p>
                  </div>
                </div>
                {bookingDetails?.details.map((detail: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{detail.label}</p>
                      <p className="font-semibold text-gray-900 mt-1">{detail.value}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-300 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                  <span className="text-3xl font-bold text-primary-600">
                    {booking.currency || 'USD'} {booking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="content-card mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">💰</span>
                <h2 className="heading-secondary mb-0">Your Trip Wallet</h2>
              </div>
              <div className="bg-primary-50 p-6 rounded-xl mb-6 border-2 border-primary-200">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Current Balance</p>
                <p className="text-5xl font-bold text-primary-600">
                  {wallet.balance.toFixed(2)} <span className="text-2xl text-gray-600">{wallet.currency}</span>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="heading-tertiary mb-4">Add Funds to Wallet</h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    className="input-field flex-1"
                  />
                  <select
                    value={fundCurrency}
                    onChange={(e) => setFundCurrency(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white font-semibold"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <button
                    onClick={handleFundWallet}
                    disabled={processing}
                    className="btn-accent px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      'Add Funds'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-primary rounded-2xl shadow-large p-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div>
                  <p className="text-white/90 mb-2 font-medium">Amount Due</p>
                  <p className="text-5xl font-bold">{booking.currency || 'USD'} {booking.totalPrice.toFixed(2)}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-white/90 mb-2 font-medium">Wallet Balance</p>
                  <p className="text-3xl font-bold">{wallet.balance.toFixed(2)} {wallet.currency}</p>
                </div>
              </div>

              {wallet.balance < priceInWalletCurrency && (
                <div className="alert-warning mb-6 bg-yellow-400/20 border-yellow-300 text-yellow-100">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Insufficient Balance</p>
                    <p className="text-sm">Please add {wallet.currency} {(priceInWalletCurrency - wallet.balance).toFixed(2)} more to your wallet</p>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing || wallet.balance < priceInWalletCurrency || booking.paymentStatus === 'Completed'}
                className="w-full bg-white text-primary-600 py-4 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl transition-all disabled:hover:bg-white"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></span>
                    Processing Payment...
                  </span>
                ) : booking.paymentStatus === 'Completed' ? (
                  'Payment Already Completed'
                ) : (
                  'Complete Payment & Confirm Booking'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

