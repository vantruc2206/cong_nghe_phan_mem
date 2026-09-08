import React, { useState } from 'react';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { UserProfile } from './types';
import { Bot } from 'lucide-react';

import { LandingScreen } from './pages/LandingScreen';
import { LoginScreen } from './pages/LoginScreen';
import { DashboardScreen } from './pages/DashboardScreen';
import { CreateOrderScreen } from './pages/CreateOrderScreen';
import { OrdersScreen } from './pages/OrdersScreen';
import { OrderDetailScreen } from './pages/OrderDetailScreen';
import { EditOrderScreen } from './pages/EditOrderScreen';
import { TrackingScreen } from './pages/TrackingScreen';
import { StationsScreen } from './pages/StationsScreen';
import { DronesScreen } from './pages/DronesScreen';
import { ChatbotScreen } from './pages/ChatbotScreen';
import { ProfileScreen } from './pages/ProfileScreen';

// Bottom navigation icon components for mobile (< 768px)
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  );
}

function OrdersIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
      <path fill="none" stroke="white" strokeWidth={3} d="M12 5v14M5 12h14"/>
    </svg>
  );
}

function TrackIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M17.66 7.93A8 8 0 1121 12h-1M17.66 7.93l-1.22 1.22"/>
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
    </svg>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('landing');
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sdd_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  React.useEffect(() => {
    const publicScreens = ['landing', 'login'];
    if (user && publicScreens.includes(currentScreen)) {
      setCurrentScreen('dashboard');
    } else if (!user && !publicScreens.includes(currentScreen)) {
      setCurrentScreen('login');
    }
  }, [user, currentScreen]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (screen: string, orderId?: string) => {
    const publicScreens = ['landing', 'login', 'stations', 'drones', 'chatbot'];
    if (!user && !publicScreens.includes(screen)) {
      if (screen !== 'login') {
        showToast('Vui lòng đăng nhập tài khoản khách hàng để sử dụng tính năng này', 'info');
      }
      setCurrentScreen('login');
      return;
    }
    if (orderId) setSelectedOrderId(orderId);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sdd_customer_token');
    localStorage.removeItem('sdd_customer');
    showToast('Đã đăng xuất tài khoản', 'info');
    setCurrentScreen('landing');
  };

  const isLoggedIn = !!user;
  const showBottomNav = isLoggedIn && !['landing', 'login'].includes(currentScreen);

  return (
    <div className="app-shell">
      {/* ─── Top Header (Full Width Responsive) ─── */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* ─── Main Screen Content ─── */}
      <main className={`flex-1 w-full max-w-7xl mx-auto ${
        currentScreen === 'chatbot'
          ? 'px-2 sm:px-4 py-2 pb-16 md:pb-4 flex flex-col min-h-0'
          : 'px-4 sm:px-6 lg:px-8 py-4 pb-16 md:pb-8'
      }`}>
        {currentScreen === 'landing' && <LandingScreen onNavigate={handleNavigate} />}
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={(u) => {
              setUser(u);
              handleNavigate('dashboard');
              showToast(`Chào mừng ${u.ho_ten || 'bạn'}! 👋`, 'success');
            }}
            showToast={showToast}
          />
        )}
        {currentScreen === 'dashboard' && <DashboardScreen user={user} onNavigate={handleNavigate} />}
        {currentScreen === 'create-order' && (
          <CreateOrderScreen user={user} onNavigate={handleNavigate} showToast={showToast} />
        )}
        {currentScreen === 'orders' && (
          <OrdersScreen user={user} onNavigate={handleNavigate} showToast={showToast} />
        )}
        {currentScreen === 'order-detail' && (
          <OrderDetailScreen orderId={selectedOrderId} onNavigate={handleNavigate} showToast={showToast} />
        )}
        {currentScreen === 'edit-order' && (
          <EditOrderScreen orderId={selectedOrderId} onNavigate={handleNavigate} showToast={showToast} />
        )}
        {currentScreen === 'tracking' && (
          <TrackingScreen user={user} selectedOrderId={selectedOrderId} onNavigate={handleNavigate} />
        )}
        {currentScreen === 'stations' && <StationsScreen />}
        {currentScreen === 'drones' && <DronesScreen />}
        {currentScreen === 'chatbot' && <ChatbotScreen user={user} />}
        {currentScreen === 'profile' && (
          <ProfileScreen user={user} onUpdateProfile={setUser} showToast={showToast} />
        )}
      </main>

      {/* ─── Floating AI Chatbot Button for Mobile ─── */}
      {isLoggedIn && currentScreen !== 'chatbot' && (
        <button
          onClick={() => handleNavigate('chatbot')}
          className="md:hidden fixed bottom-[4.25rem] right-3.5 z-40 bg-gradient-to-r from-emerald-600 to-[#00B14F] text-white w-10 h-10 rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center cursor-pointer border border-white/30 active:scale-95 transition-all"
          title="Mở AI Chatbot"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* ─── Bottom Navigation (Mobile < 768px Only) ─── */}
      {showBottomNav && (
        <nav className="bottom-nav">
          <button
            className={`bottom-nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            <HomeIcon active={currentScreen === 'dashboard'} />
            Trang chủ
          </button>

          <button
            className={`bottom-nav-item ${currentScreen === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavigate('orders')}
          >
            <OrdersIcon active={currentScreen === 'orders'} />
            Đơn hàng
          </button>

          {/* FAB Center Button */}
          <button
            className="bottom-nav-item"
            onClick={() => handleNavigate('create-order')}
            style={{ color: '#00B14F' }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00B14F, #00C853)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -16, boxShadow: '0 4px 14px rgba(0,177,79,0.4)',
            }}>
              <PlusCircleIcon />
            </div>
          </button>

          <button
            className={`bottom-nav-item ${currentScreen === 'tracking' ? 'active' : ''}`}
            onClick={() => handleNavigate('tracking')}
          >
            <TrackIcon active={currentScreen === 'tracking'} />
            Theo dõi
          </button>

          <button
            className={`bottom-nav-item ${currentScreen === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavigate('profile')}
          >
            <ProfileIcon active={currentScreen === 'profile'} />
            Tài khoản
          </button>
        </nav>
      )}

      {/* ─── Toast Notifications ─── */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
