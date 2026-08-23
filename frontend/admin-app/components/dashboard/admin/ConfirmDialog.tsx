"use client";

import { AlertTriangle, X } from "lucide-react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isProcessing = false
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: { icon: "#ef4444", btnBg: "#ef4444", btnHover: "#dc2626" },
    warning: { icon: "#f59e0b", btnBg: "#f59e0b", btnHover: "#d97706" },
    info: { icon: "#3b82f6", btnBg: "#3b82f6", btnHover: "#2563eb" }
  };
  const v = variantStyles[variant];

  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cd-header">
          <div className="cd-icon" style={{ background: `${v.icon}18`, color: v.icon }}>
            <AlertTriangle size={20} />
          </div>
          <button type="button" className="cd-close" onClick={onCancel} disabled={isProcessing}>
            <X size={14} />
          </button>
        </div>
        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button type="button" className="cd-btn cd-btn--cancel" onClick={onCancel} disabled={isProcessing}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="cd-btn cd-btn--confirm"
            style={{ background: v.btnBg }}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        .cd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .cd-dialog {
          background: var(--card-bg, #1a1d27);
          border: 1px solid var(--border-color, #2a2d3a);
          border-radius: 14px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .cd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cd-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cd-close {
          background: none;
          border: none;
          color: var(--text-muted, #64748b);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }
        .cd-close:hover { background: rgba(255, 255, 255, 0.06); }
        .cd-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary, #f1f5f9);
          margin: 0 0 8px;
        }
        .cd-message {
          font-size: 0.82rem;
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          margin: 0 0 20px;
        }
        .cd-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .cd-btn {
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .cd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cd-btn--cancel {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary, #94a3b8);
          border: 1px solid var(--border-color, #2a2d3a);
        }
        .cd-btn--cancel:hover { background: rgba(255, 255, 255, 0.1); }
        .cd-btn--confirm {
          color: #fff;
        }
        .cd-btn--confirm:hover { filter: brightness(1.1); }
      `}</style>
    </div>
  );
}
