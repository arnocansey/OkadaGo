"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastVariant = "success" | "warning" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  timestamp: number;
};

type AdminToastContextValue = {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2715",
  warning: "\u26a0",
  info: "\u2139"
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, message, variant, timestamp: Date.now() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, addToast, dismissToast }), [toasts, addToast, dismissToast]);

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="admin-toast-stack" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className={`admin-toast admin-toast--${toast.variant}`}
            onClick={() => dismissToast(toast.id)}
          >
            <span className="admin-toast__icon" aria-hidden="true">
              {VARIANT_ICON[toast.variant]}
            </span>
            <span className="admin-toast__message">{toast.message}</span>
          </button>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}
