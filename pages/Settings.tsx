

import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PlanType, Currency } from '../types';
import { RefreshCw, User, Database, Download, Upload, FileJson, FileSpreadsheet, Plus, X, Tag, DollarSign, Bell, Coins, Wallet, UserCog, Palette } from 'lucide-react';
import { THEME_COLORS } from '../constants';

type SettingsTab = 'account' | 'finance' | 'categories' | 'data';

export const Settings: React.FC = () => {
  const { 
    user, downgradeToFree, upgradeToPremium, language, setLanguage, t, 
    exportData, importData, addCategory, removeCategory, updateBudget, requestNotificationPermission,
    setBaseCurrency, exchangeRates, refreshRates, setTheme
  } = useApp();
  
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [budgetInput, setBudgetInput] = useState(user.monthlyBudget?.toString() || '');

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success) {
          addToast(t('import_success'), 'success');
        } else {
          addToast(t('import_error'), 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    exportData(exportFormat);
    addToast(t('export_success'), 'success');
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      addToast('Kategori eklendi', 'success');
    }
  };

  const handleBudgetUpdate = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val)) {
        updateBudget(val);
        addToast('Bütçe hedefi güncellendi', 'success');
    }
  };

  const toggleNotifications = async () => {
     if (!user.notificationsEnabled) {
         const granted = await requestNotificationPermission();
         if (!granted) {
             addToast('Bildirim izni reddedildi.', 'error');
         }
     }
  }

  const tabs = [
    { id: 'account', label: t('settings_tab_account'), icon: <UserCog size={18} /> },
    { id: 'finance', label: t('settings_tab_finance'), icon: <Wallet size={18} /> },
    { id: 'categories', label: t('settings_tab_categories'), icon: <Tag size={18} /> },
    { id: 'data', label: t('settings_tab_data'), icon: <Database size={18} /> },
  ];

  const renderAccountTab = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Profile Card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User size={20} /> {t('profile_info')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('full_name')}</label>
              <input type="text" value={user.name} disabled className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2.5 text-white disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('email')}</label>
              <input type="text" value={user.email} disabled className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2.5 text-white disabled:opacity-60" />
            </div>
          </div>
        </div>

        {/* Subscription - Compact View */}
        <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <RefreshCw size={20} /> {t('subscription_plan')}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                    <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${user.plan === PlanType.PREMIUM ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-300'}`}>
                        {user.plan}
                    </span>
                    <span className="text-gray-500">
                        {user.plan === PlanType.FREE ? t('free_plan_desc') : t('premium_plan_desc')}
                    </span>
                </div>
            </div>
            
            <div className="shrink-0">
                {user.plan === PlanType.FREE ? (
                    <button 
                        onClick={upgradeToPremium}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all whitespace-nowrap"
                    >
                        {t('upgrade')}
                    </button>
                ) : (
                    <button 
                        onClick={downgradeToFree}
                        className="text-gray-500 hover:text-white font-medium text-sm underline decoration-gray-700 hover:decoration-white transition-all whitespace-nowrap"
                    >
                        {t('downgrade_test')}
                    </button>
                )}
            </div>
        </div>

        {/* App Settings */}
        <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
          <h3 className="text-lg font-bold text-white mb-4">{t('app_preferences')}</h3>
          
          {/* Theme Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-white/5 gap-4">
             <div>
                <p className="font-medium text-white flex items-center gap-2">
                   <Palette size={14} className="text-primary" /> {t('theme')}
                </p>
                <p className="text-xs text-gray-500">{t('theme_desc')}</p>
             </div>
             <div className="flex gap-2">
                {THEME_COLORS.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 ${user.themeColor === theme.id ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: theme.hex }}
                    title={theme.name}
                  />
                ))}
             </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="font-medium text-white flex items-center gap-2">
                 {t('notifications')} <Bell size={14} className={user.notificationsEnabled ? 'text-green-400' : 'text-gray-500'} />
              </p>
              <p className="text-xs text-gray-500">{t('notifications_desc')}</p>
            </div>
            
            {user.notificationsEnabled ? (
                <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-green-400 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        {t('notifications_active')}
                    </span>
                    <button 
                        onClick={() => {
                            if (Notification.permission === 'granted') {
                                new Notification('Subify Test', {
                                    body: 'Bildirim sistemi çalışıyor!',
                                    icon: '/favicon.ico',
                                    requireInteraction: true
                                });
                                addToast(t('test_notification_sent'), 'success');
                            } else {
                                addToast(t('test_notification_fail'), 'error');
                            }
                        }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded"
                    >
                        {t('test_notification')}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={toggleNotifications}
                    className="text-xs font-bold text-primary hover:text-white px-3 py-1 bg-primary/10 hover:bg-primary rounded-lg transition-colors border border-primary/20"
                >
                    {t('enable_notifications')}
                </button>
            )}
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-white">{t('language')}</p>
              <p className="text-xs text-gray-500">{t('language_desc')}</p>
            </div>
            <div className="flex bg-dark rounded-lg p-1 border border-white/5">
              <button 
                onClick={() => setLanguage('tr')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === 'tr' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                TR
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === 'en' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
    </div>
  );

  const renderFinanceTab = () => (
    <div className="space-y-6 animate-fade-in">
         {/* Currency Settings */}
         <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Coins size={20} /> {t('base_currency')}
                    </h3>
                    <button onClick={refreshRates} title="Update Rates" className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12} /> Live
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">{t('base_currency_desc')}</p>
                <div className="flex gap-2">
                    {['TRY', 'USD', 'EUR'].map(curr => (
                        <button
                            key={curr}
                            onClick={() => setBaseCurrency(curr as Currency)}
                            className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                                user.currency === curr 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-dark border-white/10 text-gray-400 hover:border-white/30'
                            }`}
                        >
                            {curr}
                        </button>
                    ))}
                </div>
            </div>

         {/* Budget Goals */}
         <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign size={20} /> {t('budget_settings')}
            </h3>
            <p className="text-sm text-gray-400 mb-4">{t('budget_desc')}</p>
            <div className="flex gap-4">
                <input 
                    type="number" 
                    placeholder="0.00" 
                    className="flex-1 bg-dark border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                />
                <button 
                    onClick={handleBudgetUpdate}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2 rounded-xl transition-colors"
                >
                    {t('save')}
                </button>
            </div>
        </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Custom Categories */}
        <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Tag size={20} /> {t('custom_categories')}
            </h3>
            
            <div className="flex gap-4 mb-6">
                <input 
                    type="text" 
                    placeholder={t('enter_category_name')}
                    className="flex-1 bg-dark border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button 
                    onClick={handleAddCategory}
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                    <Plus size={18} /> {t('add_category')}
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {(user.customCategories && user.customCategories.length > 0) ? (
                    user.customCategories.map(cat => (
                        <div key={cat} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm text-gray-300">
                            <span>{cat}</span>
                            <button 
                                onClick={() => removeCategory(cat)}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic w-full text-center py-2">Henüz özel kategori eklenmemiş.</p>
                )}
            </div>
        </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Data Management */}
        <div className="bg-surface rounded-2xl shadow-sm border border-white/10 p-6">
           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database size={20} /> {t('data_management')}
          </h3>
          <p className="text-sm text-gray-400 mb-6">{t('data_management_desc')}</p>
          
          <div className="flex flex-col gap-4">
            {/* Export Section */}
            <div className="bg-dark/50 border border-white/5 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('format_label')}</label>
                        <div className="flex bg-surface rounded-lg p-1 border border-white/10">
                            <button 
                                onClick={() => setExportFormat('json')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${exportFormat === 'json' ? 'bg-primary/20 text-primary border border-primary/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FileJson size={16} /> JSON
                            </button>
                            <button 
                                onClick={() => setExportFormat('csv')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${exportFormat === 'csv' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FileSpreadsheet size={16} /> CSV
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 mt-auto"
                    >
                        <Download size={18} />
                        {t('export_data')}
                    </button>
                </div>
            </div>

            {/* Import Section */}
            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleImportClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl text-white font-medium transition-colors"
                >
                    <Upload size={18} />
                    {t('import_data')}
                    <span className="text-xs text-gray-500 font-normal ml-1">({t('import_hint')})</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json,.csv"
                    onChange={handleFileChange}
                />
            </div>
          </div>
        </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">{t('settings')}</h2>

      {/* Tabs Header */}
      <div className="flex overflow-x-auto space-x-2 pb-2 mb-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'account' && renderAccountTab()}
        {activeTab === 'finance' && renderFinanceTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'data' && renderDataTab()}
      </div>

    </div>
  );
};