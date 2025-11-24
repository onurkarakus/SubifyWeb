

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Subscription } from '../types';
import { CheckCircle, Calendar, Clock, X } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface RenewalModalProps {
  overdueSubscriptions: Subscription[];
  onComplete: () => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({ overdueSubscriptions, onComplete }) => {
  const { renewSubscription, t, user, convertAmount, currencySymbol } = useApp();
  const { addToast } = useToast();
  const [pendingSubs, setPendingSubs] = useState<Subscription[]>(overdueSubscriptions);

  useEffect(() => {
    setPendingSubs(overdueSubscriptions);
  }, [overdueSubscriptions]);

  if (pendingSubs.length === 0) {
    return null;
  }

  const handlePaid = (sub: Subscription) => {
    renewSubscription(sub.id);
    addToast(t('renewal_success', { services: sub.name }), 'success');
    
    const remaining = pendingSubs.filter(s => s.id !== sub.id);
    setPendingSubs(remaining);
    
    if (remaining.length === 0) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const privacyClass = user.privacyMode ? 'blur-sm select-none' : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-white/10 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-warning" size={24} />
              {t('renewal_modal_title')}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{t('renewal_modal_desc')}</p>
          </div>
          <button onClick={onComplete} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-3">
          {pendingSubs.map(sub => (
            <div key={sub.id} className="bg-dark border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-lg text-white">
                  {sub.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white">{sub.name}</h4>
                  <div className={`flex items-center gap-2 text-xs text-gray-400 ${privacyClass}`}>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                      {sub.price} {sub.currency || CURRENCY_SYMBOL}
                      {sub.currency !== user.currency && (
                        <span className="text-gray-500 border-l border-white/10 pl-1 ml-1">
                          ≈ {convertAmount(sub.price, sub.currency).toFixed(2)} {currencySymbol}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <Calendar size={12} /> {t('due_date')}: {sub.nextRenewalDate}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handlePaid(sub)}
                className="w-full sm:w-auto bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold text-sm px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-primary/20 hover:border-primary"
              >
                <CheckCircle size={16} />
                {t('mark_as_paid')}
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-dark/50 border-t border-white/10 text-center">
          <button 
            onClick={onComplete}
            className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
          >
            {t('remind_later')}
          </button>
        </div>
      </div>
    </div>
  );
};
