

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Subscriptions } from './pages/Subscriptions';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { PaywallModal } from './components/PaywallModal';
import { RenewalModal } from './components/RenewalModal';
import { Menu } from 'lucide-react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Subscription } from './types';

const AppContent = () => {
  const { isAuthenticated, getOverdueSubscriptions, t } = useApp();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overdueSubs, setOverdueSubs] = useState<Subscription[]>([]);
  const location = useLocation();

  // Check for renewals on app load
  useEffect(() => {
    if (isAuthenticated) {
      const overdue = getOverdueSubscriptions();
      if (overdue.length > 0) {
        setOverdueSubs(overdue);
      }
    }
  }, [isAuthenticated, getOverdueSubscriptions]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // If not authenticated, show Login page only (handled via Routes mostly, but simple check here)
  if (!isAuthenticated) {
    return (
      <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-dark font-sans text-white overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-50 md:z-auto bg-dark`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-surface border-b border-white/10 p-4 flex items-center justify-between z-30 relative shrink-0">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
             <span className="font-bold text-lg">Subify</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1 hover:bg-white/5 rounded-lg transition-colors">
             <Menu size={24} />
           </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <PaywallModal />
      
      {location.pathname === '/' && (
        <RenewalModal 
          overdueSubscriptions={overdueSubs} 
          onComplete={() => setOverdueSubs([])} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
};

export default App;
