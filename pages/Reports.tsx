
import React from 'react';
import { useApp } from '../context/AppContext';
import { PlanType, BillingCycle, DefaultCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getCategoryColorHex } from '../constants';
import { TrendingUp, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';

export const Reports: React.FC = () => {
  const { user, subscriptions, openPaywall, t, totalMonthlySpend, getMonthlyReport, convertAmount, currencySymbol } = useApp();

  const isFree = user.plan === PlanType.FREE;
  const { paid, pending } = getMonthlyReport();

  // --- Calculations ---

  // 1. Category Distribution
  const categoryData = subscriptions.reduce((acc, sub) => {
    // Convert price to base currency
    const convertedPrice = convertAmount(sub.price, sub.currency);
    
    const existing = acc.find(x => x.name === sub.category);
    if (existing) {
      existing.value += convertedPrice;
    } else {
      acc.push({ name: sub.category, value: convertedPrice });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Sort for "Highest Spending"
  const sortedCategories = [...categoryData].sort((a, b) => b.value - a.value);
  const highestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

  // 2. Yearly Forecast
  const yearlyForecast = subscriptions.reduce((acc, sub) => {
    let yearlyPrice = sub.price;
    if (sub.cycle === BillingCycle.MONTHLY) yearlyPrice = sub.price * 12;
    if (sub.cycle === BillingCycle.QUARTERLY) yearlyPrice = sub.price * 4;
    // Convert to base currency
    return acc + convertAmount(yearlyPrice, sub.currency);
  }, 0);

  // 3. 6-Month Projection Logic
  const getProjectionData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      // Create a date object for the target projection month (1st of the month)
      const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthName = targetDate.toLocaleString('default', { month: 'short' });
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      
      let total = 0;

      subscriptions.forEach(sub => {
        const renewalDate = new Date(sub.nextRenewalDate);
        const renewalYear = renewalDate.getFullYear();
        const renewalMonth = renewalDate.getMonth();
        const convertedPrice = convertAmount(sub.price, sub.currency);

        if (sub.cycle === BillingCycle.MONTHLY) {
          // Include if the target month is same or after the renewal start date
          // Logic: (Target Year > Renewal Year) OR (Target Year == Renewal Year AND Target Month >= Renewal Month)
          if (targetYear > renewalYear || (targetYear === renewalYear && targetMonth >= renewalMonth)) {
            total += convertedPrice;
          }
        } else if (sub.cycle === BillingCycle.QUARTERLY) {
          // Calculate diff in months
          const diffMonths = (targetYear - renewalYear) * 12 + (targetMonth - renewalMonth);
          // If diffMonths >= 0 and divisible by 3
          if (diffMonths >= 0 && diffMonths % 3 === 0) {
            total += convertedPrice;
          }
        } else if (sub.cycle === BillingCycle.YEARLY) {
          // Include only if the specific month and year match the renewal date
          if (targetYear === renewalYear && targetMonth === renewalMonth) {
            total += convertedPrice;
          }
        }
      });

      data.push({ name: monthName, amount: total });
    }
    return data;
  };

  const projectionData = getProjectionData();
  
  // 4. Status Breakdown Data for Pie Chart
  const statusData = [
      { name: t('status_paid'), value: paid, fill: '#22C55E' }, // Green
      { name: t('status_pending'), value: pending, fill: '#EF4444' }, // Red
  ].filter(d => d.value > 0); // Filter out zero values to avoid ugly charts


  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto relative min-h-screen pb-20">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">{t('spending_reports')}</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Yearly Forecast */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 flex items-center space-x-4">
          <div className="p-4 bg-indigo-500/10 text-primary rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">{t('yearly_forecast')}</p>
            <h3 className="text-2xl font-bold text-white">{yearlyForecast.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currencySymbol}</h3>
          </div>
        </div>

        {/* Highest Category */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 flex items-center space-x-4">
          <div className="p-4 bg-pink-500/10 text-pink-500 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">{t('highest_category')}</p>
            <h3 className="text-lg font-bold text-white capitalize">
              {highestCategory ? (
                Object.values(DefaultCategory).includes(highestCategory.name as DefaultCategory) 
                  ? t(`cat_${highestCategory.name}` as any) 
                  : highestCategory.name
              ) : '-'}
            </h3>
            <p className="text-xs text-gray-500">
              {highestCategory ? `${highestCategory.value.toFixed(0)} ${currencySymbol}` : ''}
            </p>
          </div>
        </div>

        {/* Average Monthly */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 flex items-center space-x-4">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">{t('average_monthly')}</p>
            <h3 className="text-2xl font-bold text-white">{totalMonthlySpend.toFixed(0)} {currencySymbol}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Row 1: Projection & Status */}
        
        {/* Projection Chart (Area) */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 lg:col-span-2 h-96 flex flex-col">
          <h3 className="font-bold text-white mb-6">{t('projection_title')}</h3>
          <div className="flex-1 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B5FFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5B5FFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}${currencySymbol}`} />
                  <Tooltip 
                    cursor={{stroke: 'rgba(255,255,255,0.1)'}}
                    contentStyle={{backgroundColor: '#1F1F1F', borderColor: '#333', borderRadius: '12px', color: '#fff'}}
                    formatter={(value: number) => [`${value.toFixed(2)} ${currencySymbol}`, t('amount')]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#5B5FFF" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status (Paid vs Pending) - UPDATED CHART */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 h-96 flex flex-col">
            <h3 className="font-bold text-white mb-4">{t('status_breakdown')}</h3>
            <div className="flex-1 relative">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#1F1F1F', borderColor: '#333', borderRadius: '8px', color: '#fff'}} 
                        formatter={(value: number) => [`${value.toFixed(2)} ${currencySymbol}`, '']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                    {t('no_data')}
                  </div>
                )}
                
                {/* Center Total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold text-white">{(paid + pending).toFixed(0)}</span>
                   <span className="text-xs text-gray-500">{currencySymbol}</span>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle size={16} className="text-green-500"/> {t('status_paid')}
                    </div>
                    <span className="font-bold text-white">{paid.toFixed(0)} {currencySymbol}</span>
                 </div>
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock size={16} className="text-red-500"/> {t('status_pending')}
                    </div>
                    <span className="font-bold text-white">{pending.toFixed(0)} {currencySymbol}</span>
                 </div>
            </div>
        </div>


        {/* Row 2: Category Donut */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-white/10 flex flex-col lg:col-span-3">
          <h3 className="font-bold text-white mb-6">{t('category_distribution')}</h3>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Donut */}
              <div className="h-64 w-64 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColorHex(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1F1F1F', borderColor: '#333', borderRadius: '8px', color: '#fff'}} formatter={(value: number) => `${value.toFixed(2)} ${currencySymbol}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed List with Progress Bars */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
                {sortedCategories.map((cat, idx) => {
                  const percent = ((cat.value / totalMonthlySpend) * 100).toFixed(1);
                  const color = getCategoryColorHex(cat.name);
                  return (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                          {Object.values(DefaultCategory).includes(cat.name as DefaultCategory) ? t(`cat_${cat.name}` as any) : cat.name}
                        </span>
                        <span className="text-white font-bold">{cat.value.toFixed(0)} {currencySymbol}</span>
                      </div>
                      <div className="w-full bg-dark rounded-full h-1.5 border border-white/5">
                        <div 
                          className="h-1.5 rounded-full" 
                          style={{ width: `${percent}%`, backgroundColor: color }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-500 text-right mt-0.5">{percent}% {t('total_share')}</p>
                    </div>
                  )
                })}
                {categoryData.length === 0 && <p className="text-gray-500 text-sm text-center py-4 col-span-2">{t('no_data')}</p>}
              </div>
          </div>
        </div>
      </div>

      {/* FREE PLAN BLUR OVERLAY */}
      {isFree && (
        <div className="absolute inset-0 top-0 z-20 h-full w-full bg-dark/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="bg-surface p-8 rounded-3xl shadow-2xl max-w-md border border-white/10 transform hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary animate-bounce">
              <TrendingUp size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {t('reports_premium_title')}
            </h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              {t('reports_premium_desc')}
            </p>
            <button 
              onClick={() => openPaywall('reports')}
              className="w-full bg-gradient-to-r from-primary to-primary-hover text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all hover:shadow-xl"
            >
              {t('upgrade_now')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
