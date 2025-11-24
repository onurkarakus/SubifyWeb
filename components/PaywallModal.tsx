
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Zap, BarChart2, Bell, Infinity } from 'lucide-react';

export const PaywallModal: React.FC = () => {
  const { isPaywallOpen, closePaywall, upgradeToPremium, paywallTrigger, t } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');

  if (!isPaywallOpen) return null;

  const handleUpgrade = () => {
    setLoading(true);
    // Simulate Lemon Squeezy checkout delay
    setTimeout(() => {
      upgradeToPremium();
      setLoading(false);
    }, 1500);
  };

  // Contextual Headlines based on trigger
  const getHeadline = () => {
    switch (paywallTrigger) {
      case 'ai':
        return t('paywall_ai_title');
      case 'reports':
        return t('paywall_reports_title');
      case 'limit_reached':
        return t('paywall_limit_title');
      default:
        return t('paywall_generic_title');
    }
  };

  const getPriceText = () => {
    switch(selectedPlan) {
      case 'monthly': return t('price_monthly');
      case 'quarterly': return t('price_quarterly');
      case 'yearly': return t('price_yearly');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in-up flex flex-col md:flex-row">
        
        {/* LEFT SIDE: Features & Context */}
        <div className="p-6 md:p-8 bg-surface md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 shrink-0">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full text-primary mb-6 shadow-[0_0_20px_rgba(138,43,226,0.3)]">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{getHeadline()}</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              {t('paywall_subtitle')}
            </p>
            
            <div className="space-y-5">
              <FeatureRow icon={<Infinity size={20} />} text={t('feature_unlimited')} />
              <FeatureRow icon={<BarChart2 size={20} />} text={t('feature_reports')} />
              <FeatureRow icon={<Zap size={20} />} text={t('feature_ai')} />
              <FeatureRow icon={<Bell size={20} />} text={t('feature_notifications')} />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10 hidden md:block">
            <p className="text-xs text-gray-500">
              {t('secure_payment')}
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Pricing Options */}
        <div className="p-6 md:p-8 bg-dark/50 md:w-1/2 relative shrink-0">
           <button 
            onClick={closePaywall}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="h-full flex flex-col justify-center">
             <h3 className="text-lg font-bold text-white mb-4 text-center md:text-left">{t('subscription_plan')}</h3>
             
             <div className="space-y-3 mb-6">
                {/* Monthly Option */}
                <button 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    selectedPlan === 'monthly' 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                      : 'border-white/10 bg-surface hover:border-white/30'
                  }`}
                >
                   <div className="text-left">
                      <p className={`font-bold ${selectedPlan === 'monthly' ? 'text-white' : 'text-gray-300'}`}>{t('monthly_plan')}</p>
                      <p className="text-xs text-gray-500">{t('billed_monthly')}</p>
                   </div>
                   <p className={`font-bold ${selectedPlan === 'monthly' ? 'text-primary' : 'text-white'}`}>{t('price_monthly')}</p>
                </button>

                {/* Quarterly Option */}
                <button 
                  onClick={() => setSelectedPlan('quarterly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    selectedPlan === 'quarterly' 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                      : 'border-white/10 bg-surface hover:border-white/30'
                  }`}
                >
                   <div className="text-left">
                      <p className={`font-bold ${selectedPlan === 'quarterly' ? 'text-white' : 'text-gray-300'}`}>{t('quarterly_plan')}</p>
                      <p className="text-xs text-gray-500">{t('billed_quarterly')}</p>
                   </div>
                   <p className={`font-bold ${selectedPlan === 'quarterly' ? 'text-primary' : 'text-white'}`}>{t('price_quarterly')}</p>
                </button>

                {/* Yearly Option (Recommended) */}
                <button 
                  onClick={() => setSelectedPlan('yearly')}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between relative ${
                    selectedPlan === 'yearly' 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' 
                      : 'border-white/10 bg-surface hover:border-white/30'
                  }`}
                >
                   <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                     {t('best_value')}
                   </div>
                   <div className="text-left">
                      <p className={`font-bold ${selectedPlan === 'yearly' ? 'text-white' : 'text-gray-300'}`}>{t('yearly_plan')}</p>
                      <p className="text-xs text-primary font-medium">{t('2_months_free')}</p>
                   </div>
                   <div className="text-right">
                      <p className={`font-bold ${selectedPlan === 'yearly' ? 'text-primary' : 'text-white'}`}>{t('price_yearly')}</p>
                      <p className="text-[10px] text-gray-500 line-through opacity-50">600 TL</p>
                   </div>
                </button>
             </div>

             <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-70 flex justify-center items-center mb-3"
            >
              {loading ? (
                <span className="animate-pulse">{t('processing')}</span>
              ) : (
                `${t('upgrade_now')} (${getPriceText()})`
              )}
            </button>

            <div className="text-center">
              <button 
                onClick={closePaywall}
                className="text-gray-500 hover:text-white text-sm font-medium transition-colors"
              >
                {t('continue_free')}
              </button>
            </div>

             <div className="mt-6 pt-4 border-t border-white/10 md:hidden text-center">
                <p className="text-[10px] text-gray-500">
                  {t('secure_payment')}
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const FeatureRow = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center space-x-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-secondary">
      {icon}
    </div>
    <span className="text-gray-300 font-medium text-sm md:text-base">{text}</span>
  </div>
);
