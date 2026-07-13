"use client";

import { useState } from "react";
import { FileText, Calendar, Download, CheckCircle, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable, SkeletonDonut } from "./AdminSkeleton";

export type TaxesComplianceScreenProps = {
  dataLoading?: boolean;
};

const TABS = ["Overview", "Tax Information", "Tax Filings", "Compliance Requirements", "Certificates & Licenses"];

const TAX_OBLIGATIONS = [
  { taxType: "Corporate Income Tax (CIT)", taxId: "CIT1234567890", jurisdiction: "Ghana (GRA)", status: "Compliant", nextFilingDue: "June 30, 2024" },
  { taxType: "Value Added Tax (VAT)", taxId: "VAT0009876543", jurisdiction: "Ghana (GRA)", status: "Compliant", nextFilingDue: "June 15, 2024" },
  { taxType: "Withholding Tax", taxId: "WHT5678901234", jurisdiction: "Ghana (GRA)", status: "Compliant", nextFilingDue: "June 30, 2024" },
  { taxType: "Pay As You Earn (PAYE)", taxId: "PAYE2468013579", jurisdiction: "Ghana (GRA)", status: "Compliant", nextFilingDue: "June 30, 2024" },
];

const UPCOMING_DEADLINES = [
  { name: "VAT Return - May 2024", authority: "Ghana Revenue Authority (GRA)", daysLeft: 15, date: "Jun 15, 2024" },
  { name: "CIT Estimated Payment - Q2 2024", authority: "Ghana Revenue Authority (GRA)", daysLeft: 25, date: "Jun 30, 2024" },
  { name: "PAYE Submission - May 2024", authority: "Ghana Revenue Authority (GRA)", daysLeft: 25, date: "Jun 30, 2024" },
];

const COMPLIANCE_DOCS = [
  { name: "Tax Clearance Certificate", docId: "GRA-TCC-2024", validUntil: "Dec 31, 2024", status: "Valid" },
  { name: "VAT Certificate", docId: "GRA-VAT-CS-2024", validUntil: "Dec 31, 2024", status: "Valid" },
  { name: "Business Registration", docId: "BN-1234567890", validUntil: "Dec 31, 2024", status: "Valid" },
  { name: "SSNIT Compliance Certificate", docId: "SSNIT-CC-2024", validUntil: "Dec 31, 2024", status: "Valid" },
];

const RECENT_FILINGS = [
  { name: "VAT Return - April 2024", reference: "GRA-VAT-APR2024-001", status: "Filed", date: "May 15, 2024" },
  { name: "CIT Annual Return - 2023", reference: "GRA-CIT-2023-001", status: "Filed", date: "Apr 30, 2024" },
  { name: "PAYE Return - April 2024", reference: "GRA-PAYE-APR2024-001", status: "Filed", date: "May 10, 2024" },
];

const D = {
  bg: "#0b0f19",
  surface: "#111827",
  card: "#151c2c",
  border: "#1e293b",
  accent: "#f59e0b",
  accentDim: "rgba(245,158,11,0.12)",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  green: "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  red: "#ef4444",
  redDim: "rgba(239,68,68,0.12)",
};

export function TaxesComplianceScreen({ dataLoading = false }: TaxesComplianceScreenProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { isMobile, isTablet } = useBreakpoint();

  if (dataLoading) {
    return (
      <div style={{ padding: "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <SkeletonTable rows={4} cols={6} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", minHeight: "100vh", color: D.text }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Taxes &amp; Compliance</h1>
          <p style={{ fontSize: 14, color: D.textMuted, margin: "4px 0 0" }}>Manage your tax information, filings, and compliance requirements.</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: D.accent, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={16} /> Add Tax Information
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${D.border}`, overflowX: "auto" }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{ background: "none", border: "none", padding: "10px 0", fontSize: 13, fontWeight: i === activeTab ? 700 : 500, color: i === activeTab ? D.accent : D.textMuted, cursor: "pointer", borderBottom: i === activeTab ? `2px solid ${D.accent}` : "2px solid transparent", whiteSpace: "nowrap" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 340px", gap: 18 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Tax Status", value: "Compliant", color: D.green, sub: "All tax obligations are up to date." },
              { label: "Upcoming Deadlines", value: "2", color: D.accent, sub: "Next: June 15, 2024" },
              { label: "Total Taxes Paid (YTD)", value: "GHS 45,680.00", color: D.accent, sub: "As of May 31, 2024" },
              { label: "Outstanding Amount", value: "GHS 0.00", color: D.green, sub: "No outstanding tax liabilities" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 18 }}>
                <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}>{kpi.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: kpi.color, margin: "8px 0 4px" }}>{kpi.value}</p>
                <p style={{ fontSize: 11, color: D.textMuted, margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Tax Obligations */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Tax Obligations</h3>
            <p style={{ fontSize: 13, color: D.textMuted, margin: "0 0 16px" }}>Overview of your tax registration and obligations.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    {["Tax Type", "Tax ID / Reference", "Jurisdiction", "Status", "Next Filing Due", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: D.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TAX_OBLIGATIONS.map((row) => (
                    <tr key={row.taxId} style={{ borderBottom: `1px solid ${D.border}` }}>
                      <td style={{ padding: "10px 14px", color: D.text }}>{row.taxType}</td>
                      <td style={{ padding: "10px 14px", color: D.textMuted, fontFamily: "monospace", fontSize: 12 }}>{row.taxId}</td>
                      <td style={{ padding: "10px 14px", color: D.textMuted }}>{row.jurisdiction}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: D.greenDim, color: D.green }}>
                          <CheckCircle size={12} /> {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: D.textMuted }}>{row.nextFilingDue}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <button style={{ background: "none", border: "none", color: D.textMuted, cursor: "pointer", padding: 4 }}>⋯</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px auto 0", background: "none", border: "none", color: D.accent, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              View All Tax Information <ChevronRight size={14} />
            </button>
          </div>

          {/* Upcoming Deadlines */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Upcoming Deadlines</h3>
            <p style={{ fontSize: 13, color: D.textMuted, margin: "0 0 16px" }}>Stay ahead of your important tax and compliance deadlines.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {UPCOMING_DEADLINES.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${D.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: D.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={18} color={D.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{d.name}</p>
                    <p style={{ fontSize: 12, color: D.textMuted, margin: "2px 0 0" }}>{d.authority}</p>
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: d.daysLeft <= 15 ? D.redDim : D.accentDim, color: d.daysLeft <= 15 ? D.red : D.accent }}>
                    {d.daysLeft} Days Left
                  </span>
                  <span style={{ fontSize: 12, color: D.textMuted, minWidth: 80, textAlign: "right" }}>{d.date}</span>
                </div>
              ))}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px auto 0", background: "none", border: "none", color: D.accent, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              View All Deadlines <ChevronRight size={14} />
            </button>
          </div>

          {/* Tax Compliance Documents */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Tax Compliance Documents</h3>
            <p style={{ fontSize: 13, color: D.textMuted, margin: "0 0 16px" }}>Manage your tax certificates and important compliance documents.</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {COMPLIANCE_DOCS.map((doc) => (
                <div key={doc.docId} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: D.surface, borderRadius: 10, border: `1px solid ${D.border}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: D.greenDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={18} color={D.green} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</p>
                    <p style={{ fontSize: 11, color: D.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{doc.docId}</p>
                    <p style={{ fontSize: 11, color: D.textMuted, margin: "2px 0 0" }}>Valid until: {doc.validUntil}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: D.greenDim, color: D.green }}>{doc.status}</span>
                    <Download size={14} color={D.textMuted} style={{ cursor: "pointer" }} />
                  </div>
                </div>
              ))}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, margin: "14px auto 0", background: "none", border: "none", color: D.accent, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              View All Certificates &amp; Licenses <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tax Compliance Summary */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Tax Compliance Summary</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke={D.border} strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={D.green} strokeWidth="10" strokeDasharray={`${2 * Math.PI * 50}`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 60 60)" />
                <text x="60" y="56" textAnchor="middle" fill={D.text} fontSize="22" fontWeight="700">100%</text>
                <text x="60" y="72" textAnchor="middle" fill={D.green} fontSize="11" fontWeight="600">Compliant</text>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ label: "Compliant", pct: "100%", count: 4, color: D.green }, { label: "Pending", pct: "0%", count: 0, color: D.accent }, { label: "Overdue", pct: "0%", count: 0, color: D.red }].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                    <span style={{ color: D.textMuted }}>{item.label}</span>
                  </div>
                  <span style={{ color: D.text }}>{item.pct} ({item.count})</span>
                </div>
              ))}
            </div>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", margin: "14px 0 0", padding: "10px 0", background: "none", borderTop: `1px solid ${D.border}`, borderLeft: "none", borderRight: "none", borderBottom: "none", color: D.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              View Compliance Details <ChevronRight size={14} />
            </button>
          </div>

          {/* Recent Tax Filings */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Tax Filings</h3>
              <button style={{ background: "none", border: "none", color: D.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>View All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {RECENT_FILINGS.map((f) => (
                <div key={f.reference} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${D.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: D.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={14} color={D.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: D.textMuted, margin: "2px 0 0", fontFamily: "monospace" }}>{f.reference}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: D.greenDim, color: D.green }}>{f.status}</span>
                    <span style={{ fontSize: 11, color: D.textMuted }}>{f.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Alerts */}
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Compliance Alerts</h3>
              <button style={{ background: "none", border: "none", color: D.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>View All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: D.greenDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <CheckCircle size={28} color={D.green} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: D.green, margin: "0 0 4px" }}>Great! You&apos;re all compliant.</p>
              <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}>No compliance issues or overdue items at the moment.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
