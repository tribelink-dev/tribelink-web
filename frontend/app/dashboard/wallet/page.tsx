'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import CurrencySelector from '@/components/CurrencySelector';
import { getCurrencyByCode, formatCurrency, CURRENCIES } from '@/lib/currency';

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showTopUpForm, setShowTopUpForm] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/me');
      const userData = response.data.user;
      setWalletBalance(userData.tripWallet?.balance || 0);
      setWalletCurrency(userData.tripWallet?.currency || 'USD');
      setSelectedCurrency(userData.tripWallet?.currency || 'USD');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (quickAmount?: number) => {
    const topUpAmount = Number(quickAmount || amount);
    
    if (!topUpAmount || topUpAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError('');
    setSuccess('');
    setFunding(true);

    try {
      const response = await api.post('/trips/wallet/fund', {
        amount: parseFloat(topUpAmount.toString()),
        currency: selectedCurrency
      });

      setWalletBalance(response.data.balance);
      setWalletCurrency(response.data.currency);
      setSuccess(`Successfully added ${selectedCurrency} ${topUpAmount.toFixed(2)} to your wallet!`);
      setAmount('');
      setShowTopUpForm(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add funds');
    } finally {
      setFunding(false);
    }
  };

  const selectedCurrencyInfo = getCurrencyByCode(walletCurrency) || getCurrencyByCode('USD') || CURRENCIES[0];

  if (loading) {
    return (
      <div className="page-container pt-below-nav pb-sos-clear flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
          <div className="text-xl font-medium text-gray-700">Loading wallet...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-below-nav pb-sos-clear">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                My Wallet
              </h1>
              <p className="text-lg text-gray-600">Manage your travel funds</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Alerts */}
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

          {success && (
            <div className="alert-success mb-6 animate-slide-down bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Success</p>
                <p className="text-green-700 text-sm mt-1">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-500 hover:text-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Balance Card */}
        <div className="content-card mb-8">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Current Balance</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-5xl font-bold text-gray-900">
                {formatCurrency(walletBalance, selectedCurrencyInfo)}
              </span>
              <span className="text-xl text-gray-500 font-medium">{walletCurrency}</span>
            </div>
            <p className="text-sm text-gray-600">{selectedCurrencyInfo.name}</p>
          </div>
        </div>

        {/* Quick Top Up */}
        <div className="content-card mb-8">
          <h2 className="heading-tertiary text-gray-900 mb-4">Quick Top Up</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => handleTopUp(quickAmount)}
                disabled={funding}
                className="px-6 py-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 hover:border-blue-300 rounded-xl font-semibold text-blue-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formatCurrency(quickAmount, selectedCurrencyInfo)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Top Up Form */}
        <div className="content-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-tertiary text-gray-900">Add Custom Amount</h2>
            <button
              onClick={() => setShowTopUpForm(!showTopUpForm)}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-2"
            >
              {showTopUpForm ? 'Hide' : 'Show'} Form
              <svg className={`w-4 h-4 transition-transform ${showTopUpForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showTopUpForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleTopUp();
              }}
              className="space-y-6 animate-fade-in"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    {selectedCurrencyInfo && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        {selectedCurrencyInfo.flag}
                      </span>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="input-field pl-12 pr-4"
                      required
                    />
                  </div>
                </div>

                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Currency
                  </label>
                  <CurrencySelector
                    value={selectedCurrency}
                    onChange={setSelectedCurrency}
                    disabled={funding}
                    showPopular={true}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={funding || !amount || parseFloat(amount) <= 0}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {funding ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Funds
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info Card */}
        <div className="content-card bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About Your Wallet</h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                Your wallet balance is automatically converted to your preferred currency. 
                Funds added in different currencies will be converted at current exchange rates. 
                You can use your wallet balance to pay for trips and other travel expenses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

