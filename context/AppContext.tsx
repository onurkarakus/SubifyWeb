
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Subscription, UserProfile, PlanType, AIResult, BillingCycle, DefaultCategory, PaymentRecord, Currency } from '../types';
import { MOCK_SUBSCRIPTIONS, CURRENCY_SYMBOLS } from '../constants';
import { translations, Language } from '../translations';

interface AppContextProps {
  user: UserProfile;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id' | 'paymentHistory'>) => boolean; // returns success
  updateSubscription: (id: string, sub: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;
  renewSubscription: (id: string) => void; // Manually mark as paid/renewed
  revertLastPayment: (id: string) => void; // Undo last payment
  upgradeToPremium: () => void;
  downgradeToFree: () => void; // For testing
  generateAIAnalysis: () => Promise<AIResult>;
  isPaywallOpen: boolean;
  openPaywall: (trigger?: string) => void;
  closePaywall: () => void;
  paywallTrigger: string; // context of why paywall opened
  totalMonthlySpend: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.tr, params?: Record<string, string | number>) => string;
  getOverdueSubscriptions: () => Subscription[]; // Returns array of overdue subscriptions without updating them
  getMonthlyReport: () => { paid: number; pending: number };
  exportData: (format: 'json' | 'csv') => void;
  importData: (content: string) => boolean;
  // New Features
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  categories: string[];
  updateBudget: (amount: number) => void;
  requestNotificationPermission: () => Promise<boolean>;
  // Currency Features
  currencySymbol: string;
  setBaseCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency: Currency) => number;
  exchangeRates: Record<string, number>;
  refreshRates: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const DEFAULT_USER: UserProfile = {
  id: 'guest',
  name: 'Misafir',
  email: '',
  plan: PlanType.FREE,
  currency: 'TRY',
  customCategories: [],
  monthlyBudget: 0,
  notificationsEnabled: false
};

const MOCK_USER: UserProfile = {
  id: 'user-1',
  name: 'Ali Yılmaz',
  email: 'ali@example.com',
  plan: PlanType.FREE,
  currency: 'TRY',
  customCategories: [],
  monthlyBudget: 2500,
  notificationsEnabled: false
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [language, setLanguageState] = useState<Language>('tr');

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState('');

  // Exchange Rates State
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ TRY: 1, USD: 1, EUR: 1 });

  // --- Exchange Rate Logic ---
  const refreshRates = async () => {
    try {
      // Free API, no key required. Fetches rates relative to the user's base currency
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${user.currency}`);
      const data = await response.json();
      if (data && data.rates) {
        setExchangeRates(data.rates);
        localStorage.setItem('subify_rates', JSON.stringify({
           base: user.currency,
           rates: data.rates,
           timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("Failed to fetch rates", error);
    }
  };

  // Convert any amount to the user's base currency
  const convertAmount = (amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === user.currency) return amount;
    // Since rates are fetched relative to user.currency, the rate for fromCurrency is actually 1 unit of user.currency = X units of fromCurrency?
    // Wait, exchangerate-api/v4/latest/TRY returns: "USD": 0.03 (1 TRY = 0.03 USD).
    // So if I have 10 USD, and base is TRY. I need to divide by the rate? 
    // No, standard API response: Base = TRY. Rates: USD = 0.03.
    // 1 TRY = 0.03 USD. -> 1 USD = 1/0.03 TRY.
    // So Amount(USD) / Rate(USD) = Amount(TRY).
    
    const rate = exchangeRates[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
  };

  useEffect(() => {
    if (isAuthenticated) {
        // Load cached rates first
        const cached = localStorage.getItem('subify_rates');
        if (cached) {
            const parsed = JSON.parse(cached);
            // Valid for 24 hours and if base currency matches
            if (parsed.base === user.currency && (Date.now() - parsed.timestamp < 86400000)) {
                setExchangeRates(parsed.rates);
            } else {
                refreshRates();
            }
        } else {
            refreshRates();
        }
    }
  }, [isAuthenticated, user.currency]);


  // --- Effects (Load/Save) ---
  useEffect(() => {
    // Simulate initial data fetch from LocalStorage
    const storedAuth = localStorage.getItem('subify_auth');
    const storedSubs = localStorage.getItem('subify_subs');
    const storedUser = localStorage.getItem('subify_user');
    const storedLang = localStorage.getItem('subify_lang');

    if (storedLang) {
      setLanguageState(storedLang as Language);
    }

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
            ...parsedUser,
            currency: parsedUser.currency || 'TRY',
            customCategories: parsedUser.customCategories || [],
            monthlyBudget: parsedUser.monthlyBudget || 0,
            notificationsEnabled: parsedUser.notificationsEnabled || false
        });
      } else {
        setUser(MOCK_USER);
      }
      
      if (storedSubs) {
        try {
            const parsedSubs = JSON.parse(storedSubs);
            // Sanitize data: Ensure all required fields exist (handling data migration from older versions)
            const sanitizedSubs = Array.isArray(parsedSubs) ? parsedSubs.map((sub: any) => ({
                ...sub,
                // Fallback for missing renewal date
                nextRenewalDate: sub.nextRenewalDate || new Date().toISOString().split('T')[0],
                // Fallback for missing payment history
                paymentHistory: Array.isArray(sub.paymentHistory) ? sub.paymentHistory : []
            })) : MOCK_SUBSCRIPTIONS as unknown as Subscription[];
            
            setSubscriptions(sanitizedSubs);
        } catch (e) {
            console.error("Failed to parse subscriptions", e);
            setSubscriptions(MOCK_SUBSCRIPTIONS as unknown as Subscription[]);
        }
      } else {
        setSubscriptions(MOCK_SUBSCRIPTIONS as unknown as Subscription[]);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('subify_subs', JSON.stringify(subscriptions));
    }
  }, [subscriptions, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('subify_user', JSON.stringify(user));
    }
  }, [user, isAuthenticated]);

  // --- Notification Logic ---
  useEffect(() => {
    if (isAuthenticated && user.notificationsEnabled) {
        const overdue = getOverdueSubscriptions();
        if (overdue.length > 0 && Notification.permission === 'granted') {
            // Check if we haven't notified today
            const lastNotified = localStorage.getItem('subify_last_notification');
            const today = new Date().toISOString().split('T')[0];
            
            if (lastNotified !== today) {
                new Notification('Subify: Ödeme Hatırlatması', {
                    body: `${overdue.length} adet aboneliğinin ödeme tarihi geldi. Kontrol etmek için tıkla.`,
                    icon: '/favicon.ico',
                    requireInteraction: true
                });
                localStorage.setItem('subify_last_notification', today);
            }
        }
    }
  }, [subscriptions, isAuthenticated, user.notificationsEnabled]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('subify_lang', lang);
  };

  const setBaseCurrency = (currency: Currency) => {
      setUser(prev => ({...prev, currency}));
      // Will trigger useEffect to refresh rates
  };

  // Translation Helper
  const t = (key: keyof typeof translations.tr, params?: Record<string, string | number>) => {
    const text = translations[language][key] || translations['tr'][key] || key;
    if (!params) return text;
    
    return Object.entries(params).reduce((acc, [k, v]) => {
      return acc.replace(`{${k}}`, String(v));
    }, text);
  };

  // --- Auth Actions ---
  const login = async (email: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        // Set the mock user with the email provided (or default mock user)
        const newUser = { ...MOCK_USER, email: email || MOCK_USER.email };
        setUser(newUser);
        
        // Load default subs if empty
        if (subscriptions.length === 0) {
           setSubscriptions(MOCK_SUBSCRIPTIONS as unknown as Subscription[]);
        }

        localStorage.setItem('subify_auth', 'true');
        localStorage.setItem('subify_user', JSON.stringify(newUser));
        resolve();
      }, 1000); // Simulate network delay
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(DEFAULT_USER);
    localStorage.removeItem('subify_auth');
  };

  // --- App Actions ---

  // Identify overdue subscriptions but DO NOT auto-update
  const getOverdueSubscriptions = (): Subscription[] => {
    const today = new Date();
    // Set to beginning of day to ensure exact matches count as overdue
    today.setHours(0, 0, 0, 0);

    return subscriptions.filter(sub => {
      // Safety check for nextRenewalDate
      if (!sub.nextRenewalDate) return false;
      const renewalDate = new Date(sub.nextRenewalDate);
      // Check if renewal date is today or in the past
      return renewalDate <= today;
    });
  };

  // Manually mark a subscription as paid/renewed and advance the date
  const renewSubscription = (id: string) => {
    const today = new Date();
    
    setSubscriptions(prev => prev.map(sub => {
      if (sub.id === id) {
        if (!sub.nextRenewalDate) return sub; // Safety check

        const renewalDate = new Date(sub.nextRenewalDate);
        const oldDateStr = sub.nextRenewalDate;
        
        // 1. Record the payment in history
        const newPaymentRecord: PaymentRecord = {
            date: oldDateStr,
            amount: sub.price,
            currency: sub.currency
        };
        
        const updatedHistory = [...(sub.paymentHistory || []), newPaymentRecord];

        // 2. Calculate Next Date
        // Loop to ensure the new date is in the future relative to original schedule
        do {
            if (sub.cycle === BillingCycle.MONTHLY) {
                renewalDate.setMonth(renewalDate.getMonth() + 1);
            } else if (sub.cycle === BillingCycle.QUARTERLY) {
                renewalDate.setMonth(renewalDate.getMonth() + 3);
            } else if (sub.cycle === BillingCycle.YEARLY) {
                renewalDate.setFullYear(renewalDate.getFullYear() + 1);
            }
        } while (renewalDate <= today); // Ensure the new date is in the future

        const nextDateStr = renewalDate.toISOString().split('T')[0];
        return { 
            ...sub, 
            nextRenewalDate: nextDateStr, 
            lastUsedDate: new Date().toISOString().split('T')[0],
            paymentHistory: updatedHistory
        };
      }
      return sub;
    }));
  };

  const revertLastPayment = (id: string) => {
    setSubscriptions(prev => prev.map(sub => {
        if (sub.id === id && sub.paymentHistory && sub.paymentHistory.length > 0) {
            // Create copy of history
            const newHistory = [...sub.paymentHistory];
            // Remove the last item (which was added last)
            const lastRecord = newHistory.pop(); 
            
            if (!lastRecord) return sub; // Should not happen due to length check
            
            const currentDate = new Date(sub.nextRenewalDate);
            
            if (sub.cycle === BillingCycle.MONTHLY) {
                currentDate.setMonth(currentDate.getMonth() - 1);
            } else if (sub.cycle === BillingCycle.QUARTERLY) {
                currentDate.setMonth(currentDate.getMonth() - 3);
            } else if (sub.cycle === BillingCycle.YEARLY) {
                currentDate.setFullYear(currentDate.getFullYear() - 1);
            }
            
            const revertedDateStr = currentDate.toISOString().split('T')[0];

            return {
                ...sub,
                nextRenewalDate: revertedDateStr,
                paymentHistory: newHistory
            };
        }
        return sub;
    }));
  };

  const openPaywall = (trigger: string = 'generic') => {
    setPaywallTrigger(trigger);
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
  };

  const addSubscription = (subData: Omit<Subscription, 'id' | 'paymentHistory'>) => {
    // Freemium Logic: Max 3 subs
    if (user.plan === PlanType.FREE && subscriptions.length >= 3) {
      openPaywall('limit_reached');
      return false;
    }

    const newSub: Subscription = {
      ...subData,
      id: Math.random().toString(36).substr(2, 9),
      paymentHistory: []
    };
    setSubscriptions(prev => [...prev, newSub]);
    return true;
  };

  const updateSubscription = (id: string, subData: Partial<Subscription>) => {
    setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, ...subData } : sub));
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  const upgradeToPremium = () => {
    setUser(prev => ({ ...prev, plan: PlanType.PREMIUM }));
    closePaywall();
  };

  const downgradeToFree = () => {
    setUser(prev => ({ ...prev, plan: PlanType.FREE }));
  };

  // Simulate AI Processing Delay
  const generateAIAnalysis = async (): Promise<AIResult> => {
    if (user.plan === PlanType.FREE) {
       throw new Error("Premium Only");
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const symbol = CURRENCY_SYMBOLS[user.currency];
        const summary = language === 'tr' 
          ? `Bu ay aboneliklere toplam ${totalMonthlySpend.toFixed(0)} ${symbol} harcadın.`
          : `You spent a total of ${totalMonthlySpend.toFixed(0)} ${symbol} on subscriptions this month.`;

        const tips = language === 'tr' 
          ? [
            "Disney+ son 45 gündür kullanılmamış, dondurmayı düşünebilirsin.",
            "Spotify ve YouTube Music birlikte aylık yük oluşturuyor. En çok hangisini kullanıyorsan onu bırakmak mantıklı olabilir.",
            "Yazılım aboneliklerinde yıllık ödeme ile %20 tasarruf edebilirsin."
          ]
          : [
            "You haven't used Disney+ for 45 days, consider pausing it.",
            "Spotify and YouTube Music are stacking up. Consider keeping only the one you use most.",
            "You could save 20% on software subscriptions by switching to yearly billing."
          ];

        resolve({
          summary,
          tips,
          estimatedSavings: Math.floor(Math.random() * 200) + 50 
        });
      }, 2500); 
    });
  };

  // --- Calculations using Dynamic Conversion ---
  const totalMonthlySpend = subscriptions.reduce((acc, sub) => {
    let price = sub.price;
    
    // Cycle normalization
    if (sub.cycle === BillingCycle.YEARLY) price = sub.price / 12;
    if (sub.cycle === BillingCycle.QUARTERLY) price = sub.price / 3;
    
    // Currency normalization to User Base Currency using LIVE rates
    return acc + convertAmount(price, sub.currency);
  }, 0);

  // Helper to get breakdown for current month
  const getMonthlyReport = () => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();
    
    let paidTotal = 0;
    let pendingTotal = 0;

    subscriptions.forEach(sub => {
       // 1. Calculate PAID amount from history for this month
       const paidInMonth = (sub.paymentHistory || []).filter(record => {
           if (!record.date) return false;
           // Manual parsing to avoid timezone issues
           const [y, m, d] = record.date.split('-').map(Number);
           return (m - 1) === currentMonth && y === currentYear;
       });
       
       paidInMonth.forEach(record => {
           // Normalize currency to User Base
           paidTotal += convertAmount(record.amount, record.currency);
       });

       // 2. Calculate PENDING amount based on nextRenewalDate
       if (sub.nextRenewalDate) {
         const [ny, nm, nd] = sub.nextRenewalDate.split('-').map(Number);
         
         // Check if next renewal is in current month
         if ((nm - 1) === currentMonth && ny === currentYear) {
             // Only count full price for pending, converted
             pendingTotal += convertAmount(sub.price, sub.currency);
         }
       }
    });
    
    return { paid: paidTotal, pending: pendingTotal };
  };
  
  // Test notification function
  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
         new Notification('Subify Test', {
            body: 'Bildirim sistemi başarıyla çalışıyor! 🚀',
            icon: '/favicon.ico',
            requireInteraction: true
        });
        return true;
    }
    return false;
  }

  // --- Data Management ---
  const exportData = (format: 'json' | 'csv') => {
    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'json') {
      const data = {
        user,
        subscriptions,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV Export
      const headers = ['Name', 'Price', 'Currency', 'Cycle', 'Category', 'NextRenewalDate', 'Description'];
      const rows = subscriptions.map(sub => [
        `"${sub.name.replace(/"/g, '""')}"`, // Escape quotes
        sub.price,
        sub.currency,
        sub.cycle,
        sub.category,
        sub.nextRenewalDate,
        `"${(sub.id).substring(0,6)}"`
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      // Add BOM for Excel UTF-8 compatibility
      content = '\uFEFF' + csvContent;
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subify_backup_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (content: string): boolean => {
    try {
      // Try parsing as JSON first
      try {
        const data = JSON.parse(content);
        
        // Basic validation for JSON
        if (data.user && Array.isArray(data.subscriptions)) {
          setUser(data.user);
          const sanitizedSubs = data.subscriptions.map((sub: any) => ({
              ...sub,
              nextRenewalDate: sub.nextRenewalDate || new Date().toISOString().split('T')[0],
              paymentHistory: Array.isArray(sub.paymentHistory) ? sub.paymentHistory : []
          }));
          setSubscriptions(sanitizedSubs);
          
          localStorage.setItem('subify_user', JSON.stringify(data.user));
          localStorage.setItem('subify_subs', JSON.stringify(sanitizedSubs));
          return true;
        }
      } catch (jsonErr) {
         // Not JSON, assume CSV
      }

      // Try CSV Parsing
      const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) return false; // Need headers and at least one row

      const headers = lines[0].split(',');
      // Basic CSV Validation check
      if (!headers[0].toLowerCase().includes('name')) return false;

      const newSubs: Subscription[] = [];
      
      for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          
          if (cols.length < 3) continue;
          
          const name = cols[0] || 'Unknown';
          const price = parseFloat(cols[1]) || 0;
          const currency = (cols[2] || 'TRY') as any;
          const cycle = (cols[3] || BillingCycle.MONTHLY) as any;
          const category = (cols[4] || DefaultCategory.OTHER) as any;
          const nextRenewalDate = cols[5] || new Date().toISOString().split('T')[0];

          newSubs.push({
             id: Math.random().toString(36).substr(2, 9),
             name,
             price,
             currency,
             cycle,
             category,
             nextRenewalDate,
             paymentHistory: []
          });
      }

      if (newSubs.length > 0) {
          const updatedSubs = [...subscriptions, ...newSubs];
          setSubscriptions(updatedSubs);
          localStorage.setItem('subify_subs', JSON.stringify(updatedSubs));
          return true;
      }

      return false;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  };

  // --- New Features Logic ---
  
  const addCategory = (name: string) => {
    if (!user.customCategories?.includes(name)) {
      setUser(prev => ({
        ...prev,
        customCategories: [...(prev.customCategories || []), name]
      }));
    }
  };

  const removeCategory = (name: string) => {
    setUser(prev => ({
      ...prev,
      customCategories: (prev.customCategories || []).filter(c => c !== name)
    }));
  };

  const updateBudget = (amount: number) => {
    setUser(prev => ({ ...prev, monthlyBudget: amount }));
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setUser(prev => ({ ...prev, notificationsEnabled: true }));
      new Notification("Subify", { body: "Bildirimler aktif edildi! 🔔" });
      return true;
    }
    return false;
  };

  const categories = Array.from(new Set([
    ...Object.values(DefaultCategory),
    ...(user.customCategories || [])
  ]));

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
      subscriptions,
      addSubscription,
      updateSubscription,
      removeSubscription,
      renewSubscription,
      revertLastPayment,
      upgradeToPremium,
      downgradeToFree,
      generateAIAnalysis,
      isPaywallOpen,
      openPaywall,
      closePaywall,
      paywallTrigger,
      totalMonthlySpend,
      language,
      setLanguage,
      t,
      getOverdueSubscriptions,
      getMonthlyReport,
      exportData,
      importData,
      addCategory,
      removeCategory,
      categories,
      updateBudget,
      requestNotificationPermission,
      currencySymbol: CURRENCY_SYMBOLS[user.currency],
      setBaseCurrency,
      convertAmount,
      exchangeRates,
      refreshRates
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
