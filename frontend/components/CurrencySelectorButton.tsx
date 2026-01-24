'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/lib/CurrencyContext';
import CurrencySelector from './CurrencySelector';
import { POPULAR_CURRENCIES } from '@/lib/currency';

export default function CurrencySelectorButton() {
  const { currency, currencyData, setCurrency, loading } = useCurrency();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await setCurrency(newCurrency);
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to change currency:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
        aria-label="Select currency"
      >
        {currencyData && (
          <>
            <span className="text-lg">{currencyData.flag}</span>
            <span className="text-sm font-semibold text-gray-700 hidden sm:inline">
              {currency}
            </span>
            <span className="text-xs text-gray-500 hidden md:inline">
              {currencyData.symbol}
            </span>
          </>
        )}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Select Currency</h3>
                <p className="text-xs text-gray-600">All prices will be displayed in your selected currency</p>
              </div>

              {/* Popular Currencies */}
              <div className="p-2">
                <div className="px-3 py-2 mb-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Popular</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
                        currency === curr.code
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-900'
                          : 'hover:bg-gray-50 border-2 border-transparent text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{curr.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold">{curr.code}</div>
                        <div className="text-xs text-gray-500">{curr.symbol}</div>
                      </div>
                      {currency === curr.code && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Selector */}
              <div className="border-t border-gray-200 p-3">
                <CurrencySelector
                  value={currency}
                  onChange={handleCurrencyChange}
                  showPopular={false}
                  size="sm"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


