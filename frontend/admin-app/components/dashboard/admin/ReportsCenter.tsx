"use client";

import { useMemo, useState, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { downloadCsv } from "@/lib/export-csv";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type {
  RideRecord,
  DeliveryRecord,
  RiderRecord,
  PassengerRecord,
  WalletTransactionRecord,
  PayoutRequestRecord,
  AdminIncidentRecord,
  AdminSupportTicketRecord,
  PromoCodeRecord
} from "./types";
import { parseNumber, formatDateTime, shortDate } from "./utils";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Bike,
  Package,
  Users,
  DollarSign,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  ChevronDown
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                      */
/* ══════════════════════════════════════════════════════════════════════════════ */

export type ReportsCenterProps = {
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  riders: RiderRecord[];
  passengers: PassengerRecord[];
  walletTransactions: WalletTransactionRecord[];
  payoutRequests: PayoutRequestRecord[];
  incidents: AdminIncidentRecord[];
  supportTickets: AdminSupportTicketRecord[];
  promoCodes: PromoCodeRecord[];
  financeSummary?: {
    revenue: { total: number; rides: number; deliveries: number };
    commission: { total: number; rides: number; deliveries: number };
    daily: Array<{ key: string; revenue: number; commission: number; rides: number; deliveries: number }>;
  } | null;
  adminCurrency: string;
  onServerExport?: (entity: "rides" | "deliveries" | "riders" | "wallet-transactions" | "payout-requests") => void;
  dataLoading?: boolean;
};

type ReportTab = "operations" | "finance" | "riders" | "passengers" | "deliveries" | "safety";
type ExportFormat = "csv" | "excel" | "pdf";

const TABS: Array<{ key: ReportTab; label: string; icon: typeof FileText }> = [
  { key: "operations", label: "Operations", icon: BarChart3 },
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "riders", label: "Riders", icon: Users },
  { key: "passengers", label: "Passengers", icon: Users },
  { key: "deliveries", label: "Deliveries", icon: Package },
  { key: "safety", label: "Safety", icon: Shield }
];

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Export helpers                                                              */
/* ══════════════════════════════════════════════════════════════════════════════ */

function exportExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  const headerXml = headers.map((h) => `<Cell><Data xsi:type="String">${escapeXml(h)}</Data></Cell>`).join("");
  const rowsXml = rows
    .map(
      (row) =>
        `<Row>${row
          .map((v) => {
            const s = String(v);
            const isNum = typeof v === "number" || (/^-?\d+/.test(s) && !s.includes(","));
            return `<Cell><Data xsi:type="${isNum ? "Number" : "String"}">${escapeXml(s)}</Data></Cell>`;
          })
          .join("")}</Row>`
    )
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Report">
  <Table>${headerXml}${rowsXml}</Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportPdf(title: string, headers: string[], rows: (string | number)[][]) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:24px;color:#111}
  h1{font-size:18px;margin:0 0 4px}p{font-size:12px;color:#666;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th,td{padding:6px 8px;border:1px solid #ddd;text-align:left}
  th{background:#f5f5f5;font-weight:600}
  @media print{body{padding:12px}}
</style></head><body>
<h1>${title}</h1>
<p>Generated ${new Date().toLocaleDateString()} · OkadaGo Admin</p>
<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
  win.document.close();
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Component                                                                  */
/* ══════════════════════════════════════════════════════════════════════════════ */

export function ReportsCenter({
  rides,
  deliveries,
  riders,
  passengers,
  walletTransactions,
  payoutRequests,
  incidents,
  supportTickets,
  promoCodes,
  financeSummary,
  adminCurrency,
  onServerExport,
  dataLoading = false
}: ReportsCenterProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("operations");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  /* ── Filter data by date range ── */
  const filtered = useMemo(() => {
    const from = dateFrom;
    const to = dateTo + "T23:59:59";
    return {
      rides: rides.filter((r) => r.createdAt >= from && r.createdAt <= to),
      deliveries: deliveries.filter((d) => d.createdAt >= from && d.createdAt <= to),
      walletTransactions: walletTransactions.filter((t) => t.createdAt >= from && t.createdAt <= to),
      payoutRequests: payoutRequests.filter((p) => p.requestedAt >= from && p.requestedAt <= to),
      incidents: incidents.filter((i) => i.createdAt >= from && i.createdAt <= to),
      supportTickets: supportTickets.filter((t) => t.createdAt >= from && t.createdAt <= to)
    };
  }, [rides, deliveries, walletTransactions, payoutRequests, incidents, supportTickets, dateFrom, dateTo]);

  /* ── Operations metrics ── */
  const opsMetrics = useMemo(() => {
    const totalTrips = filtered.rides.length + filtered.deliveries.length;
    const completedRides = filtered.rides.filter((r) => r.status.toLowerCase() === "completed");
    const cancelledRides = filtered.rides.filter((r) => r.status.toLowerCase() === "cancelled");
    const completedDeliveries = filtered.deliveries.filter((d) => d.status.toLowerCase() === "delivered");
    const completionRate = totalTrips > 0 ? Math.round(((completedRides.length + completedDeliveries.length) / totalTrips) * 100) : 0;
    const avgRideFare = completedRides.length > 0 ? completedRides.reduce((s, r) => s + parseNumber(r.finalFare), 0) / completedRides.length : 0;
    const peakHour = (() => {
      const hours = new Array(24).fill(0);
      filtered.rides.forEach((r) => { const h = new Date(r.createdAt).getHours(); hours[h]++; });
      return hours.indexOf(Math.max(...hours));
    })();
    return { totalTrips, completedRides: completedRides.length, cancelledRides: cancelledRides.length, completedDeliveries: completedDeliveries.length, completionRate, avgRideFare, peakHour };
  }, [filtered]);

  /* ── Finance metrics ── */
  const finMetrics = useMemo(() => {
    const grossRevenue = filtered.rides.reduce((s, r) => s + parseNumber(r.finalFare), 0) +
      filtered.deliveries.reduce((s, d) => s + parseNumber(d.finalFee), 0);
    const commission = filtered.rides.reduce((s, r) => s + parseNumber(r.platformCommission), 0) +
      filtered.deliveries.reduce((s, d) => s + parseNumber(d.platformCommission), 0);
    const riderEarnings = grossRevenue - commission;
    const refunds = filtered.walletTransactions.filter((t) => t.description?.toLowerCase().includes("refund")).reduce((s, t) => s + parseNumber(t.amount), 0);
    const pendingPayouts = filtered.payoutRequests.filter((p) => ["REQUESTED", "REVIEWING", "APPROVED"].includes(p.status)).reduce((s, p) => s + parseNumber(p.amount), 0);
    const completedPayouts = filtered.payoutRequests.filter((p) => p.status === "PAID").reduce((s, p) => s + parseNumber(p.amount), 0);
    return { grossRevenue, commission, riderEarnings, refunds, pendingPayouts, completedPayouts };
  }, [filtered]);

  /* ── Riders metrics ── */
  const riderMetrics = useMemo(() => {
    const total = riders.length;
    const verified = riders.filter((r) => r.approvalStatus?.toLowerCase() === "approved").length;
    const pending = riders.filter((r) => r.approvalStatus?.toLowerCase() === "pending").length;
    const online = riders.filter((r) => r.onlineStatus).length;
    const suspended = riders.filter((r) => r.user?.accountStatus?.toLowerCase() === "suspended").length;
    const activeRiders = filtered.rides.reduce((set, r) => { if (r.rider?.id) set.add(r.rider.id); return set; }, new Set<string>()).size;
    const avgRating = riders.filter((r) => parseNumber(r.ratingAverage) > 0).reduce((s, r, _, a) => s + parseNumber(r.ratingAverage) / a.length, 0);
    return { total, verified, pending, online, suspended, activeRiders, avgRating };
  }, [riders, filtered]);

  /* ── Passengers metrics ── */
  const passengerMetrics = useMemo(() => {
    const total = passengers.length;
    const active = passengers.filter((p) => p.user?.accountStatus?.toLowerCase() !== "suspended" && p.user?.accountStatus?.toLowerCase() !== "deactivated").length;
    const newToday = passengers.filter((p) => p.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
    const totalSpend = filtered.rides.reduce((s, r) => s + parseNumber(r.finalFare), 0) + filtered.deliveries.reduce((s, d) => s + parseNumber(d.finalFee), 0);
    const avgSpend = total > 0 ? totalSpend / total : 0;
    const uniqueRiders = new Set(filtered.rides.map((r) => r.passenger?.id).filter(Boolean)).size;
    return { total, active, newToday, totalSpend, avgSpend, uniqueRiders };
  }, [passengers, filtered]);

  /* ── Deliveries metrics ── */
  const deliveryMetrics = useMemo(() => {
    const total = filtered.deliveries.length;
    const completed = filtered.deliveries.filter((d) => d.status.toLowerCase() === "delivered").length;
    const inTransit = filtered.deliveries.filter((d) => ["started", "picked_up", "in_transit"].includes(d.status.toLowerCase())).length;
    const cancelled = filtered.deliveries.filter((d) => d.status.toLowerCase() === "cancelled").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const revenue = filtered.deliveries.reduce((s, d) => s + parseNumber(d.finalFee), 0);
    return { total, completed, inTransit, cancelled, completionRate, revenue };
  }, [filtered]);

  /* ── Safety metrics ── */
  const safetyMetrics = useMemo(() => {
    const totalIncidents = filtered.incidents.length;
    const openIncidents = filtered.incidents.filter((i) => i.status === "OPEN").length;
    const criticalIncidents = filtered.incidents.filter((i) => i.severity === "CRITICAL").length;
    const resolvedIncidents = filtered.incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
    const totalTickets = filtered.supportTickets.length;
    const openTickets = filtered.supportTickets.filter((t) => t.status === "OPEN").length;
    const resolvedTickets = filtered.supportTickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    return { totalIncidents, openIncidents, criticalIncidents, resolvedIncidents, totalTickets, openTickets, resolvedTickets };
  }, [filtered]);

  /* ── Export handler ── */
  const handleExport = useCallback(
    (format: ExportFormat) => {
      setExporting(true);
      try {
        const label = TABS.find((t) => t.key === activeTab)?.label ?? "Report";
        const filename = `okadago-${activeTab}-report-${dateFrom}-to-${dateTo}`;

        let headers: string[] = [];
        let rows: (string | number)[][] = [];

        switch (activeTab) {
          case "operations":
            headers = ["Metric", "Value"];
            rows = [
              ["Total Trips", opsMetrics.totalTrips],
              ["Completed Rides", opsMetrics.completedRides],
              ["Cancelled Rides", opsMetrics.cancelledRides],
              ["Completed Deliveries", opsMetrics.completedDeliveries],
              ["Completion Rate", `${opsMetrics.completionRate}%`],
              ["Avg Ride Fare", formatMoney(adminCurrency, opsMetrics.avgRideFare)],
              ["Peak Hour", `${opsMetrics.peakHour}:00`]
            ];
            break;
          case "finance":
            headers = ["Metric", "Value"];
            rows = [
              ["Gross Revenue", formatMoney(adminCurrency, finMetrics.grossRevenue)],
              ["Platform Commission", formatMoney(adminCurrency, finMetrics.commission)],
              ["Rider Earnings", formatMoney(adminCurrency, finMetrics.riderEarnings)],
              ["Refunds", formatMoney(adminCurrency, finMetrics.refunds)],
              ["Pending Payouts", formatMoney(adminCurrency, finMetrics.pendingPayouts)],
              ["Completed Payouts", formatMoney(adminCurrency, finMetrics.completedPayouts)]
            ];
            break;
          case "riders":
            headers = ["Metric", "Value"];
            rows = [
              ["Total Riders", riderMetrics.total],
              ["Verified", riderMetrics.verified],
              ["Pending Verification", riderMetrics.pending],
              ["Currently Online", riderMetrics.online],
              ["Suspended", riderMetrics.suspended],
              ["Active (in period)", riderMetrics.activeRiders],
              ["Avg Rating", riderMetrics.avgRating.toFixed(1)]
            ];
            break;
          case "passengers":
            headers = ["Metric", "Value"];
            rows = [
              ["Total Passengers", passengerMetrics.total],
              ["Active", passengerMetrics.active],
              ["New Today", passengerMetrics.newToday],
              ["Total Spend (period)", formatMoney(adminCurrency, passengerMetrics.totalSpend)],
              ["Avg Spend per User", formatMoney(adminCurrency, passengerMetrics.avgSpend)]
            ];
            break;
          case "deliveries":
            headers = ["Metric", "Value"];
            rows = [
              ["Total Deliveries", deliveryMetrics.total],
              ["Completed", deliveryMetrics.completed],
              ["In Transit", deliveryMetrics.inTransit],
              ["Cancelled", deliveryMetrics.cancelled],
              ["Completion Rate", `${deliveryMetrics.completionRate}%`],
              ["Revenue", formatMoney(adminCurrency, deliveryMetrics.revenue)]
            ];
            break;
          case "safety":
            headers = ["Metric", "Value"];
            rows = [
              ["Total Incidents", safetyMetrics.totalIncidents],
              ["Open Incidents", safetyMetrics.openIncidents],
              ["Critical Incidents", safetyMetrics.criticalIncidents],
              ["Resolved Incidents", safetyMetrics.resolvedIncidents],
              ["Total Support Tickets", safetyMetrics.totalTickets],
              ["Open Tickets", safetyMetrics.openTickets],
              ["Resolved Tickets", safetyMetrics.resolvedTickets]
            ];
            break;
        }

        switch (format) {
          case "csv":
            downloadCsv(`${filename}.csv`, headers, rows);
            break;
          case "excel":
            exportExcel(`${filename}.xls`, headers, rows);
            break;
          case "pdf":
            exportPdf(`${label} Report · ${dateFrom} to ${dateTo}`, headers, rows);
            break;
        }
      } finally {
        setExporting(false);
      }
    },
    [activeTab, dateFrom, dateTo, adminCurrency, opsMetrics, finMetrics, riderMetrics, passengerMetrics, deliveryMetrics, safetyMetrics]
  );

  /* ── Export full rides/deliveries CSV via server ── */
  const handleServerExport = useCallback(
    (entity: "rides" | "deliveries" | "riders" | "wallet-transactions" | "payout-requests") => {
      if (onServerExport) onServerExport(entity);
    },
    [onServerExport]
  );

  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  return (
    <div className="rc-center">
      {/* ── Header ── */}
      <AdminPageHeader
        title="Reports Center"
        subtitle="Operational, financial, and safety reports with CSV, Excel, and PDF export."
        actions={
          <div className="rc-header-actions">
            <div className="rc-date-range">
              <Calendar size={14} />
              <input
                type="date"
                className="rc-date-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="rc-date-sep">to</span>
              <input
                type="date"
                className="rc-date-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="rc-export-group">
              <button type="button" className="rc-export-btn rc-export-btn--csv" onClick={() => handleExport("csv")} disabled={exporting}>
                <Download size={13} /> CSV
              </button>
              <button type="button" className="rc-export-btn rc-export-btn--excel" onClick={() => handleExport("excel")} disabled={exporting}>
                <Download size={13} /> Excel
              </button>
              <button type="button" className="rc-export-btn rc-export-btn--pdf" onClick={() => handleExport("pdf")} disabled={exporting}>
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>
        }
      />

      {/* ── Tabs ── */}
      <div className="rc-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              className={`rc-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="rc-content">
        {activeTab === "operations" && (
          <OperationsReport
            metrics={opsMetrics}
            rides={filtered.rides}
            deliveries={filtered.deliveries}
            adminCurrency={adminCurrency}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        )}
        {activeTab === "finance" && (
          <FinanceReport
            metrics={finMetrics}
            rides={filtered.rides}
            deliveries={filtered.deliveries}
            walletTransactions={filtered.walletTransactions}
            payoutRequests={filtered.payoutRequests}
            adminCurrency={adminCurrency}
            onServerExport={handleServerExport}
          />
        )}
        {activeTab === "riders" && (
          <RidersReport
            metrics={riderMetrics}
            riders={riders}
            rides={filtered.rides}
            adminCurrency={adminCurrency}
            onServerExport={handleServerExport}
          />
        )}
        {activeTab === "passengers" && (
          <PassengersReport
            metrics={passengerMetrics}
            passengers={passengers}
            rides={filtered.rides}
            deliveries={filtered.deliveries}
            adminCurrency={adminCurrency}
          />
        )}
        {activeTab === "deliveries" && (
          <DeliveriesReport
            metrics={deliveryMetrics}
            deliveries={filtered.deliveries}
            adminCurrency={adminCurrency}
            onServerExport={handleServerExport}
          />
        )}
        {activeTab === "safety" && (
          <SafetyReport
            metrics={safetyMetrics}
            incidents={filtered.incidents}
            supportTickets={filtered.supportTickets}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Sub-report prop types                                                      */
/* ══════════════════════════════════════════════════════════════════════════════ */

type OpsMetrics = { totalTrips: number; completedRides: number; cancelledRides: number; completedDeliveries: number; completionRate: number; avgRideFare: number; peakHour: number };
type FinMetrics = { grossRevenue: number; commission: number; riderEarnings: number; refunds: number; pendingPayouts: number; completedPayouts: number };
type RiderMetrics = { total: number; verified: number; pending: number; online: number; suspended: number; activeRiders: number; avgRating: number };
type PassengerMetrics = { total: number; active: number; newToday: number; totalSpend: number; avgSpend: number; uniqueRiders: number };
type DeliveryMetrics = { total: number; completed: number; inTransit: number; cancelled: number; completionRate: number; revenue: number };
type SafetyMetrics = { totalIncidents: number; openIncidents: number; criticalIncidents: number; resolvedIncidents: number; totalTickets: number; openTickets: number; resolvedTickets: number };

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Operations Report                                                          */
/* ══════════════════════════════════════════════════════════════════════════════ */

function OperationsReport({ metrics, rides, deliveries, adminCurrency, dateFrom, dateTo }: {
  metrics: OpsMetrics;
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  dateFrom: string;
  dateTo: string;
}) {
  const dailyBuckets = useMemo(() => {
    const map = new Map<string, { rides: number; deliveries: number }>();
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      map.set(key, { rides: 0, deliveries: 0 });
    }
    rides.forEach((r) => { const k = r.createdAt.slice(0, 10); const b = map.get(k); if (b) b.rides++; });
    deliveries.forEach((d) => { const k = d.createdAt.slice(0, 10); const b = map.get(k); if (b) b.deliveries++; });
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [rides, deliveries, dateFrom, dateTo]);

  const maxDaily = Math.max(1, ...dailyBuckets.map((b) => b.rides + b.deliveries));

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    rides.forEach((r) => { const s = r.status.toLowerCase(); counts.set(s, (counts.get(s) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rides]);

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--blue"><Bike size={18} /></div><div><span className="rc-kpi-value">{metrics.totalTrips}</span><span className="rc-kpi-label">Total Trips</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.completionRate}%</span><span className="rc-kpi-label">Completion Rate</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--red"><XCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.cancelledRides}</span><span className="rc-kpi-label">Cancelled Rides</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><Clock size={18} /></div><div><span className="rc-kpi-value">{metrics.peakHour}:00</span><span className="rc-kpi-label">Peak Hour</span></div></div>
      </div>

      <article className="rc-card">
        <h3 className="rc-card-title">Daily Trip Volume</h3>
        <div className="rc-bars">
          {dailyBuckets.map((b) => (
            <div key={b.key} className="rc-bar-col">
              <div className="rc-bar-track">
                <div className="rc-bar rc-bar--rides" style={{ height: `${(b.rides / maxDaily) * 100}%` }} title={`${b.rides} rides`} />
                <div className="rc-bar rc-bar--deliveries" style={{ height: `${(b.deliveries / maxDaily) * 100}%` }} title={`${b.deliveries} deliveries`} />
              </div>
              <span className="rc-bar-label">{shortDate(b.key + "T12:00:00Z")}</span>
            </div>
          ))}
        </div>
        <div className="rc-legend">
          <span><i className="rc-dot rc-dot--rides" /> Rides</span>
          <span><i className="rc-dot rc-dot--deliveries" /> Deliveries</span>
        </div>
      </article>

      <article className="rc-card">
        <h3 className="rc-card-title">Ride Status Breakdown</h3>
        <table className="rc-table">
          <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
          <tbody>
            {statusBreakdown.map(([status, count]) => (
              <tr key={status}>
                <td><span className={`rc-badge rc-badge--${status === "completed" ? "green" : status === "cancelled" ? "red" : "neutral"}`}>{status}</span></td>
                <td>{count}</td>
                <td>{rides.length > 0 ? Math.round((count / rides.length) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Finance Report                                                             */
/* ══════════════════════════════════════════════════════════════════════════════ */

function FinanceReport({ metrics, rides, deliveries, walletTransactions, payoutRequests, adminCurrency, onServerExport }: {
  metrics: FinMetrics;
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  walletTransactions: WalletTransactionRecord[];
  payoutRequests: PayoutRequestRecord[];
  adminCurrency: string;
  onServerExport?: (entity: "wallet-transactions" | "payout-requests") => void;
}) {
  const paymentMethods = useMemo(() => {
    const counts = new Map<string, number>();
    rides.forEach((r) => { const m = r.paymentMethod ?? "cash"; counts.set(m, (counts.get(m) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rides]);

  const txByType = useMemo(() => {
    const counts = new Map<string, { count: number; total: number }>();
    walletTransactions.forEach((t) => {
      const type = t.type?.toLowerCase() ?? "unknown";
      const existing = counts.get(type) ?? { count: 0, total: 0 };
      existing.count++;
      existing.total += parseNumber(t.amount);
      counts.set(type, existing);
    });
    return Array.from(counts.entries());
  }, [walletTransactions]);

  const payoutByStatus = useMemo(() => {
    const counts = new Map<string, { count: number; total: number }>();
    payoutRequests.forEach((p) => {
      const existing = counts.get(p.status) ?? { count: 0, total: 0 };
      existing.count++;
      existing.total += parseNumber(p.amount);
      counts.set(p.status, existing);
    });
    return Array.from(counts.entries());
  }, [payoutRequests]);

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><DollarSign size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.grossRevenue)}</span><span className="rc-kpi-label">Gross Revenue</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><TrendingUp size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.commission)}</span><span className="rc-kpi-label">Platform Commission</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--blue"><DollarSign size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.riderEarnings)}</span><span className="rc-kpi-label">Rider Earnings</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--red"><XCircle size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.refunds)}</span><span className="rc-kpi-label">Refunds</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--yellow"><Clock size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.pendingPayouts)}</span><span className="rc-kpi-label">Pending Payouts</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.completedPayouts)}</span><span className="rc-kpi-label">Completed Payouts</span></div></div>
      </div>

      <div className="rc-grid-2">
        <article className="rc-card">
          <h3 className="rc-card-title">Payment Methods</h3>
          <table className="rc-table">
            <thead><tr><th>Method</th><th>Trips</th><th>%</th></tr></thead>
            <tbody>
              {paymentMethods.map(([method, count]) => (
                <tr key={method}>
                  <td className="rc-capitalize">{method.replace("_", " ")}</td>
                  <td>{count}</td>
                  <td>{rides.length > 0 ? Math.round((count / rides.length) * 100) : 0}%</td>
                </tr>
              ))}
              {paymentMethods.length === 0 && <tr><td colSpan={3} className="rc-empty">No data</td></tr>}
            </tbody>
          </table>
        </article>

        <article className="rc-card">
          <h3 className="rc-card-title">Wallet Transactions</h3>
          <table className="rc-table">
            <thead><tr><th>Type</th><th>Count</th><th>Total</th></tr></thead>
            <tbody>
              {txByType.map(([type, data]) => (
                <tr key={type}>
                  <td className="rc-capitalize">{type}</td>
                  <td>{data.count}</td>
                  <td>{formatMoney(adminCurrency, data.total)}</td>
                </tr>
              ))}
              {txByType.length === 0 && <tr><td colSpan={3} className="rc-empty">No transactions</td></tr>}
            </tbody>
          </table>
          {onServerExport && (
            <button type="button" className="rc-link-btn" onClick={() => onServerExport("wallet-transactions")}>
              <Download size={12} /> Export full transactions CSV
            </button>
          )}
        </article>
      </div>

      <article className="rc-card">
        <h3 className="rc-card-title">Payout Requests</h3>
        <table className="rc-table">
          <thead><tr><th>Status</th><th>Count</th><th>Total Amount</th></tr></thead>
          <tbody>
            {payoutByStatus.map(([status, data]) => (
              <tr key={status}>
                <td><span className={`rc-badge rc-badge--${status === "PAID" ? "green" : status === "REQUESTED" ? "yellow" : status === "REJECTED" ? "red" : "neutral"}`}>{status}</span></td>
                <td>{data.count}</td>
                <td>{formatMoney(adminCurrency, data.total)}</td>
              </tr>
            ))}
            {payoutByStatus.length === 0 && <tr><td colSpan={3} className="rc-empty">No payout requests</td></tr>}
          </tbody>
        </table>
        {onServerExport && (
          <button type="button" className="rc-link-btn" onClick={() => onServerExport("payout-requests")}>
            <Download size={12} /> Export full payouts CSV
          </button>
        )}
      </article>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Riders Report                                                              */
/* ══════════════════════════════════════════════════════════════════════════════ */

function RidersReport({ metrics, riders, rides, adminCurrency, onServerExport }: {
  metrics: RiderMetrics;
  riders: RiderRecord[];
  rides: RideRecord[];
  adminCurrency: string;
  onServerExport?: (entity: "riders") => void;
}) {
  const topRiders = useMemo(() => {
    const counts = new Map<string, { name: string; code: string; trips: number; earnings: number; rating: number }>();
    rides.filter((r) => r.status.toLowerCase() === "completed" && r.rider).forEach((r) => {
      const id = r.rider!.id ?? r.rider!.user.fullName;
      const existing = counts.get(id) ?? { name: r.rider!.user?.fullName ?? "Unknown", code: r.rider!.displayCode ?? "", trips: 0, earnings: 0, rating: 0 };
      existing.trips++;
      existing.earnings += parseNumber(r.riderEarnings);
      counts.set(id, existing);
    });
    return Array.from(counts.values()).sort((a, b) => b.trips - a.trips).slice(0, 10);
  }, [rides]);

  const verificationBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    riders.forEach((r) => { const s = r.approvalStatus?.toLowerCase() ?? "unknown"; counts.set(s, (counts.get(s) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [riders]);

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--blue"><Users size={18} /></div><div><span className="rc-kpi-value">{metrics.total}</span><span className="rc-kpi-label">Total Riders</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.verified}</span><span className="rc-kpi-label">Verified</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--yellow"><Clock size={18} /></div><div><span className="rc-kpi-value">{metrics.pending}</span><span className="rc-kpi-label">Pending</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><TrendingUp size={18} /></div><div><span className="rc-kpi-value">{metrics.online}</span><span className="rc-kpi-label">Online Now</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--red"><XCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.suspended}</span><span className="rc-kpi-label">Suspended</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><Bike size={18} /></div><div><span className="rc-kpi-value">{metrics.activeRiders}</span><span className="rc-kpi-label">Active (period)</span></div></div>
      </div>

      <div className="rc-grid-2">
        <article className="rc-card">
          <h3 className="rc-card-title">Top Riders by Trips</h3>
          <table className="rc-table">
            <thead><tr><th>#</th><th>Rider</th><th>Code</th><th>Trips</th><th>Earnings</th></tr></thead>
            <tbody>
              {topRiders.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td><code className="rc-code">{r.code}</code></td>
                  <td>{r.trips}</td>
                  <td>{formatMoney(adminCurrency, r.earnings)}</td>
                </tr>
              ))}
              {topRiders.length === 0 && <tr><td colSpan={5} className="rc-empty">No completed rides in period</td></tr>}
            </tbody>
          </table>
        </article>

        <article className="rc-card">
          <h3 className="rc-card-title">Verification Status</h3>
          <table className="rc-table">
            <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
            <tbody>
              {verificationBreakdown.map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`rc-badge rc-badge--${status === "approved" ? "green" : status === "pending" ? "yellow" : "red"}`}>{status}</span></td>
                  <td>{count}</td>
                  <td>{riders.length > 0 ? Math.round((count / riders.length) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {onServerExport && (
            <button type="button" className="rc-link-btn" onClick={() => onServerExport("riders")}>
              <Download size={12} /> Export full riders CSV
            </button>
          )}
        </article>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Passengers Report                                                          */
/* ══════════════════════════════════════════════════════════════════════════════ */

function PassengersReport({ metrics, passengers, rides, deliveries, adminCurrency }: {
  metrics: PassengerMetrics;
  passengers: PassengerRecord[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
}) {
  const topSpenders = useMemo(() => {
    const spending = new Map<string, { name: string; trips: number; spend: number }>();
    rides.forEach((r) => {
      const p = r.passenger;
      const pid = p?.id ?? p?.user?.fullName;
      if (!pid) return;
      const existing = spending.get(pid) ?? { name: p.user?.fullName ?? "Unknown", trips: 0, spend: 0 };
      existing.trips++;
      existing.spend += parseNumber(r.finalFare);
      spending.set(pid, existing);
    });
    deliveries.forEach((d) => {
      const pid = d.passenger?.user?.fullName;
      if (!pid) return;
      const existing = spending.get(pid) ?? { name: d.passenger?.user?.fullName ?? "Unknown", trips: 0, spend: 0 };
      existing.trips++;
      existing.spend += parseNumber(d.finalFee);
      spending.set(pid, existing);
    });
    return Array.from(spending.values()).sort((a, b) => b.spend - a.spend).slice(0, 10);
  }, [rides, deliveries]);

  const signupTrend = useMemo(() => {
    const counts = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      counts.set(d.toISOString().slice(0, 10), 0);
    }
    passengers.forEach((p) => { const k = p.createdAt?.slice(0, 10); if (k && counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1); });
    return Array.from(counts.entries()).map(([key, count]) => ({ key, count }));
  }, [passengers]);

  const maxSignups = Math.max(1, ...signupTrend.map((d) => d.count));

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--blue"><Users size={18} /></div><div><span className="rc-kpi-value">{metrics.total}</span><span className="rc-kpi-label">Total Passengers</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.active}</span><span className="rc-kpi-label">Active</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><TrendingUp size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.totalSpend)}</span><span className="rc-kpi-label">Total Spend (period)</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--yellow"><DollarSign size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.avgSpend)}</span><span className="rc-kpi-label">Avg Spend / User</span></div></div>
      </div>

      <article className="rc-card">
        <h3 className="rc-card-title">Signups (Last 30 Days)</h3>
        <div className="rc-bars rc-bars--slim">
          {signupTrend.map((d) => (
            <div key={d.key} className="rc-bar-col">
              <div className="rc-bar-track">
                <div className="rc-bar rc-bar--signups" style={{ height: `${(d.count / maxSignups) * 100}%` }} title={`${d.count} signups`} />
              </div>
              <span className="rc-bar-label">{shortDate(d.key + "T12:00:00Z")}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="rc-card">
        <h3 className="rc-card-title">Top Spenders</h3>
        <table className="rc-table">
          <thead><tr><th>#</th><th>Passenger</th><th>Trips</th><th>Total Spend</th></tr></thead>
          <tbody>
            {topSpenders.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td>{p.trips}</td>
                <td>{formatMoney(adminCurrency, p.spend)}</td>
              </tr>
            ))}
            {topSpenders.length === 0 && <tr><td colSpan={4} className="rc-empty">No trip data in period</td></tr>}
          </tbody>
        </table>
      </article>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Deliveries Report                                                          */
/* ══════════════════════════════════════════════════════════════════════════════ */

function DeliveriesReport({ metrics, deliveries, adminCurrency, onServerExport }: {
  metrics: DeliveryMetrics;
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  onServerExport?: (entity: "deliveries") => void;
}) {
  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    deliveries.forEach((d) => { const s = d.status.toLowerCase(); counts.set(s, (counts.get(s) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [deliveries]);

  const dailyDeliveries = useMemo(() => {
    const map = new Map<string, number>();
    deliveries.forEach((d) => { const k = d.createdAt.slice(0, 10); map.set(k, (map.get(k) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => ({ key, count }));
  }, [deliveries]);

  const maxDaily = Math.max(1, ...dailyDeliveries.map((d) => d.count));

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--blue"><Package size={18} /></div><div><span className="rc-kpi-value">{metrics.total}</span><span className="rc-kpi-label">Total Deliveries</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.completed}</span><span className="rc-kpi-label">Completed</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><TrendingUp size={18} /></div><div><span className="rc-kpi-value">{metrics.inTransit}</span><span className="rc-kpi-label">In Transit</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><DollarSign size={18} /></div><div><span className="rc-kpi-value">{formatMoney(adminCurrency, metrics.revenue)}</span><span className="rc-kpi-label">Revenue</span></div></div>
      </div>

      <article className="rc-card">
        <h3 className="rc-card-title">Daily Delivery Volume</h3>
        <div className="rc-bars rc-bars--slim">
          {dailyDeliveries.map((d) => (
            <div key={d.key} className="rc-bar-col">
              <div className="rc-bar-track">
                <div className="rc-bar rc-bar--deliveries" style={{ height: `${(d.count / maxDaily) * 100}%` }} title={`${d.count} deliveries`} />
              </div>
              <span className="rc-bar-label">{shortDate(d.key + "T12:00:00Z")}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="rc-card">
        <h3 className="rc-card-title">Status Breakdown</h3>
        <table className="rc-table">
          <thead><tr><th>Status</th><th>Count</th><th>%</th></tr></thead>
          <tbody>
            {statusBreakdown.map(([status, count]) => (
              <tr key={status}>
                <td><span className={`rc-badge rc-badge--${status === "delivered" ? "green" : status === "cancelled" ? "red" : "neutral"}`}>{status}</span></td>
                <td>{count}</td>
                <td>{deliveries.length > 0 ? Math.round((count / deliveries.length) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {onServerExport && (
          <button type="button" className="rc-link-btn" onClick={() => onServerExport("deliveries")}>
            <Download size={12} /> Export full deliveries CSV
          </button>
        )}
      </article>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/*  Safety Report                                                              */
/* ══════════════════════════════════════════════════════════════════════════════ */

function SafetyReport({ metrics, incidents, supportTickets }: {
  metrics: SafetyMetrics;
  incidents: AdminIncidentRecord[];
  supportTickets: AdminSupportTicketRecord[];
}) {
  const incidentBySeverity = useMemo(() => {
    const counts = new Map<string, number>();
    incidents.forEach((i) => { const s = i.severity ?? "UNKNOWN"; counts.set(s, (counts.get(s) ?? 0) + 1); });
    return Array.from(counts.entries());
  }, [incidents]);

  const ticketByStatus = useMemo(() => {
    const counts = new Map<string, number>();
    supportTickets.forEach((t) => { const s = t.status ?? "UNKNOWN"; counts.set(s, (counts.get(s) ?? 0) + 1); });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [supportTickets]);

  const recentIncidents = useMemo(
    () => [...incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
    [incidents]
  );

  const severityColor = (s: string) => {
    switch (s) {
      case "CRITICAL": return "red";
      case "HIGH": return "orange";
      case "MEDIUM": return "yellow";
      case "LOW": return "neutral";
      default: return "neutral";
    }
  };

  return (
    <div className="rc-section">
      <div className="rc-kpi-grid">
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--red"><AlertTriangle size={18} /></div><div><span className="rc-kpi-value">{metrics.totalIncidents}</span><span className="rc-kpi-label">Total Incidents</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--orange"><Clock size={18} /></div><div><span className="rc-kpi-value">{metrics.openIncidents}</span><span className="rc-kpi-label">Open Incidents</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--red"><AlertTriangle size={18} /></div><div><span className="rc-kpi-value">{metrics.criticalIncidents}</span><span className="rc-kpi-label">Critical</span></div></div>
        <div className="rc-kpi"><div className="rc-kpi-icon rc-kpi-icon--green"><CheckCircle size={18} /></div><div><span className="rc-kpi-value">{metrics.totalTickets}</span><span className="rc-kpi-label">Support Tickets</span></div></div>
      </div>

      <div className="rc-grid-2">
        <article className="rc-card">
          <h3 className="rc-card-title">Incidents by Severity</h3>
          <table className="rc-table">
            <thead><tr><th>Severity</th><th>Count</th></tr></thead>
            <tbody>
              {incidentBySeverity.map(([severity, count]) => (
                <tr key={severity}>
                  <td><span className={`rc-badge rc-badge--${severityColor(severity)}`}>{severity}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
              {incidentBySeverity.length === 0 && <tr><td colSpan={2} className="rc-empty">No incidents</td></tr>}
            </tbody>
          </table>
        </article>

        <article className="rc-card">
          <h3 className="rc-card-title">Support Tickets by Status</h3>
          <table className="rc-table">
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>
              {ticketByStatus.map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`rc-badge rc-badge--${status === "RESOLVED" || status === "CLOSED" ? "green" : status === "OPEN" ? "yellow" : "neutral"}`}>{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
              {ticketByStatus.length === 0 && <tr><td colSpan={2} className="rc-empty">No tickets</td></tr>}
            </tbody>
          </table>
        </article>
      </div>

      <article className="rc-card">
        <h3 className="rc-card-title">Recent Incidents</h3>
        <table className="rc-table">
          <thead><tr><th>Date</th><th>Severity</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            {recentIncidents.map((inc) => (
              <tr key={inc.id}>
                <td>{formatDateTime(inc.createdAt)}</td>
                <td><span className={`rc-badge rc-badge--${severityColor(inc.severity)}`}>{inc.severity}</span></td>
                <td>{inc.category ?? "—"}</td>
                <td><span className={`rc-badge rc-badge--${inc.status === "RESOLVED" || inc.status === "CLOSED" ? "green" : inc.status === "OPEN" ? "red" : "yellow"}`}>{inc.status}</span></td>
              </tr>
            ))}
            {recentIncidents.length === 0 && <tr><td colSpan={4} className="rc-empty">No incidents in period</td></tr>}
          </tbody>
        </table>
      </article>
    </div>
  );
}
