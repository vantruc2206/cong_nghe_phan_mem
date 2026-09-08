import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-6 md:left-auto md:right-6 md:translate-x-0 z-[9999] flex flex-col gap-2.5 w-[92vw] max-w-md pointer-events-none transition-all duration-300">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-4 md:slide-in-from-right-4 fade-in ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/40 text-white shadow-rose-500/10'
              : 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/10'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-emerald-400 shrink-0" />}
            
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 truncate md:whitespace-normal">
              {toast.text}
            </span>
          </div>

          <button
            onClick={() => onClose(toast.id)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
