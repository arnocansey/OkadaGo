"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Lock, BarChart3, Users, Zap } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { useAuth } from "@/lib/auth";
import { adminLogin } from "@/lib/auth-requests";
import { useToastAndLoader } from "@/components/providers/toast-and-loader-provider";

export function AdminLoginScreen() {
  const router = useRouter();
  const { getDevice, setSession, session, status } = useAuth();
  const { showToast, showLoader, hideLoader } = useToastAndLoader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");

  useMemo(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
      window.location.replace(target);
    }
  }, [status, session]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    showLoader("Signing you in...");
    setErrorMessage(null);
    setLoading(true);

    try {
      const device = getDevice();
      const result = await adminLogin({
        email: email.trim(),
        password,
        device,
        totpCode: totpCode.trim() || undefined,
        backupCode: backupCode.trim() || undefined
      });

      setSession(result);
      showToast("Welcome back!", "success");

      const redirect = new URLSearchParams(window.location.search).get("redirect");
      const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
      window.location.assign(target);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to sign in right now.";
      if (/two-factor|backup code/i.test(msg)) {
        setNeedsTotp(true);
        if (!totpCode.trim() && !backupCode.trim()) {
          setErrorMessage(null);
          showToast("Two-factor code required", "info");
          hideLoader();
          setLoading(false);
          return;
        }
      }
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      hideLoader();
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      {/* Left brand panel */}
      <div className="admin-login-brand">
        <div className="admin-login-brand-bg" />

        <Link href="/" className="admin-login-brand-logo">
          <BrandMark variant="wordmark" onDark height={36} priority />
        </Link>

        <div className="admin-login-brand-content">
          <div className="admin-login-badge">
            <Shield size={14} />
            Admin Portal
          </div>

          <h1 className="admin-login-headline">
            Command center<br />
            for your fleet.
          </h1>

          <p className="admin-login-subline">
            Operate rider approvals, payouts, safety reports, and live city activity from one secure command center.
          </p>

          <div className="admin-login-features">
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon">
                <BarChart3 size={16} />
              </div>
              <div>
                <strong>Real-time analytics</strong>
                <span>Live fleet metrics and revenue dashboards</span>
              </div>
            </div>
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon">
                <Users size={16} />
              </div>
              <div>
                <strong>Rider management</strong>
                <span>Verification, performance tracking, payouts</span>
              </div>
            </div>
            <div className="admin-login-feature">
              <div className="admin-login-feature-icon">
                <Zap size={16} />
              </div>
              <div>
                <strong>Operations control</strong>
                <span>Zone management, promotions, support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-login-brand-footer">
          <Lock size={12} />
          <span>256-bit encrypted · SOC 2 compliant</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="admin-login-form-panel">
        <div className="admin-login-form-wrapper">
          <div className="admin-login-form-header">
            <div className="admin-login-form-logo-mobile">
              <BrandMark variant="wordmark" height={28} priority />
            </div>
            <h2>Sign in to Admin</h2>
            <p>Enter your credentials to access the platform operations console.</p>
          </div>

          {errorMessage && (
            <div className="admin-login-error">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-login-field">
              <label htmlFor="admin-email">Email address</label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@okadago.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="admin-login-field">
              <div className="admin-login-field-row">
                <label htmlFor="admin-password">Password</label>
                <Link href="/login" className="admin-login-forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="admin-login-password-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-login-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {needsTotp && (
              <div className="admin-login-totp-section">
                <div className="admin-login-field">
                  <label htmlFor="admin-totp">Authenticator code</label>
                  <input
                    id="admin-totp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                  />
                </div>
                <div className="admin-login-field">
                  <label htmlFor="admin-backup">Or backup code</label>
                  <input
                    id="admin-backup"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  />
                  <span className="admin-login-hint">
                    Use either your authenticator app code or a one-time backup code.
                  </span>
                </div>
              </div>
            )}

            <label className="admin-login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="admin-login-submit-loading">
                  <span className="admin-login-spinner" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="admin-login-footer-text">
            <Lock size={12} />
            <span>Protected by enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
