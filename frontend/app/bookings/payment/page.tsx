'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/CurrencyContext';
import { ArrowLeft, CreditCard, Wallet, Calendar, User } from 'lucide-react';

export default function BookingPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
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
    const id = searchParams.get('id') || (typeof window !== 'undefined' ? sessionStorage.getItem('bookingId') : null);
    if (!id) {
      router.push('/bookings');
      return;
    }
    setBookingId(id);
    if (typeof window !== 'undefined') sessionStorage.setItem('bookingId', id);
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
      if (err.response?.status === 404) setTimeout(() => router.push('/bookings'), 2000);
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
        currency: fundCurrency,
      });
      setMessage('Wallet funded successfully.');
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
      const response = await api.post(`/bookings/${bookingId}/pay`);
      const remainingBalance = response.data.remainingBalance;
      if (remainingBalance !== undefined) {
        setWallet((prev) => ({ ...prev, balance: remainingBalance }));
      }
      await fetchWallet();
      if (typeof window !== 'undefined') sessionStorage.removeItem('bookingId');
      setMessage('Payment successful. Your booking is confirmed.');
      setTimeout(() => router.push('/bookings'), 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment failed';
      setError(err.response?.status === 400 && errorMessage.includes('balance') ? `${errorMessage} Add funds to your wallet below.` : errorMessage);
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
            { label: 'Check-in', value: booking.abodeStay?.checkIn ? new Date(booking.abodeStay.checkIn).toLocaleDateString() : 'N/A' },
            { label: 'Check-out', value: booking.abodeStay?.checkOut ? new Date(booking.abodeStay.checkOut).toLocaleDateString() : 'N/A' },
            { label: 'Guests', value: booking.abodeStay?.numberOfGuests ?? 1 },
          ],
        };
      case 'EXPERIENCE':
        return {
          type: 'Experience',
          icon: '🎯',
          details: [
            { label: 'Date', value: booking.experience?.date ? new Date(booking.experience.date).toLocaleDateString() : 'N/A' },
            { label: 'Time', value: booking.experience?.startTime || 'N/A' },
            { label: 'Participants', value: booking.experience?.numberOfParticipants ?? 1 },
          ],
        };
      case 'EVENT':
        return {
          type: 'Event',
          icon: '🎪',
          details: [
            { label: 'Tickets', value: booking.event?.ticketCount ?? 1 },
            { label: 'Tier', value: booking.event?.ticketTier || 'General' },
          ],
        };
      default:
        return null;
    }
  };

  const bookingDetails = getBookingDetails();
  const priceInWalletCurrency = booking?.totalPrice ?? 0;
  const currency = booking?.currency || 'USD';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-heritage-gold border-t-transparent" />
          </div>
          <p className="text-center text-charcoal-600 font-medium">Loading payment details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Bookings</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-heritage-gold/10 p-4 rounded-2xl">
              <CreditCard className="w-8 h-8 text-heritage-gold" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-charcoal-700">Secure Payment</h1>
              <p className="text-charcoal-600 mt-1">Pay with your Tribelink wallet</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="flex-1 whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="flex-1">{message}</span>
          </div>
        )}

        {booking && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8 mb-8"
            >
              <h2 className="text-xl font-bold text-charcoal-700 mb-6 flex items-center gap-3">
                <span className="text-3xl">{bookingDetails?.icon || '📋'}</span>
                Booking Summary
              </h2>
              <div className="space-y-4 bg-cream-50 rounded-2xl p-6 border border-cream-200">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-heritage-gold" />
                  <div>
                    <p className="text-xs text-charcoal-500 uppercase font-semibold">Type</p>
                    <p className="font-semibold text-charcoal-700">{bookingDetails?.type ?? 'Booking'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-heritage-gold" />
                  <div>
                    <p className="text-xs text-charcoal-500 uppercase font-semibold">Title</p>
                    <p className="font-semibold text-charcoal-700">{getBookingTitle()}</p>
                  </div>
                </div>
                {bookingDetails?.details.map((d: { label: string; value: string | number }, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-charcoal-400">•</span>
                    <span className="text-sm text-charcoal-600 font-medium">{d.label}:</span>
                    <span className="text-charcoal-700">{d.value}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-charcoal-200 flex justify-between items-center">
                  <span className="text-lg font-semibold text-charcoal-700">Total</span>
                  <span className="text-2xl font-bold text-heritage-gold">
                    {formatPrice(booking.totalPrice, currency)}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8 mb-8"
            >
              <h2 className="text-xl font-bold text-charcoal-700 mb-6 flex items-center gap-3">
                <Wallet className="w-6 h-6 text-heritage-gold" />
                Your Wallet
              </h2>
              <div className="bg-gradient-to-br from-heritage-gold/10 to-cream-100 rounded-2xl p-6 mb-6 border border-heritage-gold/20">
                <p className="text-sm text-charcoal-600 font-medium mb-1">Current balance</p>
                <p className="text-4xl font-bold text-heritage-gold">
                  {formatPrice(wallet.balance, wallet.currency)}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-charcoal-700 mb-4">Add funds</h3>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    className="flex-1 min-w-[120px] px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                  <select
                    value={fundCurrency}
                    onChange={(e) => setFundCurrency(e.target.value)}
                    className="px-4 py-3 border border-charcoal-200 rounded-xl focus:ring-2 focus:ring-heritage-gold bg-white font-medium"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <motion.button
                    onClick={handleFundWallet}
                    disabled={processing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-charcoal-600 text-white font-semibold rounded-xl hover:bg-charcoal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Add Funds'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-heritage-gold to-heritage-gold-dark rounded-3xl shadow-xl p-6 md:p-8 text-white"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-1">Amount due</p>
                  <p className="text-4xl font-bold">{formatPrice(booking.totalPrice, currency)}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-white/90 text-sm font-medium mb-1">Wallet balance</p>
                  <p className="text-2xl font-bold">{formatPrice(wallet.balance, wallet.currency)}</p>
                </div>
              </div>
              {currency === wallet.currency && wallet.balance < priceInWalletCurrency && (
                <div className="mb-6 p-4 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-100">
                  <p className="font-semibold">Insufficient balance</p>
                  <p className="text-sm mt-1">
                    Add {formatPrice(priceInWalletCurrency - wallet.balance, wallet.currency)} to your wallet.
                  </p>
                </div>
              )}
              <motion.button
                onClick={handlePayment}
                disabled={processing || booking.paymentStatus === 'Completed'}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-white text-heritage-gold font-bold text-lg rounded-xl shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-heritage-gold border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : booking.paymentStatus === 'Completed' ? (
                  'Already paid'
                ) : (
                  'Complete payment & confirm booking'
                )}
              </motion.button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
