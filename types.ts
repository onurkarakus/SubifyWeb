
export enum PlanType {
  FREE = 'free',
  PREMIUM = 'premium'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Default categories kept for initialization, but type is now string
export enum DefaultCategory {
  ENTERTAINMENT = 'entertainment',
  SOFTWARE = 'software',
  EDUCATION = 'education',
  MUSIC = 'music',
  OTHER = 'other'
}

export type Currency = 'TRY' | 'USD' | 'EUR';

export interface PaymentRecord {
  date: string; // ISO Date YYYY-MM-DD
  amount: number;
  currency: Currency;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  cycle: BillingCycle;
  category: string; // Changed from enum to string to support custom categories
  nextRenewalDate: string;
  lastUsedDate?: string; // Optional for advanced AI logic
  logoUrl?: string;
  paymentHistory: PaymentRecord[]; 
}

export interface AIResult {
  summary: string;
  tips: string[];
  estimatedSavings: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: PlanType;
  currency: Currency; // Preferred Base Currency
  monthlyBudget?: number; // New: Budget Goal
  customCategories?: string[]; // New: User defined categories
  notificationsEnabled?: boolean; // New: Notification preference
}
