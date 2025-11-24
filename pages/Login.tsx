

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, t, language, setLanguage } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    await login(email);
    // Navigate is handled here, but also App.tsx protects routes
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background glow effect */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]"></div>
       </div>

       <div className="absolute top-6 right-6 flex bg-surface border border-white/10 rounded-lg p-1 z-10">
          <button 
            onClick={() => setLanguage('tr')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === 'tr' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            TR
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${language === 'en' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            EN
          </button>
        </div>

      <div className="bg-surface border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10 animate-fade-in-up relative z-10">
        
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-primary-hover rounded-xl text-white font-bold text-xl shadow-lg shadow-primary/20 mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-white">Subify</h1>
          <p className="text-gray-400 mt-2 text-sm">{t('login_subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">{t('email')}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required
                placeholder="ornek@email.com"
                className="w-full pl-11 pr-4 py-3 bg-dark border border-white/10 rounded-xl focus:bg-dark focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-white placeholder-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">{t('password')}</label>
            <div className="relative">
               <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-dark border border-white/10 rounded-xl focus:bg-dark focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-white placeholder-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-gray-300">
              <input type="checkbox" className="rounded border-white/20 bg-dark text-primary focus:ring-primary" />
              <span>{t('remember_me')}</span>
            </label>
            <button type="button" className="text-primary hover:text-primary-hover font-medium">
              {t('forgot_password')}
            </button>
          </div>

          <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl text-xs text-center">
            ℹ️ {t('demo_hint')}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span>{t('processing')}</span>
            ) : (
              <>
                <span>{t('start_now')}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-gray-500">{t('or')}</span>
            </div>
          </div>

          <button type="button" className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-white/10 rounded-xl shadow-sm bg-dark text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
             <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('continue_with_google')}
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-500">
          {t('no_account')} <button className="text-primary font-bold hover:underline">{t('sign_up')}</button>
        </p>
      </div>
    </div>
  );
};