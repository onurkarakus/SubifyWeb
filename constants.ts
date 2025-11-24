
import { DefaultCategory, Currency } from './types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  'TRY': '₺',
  'USD': '$',
  'EUR': '€'
};

// Deprecated: Use CURRENCY_SYMBOLS[user.currency] instead
export const CURRENCY_SYMBOL = '₺';

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  [DefaultCategory.ENTERTAINMENT]: '#F472B6', // Pink
  [DefaultCategory.SOFTWARE]: '#60A5FA', // Blue
  [DefaultCategory.EDUCATION]: '#34D399', // Emerald
  [DefaultCategory.MUSIC]: '#FBBF24', // Amber
  [DefaultCategory.OTHER]: '#9CA3AF', // Gray
};

// Helper to generate consistent colors for custom categories
export const getCategoryColorHex = (category: string): string => {
  // Return default if exists
  if (DEFAULT_CATEGORY_COLORS[category]) return DEFAULT_CATEGORY_COLORS[category];
  
  // Generate consistent color from string
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 60%)`; 
};

export const MOCK_SUBSCRIPTIONS = [
  {
    id: '1',
    name: 'Netflix',
    price: 129,
    currency: 'TRY',
    cycle: 'monthly',
    category: DefaultCategory.ENTERTAINMENT,
    nextRenewalDate: '2023-11-20',
    lastUsedDate: '2023-11-18',
    paymentHistory: []
  },
  {
    id: '2',
    name: 'Spotify',
    price: 69,
    currency: 'TRY',
    cycle: 'monthly',
    category: DefaultCategory.MUSIC,
    nextRenewalDate: '2023-11-25',
    lastUsedDate: '2023-11-01',
    paymentHistory: []
  },
  {
    id: '3',
    name: 'Apple Music',
    price: 19.99,
    currency: 'TRY',
    cycle: 'monthly',
    category: DefaultCategory.MUSIC,
    nextRenewalDate: '2025-12-19',
    lastUsedDate: '2025-12-01',
    paymentHistory: []
  }
];

export const POPULAR_PLATFORMS = [
  { name: 'Netflix', category: DefaultCategory.ENTERTAINMENT, price: 129.00 },
  { name: 'Spotify', category: DefaultCategory.MUSIC, price: 69.00 },
  { name: 'YouTube Premium', category: DefaultCategory.ENTERTAINMENT, price: 59.99 },
  { name: 'Amazon Prime', category: DefaultCategory.ENTERTAINMENT, price: 39.00 },
  { name: 'Disney+', category: DefaultCategory.ENTERTAINMENT, price: 134.99 },
  { name: 'iCloud+', category: DefaultCategory.SOFTWARE, price: 12.99 },
  { name: 'Adobe Creative Cloud', category: DefaultCategory.SOFTWARE, price: 350.00 },
  { name: 'Notion', category: DefaultCategory.SOFTWARE, price: 250.00 },
  { name: 'ChatGPT Plus', category: DefaultCategory.SOFTWARE, price: 700.00 },
  { name: 'Exxen', category: DefaultCategory.ENTERTAINMENT, price: 99.90 },
  { name: 'BluTV', category: DefaultCategory.ENTERTAINMENT, price: 89.90 },
  { name: 'Apple Music', category: DefaultCategory.MUSIC, price: 19.99 },
  { name: 'Udemy', category: DefaultCategory.EDUCATION, price: 0 },
  { name: 'Duolingo', category: DefaultCategory.EDUCATION, price: 329.99 },
];
