'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-top-5 duration-200 bg-white text-gray-900 transition-all
                ${toast.type === 'success' ? 'border-green-100 bg-green-50/70 text-green-900 shadow-green-100/10' : ''}
                ${toast.type === 'error' ? 'border-red-100 bg-red-50/70 text-red-900 shadow-red-100/10' : ''}
                ${toast.type === 'warning' ? 'border-amber-100 bg-amber-50/70 text-amber-900 shadow-amber-100/10' : ''}
                ${toast.type === 'info' ? 'border-blue-100 bg-blue-50/70 text-blue-900 shadow-blue-100/10' : ''}
              `}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-red-650 mt-0.5 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />}
              
              <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 hover:bg-gray-100/50 transition-colors cursor-pointer shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
