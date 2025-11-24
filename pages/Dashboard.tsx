

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, MoreVertical, Grid, List as ListIcon, Filter, SortAsc, Trash2, AlertTriangle, Pencil, Calendar, DollarSign, Type, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { AddSubscriptionModal } from '../components/AddSubscriptionModal';
import { AISection } from '../components/AISection';
import { getCategoryColorHex, CURRENCY_SYMBOLS } from '../constants';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Subscription, BillingCycle, DefaultCategory } from '../types';

export const Dashboard: React.FC = () => {
  const { user, subscriptions, totalMonthlySpend, removeSubscription, renewSubscription, t, categories, currencySymbol, convertAmount } = useApp();
  const { addToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // View & Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortType, setSortType] = useState<'date' | 'price' | 'name'>('date');
  
  // Chart State
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');

  // Edit & Delete States
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Upcoming Carousel State
  const [currentUpcomingIndex, setCurrentUpcomingIndex] = useState(0);
  
  // Ref to handle clicking outside of menus
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Logic: Filter & Sort ---
  const processedSubscriptions = subscriptions
    .filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortType) {
        case 'price':
          // Compare converted prices for fairness
          return convertAmount(b.price, b.currency) - convertAmount(a.price, a.currency);
        case 'name':
          return a.name.localeCompare(b.name); // Ascending name
        case 'date':
        default:
          return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime(); // Ascending date
      }
    });

  // Get upcoming payments for the next 5 days
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() + 5);
    limitDate.setHours(23, 59, 59, 999);

    return processedSubscriptions
      .filter(sub => {
        const [y, m, d] = sub.nextRenewalDate.split('-').map(Number);
        const subDate = new Date(y, m - 1, d);
        return subDate >= today && subDate <= limitDate;
      })
      .sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime());
  }, [processedSubscriptions]);
  
  // Reset index if list changes
  useEffect(() => {
    if (currentUpcomingIndex >= upcomingPayments.length) {
      setCurrentUpcomingIndex(0);
    }
  }, [upcomingPayments, currentUpcomingIndex]);

  const currentUpcoming = upcomingPayments[currentUpcomingIndex];

  const nextUpcoming = () => {
    setCurrentUpcomingIndex((prev) => (prev + 1) % upcomingPayments.length);
  };

  const prevUpcoming = () => {
    setCurrentUpcomingIndex((prev) => (prev - 1 + upcomingPayments.length) % upcomingPayments.length);
  };

  // --- Logic: Chart Data Calculation (Strict Date Based + Currency Conversion) ---
  const chartData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    if (chartView === 'monthly') {
      const months = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
      ];
      
      return months.map((monthName, monthIndex) => {
        let monthTotal = 0;
        subscriptions.forEach(sub => {
          const renewalDate = new Date(sub.nextRenewalDate);
          const renewalYear = renewalDate.getFullYear();
          const renewalMonth = renewalDate.getMonth();
          const convertedPrice = convertAmount(sub.price, sub.currency);

          if (sub.cycle === BillingCycle.MONTHLY) {
            if (renewalYear < currentYear || (renewalYear === currentYear && renewalMonth <= monthIndex)) {
              monthTotal += convertedPrice;
            }
          } else if (sub.cycle === BillingCycle.QUARTERLY) {
            if (renewalYear < currentYear) {
              if (monthIndex % 3 === renewalMonth % 3) {
                monthTotal += convertedPrice;
              }
            } else if (renewalYear === currentYear) {
              if (monthIndex >= renewalMonth && (monthIndex - renewalMonth) % 3 === 0) {
                monthTotal += convertedPrice;
              }
            }
          } else if (sub.cycle === BillingCycle.YEARLY) {
            if (renewalYear <= currentYear && renewalMonth === monthIndex) {
              monthTotal += convertedPrice;
            }
          }
        });
        return { name: monthName, value: monthTotal };
      });

    } else {
      const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
      return years.map(year => {
        let yearTotal = 0;
        subscriptions.forEach(sub => {
          const renewalDate = new Date(sub.nextRenewalDate);
          const renewalYear = renewalDate.getFullYear();
          const renewalMonth = renewalDate.getMonth();
          const convertedPrice = convertAmount(sub.price, sub.currency);

          if (sub.cycle === BillingCycle.MONTHLY) {
            if (renewalYear < year) {
              yearTotal += convertedPrice * 12;
            } else if (renewalYear === year) {
              yearTotal += convertedPrice * (12 - renewalMonth);
            }
          } else if (sub.cycle === BillingCycle.QUARTERLY) {
             if (renewalYear < year) {
               yearTotal += convertedPrice * 4;
             } else if (renewalYear === year) {
               const monthsRemaining = 12 - renewalMonth;
               const payments = Math.ceil(monthsRemaining / 3);
               yearTotal += convertedPrice * payments;
             }
          } else {
            if (renewalYear <= year) {
               yearTotal += convertedPrice;
            }
          }
        });
        return { name: year.toString(), value: yearTotal };
      });
    }
  }, [subscriptions, chartView, convertAmount]);

  const chartDisplayTotal = useMemo(() => {
    return chartData.reduce((acc, dataPoint) => acc + dataPoint.value, 0);
  }, [chartData]);


  const getCategoryColor = (cat: string) => {
    // Legacy support logic moved to constants, but for UI rendering we might need inline style
    const hex = getCategoryColorHex(cat);
    return { color: hex, backgroundColor: `${hex}20` }; // 20 is approx 12% opacity hex
  };

  const handleEdit = (sub: Subscription, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubscriptionToEdit(sub);
    setIsAddModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmationId(id);
    setOpenMenuId(null);
  };

  const handlePayClick = (sub: Subscription, e: React.MouseEvent) => {
    e.stopPropagation();
    renewSubscription(sub.id);
    addToast(t('renewal_success', { services: sub.name }), 'success');
  }

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      removeSubscription(deleteConfirmationId);
      addToast(t('delete_success') || 'Abonelik silindi', 'success');
      setDeleteConfirmationId(null);
    }
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleAddClick = () => {
    setSubscriptionToEdit(null);
    setIsAddModalOpen(true);
  };

  const toggleSort = () => {
    setSortType(prev => {
      if (prev === 'date') return 'price';
      if (prev === 'price') return 'name';
      return 'date';
    });
  };
  
  const getStatus = (date: string) => {
      const renewalDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (renewalDate <= today) {
          return 'overdue';
      }
      return 'active';
  }

  // Budget Calculation
  const budgetPercentage = user.monthlyBudget && user.monthlyBudget > 0 
    ? (totalMonthlySpend / user.monthlyBudget) * 100 
    : 0;
  const isOverBudget = budgetPercentage > 100;

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-8" onClick={() => setOpenMenuId(null)}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard')}</h1>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:min-w-[300px]">
             <input 
               type="text" 
               placeholder={t('search_placeholder')}
               className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
            onClick={handleAddClick}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>{t('add_subscription')}</span>
          </button>
        </div>
      </div>

      {/* KPI & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: KPIs */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           {/* Total Spend Card */}
           <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden h-auto min-h-[160px]">
              <div className="flex items-center gap-3 relative z-10 mb-2">
                 <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined">account_balance_wallet</span>
                 </div>
                 <p className="text-gray-400 font-medium">{t('monthly_total')}</p>
              </div>
              <div className="relative z-10 mb-4">
                <h3 className="text-4xl font-bold text-white">{totalMonthlySpend.toFixed(2)} {currencySymbol}</h3>
              </div>

              {/* Budget Progress Bar */}
              {user.monthlyBudget && user.monthlyBudget > 0 && (
                <div className="relative z-10 mt-auto pt-2 border-t border-white/5">
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-xs text-gray-400">{t('budget_status')}</span>
                      <span className={`text-xs font-bold ${isOverBudget ? 'text-red-400' : 'text-gray-400'}`}>
                         {Math.min(budgetPercentage, 100).toFixed(0)}%
                      </span>
                   </div>
                   <div className="w-full bg-dark rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      ></div>
                   </div>
                   <div className="mt-1 text-right">
                      {isOverBudget ? (
                         <p className="text-[10px] text-red-400 font-bold flex items-center justify-end gap-1">
                           <AlertTriangle size={10} /> {t('budget_alert', { amount: `${(totalMonthlySpend - user.monthlyBudget).toFixed(0)} ${currencySymbol}` })}
                         </p>
                      ) : (
                         <p className="text-[10px] text-gray-500">
                           {t('budget_left', { amount: `${(user.monthlyBudget - totalMonthlySpend).toFixed(0)} ${currencySymbol}` })}
                         </p>
                      )}
                   </div>
                </div>
              )}
           </div>

           {/* Upcoming Payment Card - Carousel */}
           <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col h-40 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-500 flex-shrink-0">
                     <span className="material-symbols-outlined">hourglass_top</span>
                   </div>
                   <p className="text-gray-400 font-medium">{t('upcoming_payment')}</p>
                </div>
                
                {upcomingPayments.length > 1 && (
                  <div className="flex items-center gap-1">
                     <button 
                      onClick={prevUpcoming}
                      className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                     >
                       <ChevronLeft size={16} />
                     </button>
                     <button 
                      onClick={nextUpcoming}
                      className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                     >
                       <ChevronRight size={16} />
                     </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex items-center">
                {currentUpcoming ? (
                   <div className="w-full flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg bg-dark border border-white/10 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                           {currentUpcoming.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-white font-bold text-lg truncate max-w-[120px]">{currentUpcoming.name}</p>
                            <p className="text-amber-500 text-xs font-medium flex items-center gap-1">
                               <Calendar size={10} /> {currentUpcoming.nextRenewalDate}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-2xl font-bold text-white">{currentUpcoming.price} <span className="text-xs text-gray-400 font-normal">{currentUpcoming.currency}</span></p>
                         {currentUpcoming.currency !== user.currency && (
                             <p className="text-xs text-gray-500">≈ {convertAmount(currentUpcoming.price, currentUpcoming.currency).toFixed(2)} {currencySymbol}</p>
                         )}
                      </div>
                   </div>
                ) : (
                   <div className="w-full flex flex-col items-center justify-center text-gray-500 text-sm">
                     <span className="material-symbols-outlined text-2xl mb-1 opacity-50">event_available</span>
                     <span>{t('no_data')}</span>
                   </div>
                )}
              </div>

              {upcomingPayments.length > 1 && (
                 <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1">
                    {upcomingPayments.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentUpcomingIndex ? 'bg-amber-500 w-3' : 'bg-white/10'}`}
                      />
                    ))}
                 </div>
              )}
           </div>
        </div>

        {/* Column 2: Chart (Span 2) */}
        <div className="lg:col-span-2 bg-surface border border-white/10 rounded-2xl p-6 flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <div>
               <p className="text-gray-400 font-medium">{t('spending_reports')}</p>
               <h3 className="text-2xl font-bold text-white mt-1">
                 {chartDisplayTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                 <span className="text-sm font-normal text-gray-500 ml-2">
                   / {chartView === 'monthly' ? t('this_year') : t('next_5_years')}
                 </span>
               </h3>
             </div>
             <div className="flex bg-dark rounded-lg p-1 gap-1 border border-white/5">
                <button 
                  onClick={() => setChartView('monthly')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${chartView === 'monthly' ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  {t('monthly')}
                </button>
                <button 
                  onClick={() => setChartView('yearly')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${chartView === 'yearly' ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  {t('yearly')}
                </button>
             </div>
           </div>
           
           <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}} 
                    dy={10}
                  />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{backgroundColor: '#0D0D0D', borderColor: '#333', borderRadius: '8px', color: '#fff'}}
                    formatter={(value: number) => [`${value.toFixed(2)} ${currencySymbol}`, t('amount')]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8A2BE2" 
                    radius={[4, 4, 4, 4]} 
                    barSize={chartView === 'monthly' ? 16 : 32}
                  />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* AI Section */}
      <AISection />

      {/* Subscriptions Grid Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
         <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">{t('all_categories')} ({processedSubscriptions.length})</h3>
            {sortType !== 'date' && (
              <span className="text-xs font-medium px-2 py-1 rounded bg-primary/20 text-primary capitalize">
                {t('action')}: {sortType === 'price' ? t('price') : t('service')}
              </span>
            )}
         </div>
         
         <div className="flex gap-2">
            <button 
              onClick={toggleSort}
              className={`p-2 rounded-lg bg-surface border border-white/10 transition-colors ${sortType !== 'date' ? 'text-white border-primary/50' : 'text-gray-400 hover:text-white'}`}
              title="Sort: Date -> Price -> Name"
            >
               {sortType === 'price' ? <DollarSign size={20} /> : sortType === 'name' ? <Type size={20} /> : <SortAsc size={20} />}
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg bg-surface border border-white/10 transition-colors ${showFilters ? 'text-white border-primary/50' : 'text-gray-400 hover:text-white'}`}
            >
               <Filter size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface border border-white/10 text-gray-400 hover:text-white'}`}
            >
               <Grid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface border border-white/10 text-gray-400 hover:text-white'}`}
            >
               <ListIcon size={20} />
            </button>
         </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              selectedCategory === 'all' 
                ? 'bg-white text-black border-white' 
                : 'bg-surface text-gray-400 border-white/10 hover:text-white hover:border-white/30'
            }`}
          >
            {t('all_categories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === cat 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-surface text-gray-400 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {Object.values(DefaultCategory).includes(cat as DefaultCategory) ? t(`cat_${cat}` as any) : cat}
            </button>
          ))}
        </div>
      )}

      {/* Subscriptions Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedSubscriptions.map(sub => {
            const status = getStatus(sub.nextRenewalDate);
            const catStyle = getCategoryColor(sub.category);
            return (
            <div key={sub.id} className="bg-surface border border-white/10 rounded-2xl p-5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all group relative animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-dark rounded-xl flex items-center justify-center text-xl font-bold text-white border border-white/5">
                      {sub.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-2 relative">
                      {/* Status Badge */}
                      {status === 'active' ? (
                          <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 uppercase">
                             {t('active')}
                          </div>
                      ) : (
                          <button 
                            onClick={(e) => handlePayClick(sub, e)}
                            className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase shadow-lg shadow-red-500/20 transition-colors"
                          >
                             {t('pay_now')}
                          </button>
                      )}

                      <button 
                          onClick={(e) => toggleMenu(sub.id, e)}
                          className="text-gray-500 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === sub.id && (
                          <div className="absolute top-full right-0 mt-2 w-40 bg-[#2A2A2A] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                              <button 
                                  onClick={(e) => handleEdit(sub, e)}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                              >
                                  <Pencil size={16} />
                                  {t('edit')}
                              </button>
                              <button 
                                  onClick={(e) => handleDeleteClick(sub.id, e)}
                                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                              >
                                  <Trash2 size={16} />
                                  {t('delete')}
                              </button>
                          </div>
                      )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-white truncate">{sub.name}</h4>
                  <div className="flex flex-col">
                     <span className="text-sm text-gray-400">{sub.price} {sub.currency || CURRENCY_SYMBOLS['TRY']} / {sub.cycle === 'quarterly' ? t('quarterly') : sub.cycle === 'monthly' ? t('monthly') : t('yearly')}</span>
                     {sub.currency !== user.currency && (
                         <span className="text-xs text-gray-500 mt-0.5">≈ {convertAmount(sub.price, sub.currency).toFixed(2)} {currencySymbol}</span>
                     )}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                    style={catStyle}
                  >
                      {Object.values(DefaultCategory).includes(sub.category as DefaultCategory) ? t(`cat_${sub.category}` as any) : sub.category}
                  </span>
                  <span className={`text-xs flex items-center gap-1 ${status === 'overdue' ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                        <Calendar size={12} />
                        {sub.nextRenewalDate}
                  </span>
                </div>
            </div>
          )})}

          {/* Add New Card */}
          <button 
            onClick={handleAddClick}
            className="bg-transparent border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[180px] animate-fade-in"
          >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-primary">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{t('add_subscription')}</p>
                <p className="text-xs text-gray-500 mt-1">Yeni bir harcamanı takip et.</p>
              </div>
          </button>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden animate-fade-in">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4 font-bold">{t('service')}</th>
                   <th className="px-6 py-4 font-bold">{t('category')}</th>
                   <th className="px-6 py-4 font-bold">{t('amount')}</th>
                   <th className="px-6 py-4 font-bold">{t('renewal')}</th>
                   <th className="px-6 py-4 font-bold text-right">{t('action')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {processedSubscriptions.map(sub => {
                   const status = getStatus(sub.nextRenewalDate);
                   const catStyle = getCategoryColor(sub.category);
                   return (
                   <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                     <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 bg-dark rounded-lg flex items-center justify-center text-white font-bold border border-white/10">
                          {sub.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                             <span>{sub.name}</span>
                             {status === 'overdue' && (
                                 <span className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1"><Clock size={10} /> {t('overdue')}</span>
                             )}
                        </div>
                     </td>
                     <td className="px-6 py-4">
                       <span 
                        className="px-2 py-1 rounded-full text-xs font-bold uppercase"
                        style={catStyle}
                       >
                         {Object.values(DefaultCategory).includes(sub.category as DefaultCategory) ? t(`cat_${sub.category}` as any) : sub.category}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-white font-medium">
                       <div>
                         {sub.price} {sub.currency || CURRENCY_SYMBOLS['TRY']} <span className="text-gray-500 text-xs font-normal">/ {sub.cycle === 'quarterly' ? t('quarterly') : sub.cycle === 'monthly' ? t('monthly') : t('yearly')}</span>
                       </div>
                       {sub.currency !== user.currency && (
                           <div className="text-xs text-gray-500 mt-0.5">≈ {convertAmount(sub.price, sub.currency).toFixed(2)} {currencySymbol}</div>
                       )}
                     </td>
                     <td className="px-6 py-4 text-gray-400">
                       {sub.nextRenewalDate}
                     </td>
                     <td className="px-6 py-4 text-right relative">
                        {status === 'overdue' && (
                            <button
                                onClick={(e) => handlePayClick(sub, e)}
                                className="mr-2 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                            >
                                {t('pay_now')}
                            </button>
                        )}
                        <button 
                            onClick={(e) => toggleMenu(sub.id, e)}
                            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {/* List View Dropdown */}
                        {openMenuId === sub.id && (
                          <div className="absolute right-10 top-8 w-32 bg-[#2A2A2A] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                              <button 
                                  onClick={(e) => handleEdit(sub, e)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-white/5"
                              >
                                  <Pencil size={14} />
                                  {t('edit')}
                              </button>
                              <button 
                                  onClick={(e) => handleDeleteClick(sub.id, e)}
                                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                              >
                                  <Trash2 size={14} />
                                  {t('delete')}
                              </button>
                          </div>
                        )}
                     </td>
                   </tr>
                 )})}
                 {processedSubscriptions.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {t('no_data')}
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      <AddSubscriptionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        subscriptionToEdit={subscriptionToEdit}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
               <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full text-red-500 mb-4 mx-auto">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-lg font-bold text-white text-center mb-2">{t('delete_confirm_title')}</h3>
               <p className="text-gray-400 text-center text-sm mb-6">{t('delete_confirm_desc')}</p>
               <div className="flex space-x-3">
                 <button 
                   onClick={() => setDeleteConfirmationId(null)}
                   className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-colors"
                 >
                   {t('cancel')}
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                 >
                   {t('confirm')}
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
