'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import api from './api';
import { getCurrencyByCode, type Currency } from './currency';

interface CurrencyContextType {
  currency: string;
  currencyData: Currency | null;
  setCurrency: (currency: string) => Promise<void>;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  formatPrice: (amount: number, fromCurrency?: string) => string;
  loading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [ratesVersion, setRatesVersion] = useState(0);

  // Load currency preference from user profile or localStorage
  useEffect(() => {
    const loadCurrencyPreference = async () => {
      try {
        setLoading(true);
        
        // First, try to get from user profile
        if (user) {
          try {
            const response = await api.get('/user/me');
            const userCurrency = response.data.user?.preferredCurrency || response.data.user?.tripWallet?.currency;
            if (userCurrency) {
              setCurrencyState(userCurrency);
              // Also store in localStorage for quick access
              localStorage.setItem('preferredCurrency', userCurrency);
            }
          } catch (err) {
            // If API fails, try localStorage
            const storedCurrency = localStorage.getItem('preferredCurrency');
            if (storedCurrency) {
              setCurrencyState(storedCurrency);
            }
          }
        } else {
          // Not logged in, use localStorage
          const storedCurrency = localStorage.getItem('preferredCurrency');
          if (storedCurrency) {
            setCurrencyState(storedCurrency);
          }
        }
      } catch (err) {
        console.error('Error loading currency preference:', err);
        setError('Failed to load currency preference');
      } finally {
        setLoading(false);
      }
    };

    loadCurrencyPreference();
  }, [user]);

  // Fetch exchange rates periodically (cache for 5 minutes)
  const fetchExchangeRates = useCallback(async (baseCurrency: string) => {
    const now = Date.now();
    const cacheKey = `exchangeRates_${baseCurrency}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const { rates, timestamp } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (now - timestamp < 5 * 60 * 1000) {
          setExchangeRates(rates);
          setLastFetch(timestamp);
          return;
        }
      } catch (e) {
        // Invalid cache, fetch fresh
      }
    }

    try {
      const response = await api.get(`/currency/rates?base=${baseCurrency}`);
      const rates = response.data.rates;
      setExchangeRates(rates);
      setLastFetch(now);
      
      // Cache the rates
      localStorage.setItem(cacheKey, JSON.stringify({ rates, timestamp: now }));
    } catch (err: any) {
      console.error('Error fetching exchange rates:', err);
      // Use fallback rates if API fails
      const fallbackRates = getFallbackRates(baseCurrency);
      setExchangeRates(fallbackRates);
    }
  }, []);

  // Fetch rates when currency changes
  useEffect(() => {
    if (currency && !loading) {
      fetchExchangeRates(currency);
    }
  }, [currency, loading, fetchExchangeRates]);

  // Force re-render when exchange rates change by updating a version counter
  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0) {
      setRatesVersion(prev => prev + 1);
    }
  }, [exchangeRates]);

  const setCurrency = useCallback(async (newCurrency: string) => {
    try {
      setCurrencyState(newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency);
      
      // Save to user profile if logged in
      if (user) {
        try {
          await api.patch('/user/me', {
            preferredCurrency: newCurrency
          });
        } catch (err) {
          console.error('Failed to save currency preference to profile:', err);
          // Continue anyway, it's saved in localStorage
        }
      }
      
      // Clear cached rates to force refresh
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('exchangeRates_')) {
          localStorage.removeItem(key);
        }
      });
      
      await fetchExchangeRates(newCurrency);
    } catch (err: any) {
      setError(err.message || 'Failed to update currency');
      throw err;
    }
  }, [user, fetchExchangeRates]);

  const convertPrice = useCallback((amount: number, fromCurrency?: string): number => {
    if (!amount || amount === 0) return 0;
    if (!fromCurrency) fromCurrency = 'USD'; // Default to USD if not specified
    
    const fromCurrencyUpper = fromCurrency.toUpperCase();
    const currencyUpper = currency.toUpperCase();
    
    // If same currency, no conversion needed
    if (fromCurrencyUpper === currencyUpper) return amount;
    
    // Exchange rates API returns: rates[targetCurrency] = how many targetCurrency units per 1 baseCurrency unit
    // where baseCurrency is the user's selected currency (currency variable)
    
    // Example: If user selected EUR as base, and we want to convert 100 USD to EUR:
    // - rates[USD] = 1.18 means: 1 EUR = 1.18 USD
    // - To convert USD to EUR: 100 USD * (1 EUR / 1.18 USD) = 100 / 1.18 = 84.75 EUR
    // - So we need: amount / rates[fromCurrency]
    
    let rate: number | undefined;
    
    // Check if we have the rate for fromCurrency
    if (exchangeRates[fromCurrencyUpper]) {
      // Invert: if rates[USD] = 1.18 (1 EUR = 1.18 USD), then 1 USD = 1/1.18 EUR
      rate = 1 / exchangeRates[fromCurrencyUpper];
    } else {
      // Try fallback rates
      const fallbackRates = getFallbackRates(currencyUpper);
      const fallbackRate = fallbackRates[fromCurrencyUpper];
      if (fallbackRate !== undefined) {
        // Fallback rates follow same structure: how many target per 1 base
        rate = 1 / fallbackRate;
      } else {
        // Rate not found, return original amount (or could return 0 or throw error)
        console.warn(`Exchange rate not found for ${fromCurrencyUpper} to ${currencyUpper}`);
        return amount;
      }
    }
    
    return amount * rate;
  }, [currency, exchangeRates]);

  const formatPrice = useCallback((amount: number, fromCurrency?: string): string => {
    const convertedAmount = convertPrice(amount, fromCurrency);
    const currencyData = getCurrencyByCode(currency);
    if (!currencyData) return convertedAmount.toFixed(2);
    
    const decimalPlaces = currencyData.decimalPlaces ?? 2;
    const formattedAmount = convertedAmount.toFixed(decimalPlaces);
    const parts = formattedAmount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return `${currencyData.symbol}${parts.join('.')}`;
  }, [currency, convertPrice, ratesVersion]); // Include ratesVersion to force update

  const currencyData = getCurrencyByCode(currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyData,
        setCurrency,
        convertPrice,
        formatPrice,
        loading,
        error
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Fallback exchange rates (used when API is unavailable)
function getFallbackRates(baseCurrency: string): Record<string, number> {
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.79,
    INR: 83,
    JPY: 150,
    AUD: 1.52,
    CAD: 1.35,
    CHF: 0.88,
    CNY: 7.2,
    SGD: 1.34,
    HKD: 7.8,
    NZD: 1.68,
    SEK: 10.5,
    NOK: 10.8,
    DKK: 6.9,
    PLN: 4.0,
    MXN: 17.0,
    BRL: 5.0,
    ZAR: 18.5,
    AED: 3.67,
    SAR: 3.75,
    THB: 35.0,
    MYR: 4.7,
    IDR: 15700,
    KRW: 1330,
    PHP: 56.0,
    VND: 24500,
    TRY: 32.0,
    RUB: 92.0,
  };

  // Convert to base currency
  if (baseCurrency === 'USD') return rates;
  
  const baseRate = rates[baseCurrency] || 1;
  const converted: Record<string, number> = {};
  Object.keys(rates).forEach(code => {
    converted[code] = rates[code] / baseRate;
  });
  return converted;
}


