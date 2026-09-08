import React from 'react';
import { Plane, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400">
        
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Plane className="w-5 h-5 transform -rotate-45" />
            </div>
            <span className="font-extrabold text-base text-white">Smart Drone Delivery</span>
          </div>
          <p className="max-w-sm leading-relaxed text-slate-400">
            Hệ thống giao nhận hàng hóa tự động hóa bằng Đội Drone thế hệ mới. Tiết kiệm thời gian, tối ưu chi phí vận chuyển.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Dịch Vụ</h4>
          <p>Giao hàng Drone siêu tốc</p>
          <p>Mạng lưới Trạm hạ cánh</p>
          <p>Theo dõi live GPS 24/7</p>
          <p>AI Chatbot tư vấn</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Liên Hệ</h4>
          <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> Trung Tâm Điều Hành Q.1, TP.HCM</p>
          <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-cyan-400" /> Hotline: 1900 8888</p>
          <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-cyan-400" /> support@smartdrone.vn</p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-[10px] text-slate-600">
        © 2026 Smart Drone Delivery System. All rights reserved. Built with React 19, Vite, TypeScript & Tailwind CSS.
      </div>
    </footer>
  );
};
