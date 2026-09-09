import React from 'react';
import { 
  PlusCircle, 
  ListOrdered, 
  Navigation, 
  Bot, 
  LogOut, 
  LogIn, 
  Activity,
  Plane
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, user, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Plane className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 leading-tight">
              Smart<span className="text-[#00B14F]">Drone</span>
            </h1>
            <p className="text-[10px] tracking-wider text-slate-400 font-bold uppercase">Customer Portal</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              currentScreen === 'dashboard' || currentScreen === 'landing'
                ? 'bg-white text-[#00B14F] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            Trang Chủ
          </button>

          {user && (
            <>
              <button
                onClick={() => onNavigate('create-order')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  currentScreen === 'create-order'
                    ? 'bg-white text-[#00B14F] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Tạo Đơn Hàng
              </button>

              <button
                onClick={() => onNavigate('orders')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  currentScreen === 'orders' || currentScreen === 'order-detail' || currentScreen === 'edit-order'
                    ? 'bg-white text-[#00B14F] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Đơn Hàng
              </button>

              <button
                onClick={() => onNavigate('tracking')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  currentScreen === 'tracking'
                    ? 'bg-white text-[#00B14F] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Navigation className="w-4 h-4" />
                Theo Dõi Đơn
              </button>

              <button
                onClick={() => onNavigate('chatbot')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  currentScreen === 'chatbot'
                    ? 'bg-white text-[#00B14F] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Bot className="w-4 h-4" />
                AI Chatbot
              </button>
            </>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800 transition-colors border border-slate-200 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {user.ho_ten ? user.ho_ten.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[120px] truncate hidden sm:inline">{user.ho_ten || user.email}</span>
              </button>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00B14F] hover:bg-[#009A45] text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
