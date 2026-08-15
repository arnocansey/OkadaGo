import { useState } from "react";
import { useAdminToast } from "./AdminToast";
import { formatMoney } from "@/lib/currency";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import type { RiderFinancialRow } from "./types";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Target,
  BarChart3,
  PieChart,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Download,
  Zap,
  Star,
} from "lucide-react";

export type RiderEarningsScreenProps = {
  riderFinancialRows: RiderFinancialRow[];
  riderEarningBuckets: { key: string; label: string; trips: number; earnings: number }[];
  riderChartMax: number;
  totalRiderGrossRevenue: number;
  totalRiderEarnings: number;
  totalRiderCommission: number;
  adminCurrency: string;
  dataLoading?: boolean;
};

export function RiderEarningsScreen({
  riderFinancialRows,
  riderEarningBuckets,
  riderChartMax,
  totalRiderGrossRevenue,
  totalRiderEarnings,
  totalRiderCommission,
  adminCurrency,
  dataLoading = false,
}: RiderEarningsScreenProps) {
  const { addToast } = useAdminToast();
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={5} />;
  }

  const tabs: Array<"Daily" | "Weekly" | "Monthly"> = ["Daily", "Weekly", "Monthly"];

  const tripEarnings = totalRiderGrossRevenue - totalRiderCommission;
  const incentives = totalRiderGrossRevenue * 0.05;
  const netEarnings = totalRiderEarnings + incentives;

  const topRiders = [...riderFinancialRows]
    .filter((row) => row.completedCount > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 15);

  const sortedAllRows = [...riderFinancialRows]
    .filter((row) => row.completedCount > 0)
    .sort((a, b) => b.earnings - a.earnings);

  const totalPages = Math.ceil(sortedAllRows.length / PAGE_SIZE);
  const paginatedRows = sortedAllRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const earningsTotal = topRiders.reduce((sum, r) => sum + r.earnings, 0);
  const commissionTotal = topRiders.reduce((sum, r) => sum + r.commission, 0);

  const chartWidth = 560;
  const chartHeight = 200;
  const chartPadding = 40;
  const innerWidth = chartWidth - chartPadding * 2;
  const innerHeight = chartHeight - chartPadding * 2;

  const buildLinePath = (data: number[]) => {
    if (data.length === 0) return "";
    const maxVal = Math.max(...data, 1);
    const points = data.map((val, i) => {
      const x = chartPadding + (i / (data.length - 1 || 1)) * innerWidth;
      const y = chartPadding + innerHeight - (val / maxVal) * innerHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  const earningsPath = buildLinePath(riderEarningBuckets.map((b) => b.earnings));
  const tripsPath = buildLinePath(riderEarningBuckets.map((b) => b.trips));

  const barWidth = innerWidth / (riderEarningBuckets.length || 1) * 0.4;
  const barGap = innerWidth / (riderEarningBuckets.length || 1);

  const donutRadius = 50;
  const donutStroke = 12;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const earningsRatio = totalRiderGrossRevenue > 0 ? tripEarnings / totalRiderGrossRevenue : 0;
  const commissionRatio = totalRiderGrossRevenue > 0 ? totalRiderCommission / totalRiderGrossRevenue : 0;
  const incentivesRatio = 1 - earningsRatio - commissionRatio;

  const donutSegments = [
    { ratio: earningsRatio, color: "var(--success)", label: "Trip Earnings" },
    { ratio: commissionRatio, color: "var(--brand-orange)", label: "Commission" },
    { ratio: Math.max(0, incentivesRatio), color: "var(--brand-yellow)", label: "Incentives" },
  ];

  const incentivesList = [
    { title: "Early Bird Bonus", desc: "₵2.50 per ride before 7 AM", badge: "Active" },
    { title: "Peak Hour Boost", desc: "15% extra on rides 5-8 PM", badge: "Active" },
    { title: "Weekend Warrior", desc: "₵5 flat bonus for 10+ weekend rides", badge: "Active" },
    { title: "Referral Bonus", desc: "₵50 per new rider referred", badge: "Active" },
    { title: "Streak Incentive", desc: "₵10 bonus for 5-day consecutive rides", badge: "Paused" },
  ];

  const rankColors = ["var(--brand-orange)", "var(--brand-yellow)", "#cd7f32"];

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Rider Earnings"
        subtitle="Accra completed-trip earnings, surge incentives, and commission in GHS."
        actions={
          <div className="admin-screen-toolbar">
            <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.78rem" }} onClick={() => addToast("View All clicked")}>
              <Eye size={13} /> View All
            </button>
            <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.78rem" }} onClick={() => addToast("View Full History clicked")}>
              <Download size={13} /> View Full History
            </button>
          </div>
        }
      />

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Daily" ? <Calendar size={13} style={{ marginRight: 6, verticalAlign: -2 }} /> : null}
            {tab}
          </button>
        ))}
      </div>

      <AdminKpiRow
        items={[
          { label: "Total Earnings", value: formatMoney(adminCurrency, totalRiderGrossRevenue), hint: "+12.5% vs last period", icon: <DollarSign size={18} />, tone: "yellow" },
          { label: "Trip Earnings", value: formatMoney(adminCurrency, tripEarnings), hint: "+8.2% vs last period", icon: <TrendingUp size={18} />, tone: "green" },
          { label: "Incentives", value: formatMoney(adminCurrency, incentives), hint: "+24.1% vs last period", icon: <Award size={18} />, tone: "yellow" },
          { label: "Commissions", value: formatMoney(adminCurrency, totalRiderCommission), hint: "-3.4% vs last period", icon: <Target size={18} />, tone: "red" },
          { label: "Net Earnings", value: formatMoney(adminCurrency, netEarnings), hint: "+15.7% vs last period", icon: <TrendingUp size={18} />, tone: "green" },
        ]}
      />

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Earnings Overview</h3>
              <p>Accra earnings & trips over the {activeTab.toLowerCase()} period (GHS).</p>
            </div>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => addToast("Options clicked")}
              aria-label="Chart options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="admin-reference-legend">
            <span><i className="black" /> Trips</span>
            <span><i className="yellow" /> Earnings</span>
          </div>
          <svg width={chartWidth} height={chartHeight} style={{ width: "100%", height: "auto" }}>
            {tripsPath && (
              <>
                <defs>
                  <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={tripsPath + ` L ${chartPadding + innerWidth},${chartPadding + innerHeight} L ${chartPadding},${chartPadding + innerHeight} Z`} fill="url(#tripsGrad)" />
                <path d={tripsPath} fill="none" stroke="var(--text-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {earningsPath && (
              <>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={earningsPath + ` L ${chartPadding + innerWidth},${chartPadding + innerHeight} L ${chartPadding},${chartPadding + innerHeight} Z`} fill="url(#earningsGrad)" />
                <path d={earningsPath} fill="none" stroke="var(--brand-orange)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {riderEarningBuckets.map((bucket, i) => (
              <text
                key={bucket.key}
                x={chartPadding + (i / (riderEarningBuckets.length - 1 || 1)) * innerWidth}
                y={chartHeight - 8}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={10}
              >
                {bucket.label}
              </text>
            ))}
          </svg>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Earnings Breakdown</h3>
              <p>GHS revenue distribution for Accra riders.</p>
            </div>
          </div>
          <div style={{ position: "relative", width: 120, height: 120, margin: "20px 0" }}>
            <svg width={120} height={120} viewBox={`0 0 ${donutRadius * 2} ${donutRadius * 2}`}>
              {(() => {
                let offset = 0;
                return donutSegments.map((seg) => {
                  const len = seg.ratio * donutCircumference;
                  const dashArr = `${len} ${donutCircumference - len}`;
                  const el = (
                    <circle
                      key={seg.label}
                      cx={donutRadius}
                      cy={donutRadius}
                      r={donutRadius - donutStroke / 2}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={donutStroke}
                      strokeDasharray={dashArr}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${donutRadius} ${donutRadius})`}
                      style={{ transition: "all 0.4s ease" }}
                    />
                  );
                  offset += len;
                  return el;
                });
              })()}
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                {formatMoney(adminCurrency, totalRiderGrossRevenue)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Total</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {donutSegments.map((seg) => (
              <div key={seg.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, display: "inline-block" }} />
                  {seg.label}
                </span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{(seg.ratio * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Earnings by Day of Week</h3>
              <p>Weekly Accra trip & GHS earnings breakdown.</p>
            </div>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => addToast("Options clicked")}
              aria-label="Bar chart options"
            >
              <BarChart3 size={16} />
            </button>
          </div>
          <svg width={chartWidth} height={220} style={{ width: "100%", height: "auto" }}>
            {riderEarningBuckets.map((bucket, i) => {
              const x = chartPadding + i * barGap + barGap / 2 - barWidth / 2;
              const maxVal = Math.max(...riderEarningBuckets.map((b) => b.trips), 1);
              const earningsH = bucket.earnings === 0 ? 0 : Math.max(8, (bucket.earnings / riderChartMax) * innerHeight);
              const tripsH = bucket.trips === 0 ? 0 : Math.max(8, (bucket.trips / maxVal) * innerHeight);
              const baseY = chartPadding + innerHeight;
              return (
                <g key={bucket.key}>
                  <rect x={x} y={baseY - earningsH} width={barWidth / 2 - 1} height={earningsH} rx={3} fill="var(--brand-orange)" opacity={0.85} />
                  <rect x={x + barWidth / 2 + 1} y={baseY - tripsH} width={barWidth / 2 - 1} height={tripsH} rx={3} fill="var(--text-primary)" opacity={0.25} />
                  <text x={x + barWidth / 2} y={chartHeight - 4} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
                    {bucket.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                <Zap size={16} color="var(--brand-yellow)" style={{ marginRight: 6, verticalAlign: -2 }} />
                Incentives & Bonuses
              </h3>
              <p>Active Accra rider surge and bonus programs.</p>
            </div>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => addToast("Options clicked")}
              aria-label="Incentive options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incentivesList.map((item) => (
              <div
                key={item.title}
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; e.currentTarget.style.transform = "translateX(2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: item.badge === "Active" ? "color-mix(in srgb, var(--success) 15%, transparent)" : "color-mix(in srgb, var(--text-muted) 15%, transparent)",
                      color: item.badge === "Active" ? "var(--success)" : "var(--text-muted)",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>
              <Star size={16} color="var(--brand-yellow)" style={{ marginRight: 6, verticalAlign: -2 }} />
              Top Earning Riders
            </h3>
            <p>Top 15 Accra earners this period (GHS).</p>
          </div>
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ fontSize: "0.78rem" }}
              onClick={() => addToast("View Full History clicked")}
            >
              View Full History
          </button>
        </div>
        {topRiders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 13 }}>
            No earnings data available.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Rank", "Rider", "Code", "Trips", "Earnings", "Commission"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Rank" ? "center" : "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRiders.map((row, idx) => (
                  <tr
                    key={row.rider.id}
                    onMouseEnter={() => setHoveredRow(row.rider.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: hoveredRow === row.rider.id ? "color-mix(in srgb, var(--brand-orange) 5%, transparent)" : "transparent",
                      transition: "background 0.15s ease",
                      cursor: "default",
                    }}
                  >
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: idx < 3 ? rankColors[idx] : "var(--bg-primary)",
                          color: idx < 3 ? "#fff" : "var(--text-muted)",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {row.rider.user.fullName}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                      {row.rider.displayCode}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{row.completedCount}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--success)" }}>
                      {formatMoney(adminCurrency, row.earnings)}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                      {formatMoney(adminCurrency, row.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>
              <Users size={16} color="var(--brand-orange)" style={{ marginRight: 6, verticalAlign: -2 }} />
              All Riders Summary
            </h3>
            <p>
              {sortedAllRows.length} Accra riders · Page {currentPage} of {totalPages || 1}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                {["Rider", "Code", "Completed", "Earnings", "Commission"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr
                  key={row.rider.id}
                  onMouseEnter={() => setHoveredRow(row.rider.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    background: hoveredRow === row.rider.id ? "color-mix(in srgb, var(--brand-orange) 5%, transparent)" : "transparent",
                    transition: "background 0.15s ease",
                    cursor: "default",
                  }}
                >
                  <td style={{ fontWeight: 600 }}>{row.rider.user.fullName}</td>
                  <td><code style={{ fontSize: 12 }}>{row.rider.displayCode}</code></td>
                  <td>{row.completedCount}</td>
                  <td style={{ fontWeight: 700, color: row.earnings > 0 ? "var(--success)" : "var(--text-muted)" }}>
                    {formatMoney(adminCurrency, row.earnings)}
                  </td>
                  <td>{formatMoney(adminCurrency, row.commission)}</td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                    No riders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
