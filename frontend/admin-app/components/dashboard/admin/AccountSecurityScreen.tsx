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
};

type SecurityTab = "overview" | "password" | "2fa" | "sessions" | "activity";

const TABS: Array<{ id: SecurityTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "password", label: "Password" },
  { id: "2fa", label: "Two-Factor Authentication" },
  { id: "sessions", label: "Sessions" },
  { id: "activity", label: "Login Activity" }
];

const DEMO_SESSIONS = [
  {
    id: "current",
    device: "Chrome on Windows",
    detail: "Windows 11 · Chrome 125",
    location: "Accra, Ghana",
    network: "This device",
    lastActive: "Just now",
    ip: "154.160.22.14",
    current: true
  },
  {
    id: "phone",
    device: "Safari on iPhone",
    detail: "iOS 17 · Safari",
    location: "Accra, Ghana",
    network: "MTN Ghana",
    lastActive: "15 minutes ago",
    ip: "41.66.210.88",
    current: false
  },
  {
    id: "kumasi",
    device: "Chrome on Android",
    detail: "Android 14 · Chrome 124",
    location: "Kumasi, Ghana",
    network: "Vodafone Ghana",
    lastActive: "Yesterday, 8:12 PM",
    ip: "197.251.44.19",
    current: false
  }
];

const DEMO_ACTIVITY = [
  {
    id: "1",
    at: "May 31, 2024 10:45 AM",
    location: "Accra, Ghana",
    network: "This device",
    ip: "154.160.22.14",
    device: "Chrome on Windows",
    status: "Success" as const
  },
  {
    id: "2",
    at: "May 30, 2024 7:18 PM",
    location: "Accra, Ghana",
    network: "MTN Ghana",
    ip: "41.66.210.88",
    device: "Safari on iPhone",
    status: "Success" as const
  },
  {
    id: "3",
    at: "May 29, 2024 11:02 AM",
    location: "Kumasi, Ghana",
    network: "Vodafone Ghana",
    ip: "197.251.44.19",
    device: "Chrome on Android",
    status: "Success" as const
  },
  {
    id: "4",
    at: "May 28, 2024 9:41 PM",
    location: "Lagos, Nigeria",
    network: "Unusual location",
    ip: "105.112.48.22",
    device: "Firefox on Windows",
    status: "Suspicious" as const
  },
  {
    id: "5",
    at: "May 27, 2024 4:05 PM",
    location: "Accra, Ghana",
    network: "AirtelTigo",
    ip: "154.160.18.40",
    device: "Chrome on Windows",
    status: "Failed" as const
  }
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
  token
}: AccountSecurityScreenProps) {
  const { session, signOut } = useAuth();
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<SecurityTab>("overview");
  const user = session?.user;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [suspiciousProtection, setSuspiciousProtection] = useState(true);

  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpBusy, setTotpBusy] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState<"app" | "sms" | "email" | "key">("app");

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword]);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (!token) return;
    requestJson<{ totpEnabled: boolean }>("/auth/admin/2fa", { token })
      .then((res) => setTotpEnabled(res.totpEnabled))
      .catch(() => setTotpEnabled(false));
  }, [token]);

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
          {[
            { label: "Full Name", value: user?.fullName ?? "Admin" },
            {
              label: "Email Address",
              value: user?.email ?? "—",
              badge: user?.email ? "Verified" : undefined
            },
            {
              label: "Phone Number",
              value: user?.phoneE164 ?? "—",
              badge: user?.phoneE164 ? "Verified" : undefined
            },
            { label: "Role", value: "Super Admin" },
            { label: "Admin ID", value: user?.adminProfileId?.slice(0, 12) ?? "ADM-LOCAL" },
            { label: "Date Joined", value: "May 10, 2023" }
          ].map((row) => (
            <div key={row.label} className="settings-row">
              <div>
                <div className="settings-row-meta">{row.label}</div>
                <div className="settings-row-label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {row.value}
                  {row.badge ? <span className="settings-badge settings-badge--success">{row.badge}</span> : null}
                </div>
              </div>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={() => addToast("Inline profile editor is not connected yet", "info")}
              >
                Edit
              </button>
            </div>
          ))}
        </SettingsCard>

        <SettingsCard title="Security Settings">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Password</div>
              <div className="settings-row-meta">Last changed 45 days ago</div>
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
              <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Update email is not connected yet", "info")}>
                <Mail size={14} /> Update Email
              </button>
              <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Update phone is not connected yet", "info")}>
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
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => {
                addToast("Signing out this device…", "info");
                void signOut();
              }}
            >
              <LogOut size={14} /> Logout All
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
            ["Active Sessions", `${DEMO_SESSIONS.length} Active`],
            ["Login Activity", "No suspicious activity"],
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
          {DEMO_ACTIVITY.slice(0, 3).map((row) => (
            <div key={row.id} className="settings-row">
              <div>
                <div className="settings-row-label">{row.location}</div>
                <div className="settings-row-meta">{row.device}</div>
              </div>
              <span className="settings-row-meta">{row.at.includes("10:45") ? "Just now" : row.at}</span>
            </div>
          ))}
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
              onClick={() => {
                if (!strength.checks.length || !passwordsMatch) {
                  addToast("Meet all password requirements before updating", "warning");
                  return;
                }
                addToast("Password change API is not connected yet", "info");
              }}
            >
              Update Password
            </button>
          </div>
        </SettingsCard>

        <SettingsCard title="Security Settings">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Email Verification</div>
              <div className="settings-row-meta">{user?.email ?? "No email on file"}</div>
            </div>
            <span className="settings-badge settings-badge--success">Verified</span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Phone Verification</div>
              <div className="settings-row-meta">{user?.phoneE164 ?? "No phone on file"}</div>
            </div>
            <span className="settings-badge settings-badge--success">Verified</span>
          </div>
        </SettingsCard>

        <SettingsCard title="Account Protection">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Login Alerts</div>
              <div className="settings-row-meta">Email me about new sign-ins</div>
            </div>
            <SettingsToggle checked={loginAlerts} onChange={setLoginAlerts} label="Login Alerts" />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Suspicious Activity Protection</div>
              <div className="settings-row-meta">Challenge unusual locations</div>
            </div>
            <SettingsToggle
              checked={suspiciousProtection}
              onChange={setSuspiciousProtection}
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
            <span className="settings-row-label">{totpEnabled ? "May 10, 2023" : "—"}</span>
          </div>
        </SettingsCard>

        <SettingsCard title="Backup Codes">
          <p style={{ margin: "0 0 12px", color: "var(--color-success)", fontWeight: 600, fontSize: 13 }}>
            10 unused backup codes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Backup codes UI coming soon", "info")}>
              View Backup Codes
            </button>
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Regenerate backup codes coming soon", "info")}>
              <RefreshCw size={14} /> Regenerate Backup Codes
            </button>
          </div>
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
          title={`Active Sessions (${DEMO_SESSIONS.length})`}
          actions={
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Session list refreshed", "info")}>
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
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SESSIONS.map((row) => (
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
                    <td>
                      {row.location}
                      <div><small>{row.network}</small></div>
                    </td>
                    <td>{row.lastActive}</td>
                    <td>{row.ip}</td>
                    <td><span className="settings-badge settings-badge--success">Active</span></td>
                    <td>
                      {row.current ? (
                        <span className="settings-badge settings-badge--success">Current Session</span>
                      ) : (
                        <button
                          type="button"
                          className="settings-btn settings-btn--ghost"
                          onClick={() => addToast("Revoke-other-sessions API is not connected yet", "info")}
                        >
                          Log out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
          <button
            type="button"
            className="settings-btn settings-btn--danger"
            onClick={() => {
              addToast("Signing out this device…", "info");
              void signOut();
            }}
          >
            Log out all other sessions
          </button>
        </div>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Session Summary">
          <div className="settings-row"><span className="settings-row-meta">Total Active Sessions</span><strong>{DEMO_SESSIONS.length}</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Current Device</span><span className="settings-badge settings-badge--success">This device</span></div>
          <div className="settings-row"><span className="settings-row-meta">Last Sign-in</span><strong>Just now</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Device Type</span><strong>Windows · Chrome</strong></div>
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
            <button type="button" className="settings-btn settings-btn--ghost" onClick={() => addToast("Activity refreshed", "info")}>
              <RefreshCw size={14} /> Refresh Activity
            </button>
          }
        >
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Location</th>
                  <th>IP Address</th>
                  <th>Device / Browser</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACTIVITY.map((row) => (
                  <tr key={row.id}>
                    <td>{row.at}</td>
                    <td>
                      {row.location}
                      <div><small>{row.network}</small></div>
                    </td>
                    <td>{row.ip}</td>
                    <td>{row.device}</td>
                    <td>
                      <span
                        className={`settings-badge ${
                          row.status === "Success"
                            ? "settings-badge--success"
                            : row.status === "Suspicious"
                              ? "settings-badge--warn"
                              : "settings-badge--danger"
                        }`}
                      >
                        {row.status === "Suspicious"
                          ? "Suspicious - Unusual location"
                          : row.status === "Failed"
                            ? "Failed - Incorrect password"
                            : "Success"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsCard>
      </div>

      <div className="settings-stack">
        <SettingsCard title="Login Summary">
          <div className="settings-row"><span className="settings-row-meta">Total Logins</span><strong>32</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Successful Logins</span><strong>28</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Failed Attempts</span><strong>3</strong></div>
          <div className="settings-row"><span className="settings-row-meta">Suspicious Logins</span><strong>1</strong></div>
        </SettingsCard>
        <SettingsCard title="Login Locations">
          {[
            ["Accra, Ghana", "24"],
            ["Kumasi, Ghana", "3"],
            ["Lagos, Nigeria", "2"],
            ["Other Locations", "3"]
          ].map(([city, count]) => (
            <div key={city} className="settings-row">
              <span className="settings-row-label">{city}</span>
              <span className="settings-row-meta">{count} logins</span>
            </div>
          ))}
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
    </SettingsChrome>
  );
}
