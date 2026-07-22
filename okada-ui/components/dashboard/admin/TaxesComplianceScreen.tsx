"use client";

import { FileText, Scale, Percent } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";

export type TaxesComplianceScreenProps = {
  dataLoading?: boolean;
};

const GHANA_RATES = [
  { label: "VAT (standard)", rate: "15%", note: "Ghana Revenue Authority reference" },
  { label: "NHIL", rate: "2.5%", note: "National Health Insurance Levy" },
  { label: "GETFund", rate: "2.5%", note: "Ghana Education Trust Fund" },
  { label: "COVID-19 Health Recovery Levy", rate: "1%", note: "Where applicable" },
  { label: "Corporate Income Tax", rate: "25%", note: "Standard CIT reference" },
  { label: "Withholding (services)", rate: "7.5% / 15%", note: "Depends on resident status" }
];

export function TaxesComplianceScreen({ dataLoading = false }: TaxesComplianceScreenProps) {
  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
        <EmptyCard title="Loading taxes & compliance…" body="" />
      </div>
    );
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Taxes & Compliance"
        subtitle="Ghana reference rates for ops planning. This screen is documentation only — no tax ledger API is wired yet."
      />

      <AdminKpiRow
        items={[
          { label: "Jurisdiction", value: "Ghana", hint: "GRA reference", icon: <Scale size={22} />, tone: "yellow" },
          { label: "VAT stack", value: "15%+", hint: "VAT + levies", icon: <Percent size={22} />, tone: "yellow" },
          { label: "Filing API", value: "Not connected", hint: "Honest status", icon: <FileText size={22} />, tone: "neutral" }
        ]}
      />

      <article className="admin-reference-card">
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
          body="Certificates, deadlines, and paid amounts stay off this console until a compliance API exists."
        />
      </article>
    </div>
  );
}
