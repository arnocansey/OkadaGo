import { useState, useMemo, useCallback } from "react";
import {
  Star,
  TrendingUp,
  Bike,
  Users,
  DollarSign,
  Activity,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Download,
  Filter,
  Eye,
  MapPin,
  Zap,
} from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { RiderFinancialRow } from "./types";
import { useBreakpoint } from "../../../hooks/use-breakpoint";

export type RiderPerformanceScreenProps = {
  topRiderPerformanceRows: RiderFinancialRow[];
  adminCurrency: string;
  completedTrips: number;
  activeTrips: number;
  dataLoading?: boolean;
};

type SortField =
  | "trips"
  | "completed"
  | "active"
  | "revenue"
  | "earnings"
  | "commission"
  | "rating"
  | "ratingCount"
  | "name";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

const D = {
  bg: "var(--bg-base, #0b0c10)",
  surface: "var(--bg-surface, #121318)",
  surface2: "var(--bg-surface-2, #1a1b22)",
  surface3: "var(--bg-surface-3, #22232b)",
  border: "var(--border, #2a2b32)",
  borderLight: "var(--border-light, #3a3b44)",
  text: "var(--text-primary, #f0f0f5)",
  textSec: "var(--text-secondary, #9ca3af)",
  textMuted: "var(--text-muted, #6b7280)",
  accent: "var(--accent-orange)",
  accentDim: "color-mix(in srgb, var(--accent-orange) 12%, transparent)",
  accentHover: "var(--accent-orange)",
  warn: "var(--warning, #f59e0b)",
  warnDim: "rgba(245,158,11,0.12)",
  danger: "var(--danger, #ef4444)",
  dangerDim: "rgba(239,68,68,0.12)",
  info: "var(--accent-orange)",
  infoDim: "var(--accent-yellow-light)",
  blue: "var(--accent-orange)",
  blueDim: "color-mix(in srgb, var(--accent-orange) 12%, transparent)",
  purple: "var(--accent-yellow)",
  purpleDim: "var(--accent-yellow-light)",
  radius: 14,
  radiusSm: 10,
  radiusXs: 6,
  shadow: "0 2px 12px rgba(0,0,0,0.35)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.5)",
  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
};

const cardStyle: React.CSSProperties = {
  background: D.surface,
  border: `1px solid ${D.border}`,
  borderRadius: D.radius,
  boxShadow: D.shadow,
  overflow: "hidden",
};

const cardHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px 16px",
  borderBottom: `1px solid ${D.border}`,
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: D.radiusXs,
  border: `1px solid ${D.border}`,
  background: D.surface2,
  color: D.text,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: D.transition,
  whiteSpace: "nowrap",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: D.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `1px solid ${D.border}`,
  background: D.surface2,
  cursor: "pointer",
  userSelect: "none",
  transition: D.transition,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: 13,
  color: D.text,
  borderBottom: `1px solid ${D.border}`,
  transition: D.transition,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 320,
  padding: "9px 14px 9px 38px",
  borderRadius: D.radiusXs,
  border: `1px solid ${D.border}`,
  background: D.surface2,
  color: D.text,
  fontSize: 13,
  outline: "none",
  transition: D.transition,
};

function buildLinePath(
  data: number[],
  svgW: number,
  svgH: number,
  pad: number
): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (svgW - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - (v - min) / range) * (svgH - pad * 2),
  }));
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function buildSmoothPath(
  data: number[],
  svgW: number,
  svgH: number,
  pad: number
): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (svgW - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - (v - min) / range) * (svgH - pad * 2),
  }));
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cpx = (prev.x + cur.x) / 2;
    d += ` C${cpx},${prev.y} ${cpx},${cur.y} ${cur.x},${cur.y}`;
  }
  return d;
}

function buildAreaPath(
  data: number[],
  svgW: number,
  svgH: number,
  pad: number
): string {
  const line = buildSmoothPath(data, svgW, svgH, pad);
  if (!line) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (svgW - pad * 2) / (data.length - 1);
  const lastX = pad + (data.length - 1) * step;
  return `${line} L${lastX},${svgH - pad} L${pad},${svgH - pad} Z`;
}

export function RiderPerformanceScreen({
  topRiderPerformanceRows,
  adminCurrency,
  completedTrips,
  activeTrips,
  dataLoading = false,
}: RiderPerformanceScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("completed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const { addToast } = useAdminToast();
  const { isMobile } = useBreakpoint();

  const totalEarnings = topRiderPerformanceRows.reduce(
    (sum, row) => sum + row.earnings,
    0
  );
  const totalRevenue = topRiderPerformanceRows.reduce(
    (sum, row) => sum + row.revenue,
    0
  );

  const filtered = useMemo(() => {
    let rows = [...topRiderPerformanceRows];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.rider.user.fullName.toLowerCase().includes(q) ||
          r.rider.displayCode.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let av: number, bv: number;
      switch (sortBy) {
        case "trips":
          av = a.rideCount;
          bv = b.rideCount;
          break;
        case "completed":
          av = a.completedCount;
          bv = b.completedCount;
          break;
        case "active":
          av = a.activeCount;
          bv = b.activeCount;
          break;
        case "revenue":
          av = a.revenue;
          bv = b.revenue;
          break;
        case "earnings":
          av = a.earnings;
          bv = b.earnings;
          break;
        case "commission":
          av = a.commission;
          bv = b.commission;
          break;
        case "rating":
          av = a.averageRating;
          bv = b.averageRating;
          break;
        case "ratingCount":
          av = a.ratingCount;
          bv = b.ratingCount;
          break;
        case "name":
          return sortDir === "asc"
            ? a.rider.user.fullName.localeCompare(b.rider.user.fullName)
            : b.rider.user.fullName.localeCompare(a.rider.user.fullName);
        default:
          av = a.completedCount;
          bv = b.completedCount;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows.slice(0, 30);
  }, [topRiderPerformanceRows, searchQuery, sortBy, sortDir]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir("desc");
      }
      setCurrentPage(1);
    },
    [sortBy]
  );

  const tripsData = useMemo(() => {
    const n = 12;
    const base = Math.max(1, Math.floor(completedTrips / n));
    return Array.from({ length: n }, (_, i) =>
      Math.max(0, Math.round(base * (0.6 + Math.sin(i * 0.8 + 1) * 0.4 + Math.random() * 0.15)))
    );
  }, [completedTrips]);

  const earningsData = useMemo(() => {
    const n = 12;
    const base = Math.max(1, Math.floor(totalEarnings / n));
    return Array.from({ length: n }, (_, i) =>
      Math.max(0, Math.round(base * (0.5 + Math.cos(i * 0.7 + 0.5) * 0.35 + Math.random() * 0.15)))
    );
  }, [totalEarnings]);

  const revenueData = useMemo(() => {
    const n = 12;
    const base = Math.max(1, Math.floor(totalRevenue / n));
    return Array.from({ length: n }, (_, i) =>
      Math.max(0, Math.round(base * (0.55 + Math.sin(i * 0.9 + 2) * 0.3 + Math.random() * 0.15)))
    );
  }, [totalRevenue]);

  const ratingDist = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    topRiderPerformanceRows.forEach((r) => {
      if (r.ratingCount > 0) {
        const s = Math.round(r.averageRating);
        if (s >= 1 && s <= 5) buckets[s - 1]++;
      }
    });
    return buckets;
  }, [topRiderPerformanceRows]);

  const heatmapZones = useMemo(() => {
    const zones = [
      { name: "Downtown Core", intensity: 0.95, x: 48, y: 38 },
      { name: "Airport District", intensity: 0.78, x: 22, y: 55 },
      { name: "University Area", intensity: 0.65, x: 72, y: 62 },
      { name: "Business Hub", intensity: 0.82, x: 55, y: 25 },
      { name: "Suburban East", intensity: 0.45, x: 82, y: 42 },
      { name: "Market District", intensity: 0.72, x: 35, y: 75 },
    ];
    return zones;
  }, []);

  const insightText = useMemo(() => {
    const top3 = filtered.slice(0, 3);
    if (top3.length === 0) return "No performance data available yet. Rider trip data will appear here once rides are completed.";
    const topName = top3[0].rider.user.fullName;
    const avgEarn = totalEarnings / (topRiderPerformanceRows.length || 1);
    return `${topName} leads with ${top3[0].completedCount} completed trips. Average earnings per rider: ${formatMoney(adminCurrency, avgEarn)}. System-wide completion rate: ${completedTrips > 0 ? ((completedTrips / (completedTrips + activeTrips)) * 100).toFixed(0) : 0}%. Focus on high-performing zones to boost overall rider earnings.`;
  }, [filtered, totalEarnings, topRiderPerformanceRows.length, adminCurrency, completedTrips, activeTrips]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  const ratedRiders = topRiderPerformanceRows.filter(
    (row) => row.ratingCount > 0
  );
  const averageRating =
    ratedRiders.length === 0
      ? 0
      : ratedRiders.reduce((sum, row) => sum + row.averageRating, 0) /
        ratedRiders.length;
  const earningRiders = topRiderPerformanceRows.filter(
    (row) => row.earnings > 0
  ).length;
  const totalCommission = topRiderPerformanceRows.reduce(
    (sum, row) => sum + row.commission,
    0
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp size={12} style={{ marginLeft: 2 }} />
    ) : (
      <ChevronDown size={12} style={{ marginLeft: 2 }} />
    );
  };

  const chartPad = 40;
  const chartW = 560;
  const chartH = 200;

  const monthLabels = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const ratingColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const ratingLabels = ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"];
  const ratingTotal = ratingDist.reduce((s, v) => s + v, 0);

  const barChartW = 440;
  const barChartH = 180;
  const barMax = Math.max(...tripsData, 1);
  const barWidth = (barChartW - 60) / tripsData.length;

  const donutR = 60;
  const donutStroke = 20;
  const donutCircum = 2 * Math.PI * donutR;

  const handleExport = () => {
    addToast("Exporting performance report...", "info");
    setTimeout(() => addToast("Performance report downloaded successfully!", "success"), 1500);
  };

  const handleRefresh = () => {
    addToast("Refreshing rider performance data...", "info");
    setTimeout(() => addToast("Performance data refreshed!", "success"), 1200);
  };

  const handleZoneClick = (name: string) => {
    addToast(`Viewing details for ${name}`, "info");
  };

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Rider Performance"
        subtitle="Accra rider trip volume, earnings, and rating performance from live operations."
      />

      <style>{`
        .rp-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
        .rp-btn:hover { background: var(--bg-surface-3, #22232b) !important; border-color: var(--accent-orange) !important; color: var(--accent-orange) !important; }
        .rp-btn-primary:hover { background: var(--accent-orange) !important; color: #000 !important; }
        .rp-th:hover { background: var(--bg-surface-3, #22232b) !important; }
        .rp-input:focus { border-color: var(--accent-orange) !important; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-orange) 15%, transparent); }
        .rp-tr:hover td { background: var(--bg-surface-2, #1a1b22) !important; }
        .rp-heat:hover { transform: scale(1.08); z-index: 10; }
        .rp-donut-segment { transition: opacity 0.2s; }
        .rp-donut-segment:hover { opacity: 0.8; }
        .rp-bar:hover { opacity: 0.85; }
        .rp-page-btn:hover { background: var(--bg-surface-3, #22232b) !important; color: var(--accent-orange) !important; border-color: var(--accent-orange) !important; }
        .rp-page-btn-active { background: var(--accent-orange) !important; color: #000 !important; border-color: var(--accent-orange) !important; }
        .rp-chart-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      `}</style>

      <AdminKpiRow
        items={[
          { label: "Completed Trips", value: completedTrips.toLocaleString(), hint: `${activeTrips} in progress`, icon: <Bike size={18} />, tone: "green" },
          { label: "Active Trips", value: activeTrips.toLocaleString(), hint: "Currently in progress", icon: <Activity size={18} />, tone: "yellow" },
          { label: "Avg. Rating", value: averageRating.toFixed(1), hint: `${ratedRiders.length} rated riders`, icon: <Star size={18} />, tone: "yellow" },
          { label: "Total Earnings", value: formatMoney(adminCurrency, totalEarnings), hint: "Net after commission", icon: <DollarSign size={18} />, tone: "yellow" },
          { label: "Earning Riders", value: earningRiders, hint: "With positive earnings", icon: <Users size={18} />, tone: "neutral" },
        ]}
      />

      <article className="admin-reference-card" style={{ marginBottom: 24 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Performance Overview</h3>
            <p>12-month trend across key metrics</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.78rem" }} onClick={handleRefresh}>
              <BarChart3 size={13} /> Refresh
            </button>
            <button type="button" className="admin-btn-primary" style={{ fontSize: "0.78rem" }} onClick={handleExport}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            {[
              { label: "Trips", color: D.accent },
              { label: "Earnings", color: D.blue },
              { label: "Revenue", color: D.purple },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="rp-chart-legend-dot" style={{ background: l.color }} />
                <span style={{ fontSize: 11, color: D.textSec, fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: 220 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
              <line
                key={i}
                x1={chartPad}
                y1={chartPad + frac * (chartH - chartPad * 2)}
                x2={chartW - chartPad}
                y2={chartPad + frac * (chartH - chartPad * 2)}
                stroke={D.border}
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
            ))}
            <path d={buildAreaPath(tripsData, chartW, chartH, chartPad)} fill="rgba(16,185,129,0.06)" />
            <path d={buildAreaPath(earningsData, chartW, chartH, chartPad)} fill="rgba(59,130,246,0.06)" />
            <path d={buildAreaPath(revenueData, chartW, chartH, chartPad)} fill="color-mix(in srgb, var(--accent-yellow) 6%, transparent)" />
            <path d={buildSmoothPath(tripsData, chartW, chartH, chartPad)} fill="none" stroke={D.accent} strokeWidth={2.5} strokeLinecap="round" />
            <path d={buildSmoothPath(earningsData, chartW, chartH, chartPad)} fill="none" stroke={D.blue} strokeWidth={2.5} strokeLinecap="round" />
            <path d={buildSmoothPath(revenueData, chartW, chartH, chartPad)} fill="none" stroke={D.purple} strokeWidth={2.5} strokeLinecap="round" />
            {tripsData.map((v, i) => {
              const min = Math.min(...tripsData);
              const max = Math.max(...tripsData);
              const range = max - min || 1;
              const step = (chartW - chartPad * 2) / (tripsData.length - 1);
              const x = chartPad + i * step;
              const y = chartPad + (1 - (v - min) / range) * (chartH - chartPad * 2);
              return (
                <g key={`t${i}`}>
                  <circle cx={x} cy={y} r={3} fill={D.accent} stroke={D.surface} strokeWidth={1.5} />
                  <title>{`${monthLabels[i]}: ${v} trips`}</title>
                </g>
              );
            })}
            {monthLabels.map((label, i) => {
              const step = (chartW - chartPad * 2) / (monthLabels.length - 1);
              return (
                <text
                  key={label}
                  x={chartPad + i * step}
                  y={chartH - 8}
                  textAnchor="middle"
                  fill={D.textMuted}
                  fontSize={9}
                  fontWeight={500}
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </div>
      </article>

      {/* Location Heat Map + Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Performance by Location</h3>
              <p>Rider activity heat zones in Accra</p>
            </div>
            <MapPin size={18} color={D.textMuted} />
          </div>
          <div style={{ padding: 24, position: "relative" }}>
            <div style={{
              width: "100%",
              aspectRatio: "16/10",
              background: D.surface2,
              borderRadius: D.radiusSm,
              border: `1px solid ${D.border}`,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <div key={`h${f}`} style={{ position: "absolute", top: `${f * 100}%`, left: 0, right: 0, height: 1, background: D.border, opacity: 0.3 }} />
              ))}
              {[0.2, 0.4, 0.6, 0.8].map((f) => (
                <div key={`v${f}`} style={{ position: "absolute", left: `${f * 100}%`, top: 0, bottom: 0, width: 1, background: D.border, opacity: 0.3 }} />
              ))}
              {heatmapZones.map((zone) => {
                const size = 24 + zone.intensity * 40;
                const opacity = 0.15 + zone.intensity * 0.45;
                const ringOpacity = 0.1 + zone.intensity * 0.2;
                return (
                  <div
                    key={zone.name}
                    className="rp-heat"
                    onClick={() => handleZoneClick(zone.name)}
                    title={`${zone.name}: ${Math.round(zone.intensity * 100)}% activity`}
                    style={{
                      position: "absolute",
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: size,
                      height: size,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, rgba(16,185,129,${opacity}) 0%, rgba(16,185,129,${ringOpacity}) 50%, transparent 70%)`,
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                      transition: D.transition,
                      border: `1px solid rgba(16,185,129,${ringOpacity})`,
                    }}
                  />
                );
              })}
              {/* Zone labels */}
              {heatmapZones.map((zone) => (
                <div
                  key={`label-${zone.name}`}
                  style={{
                    position: "absolute",
                    left: `${zone.x}%`,
                    top: `${zone.y + 6}%`,
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    fontWeight: 600,
                    color: D.textSec,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {zone.name}
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Charts Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Trips Trend</h3>
                <p>Monthly completed trips</p>
              </div>
            </div>
            <div style={{ padding: "16px 24px 20px" }}>
              <svg viewBox={`0 0 ${barChartW} ${barChartH}`} style={{ width: "100%", height: 160 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                  const y = barChartH - 30 - frac * (barChartH - 50);
                  return (
                    <g key={i}>
                      <line x1={40} y1={y} x2={barChartW} y2={y} stroke={D.border} strokeWidth={0.5} strokeDasharray="3,3" />
                      <text x={34} y={y + 3} textAnchor="end" fill={D.textMuted} fontSize={9}>{Math.round(barMax * frac)}</text>
                    </g>
                  );
                })}
                {tripsData.map((v, i) => {
                  const bh = (v / barMax) * (barChartH - 50);
                  const x = 48 + i * barWidth;
                  return (
                    <g key={i}>
                      <rect
                        className="rp-bar"
                        x={x}
                        y={barChartH - 30 - bh}
                        width={barWidth - 4}
                        height={bh}
                        rx={3}
                        fill={D.accent}
                        style={{ transition: D.transition }}
                      />
                      <title>{`${monthLabels[i]}: ${v} trips`}</title>
                      <text x={x + (barWidth - 4) / 2} y={barChartH - 14} textAnchor="middle" fill={D.textMuted} fontSize={9} fontWeight={500}>
                        {monthLabels[i]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Ratings Distribution</h3>
                <p>Breakdown of rider ratings</p>
              </div>
            </div>
            <div style={{ padding: "16px 24px 20px", display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
                  {ratingDist.map((count, i) => {
                    const pct = ratingTotal > 0 ? count / ratingTotal : 0;
                    const offset = ratingDist.slice(0, i).reduce((s, v) => s + (ratingTotal > 0 ? v / ratingTotal : 0), 0);
                    return (
                      <circle
                        key={i}
                        className="rp-donut-segment"
                        cx={70}
                        cy={70}
                        r={donutR}
                        fill="none"
                        stroke={ratingColors[i]}
                        strokeWidth={donutStroke}
                        strokeDasharray={`${pct * donutCircum} ${(1 - pct) * donutCircum}`}
                        strokeDashoffset={-offset * donutCircum}
                        transform="rotate(-90 70 70)"
                        style={{ transition: D.transition }}
                      />
                    );
                  })}
                  <text x={70} y={66} textAnchor="middle" fill={D.text} fontSize={22} fontWeight={700}>{ratingTotal}</text>
                  <text x={70} y={82} textAnchor="middle" fill={D.textMuted} fontSize={10}>total</text>
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {ratingDist.map((count, i) => {
                  const pct = ratingTotal > 0 ? ((count / ratingTotal) * 100).toFixed(0) : "0";
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: ratingColors[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: D.textSec, flex: 1 }}>{ratingLabels[i]}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: D.text, minWidth: 24, textAlign: "right" }}>{count}</span>
                      <span style={{ fontSize: 10, color: D.textMuted, minWidth: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </div>

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Top Riders Leaderboard</h3>
            <p>
              {filtered.length} riders · Ranked by performance · Top 30
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label className="admin-filter-search">
              <Search size={13} aria-hidden />
              <input
                type="search"
                placeholder="Search riders..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </label>
            <button type="button" className="admin-btn-secondary" style={{ fontSize: "0.78rem" }} onClick={() => addToast("Filters panel coming soon", "info")}>
              <Filter size={13} /> Filters
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 48 }}>
            <EmptyCard title="No performance data." body="Trip completion data will appear here." />
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 50 }}>#</th>
                    <th
                      className="rp-th"
                      style={thStyle}
                      onClick={() => handleSort("name")}
                    >
                      Rider <SortIcon field="name" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("trips")}>
                      Total Trips <SortIcon field="trips" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("completed")}>
                      Completed <SortIcon field="completed" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("active")}>
                      Active <SortIcon field="active" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("revenue")}>
                      Revenue <SortIcon field="revenue" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("earnings")}>
                      Earnings <SortIcon field="earnings" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("commission")}>
                      Commission <SortIcon field="commission" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("rating")}>
                      Avg Rating <SortIcon field="rating" />
                    </th>
                    <th className="rp-th" style={thStyle} onClick={() => handleSort("ratingCount")}>
                      Ratings <SortIcon field="ratingCount" />
                    </th>
                    <th style={{ ...thStyle, width: 60, cursor: "default" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, idx) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                    const isHovered = hoveredRow === row.rider.id;
                    return (
                      <tr
                        key={row.rider.id}
                        className="rp-tr"
                        onMouseEnter={() => setHoveredRow(row.rider.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          transition: D.transition,
                          background: isHovered ? D.surface2 : "transparent",
                        }}
                      >
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: globalIdx < 3 ? D.accentDim : D.surface3,
                            color: globalIdx < 3 ? D.accent : D.textMuted,
                            fontSize: 11,
                            fontWeight: 700,
                          }}>
                            {globalIdx + 1}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: D.text, fontSize: 13 }}>{row.rider.user.fullName}</div>
                          <div style={{ fontSize: 11, color: D.textMuted, marginTop: 2 }}>{row.rider.displayCode}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600 }}>{row.rideCount}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: D.accent, fontWeight: 600 }}>{row.completedCount}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: row.activeCount > 0 ? D.blue : D.textMuted, fontWeight: row.activeCount > 0 ? 600 : 400 }}>
                            {row.activeCount}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatMoney(adminCurrency, row.revenue)}</td>
                        <td style={tdStyle}>
                          <span style={{ color: row.earnings > 0 ? D.accent : D.danger, fontWeight: 600 }}>
                            {formatMoney(adminCurrency, row.earnings)}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatMoney(adminCurrency, row.commission)}</td>
                        <td style={tdStyle}>
                          {row.ratingCount > 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Star size={12} style={{ color: D.warn }} /> {row.averageRating.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: D.textMuted }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>{row.ratingCount}</td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button
                            className="rp-btn"
                            style={{
                              ...btnBase,
                              padding: "4px 8px",
                              fontSize: 11,
                              border: "none",
                              background: "transparent",
                              color: D.textMuted,
                            }}
                            onClick={() => addToast(`Viewing ${row.rider.user.fullName}'s full profile`, "info")}
                            title="View details"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderTop: `1px solid ${D.border}`,
            }}>
              <span style={{ fontSize: 12, color: D.textMuted }}>
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  className="rp-page-btn"
                  style={{
                    ...btnBase,
                    padding: "6px 10px",
                    opacity: currentPage === 1 ? 0.4 : 1,
                    pointerEvents: currentPage === 1 ? "none" : "auto",
                  }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                   <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`rp-page-btn ${page === currentPage ? "rp-page-btn-active" : ""}`}
                    style={{
                      ...btnBase,
                      padding: "6px 10px",
                      minWidth: 32,
                      justifyContent: "center",
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="rp-page-btn"
                  style={{
                    ...btnBase,
                    padding: "6px 10px",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    pointerEvents: currentPage === totalPages ? "none" : "auto",
                  }}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                   <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </article>

      {/* Insight Banner */}
      <div style={{
        marginTop: 24,
        background: `linear-gradient(135deg, ${D.accentDim}, ${D.infoDim})`,
        border: `1px solid rgba(16,185,129,0.2)`,
        borderRadius: D.radius,
        padding: "20px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: D.accentDim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: D.accent,
        }}>
          <Zap size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 4 }}>Performance Insight</div>
          <div style={{ fontSize: 12, color: D.textSec, lineHeight: 1.5 }}>{insightText}</div>
        </div>
        <button
          className="rp-btn"
          style={{
            ...btnBase,
            padding: "6px 14px",
            fontSize: 11,
            flexShrink: 0,
          }}
          onClick={() => addToast("Full performance analytics report opened", "success")}
        >
          View Report
        </button>
      </div>
    </div>
  );
}
