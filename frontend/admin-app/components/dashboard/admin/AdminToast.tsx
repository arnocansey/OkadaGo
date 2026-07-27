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
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid var(--border, #2a2b2e)",
              background: toast.variant === "success" ? "#0f3d1a" : toast.variant === "error" ? "#3d0f0f" : toast.variant === "warning" ? "#3d2e0f" : "#1a1b1e",
              color: "var(--text-primary, #f0f0f0)",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              animation: "toast-slide-in 0.3s ease-out"
            }}
          >
            <span style={{ fontSize: 16 }}>
              {toast.variant === "success" ? "\u2713" : toast.variant === "error" ? "\u2715" : toast.variant === "warning" ? "\u26a0" : "\u2139"}
            </span>
            <span>{toast.message}</span>
          </div>
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
