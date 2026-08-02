"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Download, FileText, Save } from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { SettingsCard, SettingsChrome } from "./ui/SettingsChrome";

export type CompanyProfileScreenProps = {
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
};

type CompanyTab =
  | "info"
  | "business"
  | "banking"
  | "documents"
  | "subscription"
  | "branding";

const TABS: Array<{ id: CompanyTab; label: string }> = [
  { id: "info", label: "Company Information" },
  { id: "business", label: "Business Details" },
  { id: "banking", label: "Banking Information" },
  { id: "documents", label: "Documents" },
  { id: "subscription", label: "Subscription & Plan" },
  { id: "branding", label: "Branding" }
];

const DEFAULTS: Record<string, string> = {
  companyName: "OkadaGo",
  companyRegNumber: "CS123456789",
  shortName: "OkadaGo",
  tin: "C0001234567",
  email: "admin@okadago.com",
  industry: "Transportation & Logistics",
  phone: "+233 30 123 4567",
  yearEstablished: "2018",
  website: "https://okadago.com",
  companySize: "51-200 employees",
  country: "Ghana",
  city: "Accra",
  streetAddress: "Independence Avenue",
  addressLine2: "",
  region: "Greater Accra",
  postalCode: "GA-123-4567",
  description:
    "OkadaGo is a mobility and delivery platform connecting riders and passengers across Accra and major Ghanaian cities."
};

export function CompanyProfileScreen({
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false
}: CompanyProfileScreenProps) {
  const { addToast } = useAdminToast();
  const [tab, setTab] = useState<CompanyTab>("info");
  const [form, setForm] = useState(DEFAULTS);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !platformSettings) return;
    const next = { ...DEFAULTS };
    for (const key of Object.keys(next)) {
      const value = platformSettings[key];
      if (typeof value === "string") next[key] = value;
    }
    setForm(next);
    hydratedRef.current = true;
  }, [platformSettings]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings({ ...platformSettings, ...form });
  }

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={0} rows={6} cols={3} />;
  }

  return (
    <SettingsChrome
      title="Company Profile"
      subtitle="Manage your company information, contact details, and business settings."
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Settings", href: "/settings" },
        { label: "Company Profile" }
      ]}
      tabs={TABS}
      activeTab={tab}
      onTabChange={(id) => setTab(id as CompanyTab)}
      actions={
        <button type="button" className="settings-btn settings-btn--primary" disabled={settingsSaving} onClick={save}>
          <Save size={14} /> Save Changes
        </button>
      }
    >
      {tab === "info" ? (
        <div className="settings-layout">
          <div className="settings-stack">
            <SettingsCard title="Company Information">
              <div className="settings-grid-2">
                <label className="settings-field">
                  Company Name
                  <input className="settings-input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
                </label>
                <label className="settings-field">
                  Company Registration Number
                  <input className="settings-input" value={form.companyRegNumber} onChange={(e) => update("companyRegNumber", e.target.value)} />
                </label>
                <label className="settings-field">
                  Short Name
                  <input className="settings-input" value={form.shortName} onChange={(e) => update("shortName", e.target.value)} />
                </label>
                <label className="settings-field">
                  Tax Identification Number (TIN)
                  <input className="settings-input" value={form.tin} onChange={(e) => update("tin", e.target.value)} />
                </label>
                <label className="settings-field">
                  Company Email
                  <input className="settings-input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </label>
                <label className="settings-field">
                  Industry
                  <select className="settings-select" value={form.industry} onChange={(e) => update("industry", e.target.value)}>
                    <option>Transportation & Logistics</option>
                    <option>Technology</option>
                    <option>Marketplace</option>
                  </select>
                </label>
                <label className="settings-field">
                  Phone Number
                  <input className="settings-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </label>
                <label className="settings-field">
                  Year Established
                  <input className="settings-input" value={form.yearEstablished} onChange={(e) => update("yearEstablished", e.target.value)} />
                </label>
                <label className="settings-field">
                  Website
                  <input className="settings-input" value={form.website} onChange={(e) => update("website", e.target.value)} />
                </label>
                <label className="settings-field">
                  Company Size
                  <select className="settings-select" value={form.companySize} onChange={(e) => update("companySize", e.target.value)}>
                    <option>1-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="settings-field">Company Logo</div>
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  style={{ width: 140, height: 140, flexDirection: "column", marginTop: 8 }}
                  onClick={() => addToast("Logo upload is not connected yet", "info")}
                >
                  <Building2 size={28} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: 11 }}>PNG, JPG up to 2MB</span>
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Company Address">
              <div className="settings-grid-2">
                <label className="settings-field">
                  Country
                  <select className="settings-select" value={form.country} onChange={(e) => update("country", e.target.value)}>
                    <option>Ghana</option>
                    <option>Nigeria</option>
                  </select>
                </label>
                <label className="settings-field">
                  City
                  <input className="settings-input" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </label>
                <label className="settings-field">
                  Street Address
                  <input className="settings-input" value={form.streetAddress} onChange={(e) => update("streetAddress", e.target.value)} />
                </label>
                <label className="settings-field">
                  Address Line 2 (Optional)
                  <input className="settings-input" value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} />
                </label>
                <label className="settings-field">
                  Region
                  <select className="settings-select" value={form.region} onChange={(e) => update("region", e.target.value)}>
                    <option>Greater Accra</option>
                    <option>Ashanti</option>
                    <option>Western</option>
                  </select>
                </label>
                <label className="settings-field">
                  Postal Code
                  <input className="settings-input" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                </label>
              </div>
            </SettingsCard>

            <SettingsCard title="Company Description">
              <textarea
                className="settings-textarea"
                value={form.description}
                maxLength={500}
                onChange={(e) => update("description", e.target.value)}
              />
              <div className="settings-row-meta" style={{ marginTop: 8 }}>
                {form.description.length}/500 characters
              </div>
            </SettingsCard>
          </div>

          <div className="settings-stack">
            <SettingsCard title="Company Overview">
              <div className="settings-row"><span className="settings-row-meta">Member Since</span><strong>2018</strong></div>
              <div className="settings-row">
                <span className="settings-row-meta">Current Plan</span>
                <span className="settings-badge settings-badge--success">Enterprise Plan</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Plan Status</span>
                <span className="settings-badge settings-badge--success">Active</span>
              </div>
              <div className="settings-row"><span className="settings-row-meta">Staff Accounts</span><strong>128</strong></div>
              <div className="settings-row"><span className="settings-row-meta">Total Riders</span><strong>4,560</strong></div>
              <div className="settings-row"><span className="settings-row-meta">Total Customers</span><strong>12,340</strong></div>
              <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("subscription")}>
                View Plan Details
              </button>
            </SettingsCard>

            <SettingsCard title="Primary Contact">
              <div className="settings-row-label">Admin</div>
              <div className="settings-row-meta">Super Admin</div>
              <div className="settings-row-meta" style={{ marginTop: 8 }}>{form.email}</div>
              <div className="settings-row-meta">{form.phone}</div>
            </SettingsCard>

            <SettingsCard title="Documents">
              {[
                ["Business Registration", "PDF · May 10, 2023"],
                ["TIN Certificate", "PDF · May 10, 2023"],
                ["Company Incorporation", "PDF · May 10, 2023"]
              ].map(([name, meta]) => (
                <div key={name} className="settings-row">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <FileText size={16} color="var(--accent-yellow)" />
                    <div>
                      <div className="settings-row-label">{name}</div>
                      <div className="settings-row-meta">{meta}</div>
                    </div>
                  </div>
                  <Download size={14} color="var(--text-muted)" />
                </div>
              ))}
              <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("documents")}>
                View All Documents
              </button>
            </SettingsCard>
          </div>
        </div>
      ) : (
        <SettingsCard title={TABS.find((t) => t.id === tab)?.label}>
          <p className="settings-row-meta" style={{ margin: 0 }}>
            This section is ready for ops data. Use Company Information for the fields that persist today via platform settings.
          </p>
          <button type="button" className="settings-btn settings-btn--primary" style={{ marginTop: 16 }} onClick={() => setTab("info")}>
            Back to Company Information
          </button>
        </SettingsCard>
      )}
    </SettingsChrome>
  );
}
