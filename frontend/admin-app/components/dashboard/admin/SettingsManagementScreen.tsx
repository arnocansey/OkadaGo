"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  Globe,
  KeyRound,
  Laptop,
  LogOut,
  Mail,
  Phone,
  Plug,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Smartphone,
  Users,
  Wrench
} from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { ConfirmDialog } from "./ConfirmDialog";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SettingsManagementScreenProps = {
  adminCurrency: string;
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
  token?: string | null;
};

type SettingsTab =
  | "general"
  | "company"
  | "security"
  | "notifications"
  | "payments"
  | "integrations"
  | "taxes";

/* ── Tab Config ────────────────────────────────────────────────────────────── */

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Globe }> = [
  { id: "general", label: "General", icon: Globe },
  { id: "company", label: "Company", icon: Building2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "taxes", label: "Taxes", icon: FileText }
];

/* ── Component ────────────────────────────────────────────────────────────── */

export function SettingsManagementScreen({
  adminCurrency,
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false,
  token
}: SettingsManagementScreenProps) {
  const { addToast } = useAdminToast();
  const { session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // ── General Settings State ──
  const [generalForm, setGeneralForm] = useState({
    platformName: "OkadaGo",
    currency: adminCurrency,
    timezone: "Africa/Accra",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    distanceUnit: "km",
    language: "en"
  });
  const [toggles, setToggles] = useState({
    maintenanceMode: false,
    debugMode: false
  });
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !platformSettings || Object.keys(platformSettings).length === 0) return;
    hydratedRef.current = true;
    setGeneralForm((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
        const value = platformSettings[key];
        if (typeof value === "string") next[key] = value;
        if (typeof value === "number") next[key] = String(value);
      }
      return next;
    });
    setToggles((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
        const value = platformSettings[key];
        if (typeof value === "boolean") next[key] = value;
      }
      return next;
    });
  }, [platformSettings]);

  function handleSave() {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings({ ...platformSettings, ...generalForm, ...toggles });
  }

  function handleReset() {
    if (platformSettings && Object.keys(platformSettings).length > 0) {
      hydratedRef.current = false;
      setGeneralForm({
        platformName: typeof platformSettings.platformName === "string" ? platformSettings.platformName : "OkadaGo",
        currency: typeof platformSettings.currency === "string" ? platformSettings.currency : adminCurrency,
        timezone: typeof platformSettings.timezone === "string" ? platformSettings.timezone : "Africa/Accra",
        dateFormat: typeof platformSettings.dateFormat === "string" ? platformSettings.dateFormat : "DD/MM/YYYY",
        timeFormat: typeof platformSettings.timeFormat === "string" ? platformSettings.timeFormat : "12h",
        distanceUnit: typeof platformSettings.distanceUnit === "string" ? platformSettings.distanceUnit : "km",
        language: typeof platformSettings.language === "string" ? platformSettings.language : "en"
      });
      setToggles({
        maintenanceMode: platformSettings.maintenanceMode === true,
        debugMode: platformSettings.debugMode === true
      });
      hydratedRef.current = true;
      addToast("Reverted to last saved values", "info");
    }
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="form" kpis={0} rows={8} />;
  }

  return (
    <div className="mgmt-settings">
      <AdminPageHeader
        title="Settings"
        subtitle="Manage platform configuration, company profile, security, and integrations."
      />

      {/* ── Tabs ── */}
      <div className="mgmt-settings-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`mgmt-settings-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="mgmt-settings-content">
        {activeTab === "general" && (
          <GeneralTab
            form={generalForm}
            toggles={toggles}
            setForm={setGeneralForm}
            setToggles={setToggles}
            onSave={handleSave}
            onReset={handleReset}
            saving={settingsSaving}
          />
        )}
        {activeTab === "company" && (
          <CompanyTab platformSettings={platformSettings} onSave={onSaveSettings} saving={settingsSaving} token={token} />
        )}
        {activeTab === "security" && (
          <SecurityTab token={token} />
        )}
        {activeTab === "notifications" && (
          <NotificationsTab platformSettings={platformSettings} onSave={onSaveSettings} saving={settingsSaving} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab adminCurrency={adminCurrency} platformSettings={platformSettings} onSave={onSaveSettings} saving={settingsSaving} token={token} />
        )}
        {activeTab === "integrations" && (
          <IntegrationsTab platformSettings={platformSettings} />
        )}
        {activeTab === "taxes" && (
          <TaxesTab platformSettings={platformSettings} onSave={onSaveSettings} saving={settingsSaving} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GENERAL TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function GeneralTab({
  form,
  toggles,
  setForm,
  setToggles,
  onSave,
  onReset,
  saving
}: {
  form: { platformName: string; currency: string; timezone: string; dateFormat: string; timeFormat: string; distanceUnit: string; language: string };
  toggles: { maintenanceMode: boolean; debugMode: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ platformName: string; currency: string; timezone: string; dateFormat: string; timeFormat: string; distanceUnit: string; language: string }>>;
  setToggles: React.Dispatch<React.SetStateAction<{ maintenanceMode: boolean; debugMode: boolean }>>;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
}) {
  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Globe size={15} /> Platform Defaults</h3>
        <div className="mgmt-settings-field-grid">
          <label className="mgmt-settings-field">
            <span>Platform Name</span>
            <input value={form.platformName} onChange={(e) => setForm((p) => ({ ...p, platformName: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Currency</span>
            <input value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Timezone</span>
            <select value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <label className="mgmt-settings-field">
            <span>Date Format</span>
            <select value={form.dateFormat} onChange={(e) => setForm((p) => ({ ...p, dateFormat: e.target.value }))}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </label>
          <label className="mgmt-settings-field">
            <span>Time Format</span>
            <select value={form.timeFormat} onChange={(e) => setForm((p) => ({ ...p, timeFormat: e.target.value }))}>
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </label>
          <label className="mgmt-settings-field">
            <span>Distance Unit</span>
            <select value={form.distanceUnit} onChange={(e) => setForm((p) => ({ ...p, distanceUnit: e.target.value }))}>
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </select>
          </label>
          <label className="mgmt-settings-field">
            <span>Language</span>
            <select value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}>
              <option value="en">English</option>
              <option value="tw">Twi</option>
              <option value="ha">Hausa</option>
              <option value="yo">Yoruba</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Wrench size={15} /> System Toggles</h3>
        <div className="mgmt-settings-toggles">
          {Object.entries(toggles).map(([key, value]) => (
            <label key={key} className="mgmt-settings-toggle-row">
              <span className="mgmt-settings-toggle-label">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
              <button
                type="button"
                className={`mgmt-settings-toggle${value ? " on" : ""}`}
                onClick={() => setToggles((p) => ({ ...p, [key]: !value }))}
              >
                <span className="mgmt-settings-toggle-thumb" />
              </button>
            </label>
          ))}
        </div>
      </div>

      <div className="mgmt-settings-actions">
        <button type="button" className="mgmt-settings-btn ghost" onClick={onReset}><RotateCcw size={13} /> Reset</button>
        <button type="button" className="mgmt-settings-btn primary" disabled={saving} onClick={onSave}><Save size={13} /> {saving ? "Saving…" : "Save Changes"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPANY TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function CompanyTab({
  platformSettings,
  onSave,
  saving,
  token
}: {
  platformSettings?: Record<string, unknown>;
  onSave?: (s: Record<string, unknown>) => void;
  saving: boolean;
  token?: string | null;
}) {
  const { addToast } = useAdminToast();
  const [form, setForm] = useState({
    companyName: typeof platformSettings?.companyName === "string" ? platformSettings.companyName : "OkadaGo",
    companyRegNumber: typeof platformSettings?.companyRegNumber === "string" ? platformSettings.companyRegNumber : "",
    companyEmail: typeof platformSettings?.companyEmail === "string" ? platformSettings.companyEmail : "",
    companyPhone: typeof platformSettings?.companyPhone === "string" ? platformSettings.companyPhone : "",
    companyAddress: typeof platformSettings?.companyAddress === "string" ? platformSettings.companyAddress : "",
    companyCity: typeof platformSettings?.companyCity === "string" ? platformSettings.companyCity : "Accra",
    companyCountry: typeof platformSettings?.companyCountry === "string" ? platformSettings.companyCountry : "Ghana"
  });

  function handleSave() {
    if (!onSave) return;
    onSave({ ...platformSettings, ...form });
    addToast("Company profile saved", "success");
  }

  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Building2 size={15} /> Company Information</h3>
        <div className="mgmt-settings-field-grid">
          <label className="mgmt-settings-field">
            <span>Company Name</span>
            <input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Registration Number</span>
            <input value={form.companyRegNumber} onChange={(e) => setForm((p) => ({ ...p, companyRegNumber: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Email</span>
            <input type="email" value={form.companyEmail} onChange={(e) => setForm((p) => ({ ...p, companyEmail: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Phone</span>
            <input value={form.companyPhone} onChange={(e) => setForm((p) => ({ ...p, companyPhone: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field full">
            <span>Address</span>
            <input value={form.companyAddress} onChange={(e) => setForm((p) => ({ ...p, companyAddress: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>City</span>
            <input value={form.companyCity} onChange={(e) => setForm((p) => ({ ...p, companyCity: e.target.value }))} />
          </label>
          <label className="mgmt-settings-field">
            <span>Country</span>
            <input value={form.companyCountry} onChange={(e) => setForm((p) => ({ ...p, companyCountry: e.target.value }))} />
          </label>
        </div>
      </div>
      <div className="mgmt-settings-actions">
        <button type="button" className="mgmt-settings-btn primary" disabled={saving} onClick={handleSave}><Save size={13} /> {saving ? "Saving…" : "Save Company"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function SecurityTab({ token }: { token?: string | null }) {
  const { addToast } = useAdminToast();
  const [sessions, setSessions] = useState<Array<{ id: string; device: string; lastActive: string; isCurrent: boolean }>>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [confirmRevoke, setConfirmRevoke] = useState<{ id: string; label: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    requestJson<{ sessions: Array<{ id: string; device: string; lastActive: string; isCurrent: boolean }> }>("/admin/security/sessions", { token })
      .then((data) => { if (!cancelled) setSessions(data.sessions ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSessions(false); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Shield size={15} /> Active Sessions</h3>
        {loadingSessions ? (
          <div className="mgmt-settings-empty">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="mgmt-settings-empty">No active sessions found.</div>
        ) : (
          <div className="mgmt-settings-sessions">
            {sessions.map((s) => (
              <div key={s.id} className={`mgmt-settings-session${s.isCurrent ? " current" : ""}`}>
                <div className="mgmt-settings-session-icon">{s.isCurrent ? <Laptop size={14} /> : <Smartphone size={14} />}</div>
                <div className="mgmt-settings-session-info">
                  <strong>{s.device}</strong>
                  <span>{s.lastActive}{s.isCurrent ? " (Current)" : ""}</span>
                </div>
                {!s.isCurrent && (
                  <button type="button" className="mgmt-settings-btn ghost small" onClick={() => setConfirmRevoke({ id: s.id, label: s.device || s.id.slice(0, 8) })}>
                    <LogOut size={12} /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><KeyRound size={15} /> Password</h3>
        <p className="mgmt-settings-hint">Contact your system administrator to change your password.</p>
      </div>

      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke Session"
        message={`Are you sure you want to revoke this session (${confirmRevoke?.label})? The user will be signed out immediately.`}
        confirmLabel="Revoke"
        variant="danger"
        onConfirm={async () => {
          if (!confirmRevoke || !token) { setConfirmRevoke(null); return; }
          try {
            await requestJson(`/auth/admin/sessions/${confirmRevoke.id}/revoke`, { method: "POST", token });
            setSessions((prev) => prev.filter((sess) => sess.id !== confirmRevoke.id));
            addToast("Session revoked", "success");
          } catch (err) {
            addToast((err as Error).message || "Could not revoke session", "error");
          }
          setConfirmRevoke(null);
        }}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function NotificationsTab({
  platformSettings,
  onSave,
  saving
}: {
  platformSettings?: Record<string, unknown>;
  onSave?: (s: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const { addToast } = useAdminToast();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  function handleSave() {
    if (!onSave) return;
    onSave({ ...platformSettings, emailNotifications: emailNotifs, smsNotifications: smsNotifs, pushNotifications: pushNotifs });
    addToast("Notification settings saved", "success");
  }

  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Bell size={15} /> Delivery Channels</h3>
        <div className="mgmt-settings-toggles">
          <label className="mgmt-settings-toggle-row">
            <span className="mgmt-settings-toggle-label"><Mail size={13} /> Email Notifications</span>
            <button type="button" className={`mgmt-settings-toggle${emailNotifs ? " on" : ""}`} onClick={() => setEmailNotifs(!emailNotifs)}>
              <span className="mgmt-settings-toggle-thumb" />
            </button>
          </label>
          <label className="mgmt-settings-toggle-row">
            <span className="mgmt-settings-toggle-label"><Phone size={13} /> SMS Notifications</span>
            <button type="button" className={`mgmt-settings-toggle${smsNotifs ? " on" : ""}`} onClick={() => setSmsNotifs(!smsNotifs)}>
              <span className="mgmt-settings-toggle-thumb" />
            </button>
          </label>
          <label className="mgmt-settings-toggle-row">
            <span className="mgmt-settings-toggle-label"><Smartphone size={13} /> Push Notifications</span>
            <button type="button" className={`mgmt-settings-toggle${pushNotifs ? " on" : ""}`} onClick={() => setPushNotifs(!pushNotifs)}>
              <span className="mgmt-settings-toggle-thumb" />
            </button>
          </label>
        </div>
      </div>
      <div className="mgmt-settings-actions">
        <button type="button" className="mgmt-settings-btn primary" disabled={saving} onClick={handleSave}><Save size={13} /> {saving ? "Saving…" : "Save Notifications"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function PaymentsTab({
  adminCurrency,
  platformSettings,
  onSave,
  saving,
  token
}: {
  adminCurrency: string;
  platformSettings?: Record<string, unknown>;
  onSave?: (s: Record<string, unknown>) => void;
  saving: boolean;
  token?: string | null;
}) {
  const [gateway, setGateway] = useState(typeof platformSettings?.paymentGateway === "string" ? platformSettings.paymentGateway as string : "momo");
  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><CreditCard size={15} /> Payment Configuration</h3>
        <div className="mgmt-settings-field-grid">
          <label className="mgmt-settings-field">
            <span>Default Currency</span>
            <input value={adminCurrency} disabled />
          </label>
          <label className="mgmt-settings-field">
            <span>Payment Gateway</span>
            <select value={gateway} onChange={(e) => setGateway(e.target.value)}>
              <option value="momo">Mobile Money (MoMo)</option>
              <option value="card">Card Payments</option>
              <option value="both">Both</option>
            </select>
          </label>
        </div>
        <p className="mgmt-settings-hint">Payment methods are managed through the payment gateway settings.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTEGRATIONS TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function IntegrationsTab({ platformSettings }: { platformSettings?: Record<string, unknown> }) {
  const integrations = [
    { name: "Google Maps", key: "googleMaps", desc: "Route planning & geocoding" },
    { name: "Twilio", key: "twilio", desc: "SMS notifications" },
    { name: "SendGrid", key: "sendgrid", desc: "Email delivery" },
    { name: "Paystack", key: "paystack", desc: "Card payments" },
    { name: "MoMo", key: "momo", desc: "Mobile money payments" },
  ];

  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><Plug size={15} /> Third-Party Integrations</h3>
        <p className="mgmt-settings-hint">Integration status is derived from platform configuration. Toggle keys in Settings to enable or disable.</p>
        <div className="mgmt-settings-integrations">
          {integrations.map((intg) => {
            const connected = platformSettings?.[`${intg.key}Enabled`] === true || platformSettings?.[intg.key] != null;
            return (
              <div key={intg.name} className="mgmt-settings-integration">
                <div className="mgmt-settings-integration-info">
                  <strong>{intg.name}</strong>
                  <span>{intg.desc}</span>
                </div>
                <span className={`mgmt-settings-badge ${connected ? "success" : "neutral"}`}>
                  {connected ? "Configured" : "Not Configured"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAXES TAB
   ═══════════════════════════════════════════════════════════════════════════ */

function TaxesTab({
  platformSettings,
  onSave,
  saving
}: {
  platformSettings?: Record<string, unknown>;
  onSave?: (s: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const { addToast } = useAdminToast();
  const [taxRate, setTaxRate] = useState(typeof platformSettings?.taxRate === "number" ? String(platformSettings.taxRate) : "15");
  const [taxEnabled, setTaxEnabled] = useState(typeof platformSettings?.taxEnabled === "boolean" ? platformSettings.taxEnabled : true);

  function handleSave() {
    if (!onSave) return;
    onSave({ ...platformSettings, taxRate: parseFloat(taxRate) || 15, taxEnabled });
    addToast("Tax settings saved", "success");
  }

  return (
    <div className="mgmt-settings-grid">
      <div className="mgmt-settings-card">
        <h3 className="mgmt-settings-card-title"><FileText size={15} /> Tax Configuration</h3>
        <div className="mgmt-settings-toggles">
          <label className="mgmt-settings-toggle-row">
            <span className="mgmt-settings-toggle-label">Enable Tax Calculation</span>
            <button type="button" className={`mgmt-settings-toggle${taxEnabled ? " on" : ""}`} onClick={() => setTaxEnabled(!taxEnabled)}>
              <span className="mgmt-settings-toggle-thumb" />
            </button>
          </label>
        </div>
        <div className="mgmt-settings-field-grid" style={{ marginTop: 16 }}>
          <label className="mgmt-settings-field">
            <span>Tax Rate (%)</span>
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} disabled={!taxEnabled} />
          </label>
        </div>
        <p className="mgmt-settings-hint">Ghana VAT rate is typically 15%. Adjust as needed for your jurisdiction.</p>
      </div>
      <div className="mgmt-settings-actions">
        <button type="button" className="mgmt-settings-btn primary" disabled={saving} onClick={handleSave}><Save size={13} /> {saving ? "Saving…" : "Save Tax Settings"}</button>
      </div>
    </div>
  );
}
