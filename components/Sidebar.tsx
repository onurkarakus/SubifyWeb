

import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, List, PieChart, Settings, LogOut, Zap, ChevronUp, User, X, TrendingUp, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlanType } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, openPaywall, logout, t, getOverdueSubscriptions, exchangeRates, refreshRates, currencySymbol } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const overdueCount = getOverdueSubscriptions().length;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  };

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    await refreshRates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getRateDisplay = (target: string) => {
    const rate = exchangeRates[target];
    if (!rate) return '...';
    // Exchange rates are: 1 Base = X Target.
    // We want to show: 1 Target = Y Base.
    // Y = 1 / X
    const val = 1 / rate;
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTargetCurrencies = () => {
    if (user.currency === 'TRY') return ['USD', 'EUR', 'GBP'];
    if (user.currency === 'USD') return ['EUR', 'GBP', 'TRY'];
    if (user.currency === 'EUR') return ['USD', 'GBP', 'TRY'];
    return ['USD', 'EUR'];
  };

  const marketTargets = getTargetCurrencies().slice(0, 3); // Show max 3

  const NavItem = ({ path, icon, label, badge }: { path: string; icon: React.ReactNode; label: string; badge?: number }) => (
    <button
      onClick={() => handleNavigation(path)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors relative ${
        location.pathname === path 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
      {(badge || 0) > 0 && (
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] shadow-sm animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="w-64 h-screen bg-dark border-r border-white/10 flex flex-col p-6">
      {/* Mobile Close Button */}
      <div className="md:hidden flex justify-end mb-2">
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X size={24} />
        </button>
      </div>

      {/* Logo */}
      <div className="mb-10 flex items-center space-x-3 px-2">
        <div className="w-8 h-8 text-primary">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Subify</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar -mx-2 px-2">
        <NavItem 
          path="/" 
          icon={<LayoutDashboard size={20} />} 
          label={t('dashboard')} 
          badge={overdueCount}
        />
        <NavItem path="/subscriptions" icon={<List size={20} />} label={t('subscriptions')} />
        <NavItem path="/reports" icon={<PieChart size={20} />} label={t('reports')} />
        <NavItem path="/settings" icon={<Settings size={20} />} label={t('settings')} />
      </nav>

      {/* Bottom Action */}
      <div className="mt-auto pt-4" ref={menuRef}>
        
        {/* Market Summary Widget */}
        <div className="mb-4 bg-[#181818] border border-white/5 rounded-xl p-3 shadow-inner">
           <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <TrendingUp size={10} /> {t('market_summary') || 'Piyasa'}
              </span>
              <button 
                onClick={handleRefreshRates} 
                className={`text-gray-500 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                title="Yenile"
              >
                <RefreshCw size={10} />
              </button>
           </div>
           <div className="space-y-1.5">
              {marketTargets.map(code => (
                 <div key={code} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                       <span className="font-bold text-gray-400">{code}</span>
                    </div>
                    <span className="font-mono font-medium text-white">
                      {getRateDisplay(code)} <span className="text-gray-600 text-[9px]">{currencySymbol}</span>
                    </span>
                 </div>
              ))}
           </div>
        </div>

        {user.plan === PlanType.FREE && (
          <div className="mb-4 p-4 bg-[#1F1F1F] border border-white/10 rounded-xl text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-2xl -mr-4 -mt-4"></div>
            <div className="flex items-center space-x-2 mb-2 relative z-10">
              <Zap size={16} className="text-primary" fill="currentColor" />
              <span className="text-xs font-bold uppercase text-primary">{t('premium_upgrade_sidebar')}</span>
            </div>
            <p className="text-xs text-gray-400 mb-3 relative z-10">
              {t('premium_upgrade_sidebar_desc')}
            </p>
            <button 
              onClick={() => { openPaywall('sidebar'); if(onClose) onClose(); }}
              className="w-full bg-primary text-white text-xs font-bold py-2.5 rounded-lg hover:bg-primary-hover transition-colors relative z-10"
            >
              {t('upgrade')}
            </button>
          </div>
        )}
        
        <div className="relative">
          {isMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1F1F1F] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in-up z-20">
               <div className="p-2">
                 <button 
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                 >
                   <User size={16} />
                   <span>{t('profile')}</span>
                 </button>
                 <div className="h-px bg-white/10 my-1"></div>
                 <button 
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                 >
                   <LogOut size={16} />
                   <span>{t('logout')}</span>
                 </button>
               </div>
            </div>
          )}

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-colors border border-transparent ${isMenuOpen ? 'bg-white/5 border-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.plan} Plan</p>
            </div>
            <ChevronUp size={16} className={`text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
