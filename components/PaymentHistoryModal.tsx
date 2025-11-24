

import React from 'react';
import { Subscription } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { X, Calendar, CheckCircle2, Receipt, RotateCcw } from 'lucide-react';
import { CURRENCY_SYMBOL } from '../constants';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, onClose, subscription }) => {
  const { t, revertLastPayment, user } = useApp();
  const { addToast } = useToast();

  if (!isOpen || !subscription) return null;

  // Sort history by date (newest first)
  const history = [...(subscription.paymentHistory || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleUndo = () => {
    revertLastPayment(subscription.id);
    addToast(t('undo_payment_success'), 'success');
    onClose(); 
  };
  
  const privacyClass = user.privacyMode ? 'blur-sm select-none' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-dark border border-white/10 flex items-center justify-center font-bold text-white">
                {subscription.name.charAt(0)}
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">{t('payment_history')}</h3>
                <p className="text-xs text-gray-400">{subscription.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {history.length > 0 ? (
             <div className="space-y-3">
               <div className="relative border-l-2 border-white/10 ml-3 space-y-6 py-2">
                  {history.map((record, idx) => (
                    <div key={idx} className="relative pl-8">
                       {/* Timeline Dot */}
                       <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-surface flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                       </div>
                       
                       <div className="bg-dark border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:border-primary/30 transition-colors relative">
                          <div>
                             <p className="text-gray-300 text-sm font-medium flex items-center gap-2">
                               <Calendar size={14} className="text-primary" />
                               {record.date}
                             </p>
                             <p className="text-xs text-gray-500 mt-1 capitalize">
                               {t('status_paid')}
                             </p>
                          </div>
                          <div className={`text-right ${privacyClass}`}>
                             <p className="text-white font-bold">
                               {record.amount} {record.currency || CURRENCY_SYMBOL}
                             </p>
                             <CheckCircle2 size={16} className="text-green-500 ml-auto mt-1" />
                          </div>

                          {/* Undo Button - Only for the most recent transaction (index 0) */}
                          {idx === 0 && (
                            <button 
                              onClick={handleUndo}
                              title={t('undo_payment')}
                              className="absolute -right-2 -top-2 p-1.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-500">
                   <Receipt size={32} />
                </div>
                <p className="text-gray-400 font-medium">{t('no_payment_history')}</p>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-dark/50">
           <button 
             onClick={onClose}
             className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
           >
             {t('continue')}
           </button>
        </div>

      </div>
    </div>
  );
};
