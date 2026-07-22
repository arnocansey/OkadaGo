import { useState } from "react";
import { useAdminToast } from "./AdminToast";
import { formatMoney } from "@/lib/currency";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable, SkeletonChart, SkeletonDonut } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
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
  ArrowUpRight,
  ArrowDownRight,
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
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  if (dataLoading) {
    return (
      <div className="exact-admin-screen" style={{ display: "flex", flexDirection: "column", gap: 20, padding: isMobile ? "16px 12px" : "24px 28px", minHeight: "100vh" }}>
        <SkeletonKPI count={5} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 14 }}>
          <SkeletonChart />
          <SkeletonDonut />
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  const tabs: Array<"Daily" | "Weekly" | "Monthly"> = ["Daily", "Weekly", "Monthly"];

  const tripEarnings = totalRiderGrossRevenue - totalRiderCommission;
  const incentives = totalRiderGrossRevenue * 0.05;
  const netEarnings = totalRiderEarnings + incentives;
  const earningRiders = riderFinancialRows.filter((row) => row.earnings > 0);

  const kpis = [
    { label: "Total Earnings", value: totalRiderGrossRevenue, icon: DollarSign, color: "var(--brand-orange)", change: "+12.5%", up: true },
    { label: "Trip Earnings", value: tripEarnings, icon: TrendingUp, color: "var(--success)", change: "+8.2%", up: true },
    { label: "Incentives", value: incentives, icon: Award, color: "var(--brand-yellow)", change: "+24.1%", up: true },
    { label: "Commissions", value: -totalRiderCommission, icon: Target, color: "var(--danger)", change: "-3.4%", up: false },
    { label: "Net Earnings", value: netEarnings, icon: TrendingUp, color: "var(--info)", change: "+15.7%", up: true },
  ];

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
    { title: "Early Bird Bonus", desc: "$2.50 per ride before 7 AM", badge: "Active" },
    { title: "Peak Hour Boost", desc: "15% extra on rides 5-8 PM", badge: "Active" },
    { title: "Weekend Warrior", desc: "$5 flat bonus for 10+ weekend rides", badge: "Active" },
    { title: "Referral Bonus", desc: "$50 per new rider referred", badge: "Active" },
    { title: "Streak Incentive", desc: "$10 bonus for 5-day consecutive rides", badge: "Paused" },
  ];

  const rankColors = ["var(--brand-orange)", "var(--brand-yellow)", "#cd7f32"];

  return (
    <div className="exact-admin-screen" style={{ display: "flex", flexDirection: "column", gap: 20, padding: isMobile ? "16px 12px" : "24px 28px", minHeight: "100vh", fontFamily: "var(--font-family)" }}>
      <AdminPageHeader
        title="Rider Earnings"
        subtitle="Review rider earnings estimated from completed trips and platform commission."
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            {(["View All", "View Full History"] as const).map((label) => (
              <button
                key={label}
                onClick={() => addToast(label + " clicked")}
                style={{
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-orange)";
                  e.currentTarget.style.background = "color-mix(in srgb, var(--accent-orange) 10%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.background = "var(--bg-card)";
                }}
              >
                {label === "View All" ? <Eye size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> : <Download size={14} style={{ marginRight: 6, verticalAlign: -2 }} />}
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, width: isMobile ? "100%" : "fit-content", overflowX: isMobile ? "auto" : undefined }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? "#fff" : "var(--text-secondary)",
              background: activeTab === tab ? "var(--brand-orange)" : "transparent",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab === "Daily" ? <Calendar size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> : null}
            {tab}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(5, 1fr)", gap: 14 }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "all 0.25s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = kpi.color;
                e.currentTarget.style.boxShadow = `0 0 20px color-mix(in srgb, ${kpi.color} 15%, transparent)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `color-mix(in srgb, ${kpi.color} 12%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                {formatMoney(adminCurrency, Math.abs(kpi.value))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: kpi.up ? "var(--success)" : "var(--danger)" }}>
                {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr", gap: 14 }}>
        {/* Earnings Overview Line Chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Earnings Overview</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Earnings & trips over {activeTab.toLowerCase()} period</p>
            </div>
            <button
              onClick={() => addToast("Options clicked")}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; e.currentTarget.style.color = "var(--brand-orange)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 18, marginBottom: 12, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--text-primary)", display: "inline-block" }} />
              <span style={{ color: "var(--text-muted)" }}>Trips</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--brand-orange)", display: "inline-block" }} />
              <span style={{ color: "var(--text-muted)" }}>Earnings</span>
            </span>
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
        </div>

        {/* Donut Chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", alignSelf: "flex-start" }}>Earnings Breakdown</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)", alignSelf: "flex-start" }}>Revenue distribution</p>
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
        </div>
      </div>

      {/* Bar Chart & Incentives */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr", gap: 14 }}>
        {/* Bar Chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Earnings by Day of Week</h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Weekly breakdown</p>
            </div>
            <button
              onClick={() => addToast("Options clicked")}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; e.currentTarget.style.color = "var(--brand-orange)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
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
        </div>

        {/* Incentives Sidebar */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
                <Zap size={16} color="var(--brand-yellow)" />
                Incentives & Bonuses
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Active rider programs</p>
            </div>
            <button
              onClick={() => addToast("Options clicked")}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; e.currentTarget.style.color = "var(--brand-orange)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
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
        </div>
      </div>

      {/* Top Earners Table */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
              <Star size={16} color="var(--brand-yellow)" />
              Top Earning Riders
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>Top 15 earners this period</p>
          </div>
          <button
            onClick={() => addToast("View Full History clicked")}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--brand-orange)",
              background: "transparent",
              border: "1px solid var(--brand-orange)",
              borderRadius: 7,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--brand-orange) 10%, transparent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
      </div>

      {/* Summary Table with Pagination */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px",
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
              <Users size={16} color="var(--brand-orange)" />
              All Riders Summary
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              {sortedAllRows.length} riders · Page {currentPage} of {totalPages || 1}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }}
              disabled={currentPage <= 1}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: currentPage <= 1 ? "var(--bg-primary)" : "transparent",
                color: currentPage <= 1 ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
              disabled={currentPage >= totalPages}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: currentPage >= totalPages ? "var(--bg-primary)" : "transparent",
                color: currentPage >= totalPages ? "var(--text-muted)" : "var(--text-primary)",
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                opacity: currentPage >= totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Rider", "Code", "Completed", "Earnings", "Commission"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
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
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {row.rider.user.fullName}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                    {row.rider.displayCode}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{row.completedCount}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: row.earnings > 0 ? "var(--success)" : "var(--text-muted)" }}>
                    {formatMoney(adminCurrency, row.earnings)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>
                    {formatMoney(adminCurrency, row.commission)}
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                    No riders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
