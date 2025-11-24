
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlanType, AIResult } from '../types';
import { Bot, Lock, Sparkles, RefreshCw } from 'lucide-react';

export const AISection: React.FC = () => {
  const { user, openPaywall, generateAIAnalysis, t } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  const handleAnalyze = async () => {
    if (user.plan === PlanType.FREE) {
      openPaywall('ai');
      return;
    }

    setLoading(true);
    try {
      const data = await generateAIAnalysis();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-white/10 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">{t('ai_assistant')}</h3>
          </div>
          {user.plan === PlanType.PREMIUM && (
             <div className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">{t('premium_active')}</div>
          )}
        </div>

        {!result && !loading && (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-6">
              {user.plan === PlanType.FREE ? t('ai_pitch_free') : t('ai_pitch_premium')}
            </p>
            
            <button
              onClick={handleAnalyze}
              className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl group hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <span className="absolute top-0 right-0 inline-block w-4 h-4 transition-all duration-500 ease-in-out bg-indigo-700 rounded group-hover:-mr-4 group-hover:-mt-4">
                <span className="absolute top-0 right-0 w-5 h-5 rotate-45 translate-x-1/2 -translate-y-1/2 bg-white/20"></span>
              </span>
              <span className="relative flex items-center space-x-2">
                {user.plan === PlanType.FREE ? <Lock size={18} /> : <Sparkles size={18} />}
                <span>{user.plan === PlanType.FREE ? t('get_ai_suggestion') : t('analyze')}</span>
              </span>
            </button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center animate-pulse">
            <div className="flex justify-center mb-4">
               <Bot size={48} className="text-indigo-400 animate-bounce" />
            </div>
            <p className="text-white font-medium">{t('analyzing')}</p>
            <p className="text-gray-500 text-sm">{t('analyzing_desc')}</p>
          </div>
        )}

        {result && !loading && (
           <div className="animate-fade-in">
             <div className="mb-4">
               <h4 className="font-bold text-white mb-1 flex items-center gap-2">
                 {t('ai_result_title')} <span className="text-xl">👇</span>
               </h4>
               <p className="text-indigo-400 font-medium text-lg">"{result.summary}"</p>
             </div>
             
             <ul className="space-y-3 mb-6">
               {result.tips.map((tip, idx) => (
                 <li key={idx} className="flex items-start gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                   <span className="mt-1 text-indigo-400">●</span>
                   {tip}
                 </li>
               ))}
             </ul>

             <div className="flex items-center justify-between bg-green-500/10 p-4 rounded-xl border border-green-500/20">
               <div className="text-sm text-green-400 font-medium">
                 {t('estimated_savings')}
               </div>
               <div className="text-xl font-bold text-green-400">
                 {result.estimatedSavings} TL
               </div>
             </div>
             
             <div className="mt-4 text-center">
               <button onClick={() => setResult(null)} className="text-gray-500 hover:text-indigo-400 text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                 <RefreshCw size={14} /> {t('new_analysis')}
               </button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
