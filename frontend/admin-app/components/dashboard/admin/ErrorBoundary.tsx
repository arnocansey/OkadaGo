"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallbackTitle?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[AdminErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="aeb-fallback">
          <div className="aeb-card">
            <div className="aeb-icon">
              <AlertTriangle size={24} />
            </div>
            <h3>{this.props.fallbackTitle ?? "Something went wrong"}</h3>
            <p className="aeb-error-msg">{this.state.error?.message ?? "An unexpected error occurred."}</p>
            <button type="button" className="aeb-retry" onClick={this.handleReset}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
          <style>{`
            .aeb-fallback {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 300px;
              padding: 40px 20px;
            }
            .aeb-card {
              text-align: center;
              max-width: 400px;
              background: var(--card-bg, #1a1d27);
              border: 1px solid var(--border-color, #2a2d3a);
              border-radius: 14px;
              padding: 32px 24px;
            }
            .aeb-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border-radius: 12px;
              background: rgba(239, 68, 68, 0.12);
              color: #ef4444;
              margin-bottom: 16px;
            }
            .aeb-card h3 {
              font-size: 0.95rem;
              font-weight: 700;
              color: var(--text-primary, #f1f5f9);
              margin: 0 0 8px;
            }
            .aeb-error-msg {
              font-size: 0.78rem;
              color: var(--text-muted, #94a3b8);
              margin: 0 0 20px;
              line-height: 1.5;
            }
            .aeb-retry {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 9px 16px;
              border-radius: 10px;
              font-size: 0.8rem;
              font-weight: 600;
              border: none;
              background: var(--accent-orange, #ff6b00);
              color: #fff;
              cursor: pointer;
              font-family: inherit;
            }
            .aeb-retry:hover { filter: brightness(1.1); }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
