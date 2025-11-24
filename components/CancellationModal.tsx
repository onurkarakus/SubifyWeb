
import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, HelpCircle } from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({ isOpen, onClose, serviceName }) => {
  const { t } = useApp();

  if (!isOpen) return null;

  const normalizedName = serviceName.toLowerCase();
  
  // Basic heuristic for common platforms
  const getSteps = () => {
    if (normalizedName.includes('netflix')) {
      return [
        'Netflix.com adresine git ve giriş yap.',
        'Profil ikonuna tıkla ve "Hesap" bölümüne git.',
        '"Üyeliği İptal Et" butonuna tıkla.',
        'Onay ekranında iptali tamamla.'
      ];
    }
    if (normalizedName.includes('spotify')) {
      return [
        'Spotify.com/account adresine git.',
        '"Planın" bölümüne gel.',
        '"Planı Değiştir"e tıkla.',
        '"Premium\'u İptal Et" seçeneğini bul ve onayla.'
      ];
    }
    if (normalizedName.includes('apple') || normalizedName.includes('icloud')) {
      return [
        'iPhone\'unda Ayarlar\'ı aç.',
        'Adına tıkla > "Abonelikler"e git.',
        'İptal etmek istediğin aboneliği seç.',
        '"Aboneliği İptal Et" butonuna bas.'
      ];
    }
    if (normalizedName.includes('amazon') || normalizedName.includes('prime')) {
      return [
        'Amazon hesabına giriş yap.',
        '"Hesabım" > "Prime Üyeliğim" sayfasına git.',
        '"Yönet" sekmesinden "Üyeliği sonlandır"ı seç.'
      ];
    }
    if (normalizedName.includes('adobe')) {
      return [
        'account.adobe.com/plans adresine git.',
        'Planını bul ve "Planı Yönet"e tıkla.',
        '"Planı İptal Et" seçeneğini seç.',
        'Nedenini seçip devam et.'
      ];
    }
    // Generic
    return [
      t('generic_cancel_step'),
      t('generic_cancel_step_2'),
      t('generic_cancel_step_3')
    ];
  };

  const steps = getSteps();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
               <HelpCircle size={24} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white">{t('cancel_guide_title')}</h3>
                <p className="text-xs text-gray-400">{serviceName}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
           <p className="text-gray-300 mb-4 text-sm">
             {t('cancel_guide_desc', { service: serviceName })}
           </p>

           <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                     {index + 1}
                   </div>
                   <p className="text-gray-400 text-sm leading-tight pt-1">
                     {step}
                   </p>
                </div>
              ))}
           </div>
           
           <div className="mt-8 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-500">
              ⚠️ İptal ettikten sonra fatura dönemi bitene kadar servisi kullanmaya devam edebilirsin.
           </div>
        </div>

        <div className="p-4 bg-dark/50 border-t border-white/10">
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
