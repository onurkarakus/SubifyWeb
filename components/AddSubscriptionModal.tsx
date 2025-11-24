

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { BillingCycle, Subscription, Currency, DefaultCategory } from '../types';
import { X, ChevronDown, Search, Users } from 'lucide-react';
import { POPULAR_PLATFORMS } from '../constants';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionToEdit?: Subscription | null;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ isOpen, onClose, subscriptionToEdit }) => {
  const { addSubscription, updateSubscription, t, categories, currencySymbol } = useApp();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'TRY' as Currency,
    category: DefaultCategory.ENTERTAINMENT as string,
    cycle: BillingCycle.MONTHLY,
    nextRenewalDate: new Date().toISOString().split('T')[0], // today
    sharedWith: 0
  });

  // Reset or Populate form when modal opens or subscriptionToEdit changes
  useEffect(() => {
    if (subscriptionToEdit) {
      setFormData({
        name: subscriptionToEdit.name,
        price: subscriptionToEdit.price.toString(),
        currency: subscriptionToEdit.currency || 'TRY',
        category: subscriptionToEdit.category,
        cycle: subscriptionToEdit.cycle,
        nextRenewalDate: subscriptionToEdit.nextRenewalDate,
        sharedWith: subscriptionToEdit.sharedWith || 0
      });
    } else {
      // Reset
      setFormData({
        name: '',
        price: '',
        currency: 'TRY',
        category: DefaultCategory.ENTERTAINMENT,
        cycle: BillingCycle.MONTHLY,
        nextRenewalDate: new Date().toISOString().split('T')[0],
        sharedWith: 0
      });
    }
  }, [subscriptionToEdit, isOpen]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPlatforms = POPULAR_PLATFORMS.filter(p => 
    p.name.toLowerCase().includes(formData.name.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSelectPlatform = (platform: typeof POPULAR_PLATFORMS[0]) => {
    setFormData({
      ...formData,
      name: platform.name,
      category: platform.category,
      price: platform.price > 0 ? platform.price.toString() : '',
    });
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (subscriptionToEdit) {
      // Update Existing
      updateSubscription(subscriptionToEdit.id, {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        category: formData.category,
        cycle: formData.cycle,
        nextRenewalDate: formData.nextRenewalDate,
        sharedWith: formData.sharedWith
      });
      addToast(t('edit_success') || 'Abonelik güncellendi', 'success');
      onClose();
    } else {
      // Add New
      const success = addSubscription({
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        category: formData.category,
        cycle: formData.cycle,
        nextRenewalDate: formData.nextRenewalDate,
        sharedWith: formData.sharedWith
      });

      if (success) {
        addToast(t('add_success') || 'Abonelik eklendi', 'success');
        setFormData({
          name: '',
          price: '',
          currency: 'TRY',
          category: DefaultCategory.ENTERTAINMENT,
          cycle: BillingCycle.MONTHLY,
          nextRenewalDate: new Date().toISOString().split('T')[0],
          sharedWith: 0
        });
        onClose();
      } else {
        onClose(); // Paywall triggers inside addSubscription context
      }
    }
  };
  
  // Calculate share for preview
  const total = parseFloat(formData.price) || 0;
  const myShare = total / (formData.sharedWith + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/10 transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-surface z-10">
          <h3 className="text-lg font-bold text-white">
            {subscriptionToEdit ? t('edit_subscription') : t('new_subscription')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('platform_name')}</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Örn: Netflix"
                required
                className="w-full px-4 py-3 bg-dark border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all pr-10 placeholder-gray-600"
                value={formData.name}
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                {isDropdownOpen ? <Search size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {isDropdownOpen && filteredPlatforms.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                {filteredPlatforms.map((platform, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectPlatform(platform)}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center justify-between group border-b border-white/5 last:border-0"
                  >
                    <span className="font-medium text-white">{platform.name}</span>
                    <span className="text-xs text-gray-500 group-hover:text-primary">{t(`cat_${platform.category}` as any)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('price')}</label>
              <div className="flex">
                <input 
                  type="number" 
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-dark border border-white/10 rounded-l-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
                <select 
                  className="w-24 px-2 py-3 bg-dark border border-l-0 border-white/10 rounded-r-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-center font-bold"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value as Currency})}
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('cycle')}</label>
              <select 
                className="w-full px-4 py-3 bg-dark border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                value={formData.cycle}
                onChange={e => setFormData({...formData, cycle: e.target.value as BillingCycle})}
              >
                <option value={BillingCycle.MONTHLY}>{t('monthly')}</option>
                <option value={BillingCycle.QUARTERLY}>{t('quarterly')}</option>
                <option value={BillingCycle.YEARLY}>{t('yearly')}</option>
              </select>
            </div>
          </div>

          {/* Shared Subscription Section */}
          <div>
             <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                <Users size={16} /> {t('shared_subscription')}
             </label>
             <div className="bg-dark border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-300">{t('shared_with')}</span>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, sharedWith: Math.max(0, prev.sharedWith - 1)}))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                    >
                        -
                    </button>
                    <span className="font-bold text-white w-4 text-center">{formData.sharedWith}</span>
                    <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, sharedWith: prev.sharedWith + 1}))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                    >
                        +
                    </button>
                </div>
             </div>
             {formData.sharedWith > 0 && (
                 <div className="mt-2 text-right text-xs text-gray-400 flex justify-between px-1">
                    <span>{t('total_price')}: {total}</span>
                    <span className="text-primary font-bold">{t('my_share')}: {myShare.toFixed(2)}</span>
                 </div>
             )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('category')}</label>
            <select 
              className="w-full px-4 py-3 bg-dark border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {categories.map(cat => {
                const isDefault = Object.values(DefaultCategory).includes(cat as DefaultCategory);
                const label = isDefault ? t(`cat_${cat}` as any) : cat;
                return (
                  <option key={cat} value={cat}>{label}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('next_payment')}</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-3 bg-dark border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none [color-scheme:dark]"
              value={formData.nextRenewalDate}
              onChange={e => setFormData({...formData, nextRenewalDate: e.target.value})}
            />
          </div>

          <div className="pt-4 flex space-x-3">
             <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-colors"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-lg hover:shadow-primary/30 transition-all"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};