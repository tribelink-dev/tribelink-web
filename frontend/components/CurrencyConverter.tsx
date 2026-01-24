'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CurrencySelector from './CurrencySelector';
import { formatCurrency, getCurrencyByCode, type Currency } from '@/lib/currency';
import api from '@/lib/api';

interface CurrencyConverterProps {
  initialAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  onConvert?: (result: ConversionResult) => void;
  className?: string;
  showSwapButton?: boolean;
  autoConvert?: boolean; // Automatically convert on amount/currency change
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  timestamp: string;
}

export default function CurrencyConverter({
  initialAmount = 0,
  initialFromCurrency = 'USD',
  initialToCurrency = 'EUR',
  onConvert,
  className = '',
  showSwapButton = true,
  autoConvert = true
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>(initialAmount.toString());
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(initialToCurrency);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastConversion, setLastConversion] = useState<ConversionResult | null>(null);

  // Debounce conversion
  const convertCurrency = useCallback(async () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setConvertedAmount(null);
      setExchangeRate(null);
      setError('');
      return;
    }

    if (fromCurrency === toCurrency) {
      setConvertedAmount(numAmount);
      setExchangeRate(1);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/currency/convert', {
        amount: numAmount,
        fromCurrency,
        toCurrency
      });

      const result: ConversionResult = response.data;
      setConvertedAmount(result.convertedAmount);
      setExchangeRate(result.exchangeRate);
      setLastConversion(result);
      
      if (onConvert) {
        onConvert(result);
      }
    } catch (err: any) {
      console.error('Currency conversion error:', err);
      setError(err.response?.data?.message || 'Failed to convert currency');
      setConvertedAmount(null);
      setExchangeRate(null);
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency, onConvert]);

  // Auto-convert when values change
  useEffect(() => {
    if (autoConvert) {
      const timer = setTimeout(() => {
        convertCurrency();
      }, 300); // Debounce 300ms

      return () => clearTimeout(timer);
    }
  }, [amount, fromCurrency, toCurrency, autoConvert, convertCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
    setExchangeRate(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers, decimal point, and empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const fromCurrencyObj = getCurrencyByCode(fromCurrency);
  const toCurrencyObj = getCurrencyByCode(toCurrency);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {fromCurrencyObj && (
                  <span className="text-xl">{fromCurrencyObj.flag}</span>
                )}
              </div>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 font-semibold text-lg"
              />
            </div>
          </div>

          {/* Currency Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Currency */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                From
              </label>
              <CurrencySelector
                value={fromCurrency}
                onChange={setFromCurrency}
                disabled={loading}
              />
            </div>

            {/* Swap Button */}
            {showSwapButton && (
              <div className="flex items-end justify-center md:justify-start">
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={loading}
                  className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  aria-label="Swap currencies"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </div>
            )}

            {/* To Currency */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                To
              </label>
              <CurrencySelector
                value={toCurrency}
                onChange={setToCurrency}
                disabled={loading}
              />
            </div>
          </div>

          {/* Manual Convert Button (if autoConvert is false) */}
          {!autoConvert && (
            <button
              type="button"
              onClick={convertCurrency}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Convert</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Result Section */}
      <AnimatePresence mode="wait">
        {(convertedAmount !== null || loading || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-6"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-slate-600 font-medium">Converting...</span>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            ) : convertedAmount !== null && fromCurrencyObj && toCurrencyObj ? (
              <div className="space-y-4">
                {/* Main Conversion Result */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl">{fromCurrencyObj.flag}</span>
                    <span className="text-2xl text-slate-400">→</span>
                    <span className="text-3xl">{toCurrencyObj.flag}</span>
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-2">
                    {formatCurrency(convertedAmount, toCurrencyObj)}
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatCurrency(parseFloat(amount), fromCurrencyObj)} = {formatCurrency(convertedAmount, toCurrencyObj)}
                  </div>
                </div>

                {/* Exchange Rate */}
                {exchangeRate !== null && (
                  <div className="pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Exchange Rate</span>
                      <span className="font-semibold text-slate-900">
                        1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                      </span>
                    </div>
                    {lastConversion?.timestamp && (
                      <div className="mt-2 text-xs text-slate-500 text-right">
                        Updated: {new Date(lastConversion.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

