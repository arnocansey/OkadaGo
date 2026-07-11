import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastVariant = 'success' | 'warning' | 'error' | 'info';

type Toast = { id: string; message: string; variant: ToastVariant };

const ToastCtx = createContext<{ toast: (msg: string, v?: ToastVariant) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p.slice(-4), { id, message, variant }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '12px 16px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: t.variant === 'success' ? '#0f3d1a' : t.variant === 'error' ? '#3d0f0f' : t.variant === 'warning' ? '#3d2e0f' : '#1a1b1e',
            color: 'var(--text-primary)', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <span style={{ fontSize: 16 }}>
              {t.variant === 'success' ? '\u2713' : t.variant === 'error' ? '\u2715' : t.variant === 'warning' ? '\u26a0' : '\u2139'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
