

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Trash2, Search, Filter, Pencil, AlertTriangle, CheckCircle, Clock, History, Users, CalendarPlus, HelpCircle } from 'lucide-react';
import { CURRENCY_SYMBOL, getCategoryColorHex, getBrandLogo } from '../constants';
import { BillingCycle, Subscription, DefaultCategory } from '../types';
import { AddSubscriptionModal } from '../components/AddSubscriptionModal';
import { PaymentHistoryModal } from '../components/PaymentHistoryModal';
import { CancellationModal } from '../components/CancellationModal';

export const Subscriptions: React.FC = () => {
  const { subscriptions, removeSubscription, renewSubscription, t, categories, user, convertAmount, currencySymbol, calculateMyShare, downloadCalendarEvent } = useApp();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  // Edit & Delete & History States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [historySub, setHistorySub] = useState<Subscription | null>(null);
  
  // New States for Cancellation
  const [cancelGuideSub, setCancelGuideSub] = useState<Subscription | null>(null);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sub.category === selectedCategory;
    const matchesCycle = selectedCycle === 'all' || sub.cycle === selectedCycle;
    return matchesSearch && matchesCategory && matchesCycle;
  });

  const handleEdit = (sub: Subscription) => {
    setSubscriptionToEdit(sub);
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmationId) {
      removeSubscription(deleteConfirmationId);
      addToast(t('delete_success') || 'Abonelik silindi', 'success');
      setDeleteConfirmationId(null);
    }
  };

  const handlePayNow = (sub: Subscription) => {
      renewSubscription(sub.id);
      addToast(t('renewal_success', { services: sub.name }), 'success');
  };
  
  const handleAddToCalendar = (sub: Subscription) => {
      downloadCalendarEvent(sub);
      addToast('Takvim dosyası indirildi (.ics)', 'success');
  };

  // Status Helper
  const getStatus = (date: string) => {
      const renewalDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      if (renewalDate <= today) {
          return 'overdue';
      }
      return 'active';
  }

  const getCategoryColor = (cat: string) => {
    const hex = getCategoryColorHex(cat);
    return { color: hex, backgroundColor: `${hex}20` };
  };
  
  const privacyClass = user.privacyMode ? 'blur-md select-none' : '';

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">{t('my_subscriptions')}</h2>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')} 
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <select 
                    className="appearance-none bg-surface border border-white/10 rounded-xl px-4 py-2.5 pr-8 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-gray-300"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">{t('all_categories')}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {Object.values(DefaultCategory).includes(cat as DefaultCategory) ? t(`cat_${cat}` as any) : cat}
                        </option>
                    ))}
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
             <div className="relative">
                <select 
                    className="appearance-none bg-surface border border-white/10 rounded-xl px-4 py-2.5 pr-8 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none capitalize text-gray-300"
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value)}
                >
                    <option value="all">{t('all_cycles')}</option>
                    <option value={BillingCycle.MONTHLY}>{t('monthly')}</option>
                    <option value={BillingCycle.QUARTERLY}>{t('quarterly')}</option>
                    <option value={BillingCycle.YEARLY}>{t('yearly')}</option>
                </select>
                 <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">{t('service')}</th>
              <th className="p-4 font-medium">{t('status')}</th>
              <th className="p-4 font-medium">{t('amount')}</th>
              <th className="p-4 font-medium">{t('cycle')}</th>
              <th className="p-4 font-medium">{t('renewal')}</th>
              <th className="p-4 font-medium text-right">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredSubscriptions.map(sub => {
              const status = getStatus(sub.nextRenewalDate);
              const catStyle = getCategoryColor(sub.category);
              const isShared = sub.sharedWith && sub.sharedWith > 0;
              const myShare = calculateMyShare(sub);
              
              return (
              <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-dark border border-white/10 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                       <img 
                          src={getBrandLogo(sub.name)} 
                          alt={sub.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                       />
                       <div className="hidden w-full h-full flex items-center justify-center bg-dark text-white font-bold">
                          {sub.name.charAt(0)}
                       </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white">{sub.name}</span>
                        <span className="text-xs text-gray-500">
                           {Object.values(DefaultCategory).includes(sub.category as DefaultCategory) ? t(`cat_${sub.category}` as any) : sub.category}
                        </span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/20">
                          <CheckCircle size={10} /> {t('active')}
                      </span>
                  ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/20">
                          <Clock size={10} /> {t('overdue')}
                      </span>
                  )}
                </td>
                <td className="p-4 font-medium text-white">
                  <div className={privacyClass}>
                    {sub.price} {sub.currency || CURRENCY_SYMBOL}
                  </div>
                  {isShared ? (
                     <div className={`text-xs text-primary font-bold mt-0.5 flex items-center gap-1 ${privacyClass}`}>
                         <Users size={10} /> {myShare.toFixed(2)} {sub.currency}
                     </div>
                  ) : (
                     sub.currency !== user.currency && (
                        <div className={`text-xs text-gray-500 mt-0.5 ${privacyClass}`}>≈ {convertAmount(sub.price, sub.currency).toFixed(2)} {currencySymbol}</div>
                     )
                  )}
                </td>
                <td className="p-4 text-gray-400 text-sm capitalize">
                  {sub.cycle === 'quarterly' ? t('quarterly') : sub.cycle === 'monthly' ? t('monthly') : t('yearly')}
                </td>
                <td className="p-4 text-gray-400 text-sm">
                  {sub.nextRenewalDate}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {status === 'overdue' && (
                        <button
                            onClick={() => handlePayNow(sub)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                        >
                            {t('pay_now')}
                        </button>
                    )}
                    
                    {/* Add to Calendar Button */}
                    <button 
                      onClick={() => handleAddToCalendar(sub)}
                      className="text-gray-500 hover:text-green-400 transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      title={t('add_to_calendar')}
                    >
                       <CalendarPlus size={16} />
                    </button>
                    
                    {/* History */}
                    <button 
                      onClick={() => setHistorySub(sub)}
                      className="text-gray-500 hover:text-indigo-400 transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      title={t('view_history')}
                    >
                      <History size={16} />
                    </button>

                    {/* How to Cancel */}
                    <button 
                      onClick={() => setCancelGuideSub(sub)}
                      className="text-gray-500 hover:text-red-300 transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      title={t('how_to_cancel')}
                    >
                       <HelpCircle size={16} />
                    </button>
                    
                    <button 
                      onClick={() => handleEdit(sub)}
                      className="text-gray-500 hover:text-white transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      title={t('edit')}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(sub.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      title={t('delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
             {filteredSubscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {t('no_data')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Subscription Modal */}
      <AddSubscriptionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        subscriptionToEdit={subscriptionToEdit}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal 
        isOpen={!!historySub}
        onClose={() => setHistorySub(null)}
        subscription={historySub}
      />
      
      {/* Cancellation Guide Modal */}
      {cancelGuideSub && (
          <CancellationModal 
             isOpen={!!cancelGuideSub}
             onClose={() => setCancelGuideSub(null)}
             serviceName={cancelGuideSub.name}
          />
      )}

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
