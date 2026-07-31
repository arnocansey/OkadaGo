"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { OkadaLoader } from "@/components/ui/OkadaLoader";

type ToastType = "info" | "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastAndLoaderContextType {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  showLoader: (label?: string) => void;
  hideLoader: () => void;
}

const ToastAndLoaderContext = createContext<ToastAndLoaderContextType | null>(null);

export function useToastAndLoader() {
  const context = useContext(ToastAndLoaderContext);
  if (!context) {
    throw new Error("useToastAndLoader must be used within a ToastAndLoaderProvider");
  }
  return context;
}

export function ToastAndLoaderProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info", durationMs = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  }, []);

  const showLoader = useCallback((label?: string) => {
    setLoading(true);
    setLoadingLabel(label || "Loading...");
  }, []);

  const hideLoader = useCallback(() => {
    setLoading(false);
    setLoadingLabel(null);
  }, []);

  return (
    <ToastAndLoaderContext.Provider value={{ showToast, showLoader, hideLoader }}>
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let Icon = Info;
            let toneClass = "app-toast app-toast--info";

            if (toast.type === "success") {
              Icon = CheckCircle;
              toneClass = "app-toast app-toast--success";
            } else if (toast.type === "error") {
              Icon = AlertCircle;
              toneClass = "app-toast app-toast--error";
            } else if (toast.type === "warning") {
              Icon = AlertCircle;
              toneClass = "app-toast app-toast--warning";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto ${toneClass}`}
              >
                <Icon className="app-toast__icon w-5 h-5 mt-0.5 shrink-0" />
                <div className="app-toast__message flex-1 text-sm font-semibold">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="app-toast__dismiss shrink-0 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Global Loader Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#15181d] text-white p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-4 shadow-2xl max-w-xs text-center"
            >
              <OkadaLoader size="lg" label={loadingLabel ?? undefined} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastAndLoaderContext.Provider>
  );
}
