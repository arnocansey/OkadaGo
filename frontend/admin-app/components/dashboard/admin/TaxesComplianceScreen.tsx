"use client";

import { useEffect, useState } from "react";
import { FileText, Scale, Percent, Building2 } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { useAdminToast } from "./AdminToast";

export type TaxesComplianceScreenProps = {
  dataLoading?: boolean;
  platformSettings?: Record<string, unknown>;
  onSaveSettings?: (settings: Record<string, unknown>) => void;
  settingsSaving?: boolean;
};

const GHANA_RATES = [
  { label: "VAT (standard)", rate: "15%", note: "Ghana Revenue Authority reference" },
  { label: "NHIL", rate: "2.5%", note: "National Health Insurance Levy" },
  { label: "GETFund", rate: "2.5%", note: "Ghana Education Trust Fund" },
  { label: "COVID-19 Health Recovery Levy", rate: "1%", note: "Where applicable" },
  { label: "Corporate Income Tax", rate: "25%", note: "Standard CIT reference" },
  { label: "Withholding (services)", rate: "7.5% / 15%", note: "Depends on resident status" }
];

const TAX_PROFILE_KEY = "okadago.admin.taxProfile";

type TaxProfile = {
  legalName: string;
  tin: string;
  vatId: string;
  filingContactEmail: string;
  notes: string;
};

const EMPTY_PROFILE: TaxProfile = {
  legalName: "",
  tin: "",
  vatId: "",
  filingContactEmail: "",
  notes: ""
};

function loadProfile(): TaxProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(TAX_PROFILE_KEY);
    if (!raw) return EMPTY_PROFILE;
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function TaxesComplianceScreen({
  dataLoading = false,
  platformSettings,
  onSaveSettings,
  settingsSaving = false
}: TaxesComplianceScreenProps) {
  const { addToast } = useAdminToast();
  const [profile, setProfile] = useState<TaxProfile>(EMPTY_PROFILE);

  useEffect(() => {
    const fromServer = platformSettings?.taxProfile;
    if (fromServer && typeof fromServer === "object") {
      setProfile({ ...EMPTY_PROFILE, ...(fromServer as TaxProfile) });
      return;
    }
    setProfile(loadProfile());
  }, [platformSettings]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="form" kpis={3} rows={5} />;
  }

  const saveProfile = () => {
    if (onSaveSettings) {
      onSaveSettings({ taxProfile: profile });
      // Keep a local fallback for offline reloads until the server round-trip finishes.
      window.localStorage.setItem(TAX_PROFILE_KEY, JSON.stringify(profile));
      return;
    }
    window.localStorage.setItem(TAX_PROFILE_KEY, JSON.stringify(profile));
    addToast("Tax profile saved locally on this browser — not filed with GRA", "success");
  };

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Taxes & Compliance"
        subtitle="Ghana tax reference and local company profile — GRA filing API is not connected."
      />

      <AdminKpiRow
        items={[
          { label: "Jurisdiction", value: "Ghana", hint: "GRA reference", icon: <Scale size={22} />, tone: "yellow" },
          { label: "VAT stack", value: "15%+", hint: "VAT + levies", icon: <Percent size={22} />, tone: "yellow" },
          { label: "Filing API", value: "Not connected", hint: "No live GRA sync", icon: <FileText size={22} />, tone: "neutral" }
        ]}
      />

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Company tax profile</h3>
            <p>
              {onSaveSettings
                ? "Saved to the server for all admins. Saving does not submit anything to GRA."
                : "Stored in this browser only for ops reference. Saving does not submit anything to GRA."}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            padding: "4px 0 16px"
          }}
        >
          {(
            [
              ["legalName", "Legal name"],
              ["tin", "TIN"],
              ["vatId", "VAT ID"],
              ["filingContactEmail", "Filing contact email"]
            ] as const
          ).map(([key, label]) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
              {label}
              <input
                className="admin-input-sm"
                value={profile[key]}
                onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
              />
            </label>
          ))}
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
          Internal notes
          <textarea
            value={profile.notes}
            onChange={(e) => setProfile((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
            style={{
              width: "100%",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              padding: 10,
              fontSize: 13,
              resize: "vertical"
            }}
            placeholder="Accountant contacts, filing calendar reminders, etc."
          />
        </label>
        <button type="button" className="admin-btn-primary" onClick={saveProfile} disabled={settingsSaving}>
          <Building2 size={15} /> {settingsSaving ? "Saving…" : onSaveSettings ? "Save tax profile" : "Save local tax profile"}
        </button>
      </article>

      <article className="admin-reference-card" style={{ marginTop: 20 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Reference tax rates</h3>
            <p>Published Ghana rates for product and finance alignment — not live GRA filings.</p>
          </div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tax / Levy</th>
                <th>Rate</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {GHANA_RATES.map((row) => (
                <tr key={row.label}>
                  <td><strong>{row.label}</strong></td>
                  <td>{row.rate}</td>
                  <td><small>{row.note}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="admin-reference-card" style={{ marginTop: 20 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Compliance filings</h3>
            <p>Connect a GRA / accounting integration before treating filings as live data.</p>
          </div>
        </div>
        <EmptyCard
          title="No filing system connected"
          body="Certificates, deadlines, and paid amounts stay off this console until a compliance API exists. Local tax profile above is ops notes only."
        />
      </article>
    </div>
  );
}
