'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileStickyBar from '@/components/ui/MobileStickyBar';

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tripId, setTripId] = useState('');
  const [trip, setTrip] = useState<any>(null);
  const [wallet, setWallet] = useState({ balance: 0, currency: 'USD' });
  const [fundAmount, setFundAmount] = useState('');
  const [fundCurrency, setFundCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedTripId = sessionStorage.getItem('tripId');
    if (!storedTripId) {
      router.push('/trips/select');
      return;
    }

    setTripId(storedTripId);
  }, []);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
      fetchWallet();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/trips/${tripId}`);
      setTrip(response.data.trip);
      setError('');
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      setError(err.response?.data?.message || 'Failed to load trip');
      if (err.response?.status === 404) {
        // Trip not found, redirect to select
        setTimeout(() => router.push('/trips/select'), 2000);
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
      // Update tokens in localStorage if available
      if (response.data.user?.tokens !== undefined && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.tokens = response.data.user.tokens;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (err) {
      // Handle error
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
    if (!trip || !tripId) {
      setError('Trip information is missing. Please try again.');
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      console.log('Processing payment for trip:', tripId);
      const response = await api.post(`/trips/${tripId}/pay`);
      
      console.log('Payment response:', response.data);
      
      const newTokens = response.data.tokens;
      const remainingBalance = response.data.remainingBalance;
      const ticketsGenerated = response.data.ticketsGenerated || 0;
      const errors = response.data.errors || [];
      const warnings = response.data.warnings || [];
      
      // Update wallet balance
      if (remainingBalance !== undefined) {
        setWallet(prev => ({ ...prev, balance: remainingBalance }));
      }
      
      // Update tokens in localStorage
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.tokens = newTokens;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
      
      // Refresh wallet to get updated balance
      await fetchWallet();
      
      // Clear tripId from session storage
      sessionStorage.removeItem('tripId');
      
      // Build message based on ticket generation status
      if (ticketsGenerated > 0) {
        setMessage(`Payment successful! ${ticketsGenerated} ticket(s) generated. Your trip is confirmed. You earned 2 tokens! (Total: ${newTokens} tokens)`);
      } else {
        // No tickets generated - show warning
        const warningMsg = warnings.length > 0 
          ? warnings.join(' ') 
          : 'No tickets were generated. Please check your trip schedule.';
        setError(`Payment successful, but ${warningMsg}`);
        
        // Also log errors if any
        if (errors.length > 0) {
          console.error('Ticket creation errors:', errors);
          const errorDetails = errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n');
          setError(`Payment successful, but no tickets were generated:\n${errorDetails}`);
        }
        
        // Don't redirect if no tickets - let user see the error
        return;
      }
      
      // Show errors if any (but tickets were still created)
      if (errors.length > 0) {
        console.warn('Some tickets failed to generate:', errors);
        const errorDetails = errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n');
        setError(`Payment successful! ${ticketsGenerated} ticket(s) generated, but some failed:\n${errorDetails}`);
      }
      
      // Wait a bit longer to ensure tickets are fully saved in database
      setTimeout(() => {
        router.push('/dashboard/tickets');
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

  return (
    <div className="page-container pt-below-nav pb-bottom-bar md:pb-12">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6 shadow-medium">
            <span className="text-4xl">💳</span>
          </div>
          <h1 className="heading-primary text-gray-900">
            Secure Payment
          </h1>
          <p className="text-subtitle text-gray-600 mb-0">
            Complete your booking and start your adventure
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-primary-600">💳</span>
            <span className="text-sm font-semibold text-primary-700">Payment via Triberoutes Wallet</span>
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

        {/* Token Display - Small and Compact */}
        {user && typeof user.tokens !== 'undefined' && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-lg">🪙</span>
              <span className="text-sm font-semibold text-yellow-700">
                {user.tokens} {user.tokens === 1 ? 'token' : 'tokens'} available
              </span>
              <span className="text-xs text-yellow-600 ml-2">(+2 after payment)</span>
            </div>
          </div>
        )}

        {trip && (
          <>
            <div className="content-card mb-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📋</span>
                <h2 className="heading-secondary mb-0">Trip Summary</h2>
              </div>
              <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌍</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Destination</p>
                    <p className="font-semibold text-gray-900 mt-1">{trip.district}, {trip.state}, {trip.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Travel Dates</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {new Date(trip.fromDate).toLocaleDateString()} - {new Date(trip.toDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-300 flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                  <span className="text-3xl font-bold text-primary-600">
                    ${trip.totalPrice.toFixed(2)}
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
                <p className="text-3xl sm:text-5xl font-bold text-primary-600">
                  {wallet.balance.toFixed(2)} <span className="text-2xl text-gray-600">{wallet.currency}</span>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="heading-tertiary mb-4">Add Funds to Wallet</h3>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    className="btn-accent w-full sm:w-auto sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
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
                  <p className="text-5xl font-bold">${trip.totalPrice.toFixed(2)}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-white/90 mb-2 font-medium">Wallet Balance</p>
                  <p className="text-3xl font-bold">{wallet.balance.toFixed(2)} {wallet.currency}</p>
                </div>
              </div>

              {wallet.balance < trip.totalPrice && (
                <div className="alert-warning mb-6 bg-yellow-400/20 border-yellow-300 text-yellow-100">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Insufficient Balance</p>
                    <p className="text-sm">Please add ${(trip.totalPrice - wallet.balance).toFixed(2)} more to your wallet</p>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing || wallet.balance < trip.totalPrice}
                className="hidden md:block w-full bg-white text-primary-600 py-4 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-xl transition-all disabled:hover:bg-white touch-target"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></span>
                    Processing Payment...
                  </span>
                ) : (
                  'Complete Payment & Confirm Trip'
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {trip && (
        <MobileStickyBar>
          <button
            type="button"
            onClick={handlePayment}
            disabled={processing || wallet.balance < trip.totalPrice}
            className="w-full bg-brand text-white py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base touch-target"
          >
            {processing ? 'Processing…' : `Pay $${trip.totalPrice.toFixed(2)}`}
          </button>
        </MobileStickyBar>
      )}
    </div>
  );
}

