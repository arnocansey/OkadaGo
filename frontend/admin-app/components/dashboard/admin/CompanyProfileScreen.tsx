"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Download, FileText, Save } from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { SettingsCard, SettingsChrome } from "./ui/SettingsChrome";

export type CompanyProfileScreenProps = {
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
  token?: string | null;
  adminCount?: number;
  riderCount?: number;
  passengerCount?: number;
  memberSince?: string;
};

type CompanyTab =
  | "info"
  | "business"
  | "banking"
  | "documents"
  | "subscription"
  | "branding";

type CompanyDoc = {
  id: string;
  name: string;
  url: string;
  meta: string;
};

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
    "OkadaGo is a mobility and delivery platform connecting riders and passengers across Accra and major Ghanaian cities.",
  businessType: "Limited Liability Company",
  directors: "",
  vatNumber: "",
  bankName: "GCB Bank",
  bankAccountName: "OkadaGo Technologies",
  bankAccountNumber: "",
  bankBranch: "Accra Main",
  momoSettlement: "",
  planName: "Enterprise Plan",
  planStatus: "Active",
  brandPrimary: "#F5C518",
  brandSecondary: "#111827",
  supportEmail: "support@okadago.com",
  companyLogoUrl: ""
};

function parseDocs(settings?: Record<string, unknown>): CompanyDoc[] {
  const raw = settings?.companyDocuments;
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is CompanyDoc => {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, unknown>;
    return typeof item.id === "string" && typeof item.name === "string" && typeof item.url === "string";
  });
}

export function CompanyProfileScreen({
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false,
  token,
  adminCount = 0,
  riderCount = 0,
  passengerCount = 0,
  memberSince
}: CompanyProfileScreenProps) {
  const { addToast } = useAdminToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<CompanyTab>("info");
  const [form, setForm] = useState(DEFAULTS);
  const [docs, setDocs] = useState<CompanyDoc[]>([]);
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !platformSettings) return;
    const next = { ...DEFAULTS };
    for (const key of Object.keys(next)) {
      const value = platformSettings[key];
      if (typeof value === "string") next[key] = value;
    }
    setForm(next);
    setDocs(parseDocs(platformSettings));
    hydratedRef.current = true;
  }, [platformSettings]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save(extra: Record<string, unknown> = {}) {
    if (!onSaveSettings) {
      addToast("Settings persistence is unavailable", "error");
      return;
    }
    onSaveSettings({
      ...platformSettings,
      ...form,
      companyDocuments: docs,
      ...extra
    });
  }

  async function uploadImage(file: File, kind: "company_logo" | "company_document") {
    if (!token) {
      addToast("Sign in required to upload", "error");
      return null;
    }
    setUploading(true);
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const res = await requestJson<{ url: string }>("/admin/settings/upload-image", {
        method: "POST",
        token,
        body: JSON.stringify({ imageBase64, kind })
      });
      return res.url;
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Upload failed", "error");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoPick(file: File | null) {
    if (!file) return;
    const url = await uploadImage(file, "company_logo");
    if (!url) return;
    const next = { ...form, companyLogoUrl: url };
    setForm(next);
    save({ ...next, companyDocuments: docs });
  }

  async function handleDocPick(file: File | null) {
    if (!file) return;
    const name = docName.trim() || file.name;
    const url = await uploadImage(file, "company_document");
    if (!url) return;
    const nextDocs = [
      ...docs,
      {
        id: `doc_${Date.now().toString(36)}`,
        name,
        url,
        meta: `Uploaded · ${new Date().toLocaleDateString()}`
      }
    ];
    setDocs(nextDocs);
    setDocName("");
    save({ companyDocuments: nextDocs });
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
        <button type="button" className="settings-btn settings-btn--primary" disabled={settingsSaving} onClick={() => save()}>
          <Save size={14} /> Save Changes
        </button>
      }
    >
      {tab === "info" ? (
        <div className="settings-layout">
          <div className="settings-stack">
            <SettingsCard title="Company Information">
              <div className="settings-grid-2">
                {(
                  [
                    ["companyName", "Company Name"],
                    ["companyRegNumber", "Company Registration Number"],
                    ["shortName", "Short Name"],
                    ["tin", "Tax Identification Number (TIN)"],
                    ["email", "Company Email"],
                    ["phone", "Phone Number"],
                    ["website", "Website"],
                    ["yearEstablished", "Year Established"]
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="settings-field">
                    {label}
                    <input className="settings-input" value={form[key]} onChange={(e) => update(key, e.target.value)} />
                  </label>
                ))}
                <label className="settings-field">
                  Industry
                  <select className="settings-select" value={form.industry} onChange={(e) => update("industry", e.target.value)}>
                    <option>Transportation & Logistics</option>
                    <option>Technology</option>
                    <option>Marketplace</option>
                  </select>
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
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => void handleLogoPick(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  style={{ width: 140, height: 140, flexDirection: "column", marginTop: 8, overflow: "hidden" }}
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {form.companyLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.companyLogoUrl} alt="Company logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <Building2 size={28} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: 11 }}>{uploading ? "Uploading…" : "PNG, JPG up to 2MB"}</span>
                    </>
                  )}
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Company Address">
              <div className="settings-grid-2">
                {(
                  [
                    ["country", "Country"],
                    ["city", "City"],
                    ["streetAddress", "Street Address"],
                    ["addressLine2", "Address Line 2 (Optional)"],
                    ["region", "Region"],
                    ["postalCode", "Postal Code"]
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="settings-field">
                    {label}
                    <input className="settings-input" value={form[key]} onChange={(e) => update(key, e.target.value)} />
                  </label>
                ))}
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
              <div className="settings-row">
                <span className="settings-row-meta">Member Since</span>
                <strong>{memberSince || form.yearEstablished || "—"}</strong>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Current Plan</span>
                <span className="settings-badge settings-badge--success">{form.planName || "Enterprise Plan"}</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-meta">Plan Status</span>
                <span className="settings-badge settings-badge--success">{form.planStatus || "Active"}</span>
              </div>
              <div className="settings-row"><span className="settings-row-meta">Staff Accounts</span><strong>{adminCount}</strong></div>
              <div className="settings-row"><span className="settings-row-meta">Total Riders</span><strong>{riderCount.toLocaleString()}</strong></div>
              <div className="settings-row"><span className="settings-row-meta">Total Customers</span><strong>{passengerCount.toLocaleString()}</strong></div>
              <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("subscription")}>
                View Plan Details
              </button>
            </SettingsCard>

            <SettingsCard title="Primary Contact">
              <div className="settings-row-label">Admin</div>
              <div className="settings-row-meta">Company operations</div>
              <div className="settings-row-meta" style={{ marginTop: 8 }}>{form.email}</div>
              <div className="settings-row-meta">{form.phone}</div>
            </SettingsCard>

            <SettingsCard title="Documents">
              {docs.length === 0 ? (
                <p className="settings-row-meta" style={{ margin: 0 }}>No documents uploaded yet.</p>
              ) : (
                docs.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="settings-row">
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <FileText size={16} color="var(--accent-yellow)" />
                      <div>
                        <div className="settings-row-label">{doc.name}</div>
                        <div className="settings-row-meta">{doc.meta}</div>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="settings-btn settings-btn--ghost" aria-label={`Download ${doc.name}`}>
                      <Download size={14} />
                    </a>
                  </div>
                ))
              )}
              <button type="button" className="settings-btn settings-btn--link" onClick={() => setTab("documents")}>
                View All Documents
              </button>
            </SettingsCard>
          </div>
        </div>
      ) : null}

      {tab === "business" ? (
        <SettingsCard title="Business Details">
          <div className="settings-grid-2">
            <label className="settings-field">
              Business Type
              <input className="settings-input" value={form.businessType} onChange={(e) => update("businessType", e.target.value)} />
            </label>
            <label className="settings-field">
              VAT Number
              <input className="settings-input" value={form.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} />
            </label>
            <label className="settings-field" style={{ gridColumn: "1 / -1" }}>
              Directors / Beneficial owners
              <textarea className="settings-textarea" value={form.directors} onChange={(e) => update("directors", e.target.value)} />
            </label>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "banking" ? (
        <SettingsCard title="Banking Information">
          <div className="settings-grid-2">
            {(
              [
                ["bankName", "Bank name"],
                ["bankAccountName", "Account name"],
                ["bankAccountNumber", "Account number"],
                ["bankBranch", "Branch"],
                ["momoSettlement", "MoMo settlement number"]
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="settings-field">
                {label}
                <input className="settings-input" value={form[key]} onChange={(e) => update(key, e.target.value)} />
              </label>
            ))}
          </div>
        </SettingsCard>
      ) : null}

      {tab === "documents" ? (
        <SettingsCard title="Documents">
          <div className="settings-stack" style={{ gap: 12, marginBottom: 16 }}>
            {docs.map((doc) => (
              <div key={doc.id} className="settings-row" style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 12 }}>
                <div>
                  <div className="settings-row-label">{doc.name}</div>
                  <div className="settings-row-meta">{doc.meta}</div>
                </div>
                <a href={doc.url} target="_blank" rel="noreferrer" className="settings-btn settings-btn--ghost">
                  <Download size={14} /> Open
                </a>
              </div>
            ))}
          </div>
          <div className="settings-grid-2">
            <label className="settings-field">
              Document name
              <input className="settings-input" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Business Registration" />
            </label>
            <label className="settings-field">
              Upload file
              <input
                className="settings-input"
                type="file"
                accept="image/*,.pdf"
                disabled={uploading}
                onChange={(e) => void handleDocPick(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </SettingsCard>
      ) : null}

      {tab === "subscription" ? (
        <SettingsCard title="Subscription & Plan">
          <div className="settings-grid-2">
            <label className="settings-field">
              Plan name
              <input className="settings-input" value={form.planName} onChange={(e) => update("planName", e.target.value)} />
            </label>
            <label className="settings-field">
              Plan status
              <select className="settings-select" value={form.planStatus} onChange={(e) => update("planStatus", e.target.value)}>
                <option>Active</option>
                <option>Trial</option>
                <option>Past due</option>
              </select>
            </label>
          </div>
          <p className="settings-row-meta" style={{ marginTop: 12 }}>
            Plan fields are ops records in platform settings — not a live billing subscription.
          </p>
        </SettingsCard>
      ) : null}

      {tab === "branding" ? (
        <SettingsCard title="Branding">
          <div className="settings-grid-2">
            <label className="settings-field">
              Primary color
              <input className="settings-input" value={form.brandPrimary} onChange={(e) => update("brandPrimary", e.target.value)} />
            </label>
            <label className="settings-field">
              Secondary color
              <input className="settings-input" value={form.brandSecondary} onChange={(e) => update("brandSecondary", e.target.value)} />
            </label>
            <label className="settings-field">
              Support email
              <input className="settings-input" value={form.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} />
            </label>
          </div>
        </SettingsCard>
      ) : null}
    </SettingsChrome>
  );
}
