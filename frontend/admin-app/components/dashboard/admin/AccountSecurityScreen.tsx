"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X
} from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { SettingsCard, SettingsChrome, SettingsToggle } from "./ui/SettingsChrome";

export type AccountSecurityScreenProps = {
  dataLoading?: boolean;
  token?: string | null;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
};

type SecurityTab = "overview" | "password" | "2fa" | "sessions" | "activity";

type SessionRow = {
  id: string;
  device: string;
  detail: string;
  location: string;
  network: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
};

type ActivityRow = {
  id: string;
  time: string;
  action: string;
  status: string;
  method: string;
  location: string;
  device: string;
  createdAt: string;
};

const TABS: Array<{ id: SecurityTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "password", label: "Password" },
  { id: "2fa", label: "Two-Factor Authentication" },
  { id: "sessions", label: "Sessions" },
  { id: "activity", label: "Login Activity" }
];

function passwordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label = score >= 5 ? "Strong" : score >= 3 ? "Medium" : password ? "Weak" : "—";
  return { checks, score, label };
}

export function AccountSecurityScreen({
  dataLoading = false,
  token,
  platformSettings,
  onSaveSettings
}: AccountSecurityScreenProps) {
  const { session, setSession } = useAuth();
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<SecurityTab>("overview");
  const user = session?.user;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [suspiciousProtection, setSuspiciousProtection] = useState(true);

  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpBusy, setTotpBusy] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState<"app" | "sms" | "email" | "key">("app");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [sessionsBusy, setSessionsBusy] = useState(false);
  const [editField, setEditField] = useState<"fullName" | "email" | "phone" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [backupRemaining, setBackupRemaining] = useState(0);
  const [freshBackupCodes, setFreshBackupCodes] = useState<string[]>([]);

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const joinedLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

  useEffect(() => {
    if (!platformSettings) return;
    if (typeof platformSettings.securityLoginAlerts === "boolean") {
      setLoginAlerts(platformSettings.securityLoginAlerts);
    }
    if (typeof platformSettings.securitySuspiciousProtection === "boolean") {
      setSuspiciousProtection(platformSettings.securitySuspiciousProtection);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (!token) return;
    requestJson<{ totpEnabled: boolean; backupCodesRemaining?: number }>("/auth/admin/2fa", { token })
      .then((res) => {
        setTotpEnabled(res.totpEnabled);
        setBackupRemaining(res.backupCodesRemaining ?? 0);
      })
      .catch(() => setTotpEnabled(false));
  }, [token]);

  async function handleGenerateBackupCodes() {
    if (!token || totpCode.length !== 6) {
      addToast("Enter a valid authenticator code first", "warning");
      return;
    }
    setTotpBusy(true);
    try {
      const res = await requestJson<{ codes: string[]; remaining: number }>(
        "/auth/admin/2fa/backup-codes/generate",
        { method: "POST", token, body: JSON.stringify({ code: totpCode }) }
      );
      setFreshBackupCodes(res.codes ?? []);
      setBackupRemaining(res.remaining ?? res.codes?.length ?? 0);
      setTotpCode("");
      addToast("Backup codes generated — copy them now", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not generate backup codes", "error");
    } finally {
      setTotpBusy(false);
    }
  }

  async function loadSessions() {
    if (!token) return;
    setSessionsBusy(true);
    try {
      const res = await requestJson<{ sessions: SessionRow[] }>("/auth/admin/sessions", { token });
      setSessions(res.sessions ?? []);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not load sessions", "error");
    } finally {
      setSessionsBusy(false);
    }
  }

  async function loadActivity() {
    if (!token) return;
    try {
      const res = await requestJson<{ activity: ActivityRow[] }>("/auth/admin/login-activity", { token });
      setActivity(res.activity ?? []);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not load login activity", "error");
    }
  }

  useEffect(() => {
    if (!token) return;
    void loadSessions();
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function persistSecurityPref(key: "securityLoginAlerts" | "securitySuspiciousProtection", value: boolean) {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings({ ...platformSettings, [key]: value });
  }

  async function handlePasswordUpdate() {
    if (!token) return;
    if (!strength.checks.length || !strength.checks.upper || !strength.checks.lower || !strength.checks.number || !strength.checks.special || !passwordsMatch) {
      addToast("Meet all password requirements before updating", "warning");
      return;
    }
    setPasswordBusy(true);
    try {
      await requestJson("/auth/admin/change-password", {
        method: "POST",
        token,
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Password updated", "success");
      void loadActivity();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not update password", "error");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleProfileSave() {
    if (!token || !editField) return;
    setProfileBusy(true);
    try {
      const body: Record<string, string> = {};
      if (editField === "fullName") body.fullName = editValue.trim();
      if (editField === "email") body.email = editValue.trim();
      if (editField === "phone") {
        body.phoneE164 = editValue.trim();
        const digits = editValue.replace(/\D/g, "");
        body.phoneLocal = digits.slice(-9) || digits;
        body.phoneCountryCode = editValue.trim().startsWith("+233") ? "+233" : user?.phoneCountryCode || "+233";
      }
      const refreshed = await requestJson<{ token: string; expiresAt: string; user: NonNullable<typeof user> }>(
        "/auth/admin/profile",
        { method: "PATCH", token, body: JSON.stringify(body) }
      );
      setSession(refreshed);
      setEditField(null);
      addToast("Profile updated", "success");
      void loadActivity();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not update profile", "error");
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!token) return;
    try {
      await requestJson(`/auth/admin/sessions/${sessionId}/revoke`, { method: "POST", token, body: "{}" });
      addToast("Session revoked", "success");
      void loadSessions();
      void loadActivity();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not revoke session", "error");
    }
  }

  async function handleLogoutOthers() {
    if (!token) return;
    try {
      const res = await requestJson<{ revokedCount: number }>("/auth/admin/sessions/logout-others", {
        method: "POST",
        token,
        body: "{}"
      });
      addToast(`Logged out ${res.revokedCount} other session${res.revokedCount === 1 ? "" : "s"}`, "success");
      void loadSessions();
      void loadActivity();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not log out other sessions", "error");
    }
  }

  async function handleTotpSetup() {
    if (!token) return;
    setTotpBusy(true);
    try {
      const res = await requestJson<{ secret: string; otpauthUrl: string }>(
        "/auth/admin/2fa/setup",
        { method: "POST", token }
      );
      setTotpSetup(res);
      setTotpCode("");
      addToast("Authenticator secret ready — scan or enter manually", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not start 2FA setup", "error");
    } finally {
      setTotpBusy(false);
    }
  }

  async function handleTotpEnable() {
    if (!token || !totpCode) return;
    setTotpBusy(true);
    try {
      await requestJson("/auth/admin/2fa/enable", {
        method: "POST",
        token,
        body: JSON.stringify({ code: totpCode })
      });
      setTotpEnabled(true);
      setTotpSetup(null);
      setTotpCode("");
      addToast("Two-factor authentication enabled", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Invalid code", "error");
    } finally {
      setTotpBusy(false);
    }
  }

  async function handleTotpDisable() {
    if (!token || !totpCode) return;
    setTotpBusy(true);
    try {
      await requestJson("/auth/admin/2fa/disable", {
        method: "POST",
        token,
        body: JSON.stringify({ code: totpCode })
      });
      setTotpEnabled(false);
      setTotpCode("");
      addToast("Two-factor authentication disabled", "info");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Could not disable 2FA", "error");
    } finally {
      setTotpBusy(false);
    }
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={0} rows={6} cols={4} />;
  }

  const crumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Account & Security" }
  ];

  const overview = (
    <div className="settings-layout">
      <div className="settings-stack">
        <SettingsCard title="Account Information" subtitle="Your OkadaGo admin profile details.">
          {(
            [
              { label: "Full Name", value: user?.fullName ?? "Admin", field: "fullName" as const, badge: undefined },
              {
                label: "Email Address",
                value: user?.email ?? "—",
                field: "email" as const,
                badge: user?.isEmailVerified ? "Verified" : user?.email ? "Unverified" : undefined
              },
              {
                label: "Phone Number",
                value: user?.phoneE164 ?? "—",
                field: "phone" as const,
                badge: user?.isPhoneVerified ? "Verified" : user?.phoneE164 ? "Unverified" : undefined
              },
              { label: "Role", value: user?.adminTitle || "Admin", field: null, badge: undefined },
              { label: "Admin ID", value: user?.adminProfileId?.slice(0, 12) ?? "—", field: null, badge: undefined },
              { label: "Date Joined", value: joinedLabel, field: null, badge: undefined }
            ] as const
          ).map((row) => (
            <div key={row.label} className="settings-row">
              <div>
                <div className="settings-row-meta">{row.label}</div>
                <div className="settings-row-label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {row.value}
                  {row.badge ? (
                    <span className={`settings-badge ${row.badge === "Verified" ? "settings-badge--success" : "settings-badge--warn"}`}>
                      {row.badge}
                    </span>
                  ) : null}
                </div>
              </div>
              {row.field ? (
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={() => {
                    setEditField(row.field);
                    setEditValue(
                      row.field === "fullName"
                        ? user?.fullName ?? ""
                        : row.field === "email"
                          ? user?.email ?? ""
                          : user?.phoneE164 ?? ""
                    );
                  }}
                >
                  Edit
                </button>
              ) : null}
            </div>
          ))}
        </SettingsCard>

        <SettingsCard title="Security Settings">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Password</div>
              <div className="settings-row-meta">Use a strong unique password</div>
            </div>
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setTab("password")}>
              Change Password
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Two-Factor Authentication (2FA)</div>
              <div className="settings-row-meta">Authenticator app protection</div>
            </div>
            <span className={`settings-badge ${totpEnabled ? "settings-badge--success" : "settings-badge--warn"}`}>
              {totpEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Email / Phone Verification</div>
              <div className="settings-row-meta">Keep recovery channels current</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={() => {
                  setEditField("email");
                  setEditValue(user?.email ?? "");
                }}
              >
                <Mail size={14} /> Update Email
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={() => {
                  setEditField("phone");
                  setEditValue(user?.phoneE164 ?? "");
                }}
              >
                <Phone size={14} /> Update Phone
              </button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Account Actions">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Logout from all devices</div>
              <div className="settings-row-meta">Ends every active admin session</div>
            </div>
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => void handleLogoutOthers()}>
              <LogOut size={14} /> Logout Others
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Delete Account</div>
              <div className="settings-row-meta">Requires support review for staff accounts</div>
            </div>
            <button
              type="button"
              className="settings-btn settings-btn--danger"
              onClick={() => addToast("Account deletion is disabled for staff consoles", "warning")}
            >
              Delete Account
            </button>
          </div>
        </SettingsCard>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Security Summary">
          <p style={{ margin: "0 0 12px", color: "var(--color-success)", fontWeight: 700, fontSize: 13 }}>
            Your account security status is strong.
          </p>
          {[
            ["Password", "Strong"],
            ["2FA", totpEnabled ? "Enabled" : "Disabled"],
            ["Active Sessions", `${sessions.length} Active`],
            ["Login Activity", `${activity.length} recent events`],
            ["API Access", "Restricted"]
          ].map(([label, value]) => (
            <div key={label} className="settings-row">
              <span className="settings-row-label" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Check size={14} color="var(--color-success)" /> {label}
              </span>
              <span className="settings-row-meta">{value}</span>
            </div>
          ))}
        </SettingsCard>

        <SettingsCard
          title="Recent Login Activity"
          actions={
            <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("activity")}>
              View All
            </button>
          }
        >
          {activity.length === 0 ? (
            <p className="settings-row-meta" style={{ margin: 0 }}>No login activity recorded yet.</p>
          ) : (
            activity.slice(0, 3).map((row) => (
              <div key={row.id} className="settings-row">
                <div>
                  <div className="settings-row-label">{row.action}</div>
                  <div className="settings-row-meta">{row.device} · {row.location}</div>
                </div>
                <span className="settings-row-meta">{row.time}</span>
              </div>
            ))
          )}
        </SettingsCard>

        <SettingsCard title="Need Help?">
          <ul className="settings-help-list">
            <li><a href="#secure">How to secure your account</a></li>
            <li><a href="#2fa" onClick={(e) => { e.preventDefault(); setTab("2fa"); }}>How to set up 2FA</a></li>
            <li><a href="#suspicious">Recognize suspicious activity</a></li>
          </ul>
        </SettingsCard>
      </div>
    </div>
  );

  const passwordTab = (
    <div className="settings-layout">
      <div className="settings-stack">
        <SettingsCard title="Change Password" subtitle="Use a unique password you do not reuse elsewhere.">
          <div className="settings-stack" style={{ gap: 14 }}>
            <label className="settings-field">
              Current Password
              <div style={{ position: "relative" }}>
                <input
                  className="settings-input"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-btn settings-btn--link"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="settings-field">
              New Password
              <input
                className="settings-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <div>
              <div className="settings-row-meta" style={{ marginBottom: 6 }}>
                Password strength: <strong style={{ color: strength.score >= 5 ? "var(--color-success)" : "var(--text-primary)" }}>{strength.label}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background:
                        i < strength.score
                          ? strength.score >= 5
                            ? "var(--color-success)"
                            : "var(--accent-yellow)"
                          : "var(--border-color)"
                    }}
                  />
                ))}
              </div>
            </div>
            <label className="settings-field">
              Confirm New Password
              <input
                className="settings-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              style={{ alignSelf: "flex-start" }}
              disabled={passwordBusy}
              onClick={() => void handlePasswordUpdate()}
            >
              {passwordBusy ? "Updating…" : "Update Password"}
            </button>
          </div>
        </SettingsCard>

        <SettingsCard title="Security Settings">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Email Verification</div>
              <div className="settings-row-meta">{user?.email ?? "No email on file"}</div>
            </div>
            <span className={`settings-badge ${user?.isEmailVerified ? "settings-badge--success" : "settings-badge--warn"}`}>
              {user?.isEmailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Phone Verification</div>
              <div className="settings-row-meta">{user?.phoneE164 ?? "No phone on file"}</div>
            </div>
            <span className={`settings-badge ${user?.isPhoneVerified ? "settings-badge--success" : "settings-badge--warn"}`}>
              {user?.isPhoneVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </SettingsCard>

        <SettingsCard title="Account Protection">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Login Alerts</div>
              <div className="settings-row-meta">Email me about new sign-ins</div>
            </div>
            <SettingsToggle
              checked={loginAlerts}
              onChange={(next) => {
                setLoginAlerts(next);
                persistSecurityPref("securityLoginAlerts", next);
              }}
              label="Login Alerts"
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Suspicious Activity Protection</div>
              <div className="settings-row-meta">Challenge unusual locations</div>
            </div>
            <SettingsToggle
              checked={suspiciousProtection}
              onChange={(next) => {
                setSuspiciousProtection(next);
                persistSecurityPref("securitySuspiciousProtection", next);
              }}
              label="Suspicious Activity Protection"
            />
          </div>
        </SettingsCard>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Password Requirements">
          {[
            ["8 characters", strength.checks.length],
            ["Uppercase letter", strength.checks.upper],
            ["Lowercase letter", strength.checks.lower],
            ["Number", strength.checks.number],
            ["Special character", strength.checks.special],
            ["Passwords match", passwordsMatch]
          ].map(([label, ok]) => (
            <div key={String(label)} className="settings-row">
              <span className="settings-row-label" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                {ok ? <Check size={14} color="var(--color-success)" /> : <X size={14} color="var(--text-muted)" />}
                {label}
              </span>
            </div>
          ))}
        </SettingsCard>

        <SettingsCard title="Two-Factor Authentication">
          <div className="settings-row">
            <div className="settings-row-label">Status</div>
            <span className={`settings-badge ${totpEnabled ? "settings-badge--success" : "settings-badge--warn"}`}>
              {totpEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="settings-row">
            <div className="settings-row-meta">Method</div>
            <div className="settings-row-label">Authenticator App</div>
          </div>
          <button type="button" className="settings-btn settings-btn--primary" style={{ width: "100%" }} onClick={() => setTab("2fa")}>
            Manage 2FA
          </button>
        </SettingsCard>
      </div>
    </div>
  );

  const twoFaTab = (
    <div className="settings-layout">
      <div className="settings-stack">
        <SettingsCard title="Step 1: Choose your 2FA method">
          <div className="settings-method-grid">
            {(
              [
                { id: "app" as const, title: "Authenticator App", desc: "Google Authenticator, Authy", recommended: true },
                { id: "sms" as const, title: "SMS Verification", desc: "Codes by text message", recommended: false },
                { id: "email" as const, title: "Email Verification", desc: "Codes to your inbox", recommended: false },
                { id: "key" as const, title: "Security Key", desc: "Hardware key support soon", recommended: false }
              ] as const
            ).map((method) => (
              <button
                key={method.id}
                type="button"
                className={`settings-method-card${twoFaMethod === method.id ? " selected" : ""}`}
                onClick={() => {
                  if (method.id !== "app") {
                    addToast("Only authenticator apps are supported today", "info");
                    return;
                  }
                  setTwoFaMethod(method.id);
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <Smartphone size={18} color="var(--accent-yellow)" />
                  {method.recommended ? <span className="settings-badge settings-badge--success">Recommended</span> : null}
                </div>
                <strong style={{ fontSize: 13 }}>{method.title}</strong>
                <span className="settings-row-meta">{method.desc}</span>
              </button>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Step 2: Set up Authenticator App">
          <div className="settings-grid-2" style={{ alignItems: "start" }}>
            <ol style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.7 }}>
              <li>Download an authenticator app (Google Authenticator or Authy).</li>
              <li>Scan the QR code or enter the secret key manually.</li>
              <li>Enter the 6-digit verification code to enable 2FA.</li>
            </ol>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              {totpSetup ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpSetup.otpauthUrl)}`}
                    alt="2FA QR code"
                    width={180}
                    height={180}
                    style={{ borderRadius: 12, background: "#fff", padding: 8 }}
                  />
                  <code style={{ fontSize: 12, letterSpacing: 1, wordBreak: "break-all" }}>{totpSetup.secret}</code>
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost"
                    onClick={() => {
                      void navigator.clipboard?.writeText(totpSetup.secret);
                      addToast("Secret copied", "success");
                    }}
                  >
                    <Copy size={14} /> Copy secret
                  </button>
                </>
              ) : (
                <div
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 12,
                    border: "1px dashed var(--border-color)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--text-muted)",
                    fontSize: 12,
                    textAlign: "center",
                    padding: 16
                  }}
                >
                  {totpEnabled
                    ? "2FA is already enabled. Disable it first to rotate the secret."
                    : "Generate a setup secret to reveal the QR code."}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, alignItems: "center" }}>
            {!totpEnabled && !totpSetup ? (
              <button type="button" className="settings-btn settings-btn--primary" disabled={totpBusy} onClick={handleTotpSetup}>
                <KeyRound size={14} /> Generate setup code
              </button>
            ) : null}
            <input
              className="settings-input"
              style={{ width: 180 }}
              placeholder="e.g. 123456"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
            />
            {!totpEnabled ? (
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                disabled={totpBusy || totpCode.length !== 6 || !totpSetup}
                onClick={handleTotpEnable}
              >
                Verify & Enable 2FA
              </button>
            ) : (
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                disabled={totpBusy || totpCode.length !== 6}
                onClick={handleTotpDisable}
              >
                Disable 2FA
              </button>
            )}
          </div>
        </SettingsCard>
      </div>

      <div className="settings-stack">
        <SettingsCard title="2FA Status">
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            {totpEnabled ? <ShieldCheck size={22} color="var(--color-success)" /> : <ShieldAlert size={22} color="var(--accent-yellow)" />}
            <div>
              <div className="settings-row-label">2FA is currently {totpEnabled ? "Enabled" : "Disabled"}.</div>
              <div className="settings-row-meta">Authenticator App</div>
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-meta">Method</span>
            <span className="settings-row-label">Authenticator App</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-meta">Added On</span>
            <span className="settings-row-label">{totpEnabled ? "Enabled on this account" : "—"}</span>
          </div>
        </SettingsCard>

        <SettingsCard title="Backup Codes">
          <p className="settings-row-meta" style={{ margin: "0 0 12px" }}>
            {backupRemaining > 0
              ? `${backupRemaining} unused backup code${backupRemaining === 1 ? "" : "s"} remaining.`
              : "Generate one-time backup codes after enabling authenticator 2FA."}
          </p>
          {freshBackupCodes.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-success)", fontWeight: 600 }}>
                Copy these now — they will not be shown again.
              </p>
              <div className="settings-stack" style={{ gap: 6 }}>
                {freshBackupCodes.map((code) => (
                  <code key={code} style={{ fontSize: 13, letterSpacing: 1 }}>{code}</code>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            disabled={!totpEnabled || totpBusy || totpCode.length !== 6}
            onClick={() => void handleGenerateBackupCodes()}
          >
            <RefreshCw size={14} /> {backupRemaining > 0 ? "Regenerate backup codes" : "Generate backup codes"}
          </button>
          <p className="settings-row-meta" style={{ marginTop: 8 }}>
            Enter a current authenticator code above, then generate.
          </p>
        </SettingsCard>

        <SettingsCard title="Need Help?">
          <ul className="settings-help-list">
            <li><a href="#what">What is 2FA?</a></li>
            <li><a href="#setup">How to set up 2FA</a></li>
            <li><a href="#lost">Can&apos;t access your 2FA device?</a></li>
          </ul>
        </SettingsCard>
      </div>
    </div>
  );

  const sessionsTab = (
    <div className="settings-layout">
      <div className="settings-stack">
        <div className="settings-tip">
          <Shield size={18} color="var(--accent-yellow)" />
          <span>You&apos;re currently signed in. Review devices you do not recognize and log them out.</span>
        </div>

        <SettingsCard
          title={`Active Sessions (${sessions.length})`}
          actions={
            <button type="button" className="settings-btn settings-btn--ghost" disabled={sessionsBusy} onClick={() => void loadSessions()}>
              <RefreshCw size={14} /> Refresh Sessions
            </button>
          }
        >
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Device / Browser</th>
                  <th>Location</th>
                  <th>Last Active</th>
                  <th>Network</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No active sessions found.</td>
                  </tr>
                ) : (
                  sessions.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                          {row.device.includes("iPhone") || row.device.includes("Android") ? (
                            <Smartphone size={14} />
                          ) : (
                            <Laptop size={14} />
                          )}
                          {row.device}
                        </strong>
                        <div><small>{row.detail}</small></div>
                      </td>
                      <td>{row.location}</td>
                      <td>{row.lastActive}</td>
                      <td>{row.network}</td>
                      <td><span className="settings-badge settings-badge--success">Active</span></td>
                      <td>
                        {row.isCurrent ? (
                          <span className="settings-badge settings-badge--success">Current Session</span>
                        ) : (
                          <button
                            type="button"
                            className="settings-btn settings-btn--ghost"
                            onClick={() => void handleRevokeSession(row.id)}
                          >
                            Log out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SettingsCard>

        <div className="settings-tip">
          <ShieldAlert size={18} color="var(--accent-yellow)" />
          <span>Tips to keep your account secure. Always log out from shared devices and enable 2FA.</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span className="settings-row-meta">Unrecognized sessions? End them immediately.</span>
          <button type="button" className="settings-btn settings-btn--danger" onClick={() => void handleLogoutOthers()}>
            Log out all other sessions
          </button>
        </div>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Session Summary">
          <div className="settings-row"><span className="settings-row-meta">Total Active Sessions</span><strong>{sessions.length}</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Current Device</span><span className="settings-badge settings-badge--success">This device</span></div>
          <div className="settings-row"><span className="settings-row-meta">Last Sign-in</span><strong>{sessions.find((s) => s.isCurrent)?.lastActive ?? "—"}</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Device Type</span><strong>{sessions.find((s) => s.isCurrent)?.device ?? "—"}</strong></div>
        </SettingsCard>
        <SettingsCard title="Security Recommendation">
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
            {totpEnabled ? "2FA is enabled. Keep backup codes somewhere safe." : "Enable two-factor authentication for stronger protection."}
          </p>
          <button type="button" className="settings-btn settings-btn--primary" style={{ width: "100%" }} onClick={() => setTab("2fa")}>
            Manage 2FA
          </button>
        </SettingsCard>
      </div>
    </div>
  );

  const activityTab = (
    <div className="settings-layout">
      <div className="settings-stack">
        <SettingsCard
          title="Monitor your account activity"
          subtitle="Review successful, failed, and suspicious sign-in attempts."
          actions={
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => void loadActivity()}>
              <RefreshCw size={14} /> Refresh Activity
            </button>
          }
        >
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Location</th>
                  <th>Device / Browser</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No login activity yet. New admin logins will appear here.</td>
                  </tr>
                ) : (
                  activity.map((row) => (
                    <tr key={row.id}>
                      <td>{row.createdAt.replace("T", " ").slice(0, 16)}</td>
                      <td>{row.action}</td>
                      <td>{row.location}</td>
                      <td>{row.device}</td>
                      <td>
                        <span className="settings-badge settings-badge--success">{row.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SettingsCard>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Login Summary">
          <div className="settings-row"><span className="settings-row-meta">Total Events</span><strong>{activity.length}</strong></div>
          <div className="settings-row">
            <span className="settings-row-meta">Logins</span>
            <strong>{activity.filter((a) => a.action === "ADMIN_LOGIN").length}</strong>
          </div>
          <div className="settings-row">
            <span className="settings-row-meta">Password Changes</span>
            <strong>{activity.filter((a) => a.action === "ADMIN_PASSWORD_CHANGE").length}</strong>
          </div>
          <div className="settings-row">
            <span className="settings-row-meta">Session Revokes</span>
            <strong>{activity.filter((a) => a.action.includes("SESSION_REVOKE")).length}</strong>
          </div>
        </SettingsCard>
        <SettingsCard title="Recent Locations">
          {activity.length === 0 ? (
            <p className="settings-row-meta" style={{ margin: 0 }}>Locations appear after sign-in events are logged.</p>
          ) : (
            Array.from(new Map(activity.map((a) => [a.location, a])).values())
              .slice(0, 5)
              .map((row) => (
                <div key={row.id} className="settings-row">
                  <span className="settings-row-label">{row.location}</span>
                  <span className="settings-row-meta">{row.time}</span>
                </div>
              ))
          )}
        </SettingsCard>
        <SettingsCard title="Security Recommendations">
          <ul className="settings-help-list">
            <li>Enable two-factor authentication</li>
            <li>Review account activity regularly</li>
          </ul>
          <button type="button" className="settings-btn settings-btn--primary" style={{ width: "100%", marginTop: 12 }} onClick={() => setTab("2fa")}>
            Manage 2FA
          </button>
        </SettingsCard>
      </div>
    </div>
  );

  return (
    <SettingsChrome
      title={
        tab === "password"
          ? "Password & Security"
          : tab === "2fa"
            ? "Two-Factor Authentication (2FA)"
            : tab === "sessions"
              ? "Active Sessions"
              : tab === "activity"
                ? "Login Activity"
                : "Account & Security"
      }
      subtitle={
        tab === "password"
          ? "Manage your password, security settings, and protect your OkadaGo account."
          : tab === "2fa"
            ? "Add a second step to admin sign-in with an authenticator app."
            : tab === "sessions"
              ? "See where your OkadaGo admin account is signed in."
              : tab === "activity"
                ? "Monitor successful and suspicious sign-in attempts."
                : "Manage your account details, password, and security controls."
      }
      breadcrumbs={
        tab === "overview"
          ? crumbs
          : [...crumbs.slice(0, 2), { label: "Account & Security", href: "/settings/security" }, { label: TABS.find((t) => t.id === tab)?.label ?? tab }]
      }
      tabs={TABS}
      activeTab={tab}
      onTabChange={(id) => setTab(id as SecurityTab)}
    >
      {tab === "overview" && overview}
      {tab === "password" && passwordTab}
      {tab === "2fa" && twoFaTab}
      {tab === "sessions" && sessionsTab}
      {tab === "activity" && activityTab}

      {editField ? (
        <div className="settings-dialog-overlay" role="dialog" aria-modal="true" aria-label="Edit profile">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <h3>
                  {editField === "fullName" ? "Edit full name" : editField === "email" ? "Update email" : "Update phone"}
                </h3>
                <p>Changes save to your admin account immediately.</p>
              </div>
              <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setEditField(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="settings-card-body settings-stack" style={{ gap: 14 }}>
              <label className="settings-field">
                {editField === "fullName" ? "Full name" : editField === "email" ? "Email" : "Phone (E.164)"}
                <input
                  className="settings-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={editField === "phone" ? "+233241234567" : undefined}
                />
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setEditField(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="settings-btn settings-btn--primary"
                  disabled={profileBusy || !editValue.trim()}
                  onClick={() => void handleProfileSave()}
                >
                  {profileBusy ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SettingsChrome>
  );
}
