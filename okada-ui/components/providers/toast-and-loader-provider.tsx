"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

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
            let bgColor = "bg-white text-slate-800 border-slate-200";
            let iconColor = "text-[#f7c600]";

            if (toast.type === "success") {
              Icon = CheckCircle;
              bgColor = "bg-emerald-50 text-emerald-900 border-emerald-100";
              iconColor = "text-emerald-500";
            } else if (toast.type === "error") {
              Icon = AlertCircle;
              bgColor = "bg-red-50 text-red-900 border-red-100";
              iconColor = "text-red-500";
            } else if (toast.type === "warning") {
              Icon = AlertCircle;
              bgColor = "bg-amber-50 text-amber-900 border-amber-100";
              iconColor = "text-amber-500";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto ${bgColor}`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
                <div className="flex-1 text-sm font-semibold">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
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
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              {loadingLabel && <p className="text-sm font-semibold tracking-wide text-white/90">{loadingLabel}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastAndLoaderContext.Provider>
  );
}
