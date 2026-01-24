const express = require('express');
const { convertCurrency } = require('../services/currency');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Convert currency amount
 * POST /api/currency/convert
 * Body: { amount: number, fromCurrency: string, toCurrency: string }
 */
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    // Validation
    if (!amount || amount < 0) {
      return res.status(400).json({ 
        message: 'Invalid amount. Amount must be a positive number.' 
      });
    }

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        message: 'Both fromCurrency and toCurrency are required.' 
      });
    }

    // Convert currency
    const convertedAmount = await convertCurrency(
      parseFloat(amount),
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase()
    );

    // Calculate exchange rate
    const exchangeRate = fromCurrency.toUpperCase() === toCurrency.toUpperCase() 
      ? 1 
      : convertedAmount / parseFloat(amount);

    res.json({
      success: true,
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency.toUpperCase(),
      convertedAmount: convertedAmount,
      convertedCurrency: toCurrency.toUpperCase(),
      exchangeRate: exchangeRate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ 
      message: 'Error converting currency', 
      error: error.message 
    });
  }
});

/**
 * Get exchange rates for a base currency
 * GET /api/currency/rates?base=USD
 */
router.get('/rates', async (req, res) => {
  try {
    const baseCurrency = (req.query.base || 'USD').toUpperCase();
    
    // All supported currencies to return rates for
    const targetCurrencies = [
      'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD',
      'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'MXN', 'BRL', 'ZAR', 'AED',
      'SAR', 'THB', 'MYR', 'IDR', 'KRW', 'PHP', 'VND', 'TRY', 'RUB'
    ];
    
    const rates = {};
    
    // Get rate for each target currency
    for (const targetCurrency of targetCurrencies) {
      if (targetCurrency === baseCurrency) {
        rates[targetCurrency] = 1;
      } else {
        // Convert 1 unit of base currency to target currency
        const converted = await convertCurrency(1, baseCurrency, targetCurrency);
        rates[targetCurrency] = converted;
      }
    }

    res.json({
      success: true,
      base: baseCurrency,
      rates: rates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get exchange rates error:', error);
    res.status(500).json({ 
      message: 'Error fetching exchange rates', 
      error: error.message 
    });
  }
});

module.exports = router;

