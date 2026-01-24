'use client';

import { useState, useRef, useEffect } from 'react';
import { CURRENCIES, POPULAR_CURRENCIES, type Currency, getCurrencyByCode } from '@/lib/currency';

interface CurrencySelectorProps {
  value: string; // Currency code (e.g., 'USD')
  onChange: (currencyCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  showPopular?: boolean; // Show popular currencies section
  size?: 'sm' | 'md' | 'lg';
}

export default function CurrencySelector({
  value,
  onChange,
  placeholder = 'Select currency',
  disabled = false,
  required = false,
  className = '',
  error,
  showPopular = true,
  size = 'md'
}: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    value ? getCurrencyByCode(value) || null : null
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected currency when value prop changes
  useEffect(() => {
    if (value) {
      const currency = getCurrencyByCode(value);
      if (currency) {
        setSelectedCurrency(currency);
      }
    } else {
      setSelectedCurrency(null);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const filteredCurrencies = CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    onChange(currency.code);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3.5 px-4 text-base',
    lg: 'py-4 px-5 text-lg'
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-3 ${sizeClasses[size]} border-2 rounded-xl transition-all ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
            : showDropdown
            ? 'border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
            : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
        } bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed outline-none`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedCurrency ? (
            <>
              <span className="text-xl flex-shrink-0">{selectedCurrency.flag}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {selectedCurrency.code}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {selectedCurrency.name}
                </div>
              </div>
              <span className="text-slate-600 font-medium flex-shrink-0">
                {selectedCurrency.symbol}
              </span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 sticky top-0 bg-white">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search currency..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="max-h-80 overflow-y-auto">
            {/* Popular Currencies Section */}
            {showPopular && !searchQuery && (
              <>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Popular</p>
                </div>
                {POPULAR_CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => handleCurrencySelect(currency)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                      selectedCurrency?.code === currency.code ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{currency.flag}</span>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{currency.code}</div>
                      <div className="text-xs text-slate-500 truncate">{currency.name}</div>
                    </div>
                    <span className="text-slate-600 font-medium text-sm flex-shrink-0">
                      {currency.symbol}
                    </span>
                    {selectedCurrency?.code === currency.code && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">All Currencies</p>
                </div>
              </>
            )}

            {/* All Currencies */}
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                    selectedCurrency?.code === currency.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{currency.flag}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{currency.code}</div>
                    <div className="text-xs text-slate-500 truncate">{currency.name}</div>
                  </div>
                  <span className="text-slate-600 font-medium text-sm flex-shrink-0">
                    {currency.symbol}
                  </span>
                  {selectedCurrency?.code === currency.code && (
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No currencies found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

