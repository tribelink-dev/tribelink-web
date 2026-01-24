export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  decimalPlaces?: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimalPlaces: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', decimalPlaces: 0 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', decimalPlaces: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', decimalPlaces: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', decimalPlaces: 2 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', decimalPlaces: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', decimalPlaces: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', decimalPlaces: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', decimalPlaces: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪', decimalPlaces: 2 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴', decimalPlaces: 2 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰', decimalPlaces: 2 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', decimalPlaces: 2 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽', decimalPlaces: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', decimalPlaces: 2 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', decimalPlaces: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', decimalPlaces: 2 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', decimalPlaces: 2 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', decimalPlaces: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', decimalPlaces: 2 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', decimalPlaces: 0 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', decimalPlaces: 0 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', decimalPlaces: 2 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', decimalPlaces: 0 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', decimalPlaces: 2 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺', decimalPlaces: 2 },
];

export const POPULAR_CURRENCIES: Currency[] = [
  CURRENCIES.find(c => c.code === 'USD')!,
  CURRENCIES.find(c => c.code === 'EUR')!,
  CURRENCIES.find(c => c.code === 'GBP')!,
  CURRENCIES.find(c => c.code === 'INR')!,
  CURRENCIES.find(c => c.code === 'JPY')!,
  CURRENCIES.find(c => c.code === 'AUD')!,
  CURRENCIES.find(c => c.code === 'CAD')!,
  CURRENCIES.find(c => c.code === 'SGD')!,
].filter(Boolean);

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function formatCurrency(amount: number, currency: Currency | string): string {
  const currencyObj = typeof currency === 'string' ? getCurrencyByCode(currency) : currency;
  if (!currencyObj) return amount.toFixed(2);
  
  const decimalPlaces = currencyObj.decimalPlaces ?? 2;
  const formattedAmount = amount.toFixed(decimalPlaces);
  
  // Format with thousand separators
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${currencyObj.symbol}${parts.join('.')}`;
}

export function parseCurrencyAmount(value: string): number {
  // Remove currency symbols and commas, then parse
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

