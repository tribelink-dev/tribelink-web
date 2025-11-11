const axios = require('axios');

/**
 * Convert currency using exchange rate API
 * Using exchangerate-api.io (free tier) or similar
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    // If same currency, return as is
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // For demo, use a simple conversion or API
    // In production, use a real API like exchangerate-api.io
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    
    if (apiKey) {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const rate = response.data.rates[toCurrency];
      if (rate) {
        return amount * rate;
      }
    }

    // Fallback: simple conversion rates (for demo)
    const conversionRates = {
      USD: { EUR: 0.85, INR: 83, GBP: 0.79, JPY: 150 },
      EUR: { USD: 1.18, INR: 98, GBP: 0.93, JPY: 176 },
      INR: { USD: 0.012, EUR: 0.010, GBP: 0.0095, JPY: 1.8 },
      GBP: { USD: 1.27, EUR: 1.08, INR: 105, JPY: 190 },
      JPY: { USD: 0.0067, EUR: 0.0057, INR: 0.56, GBP: 0.0053 }
    };

    if (conversionRates[fromCurrency] && conversionRates[fromCurrency][toCurrency]) {
      return amount * conversionRates[fromCurrency][toCurrency];
    }

    return amount; // Fallback to original if no conversion available
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount; // Fallback to original amount
  }
}

module.exports = { convertCurrency };

