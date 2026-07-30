import { useState, useMemo } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Shield,
  Bell,
  CreditCard,
  FileText,
  Plug,
  ScrollText,
  Globe,
  Save,
  RotateCcw,
  Key,
  AlertTriangle,
  ExternalLink,
  Download,
  Check,
  X,
  Pencil,
  Lock,
  Smartphone,
  Mail,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonForm } from "./AdminSkeleton";
import type { ServiceZoneRecord, AdminAccountRecord, AuditLogRecord } from "./types";

export type SettingsScreenProps = {
  zones: ServiceZoneRecord[];
  adminAccounts: AdminAccountRecord[];
  adminRoleEntries: [string, string[]][];
  adminModules: string[];
  adminCurrency: string;
  auditLogs?: AuditLogRecord[];
  dataLoading?: boolean;
};

type SectionKey =
  | "general"
  | "company"
  | "security"
  | "notifications"
  | "payment"
  | "taxes"
  | "integrations"
  | "audit";

const SECTIONS: { key: SectionKey; label: string; icon: typeof SettingsIcon }[] = [
  { key: "general", label: "General", icon: SettingsIcon },
  { key: "company", label: "Company Profile", icon: Building2 },
  { key: "security", label: "Account & Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "payment", label: "Payment Methods", icon: CreditCard },
  { key: "taxes", label: "Taxes & Compliance", icon: FileText },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "audit", label: "Audit Logs", icon: ScrollText },
];

const DARK = {
  bg: "var(--bg-primary)",
  surface: "var(--bg-card)",
  surfaceAlt: "color-mix(in srgb, var(--bg-card) 85%, var(--text-primary))",
  border: "var(--border-color)",
  text: "var(--text-primary)",
  textMuted: "var(--text-secondary)",
  accent: "var(--accent-orange)",
  accentHover: "var(--accent-yellow)",
  green: "var(--color-success)",
  greenBg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
  red: "var(--color-danger)",
  redBg: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
  yellow: "var(--accent-yellow)",
  yellowBg: "var(--accent-yellow-light)",
  blue: "var(--accent-orange)",
  blueBg: "color-mix(in srgb, var(--accent-orange) 15%, transparent)",
  input: "var(--bg-primary)",
  inputBorder: "var(--border-color)",
  navItem: "var(--bg-card)",
  navActive: "var(--accent-yellow)",
  navHover: "color-mix(in srgb, var(--bg-card) 85%, var(--text-primary))",
  dangerZone: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
  dangerBorder: "color-mix(in srgb, var(--color-danger) 40%, transparent)",
} as const;

const s = (overrides: Record<string, string | number>) =>
  ({
    ...DARK,
    ...overrides,
  }) as React.CSSProperties;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${DARK.inputBorder}`,
  background: DARK.input,
  color: DARK.text,
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  color: DARK.textMuted,
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  background: DARK.surface,
  borderRadius: 14,
  border: `1px solid ${DARK.border}`,
  padding: 20,
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 18px",
  borderRadius: 10,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

export function SettingsScreen({
  zones,
  adminAccounts,
  adminRoleEntries,
  adminModules,
  adminCurrency,
  auditLogs = [],
  dataLoading = false,
}: SettingsScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile, isTablet } = useBreakpoint();
  const [activeSection, setActiveSection] = useState<SectionKey>("general");
  const [formValues, setFormValues] = useState<Record<string, string>>({
    platformName: "OkadaGo",
    currency: adminCurrency,
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    distanceUnit: "km",
    language: "en",
    companyName: "OkadaGo Technologies",
    email: "admin@okadago.com",
    phone: "+233200000000",
    address: "Accra, Ghana",
    website: "https://okadago.com",
    logo: "",
    taxRate: "15",
    invoicePrefix: "OKD",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    autoInvoice: true,
    maintenanceMode: false,
    debugMode: false,
    require2FA: false,
  });
  const [modules, setModules] = useState<string[]>(adminModules);

  const toggle = (key: string) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateField = (key: string, value: string) =>
    setFormValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    addToast("Platform settings save API is not connected yet — changes on this screen are local preview only", "info");
  };

  const handleReset = () => {
    addToast("Reset is preview-only until settings persistence exists", "info");
  };

  const handleConnect = (service: string) => {
    addToast(`${service} connection is not wired in this console yet`, "info");
  };

  const handleExportLogs = () => {
    if (auditLogs.length === 0) {
      addToast("No audit logs to export", "info");
      return;
    }
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okadago-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Downloaded current audit log snapshot", "success");
  };

  const activityLogs = useMemo(
    () =>
      auditLogs.slice(0, 20).map((log) => ({
        id: log.id,
        action: log.action,
        user: log.actor?.email ?? log.actor?.fullName ?? "System",
        time: log.createdAt.replace("T", " ").slice(0, 16),
        detail:
          typeof log.details === "object" && log.details
            ? JSON.stringify(log.details).slice(0, 120)
            : `${log.entity}${log.entityId ? ` · ${log.entityId}` : ""}`
      })),
    [auditLogs]
  );

  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
        <SkeletonForm fields={8} />
      </div>
    );
  }

  const renderGeneral = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Ghana Platform Settings</h3>
      <p style={{ color: DARK.textMuted, fontSize: 12, margin: 0 }}>OkadaGo Accra ops defaults — timezone Africa/Accra, GHS currency.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          Platform Name
          <input style={inputStyle} value={formValues.platformName} onChange={(e) => updateField("platformName", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Currency
          <input style={inputStyle} value={formValues.currency} onChange={(e) => updateField("currency", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Timezone
          <input style={inputStyle} value={formValues.timezone} onChange={(e) => updateField("timezone", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Date Format
          <select style={inputStyle} value={formValues.dateFormat} onChange={(e) => updateField("dateFormat", e.target.value)}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </label>
        <label style={labelStyle}>
          Time Format
          <select style={inputStyle} value={formValues.timeFormat} onChange={(e) => updateField("timeFormat", e.target.value)}>
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </label>
        <label style={labelStyle}>
          Distance Unit
          <select style={inputStyle} value={formValues.distanceUnit} onChange={(e) => updateField("distanceUnit", e.target.value)}>
            <option value="km">Kilometers</option>
            <option value="mi">Miles</option>
          </select>
        </label>
        <label style={labelStyle}>
          Language
          <select style={inputStyle} value={formValues.language} onChange={(e) => updateField("language", e.target.value)}>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="tw">Twi</option>
          </select>
        </label>
      </div>

      <h3 style={{ color: DARK.text, fontSize: 14, fontWeight: 700, margin: "8px 0 0" }}>System Toggles</h3>
      {[
        { key: "maintenanceMode", label: "Maintenance Mode", desc: "Temporarily disable public access" },
        { key: "debugMode", label: "Debug Mode", desc: "Enable verbose logging" },
      ].map(({ key, label, desc }) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${DARK.border}` }}>
          <div>
            <div style={{ color: DARK.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
            <div style={{ color: DARK.textMuted, fontSize: 12 }}>{desc}</div>
          </div>
          <button onClick={() => toggle(key)} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
            background: toggles[key] ? DARK.green : DARK.surfaceAlt,
            transition: "background 0.2s",
          }}>
            <span style={{
              position: "absolute", top: 3, left: toggles[key] ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderCompany = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Company Information — Ghana Ops</h3>
      <p style={{ color: DARK.textMuted, fontSize: 12, margin: 0 }}>OkadaGo legal and contact profile for Accra operations.</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          Company Name
          <input style={inputStyle} value={formValues.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Email
          <input style={inputStyle} type="email" value={formValues.email} onChange={(e) => updateField("email", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Phone
          <input style={inputStyle} value={formValues.phone} onChange={(e) => updateField("phone", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Website
          <input style={inputStyle} value={formValues.website} onChange={(e) => updateField("website", e.target.value)} />
        </label>
      </div>
      <label style={labelStyle}>
        Address
        <input style={inputStyle} value={formValues.address} onChange={(e) => updateField("address", e.target.value)} />
      </label>
      <label style={labelStyle}>
        Company Logo
        <div style={{
          width: 120, height: 120, borderRadius: 14, border: `2px dashed ${DARK.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 8, cursor: "pointer", color: DARK.textMuted, fontSize: 12,
        }}>
          <Building2 size={28} style={{ opacity: 0.4 }} />
          <span>Upload Logo</span>
        </div>
      </label>
    </div>
  );

  const renderSecurity = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Account & Security</h3>

      <div style={{ display: "flex", gap: isMobile ? 8 : 12, flexWrap: "wrap" }}>
        <button style={{ ...btnBase, background: DARK.accent, color: "#fff" }} onClick={() => addToast("Inline profile editor is not connected yet", "info")}>
          <Pencil size={15} /> Edit Profile
        </button>
        <button style={{ ...btnBase, background: DARK.surfaceAlt, color: DARK.text, border: `1px solid ${DARK.border}` }} onClick={() => addToast("Password change email is not connected yet", "info")}>
          <Lock size={15} /> Change Password
        </button>
      </div>

      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: toggles.require2FA ? DARK.greenBg : DARK.surfaceAlt,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={20} style={{ color: toggles.require2FA ? DARK.green : DARK.textMuted }} />
          </div>
          <div>
            <div style={{ color: DARK.text, fontSize: 13, fontWeight: 600 }}>Two-Factor Authentication</div>
            <div style={{ color: DARK.textMuted, fontSize: 12 }}>Require 2FA for all admin accounts</div>
          </div>
        </div>
        <button onClick={() => toggle("require2FA")} style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
          background: toggles.require2FA ? DARK.green : DARK.surfaceAlt, transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 3, left: toggles.require2FA ? 23 : 3,
            width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          }} />
        </button>
      </div>

      <h3 style={{ color: DARK.text, fontSize: 14, fontWeight: 700, margin: "4px 0 0" }}>Change Password</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <label style={labelStyle}>
          Current Password
          <div style={{ position: "relative" }}>
            <input style={{ ...inputStyle, paddingRight: 36 }} type="password" value={formValues.currentPassword} onChange={(e) => updateField("currentPassword", e.target.value)} />
            <Eye size={16} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: DARK.textMuted, cursor: "pointer" }} />
          </div>
        </label>
        <label style={labelStyle}>
          New Password
          <input style={inputStyle} type="password" value={formValues.newPassword} onChange={(e) => updateField("newPassword", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Confirm New Password
          <input style={inputStyle} type="password" value={formValues.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} />
        </label>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Notification Preferences</h3>
      {[
        { key: "emailNotifications", label: "Email Notifications", desc: "Receive system alerts via email", icon: Mail },
        { key: "smsNotifications", label: "SMS Notifications", desc: "Receive alerts via SMS", icon: MessageSquare },
        { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications", icon: Smartphone },
      ].map(({ key, label, desc, icon: Icon }) => (
        <div key={key} style={{
          ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: toggles[key] ? DARK.greenBg : DARK.surfaceAlt,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={20} style={{ color: toggles[key] ? DARK.green : DARK.textMuted }} />
            </div>
            <div>
              <div style={{ color: DARK.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
              <div style={{ color: DARK.textMuted, fontSize: 12 }}>{desc}</div>
            </div>
          </div>
          <button onClick={() => toggle(key)} style={{
            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
            background: toggles[key] ? DARK.green : DARK.surfaceAlt, transition: "background 0.2s",
          }}>
            <span style={{
              position: "absolute", top: 3, left: toggles[key] ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
            }} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderPayment = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Payment Methods</h3>
      {[
        { name: "MTN Mobile Money", desc: "Accept MTN MoMo payments from passengers", connected: true, color: "#ffc107" },
        { name: "Telecel Cash", desc: "Accept Telecel Cash payments", connected: false, color: "#ff5252" },
        { name: "Bank Transfer", desc: "Direct bank account transfers", connected: false, color: DARK.blue },
      ].map(({ name, desc, connected, color }) => (
        <div key={name} style={{
          ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `${color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard size={22} style={{ color }} />
            </div>
            <div>
              <div style={{ color: DARK.text, fontSize: 14, fontWeight: 600 }}>{name}</div>
              <div style={{ color: DARK.textMuted, fontSize: 12 }}>{desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {connected && (
              <span style={{ ...btnBase, background: DARK.greenBg, color: DARK.green, fontSize: 11, padding: "6px 12px" }}>
                <Check size={13} /> Connected
              </span>
            )}
            {!connected && (
              <button
                style={{ ...btnBase, background: DARK.accent, color: "#fff", padding: "8px 16px" }}
                onClick={() => handleConnect(name)}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTaxes = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Taxes & Compliance</h3>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <label style={labelStyle}>
          Tax Rate (%)
          <input style={inputStyle} type="number" value={formValues.taxRate} onChange={(e) => updateField("taxRate", e.target.value)} />
        </label>
        <label style={labelStyle}>
          Invoice Prefix
          <input style={inputStyle} value={formValues.invoicePrefix} onChange={(e) => updateField("invoicePrefix", e.target.value)} />
        </label>
      </div>

      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: toggles.autoInvoice ? DARK.greenBg : DARK.surfaceAlt,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={20} style={{ color: toggles.autoInvoice ? DARK.green : DARK.textMuted }} />
          </div>
          <div>
            <div style={{ color: DARK.text, fontSize: 13, fontWeight: 600 }}>Auto-Invoice Generation</div>
            <div style={{ color: DARK.textMuted, fontSize: 12 }}>Automatically generate invoices for completed rides</div>
          </div>
        </div>
        <button onClick={() => toggle("autoInvoice")} style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
          background: toggles.autoInvoice ? DARK.green : DARK.surfaceAlt, transition: "background 0.2s",
        }}>
          <span style={{
            position: "absolute", top: 3, left: toggles.autoInvoice ? 23 : 3,
            width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
          }} />
        </button>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Integrations</h3>
      {[
        { name: "Google Maps API", desc: "Routing, geocoding, and distance matrix", connected: true },
        { name: "SMS Gateway", desc: "Transactional SMS provider", connected: false },
        { name: "Payment Gateway", desc: "Primary payment processor", connected: true },
      ].map(({ name, desc, connected }) => (
        <div key={name} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: connected ? DARK.greenBg : DARK.surfaceAlt,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plug size={20} style={{ color: connected ? DARK.green : DARK.textMuted }} />
            </div>
            <div>
              <div style={{ color: DARK.text, fontSize: 14, fontWeight: 600 }}>{name}</div>
              <div style={{ color: DARK.textMuted, fontSize: 12 }}>{desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {connected && (
              <span style={{ ...btnBase, background: DARK.greenBg, color: DARK.green, fontSize: 11, padding: "6px 12px" }}>
                <Check size={13} /> Connected
              </span>
            )}
            {!connected && (
              <button style={{ ...btnBase, background: DARK.accent, color: "#fff", padding: "8px 16px" }} onClick={() => handleConnect(name)}>
                Connect
              </button>
            )}
            <button style={{ ...btnBase, background: DARK.surfaceAlt, color: DARK.textMuted, padding: "6px 10px" }} title="Platform Settings">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAudit = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: DARK.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Audit Logs</h3>
        <button style={{ ...btnBase, background: DARK.accent, color: "#fff" }} onClick={handleExportLogs}>
          <Download size={15} /> Export
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Action", "User", "Time", "Detail"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: `1px solid ${DARK.border}`, color: DARK.textMuted, fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activityLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "16px 14px", color: DARK.textMuted }}>
                  No audit activity yet. Admin actions will appear here.
                </td>
              </tr>
            ) : (
              activityLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${DARK.border}` }}>
                  <td style={{ padding: "10px 14px", color: DARK.text }}>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: log.action.includes("update") || log.action.includes("change") ? DARK.yellowBg : log.action.includes("create") ? DARK.greenBg : DARK.blueBg,
                      color: log.action.includes("update") || log.action.includes("change") ? DARK.yellow : log.action.includes("create") ? DARK.green : DARK.blue,
                    }}>{log.action}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: DARK.textMuted }}>{log.user}</td>
                  <td style={{ padding: "10px 14px", color: DARK.textMuted }}>{log.time}</td>
                  <td style={{ padding: "10px 14px", color: DARK.text }}>{log.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const sectionContent: Record<SectionKey, () => React.ReactNode> = {
    general: renderGeneral,
    company: renderCompany,
    security: renderSecurity,
    notifications: renderNotifications,
    payment: renderPayment,
    taxes: renderTaxes,
    integrations: renderIntegrations,
    audit: renderAudit,
  };

  return (
    <div className="exact-admin-screen" style={{ display: "flex", flexDirection: "column", gap: 16, color: DARK.text, fontFamily: "inherit" }}>
      <AdminPageHeader
        title="Settings"
        subtitle="Company, security, payments, and Ghana ops preferences."
      />
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 20, minHeight: "100%" }}>
      {/* Left Sidebar */}
      <div style={{
        width: isMobile ? "100%" : 240, flexShrink: 0, background: DARK.surface, borderRadius: 14,
        border: `1px solid ${DARK.border}`, padding: 8, display: "flex", flexDirection: isMobile ? "row" : "column",
        flexWrap: isMobile ? "wrap" : undefined, overflowX: isMobile ? "auto" : undefined, gap: 4,
      }}>
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const active = activeSection === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? DARK.yellow : "transparent",
                color: active ? "#0b0f19" : DARK.textMuted,
                transition: "all 0.15s", textAlign: "left", width: "100%",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = DARK.navHover); }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = "transparent"); }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <article className="admin-reference-card" style={cardStyle}>
          {sectionContent[activeSection]()}
        </article>
        <div className="admin-screen-toolbar" style={{ gap: isMobile ? 8 : 12 }}>
          <button
            type="button"
            className="admin-btn-primary"
            style={{ ...btnBase, background: DARK.yellow, color: "#0b0f19", padding: "11px 24px" }}
            onClick={handleSave}
          >
            <Save size={16} /> Save Changes
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            style={{ ...btnBase, background: DARK.surfaceAlt, color: DARK.textMuted, border: `1px solid ${DARK.border}`, padding: "11px 24px" }}
            onClick={handleReset}
          >
            <RotateCcw size={16} /> Reset to Default
          </button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: isMobile ? "100%" : 260, flexShrink: 0, display: isMobile ? "none" : "flex", flexDirection: "column", gap: 16 }}>
        {/* Platform Info */}
        <article className="admin-reference-card" style={{ ...cardStyle }}>
          <h4 style={{ color: DARK.text, fontSize: 13, fontWeight: 700, margin: "0 0 14px" }}>Platform Info</h4>
          {[
            { label: "Currency", value: adminCurrency },
            { label: "Active Zones", value: `${zones.filter((z) => z.isActive).length} / ${zones.length}` },
            { label: "Admins", value: `${adminAccounts.length}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${DARK.border}` }}>
              <span style={{ color: DARK.textMuted, fontSize: 12 }}>{label}</span>
              <span style={{ color: DARK.text, fontSize: 12, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </article>

        {/* Live modules */}
        <article className="admin-reference-card" style={{ ...cardStyle }}>
          <h4 style={{ color: DARK.text, fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>
            <Key size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            Enabled modules
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(modules.length ? modules : ["No modules listed"]).slice(0, 8).map((mod) => (
              <div key={mod} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: DARK.textMuted, fontSize: 12 }}>{mod}</span>
                <span style={{ color: DARK.green, fontSize: 12, fontWeight: 600 }}>On</span>
              </div>
            ))}
          </div>
        </article>

        {/* Danger Zone */}
        <article
          className="admin-reference-card"
          style={{
            ...cardStyle, background: DARK.dangerZone, borderColor: DARK.dangerBorder,
          }}
        >
          <h4 style={{ color: DARK.red, fontSize: 13, fontWeight: 700, margin: "0 0 12px" }}>
            <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            Danger Zone
          </h4>
          <button
            type="button"
            style={{ ...btnBase, background: DARK.red, color: "#fff", width: "100%", justifyContent: "center", padding: "9px 0" }}
            onClick={() => addToast("Factory reset is disabled — no destructive wipe API in this console", "warning")}
          >
            <Trash2 size={14} /> Factory Reset
          </button>
          <p style={{ color: DARK.textMuted, fontSize: 11, margin: "8px 0 0", lineHeight: 1.4 }}>
            This action is irreversible and will delete all platform data.
          </p>
        </article>
      </div>
      </div>
    </div>
  );
}
