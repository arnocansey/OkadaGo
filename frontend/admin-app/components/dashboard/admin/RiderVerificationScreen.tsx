import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Shield,
  Calendar,
  MessageSquare,
  Eye,
  BadgeCheck,
  ClipboardCheck,
  Users,
  Star,
} from "lucide-react";
import type { RiderRecord } from "./types";
import { formatDateTime, statusTone } from "./utils";
import { useAdminToast } from "./AdminToast";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable } from "./AdminSkeleton";

export type RiderVerificationScreenProps = {
  riderVerificationRows: {
    rider: RiderRecord;
    verificationStatus: string;
    hasVehicle: boolean;
    hasZone: boolean;
    hasContact: boolean;
  }[];
  riderVerificationStats: {
    pending: number;
    approved: number;
    rejected: number;
    underReview: number;
    today: number;
  };
  onRiderApproval?: (riderProfileId: string, action: "approve" | "reject", reason?: string) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

type SubTab = "all" | "pending" | "documents" | "interview" | "background";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "all", label: "All Applications" },
  { key: "pending", label: "Pending Review" },
  { key: "documents", label: "Document Verification" },
  { key: "interview", label: "Interview Scheduling" },
  { key: "background", label: "Background Check" },
];

const ROWS_PER_PAGE = 5;

/* ── tiny helper ── */
function statusColor(s: string): string {
  const t = statusTone(s);
  if (t === "success") return "#22c55e";
  if (t === "warning") return "#f59e0b";
  if (t === "danger") return "#ef4444";
  return "#94a3b8";
}

/* ════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                        */
/* ════════════════════════════════════════════════════════════════════ */

export function RiderVerificationScreen({
  riderVerificationRows,
  riderVerificationStats,
  onRiderApproval,
  isMutating = false,
  dataLoading = false,
}: RiderVerificationScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile, isTablet } = useBreakpoint();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  if (dataLoading) {
    return (
      <div style={{ padding: 32, background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  /* ── derived ── */
  const filteredRows = riderVerificationRows.filter((row) => {
    const matchSearch =
      searchQuery === "" ||
      row.rider.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.rider.displayCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === "all" || row.verificationStatus.toLowerCase() === statusFilter.toLowerCase();

    const matchTab =
      activeSubTab === "all" ||
      (activeSubTab === "pending" && row.verificationStatus.toLowerCase() === "pending") ||
      (activeSubTab === "documents" && row.verificationStatus.toLowerCase() === "under review") ||
      (activeSubTab === "interview" && row.verificationStatus.toLowerCase() === "pending") ||
      (activeSubTab === "background" && row.verificationStatus.toLowerCase() === "pending");

    return matchSearch && matchStatus && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const selectedRow =
    selectedApplication !== null ? riderVerificationRows[selectedApplication] : null;

  /* ── KPI config ── */
  const kpis = [
    {
      label: "Pending",
      value: riderVerificationStats.pending,
      sub: "Awaiting review",
      color: "var(--accent-yellow)",
      bg: "var(--accent-yellow-light)",
      icon: Clock,
    },
    {
      label: "Under Review",
      value: riderVerificationStats.underReview,
      sub: "In verification",
      color: "var(--accent-orange)",
      bg: "color-mix(in srgb, var(--accent-orange) 15%, transparent)",
      icon: Eye,
    },
    {
      label: "Approved",
      value: riderVerificationStats.approved,
      sub: "Fully verified",
      color: "var(--color-success)",
      bg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
      icon: CheckCircle,
    },
    {
      label: "Rejected",
      value: riderVerificationStats.rejected,
      sub: "Declined",
      color: "var(--color-danger)",
      bg: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
      icon: XCircle,
    },
    {
      label: "Applied Today",
      value: riderVerificationStats.today,
      sub: "New applicants",
      color: "var(--text-secondary)",
      bg: "color-mix(in srgb, var(--text-secondary) 15%, transparent)",
      icon: BadgeCheck,
    },
  ];

  /* ── action handlers ── */
  const handleVerify = (riderId: string, riderName: string) => {
    if (onRiderApproval) {
      onRiderApproval(riderId, "approve");
    } else {
      addToast(`Verification started for ${riderName}`, "info");
    }
  };
  const handleReject = (riderId: string, riderName: string) => {
    if (onRiderApproval) {
      onRiderApproval(riderId, "reject");
    } else {
      addToast(`Application rejected for ${riderName}`, "error");
    }
  };
  const handleApproveAll = () => {
    addToast("Bulk approval triggered for all eligible riders", "success");
  };
  const handleRequestInfo = (riderName: string) => {
    addToast(`Information requested from ${riderName}`, "info");
  };
  const handleScheduleInterview = (riderName: string) => {
    addToast(`Interview scheduled for ${riderName}`, "success");
  };
  const handleExportReport = () => {
    addToast("Export report generated — download starting…", "success");
  };

  /* ════════════════════════════════════════════════════════════════ */
  /*  STYLES                                                       */
  /* ════════════════════════════════════════════════════════════════ */

  const S = {
    root: {
      background: "var(--bg-primary)",
      minHeight: "100vh",
      padding: 32,
      fontFamily: "var(--font-family)",
      color: "var(--text-primary)",
      position: "relative" as const,
    } as React.CSSProperties,

    /* KPI row */
    kpiRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 16,
      marginBottom: 28,
    } as React.CSSProperties,
    kpi: (c: string, bg: string): React.CSSProperties => ({
      background: bg,
      border: `1px solid ${c}22`,
      borderRadius: 14,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      transition: "transform .15s, box-shadow .15s",
    }),
    kpiIcon: (c: string): React.CSSProperties => ({
      width: 44,
      height: 44,
      borderRadius: 12,
      background: `${c}22`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }),
    kpiValue: {
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1.1,
    } as React.CSSProperties,
    kpiLabel: {
      fontSize: 12,
      color: "var(--text-secondary)",
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
      marginTop: 2,
    } as React.CSSProperties,
    kpiSub: {
      fontSize: 11,
      color: "var(--text-secondary)",
      marginTop: 1,
    } as React.CSSProperties,

    /* card shell */
    card: {
      background: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: 16,
      overflow: "hidden",
    } as React.CSSProperties,
    cardHead: {
      padding: "20px 24px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap" as const,
      gap: 12,
    } as React.CSSProperties,
    title: {
      fontSize: 18,
      fontWeight: 700,
      margin: 0,
      color: "var(--text-primary)",
    } as React.CSSProperties,
    subtitle: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 2,
    } as React.CSSProperties,

    /* sub-tabs */
    tabBar: {
      display: "flex",
      gap: 4,
      padding: "16px 24px 0",
      borderBottom: "1px solid var(--border-color)",
      overflowX: "auto" as const,
    } as React.CSSProperties,
    tab: (active: boolean): React.CSSProperties => ({
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? "#f1f5f9" : "#64748b",
      background: active ? "var(--accent-yellow-light)" : "transparent",
      border: "none",
      borderBottom: active ? "2px solid var(--accent-orange)" : "2px solid transparent",
      borderRadius: "8px 8px 0 0",
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      transition: "all .15s",
    }),

    /* toolbar */
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 24px",
      flexWrap: "wrap" as const,
    } as React.CSSProperties,
    searchBox: {
      flex: "1 1 220px",
      position: "relative" as const,
    } as React.CSSProperties,
    searchInput: {
      width: "100%",
      padding: "10px 14px 10px 40px",
      fontSize: 13,
      borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      outline: "none",
      transition: "border-color .15s",
    } as React.CSSProperties,
    select: {
      padding: "10px 14px",
      fontSize: 13,
      borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      outline: "none",
      cursor: "pointer",
    } as React.CSSProperties,
    btn: (variant: "primary" | "outline" | "danger" | "success" | "info"): React.CSSProperties => {
      const base: React.CSSProperties = {
        padding: "10px 18px",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "all .15s",
        whiteSpace: "nowrap" as const,
      };
      const map: Record<string, React.CSSProperties> = {
        primary: { background: "var(--accent-orange)", color: "#fff" },
        outline: {
          background: "transparent",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
        },
        danger: { background: "#dc2626", color: "#fff" },
        success: { background: "#16a34a", color: "#fff" },
        info: { background: "#0891b2", color: "#fff" },
      };
      return { ...base, ...map[variant] };
    },

    /* table */
    tableWrap: {
      overflowX: "auto" as const,
    } as React.CSSProperties,
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      fontSize: 13,
    } as React.CSSProperties,
    th: {
      textAlign: "left" as const,
      padding: "12px 16px",
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: 0.7,
      color: "var(--text-muted)",
      borderBottom: "1px solid var(--border-color)",
      whiteSpace: "nowrap" as const,
    } as React.CSSProperties,
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid var(--border-color)",
      verticalAlign: "middle" as const,
    } as React.CSSProperties,
    tr: (i: number): React.CSSProperties => ({
      background: hoveredRow === i ? "color-mix(in srgb, var(--accent-orange) 6%, transparent)" : "transparent",
      cursor: "pointer",
      transition: "background .12s",
    }),

    /* status pill */
    pill: (color: string): React.CSSProperties => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: `${color}18`,
      border: `1px solid ${color}33`,
    }),
    dot: (color: string): React.CSSProperties => ({
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: color,
    }),

    /* pagination */
    pagination: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 24px",
      borderTop: "1px solid var(--border-color)",
    } as React.CSSProperties,
    pageBtn: (active: boolean): React.CSSProperties => ({
      width: 34,
      height: 34,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: active ? "none" : "1px solid var(--border-color)",
      background: active ? "var(--accent-orange)" : "transparent",
      color: active ? "#fff" : "#94a3b8",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all .12s",
    }),

    /* detail overlay */
    overlay: {
      position: "fixed" as const,
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "flex-end",
    } as React.CSSProperties,
    panel: {
      width: 520,
      maxWidth: "100%",
      height: "100%",
      background: "var(--bg-card)",
      borderLeft: "1px solid var(--border-color)",
      overflowY: "auto" as const,
      padding: 32,
      position: "relative" as const,
    } as React.CSSProperties,
    closeBtn: {
      position: "absolute" as const,
      top: 16,
      right: 16,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid var(--border-color)",
      borderRadius: 8,
      width: 34,
      height: 34,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "var(--text-muted)",
    } as React.CSSProperties,

    /* detail sections */
    detailSection: {
      marginBottom: 28,
    } as React.CSSProperties,
    sectionLabel: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      color: "var(--text-muted)",
      marginBottom: 14,
    } as React.CSSProperties,
    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid var(--border-color)",
      fontSize: 13,
    } as React.CSSProperties,
    infoIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: "var(--accent-yellow-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "var(--accent-orange)",
    } as React.CSSProperties,
    stepCard: (done: boolean): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px",
      borderRadius: 10,
      border: `1px solid ${done ? "#22c55e33" : "var(--border-color)"}`,
      background: done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
      marginBottom: 10,
    }),
    stepIcon: (done: boolean): React.CSSProperties => ({
      width: 36,
      height: 36,
      borderRadius: 10,
      background: done ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: done ? "#22c55e" : "#64748b",
    }),
    docCard: {
      padding: "16px",
      borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "rgba(255,255,255,0.02)",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 14,
    } as React.CSSProperties,
    docIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      background: "rgba(6,182,212,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      color: "#06b6d4",
    } as React.CSSProperties,
    actionRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 10,
      marginTop: 24,
      paddingTop: 24,
      borderTop: "1px solid var(--border-color)",
    } as React.CSSProperties,
  };

  /* ════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                       */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="exact-admin-screen" style={S.root}>
      <AdminPageHeader
        title="Rider Verification"
        subtitle="Review rider approval readiness using live profile, vehicle, zone, and account data."
      />

      {/* ── KPI Cards ── */}
      <div style={{ ...S.kpiRow, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : S.kpiRow.gridTemplateColumns }}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={S.kpi(k.color, k.bg)}>
              <div style={S.kpiIcon(k.color)}>
                <Icon size={22} color={k.color} />
              </div>
              <div>
                <div style={S.kpiLabel}>{k.label}</div>
                <div style={{ ...S.kpiValue, color: k.color }}>{k.value}</div>
                <div style={S.kpiSub}>{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Card ── */}
      <div style={S.card}>
        {/* header */}
        <div style={S.cardHead}>
          <div>
            <h3 style={S.title}>Rider Verification Queue</h3>
            <p style={S.subtitle}>
              Review and manage rider onboarding — {filteredRows.length} application
              {filteredRows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button style={S.btn("success")} onClick={handleApproveAll}>
            <CheckCircle size={15} /> Approve All Eligible
          </button>
        </div>

        {/* sub-tabs */}
        <div style={S.tabBar}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              style={S.tab(activeSubTab === t.key)}
              onClick={() => {
                setActiveSubTab(t.key);
                setCurrentPage(1);
                setSelectedApplication(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* toolbar */}
        <div style={{ ...S.toolbar, flexWrap: "wrap" }}>
          <div style={S.searchBox}>
            <Search
              size={16}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search by name or code…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={S.searchInput}
            />
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={15} style={{ color: "var(--text-muted)" }} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={S.select}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button style={S.btn("outline")} onClick={handleExportReport}>
            <Download size={15} /> Export Report
          </button>
        </div>

        {/* table */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Rider</th>
                <th style={S.th}>Code</th>
                <th style={S.th}>Contact</th>
                <th style={S.th}>Vehicle</th>
                <th style={S.th}>Zone</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Applied</th>
                <th style={{ ...S.th, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 60,
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 14,
                    }}
                  >
                    No riders match your filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const globalIdx = (safePage - 1) * ROWS_PER_PAGE + idx;
                  const { rider, verificationStatus, hasVehicle, hasZone, hasContact } = row;
                  const sc = statusColor(verificationStatus);
                  return (
                    <tr
                      key={rider.id}
                      style={S.tr(idx)}
                      onMouseEnter={() => setHoveredRow(idx)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setSelectedApplication(globalIdx)}
                    >
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600 }}>{rider.user.fullName}</span>
                          {rider.lastLocationMocked ? (
                            <span
                              title={
                                rider.lastLocationMockedAt
                                  ? `Mock GPS flagged ${formatDateTime(rider.lastLocationMockedAt)}`
                                  : "Mock GPS flagged"
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 6px",
                                borderRadius: 6,
                                background: "rgba(239,68,68,0.12)",
                                color: "#ef4444",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              <AlertTriangle size={12} /> Mock GPS
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {rider.user.phoneE164}
                        </div>
                      </td>
                      <td style={S.td}>
                        <code
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "var(--accent-yellow-light)",
                            color: "var(--accent-orange)",
                            fontSize: 12,
                          }}
                        >
                          {rider.displayCode}
                        </code>
                      </td>
                      <td style={S.td}>
                        {hasContact ? (
                          <CheckCircle size={16} color="#22c55e" />
                        ) : (
                          <XCircle size={16} color="#ef4444" />
                        )}
                      </td>
                      <td style={S.td}>
                        {hasVehicle ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle size={16} color="#22c55e" />
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {rider.vehicle?.plateNumber}
                              {rider.vehicle?.vehicleType ? ` · ${rider.vehicle.vehicleType.toLowerCase()}` : ""}
                            </span>
                          </span>
                        ) : (
                          <XCircle size={16} color="#ef4444" />
                        )}
                      </td>
                      <td style={S.td}>
                        {hasZone ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle size={16} color="#22c55e" />
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {rider.serviceZone?.name}
                            </span>
                          </span>
                        ) : (
                          <XCircle size={16} color="#ef4444" />
                        )}
                      </td>
                      <td style={S.td}>
                        <span style={S.pill(sc)}>
                          <span style={S.dot(sc)} />
                          {verificationStatus}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: "var(--text-muted)", fontSize: 12 }}>
                        {rider.createdAt ? formatDateTime(rider.createdAt) : "—"}
                      </td>
                      <td
                        style={{ ...S.td, textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            style={{
                              ...S.btn("primary"),
                              padding: "6px 12px",
                              fontSize: 11,
                            }}
                            onClick={() => handleVerify(rider.id, rider.user.fullName)}
                          >
                            Verify
                          </button>
                          <button
                            style={{
                              ...S.btn("danger"),
                              padding: "6px 12px",
                              fontSize: 11,
                            }}
                            onClick={() => handleReject(rider.id, rider.user.fullName)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div style={S.pagination}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Page {safePage} of {totalPages} · {filteredRows.length} result
            {filteredRows.length !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={S.pageBtn(false)}
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                style={S.pageBtn(p === safePage)}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              style={S.pageBtn(false)}
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Detail Slide-over ── */}
      {selectedRow && (
        <div style={{ ...S.overlay, padding: isMobile ? "16px 8px" : S.overlay.padding }} onClick={() => setSelectedApplication(null)}>
            <div
              style={{
                ...S.panel,
                width: isMobile ? "100%" : S.panel.width,
                padding: isMobile ? 16 : S.panel.padding,
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <button
              style={S.closeBtn}
              onClick={() => setSelectedApplication(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* rider header */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "var(--accent-yellow-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <User size={26} color="var(--accent-orange)" />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "var(--text-primary)",
                }}
              >
                {selectedRow.rider.user.fullName}
              </h2>
              <span style={S.pill(statusColor(selectedRow.verificationStatus))}>
                <span style={S.dot(statusColor(selectedRow.verificationStatus))} />
                {selectedRow.verificationStatus}
              </span>
            </div>

            {/* rider info */}
            <div style={S.detailSection}>
              <div style={S.sectionLabel}>Rider Information</div>
              {[
                { icon: Phone, label: "Phone", value: selectedRow.rider.user.phoneE164 },
                { icon: Mail, label: "Email", value: selectedRow.rider.user.email || "—" },
                { icon: BadgeCheck, label: "Code", value: selectedRow.rider.displayCode },
                {
                  icon: MapPin,
                  label: "Zone",
                  value: selectedRow.rider.serviceZone?.name || "Unassigned",
                },
                {
                  icon: Car,
                  label: "Vehicle",
                  value: selectedRow.rider.vehicle
                    ? `${selectedRow.rider.vehicle.plateNumber} · ${selectedRow.rider.vehicle.make}${
                        selectedRow.rider.vehicle.vehicleType
                          ? ` (${selectedRow.rider.vehicle.vehicleType.toLowerCase()})`
                          : ""
                      }`
                    : "None",
                },
                {
                  icon: ClipboardCheck,
                  label: "Job preference",
                  value: selectedRow.rider.jobPreference
                    ? selectedRow.rider.jobPreference.toLowerCase().replace(/_/g, " ")
                    : "both",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={S.infoRow}>
                  <div style={S.infoIcon}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* verification steps */}
            <div style={S.detailSection}>
              <div style={S.sectionLabel}>Verification Steps</div>
              {[
                {
                  label: "Identity Verification",
                  desc: "National ID / Passport validated",
                  done: selectedRow.hasContact,
                  icon: Shield,
                },
                {
                  label: "Document Review",
                  desc: "License, insurance, registration checked",
                  done: selectedRow.hasVehicle,
                  icon: FileText,
                },
                {
                  label: "Vehicle Inspection",
                  desc: "Physical or photo-based vehicle check",
                  done: selectedRow.hasVehicle,
                  icon: Car,
                },
                {
                  label: "Zone Assignment",
                  desc: "Assigned to active service zone",
                  done: selectedRow.hasZone,
                  icon: MapPin,
                },
                {
                  label: "Background Check",
                  desc: "Criminal & driving history review",
                  done: false,
                  icon: ClipboardCheck,
                },
              ].map(({ label, desc, done, icon: Icon }) => (
                <div key={label} style={{ ...S.stepCard(done), width: isMobile ? "100%" : undefined }}>
                  <div style={S.stepIcon(done)}>
                    {done ? <CheckCircle size={16} /> : <Icon size={16} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* documents */}
            <div style={S.detailSection}>
              <div style={S.sectionLabel}>Uploaded Documents</div>
              {[
                { name: "National ID Card", status: "Verified", date: "2 days ago" },
                { name: "Driver's License", status: "Pending", date: "2 days ago" },
                { name: "Vehicle Registration", status: "Verified", date: "1 day ago" },
                { name: "Insurance Certificate", status: "Under Review", date: "1 day ago" },
              ].map((doc) => (
                <div key={doc.name} style={{ ...S.docCard, width: isMobile ? "100%" : undefined }}>
                  <div style={S.docIcon}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Uploaded {doc.date}
                    </div>
                  </div>
                  <span
                    style={{
                      ...S.pill(
                        doc.status === "Verified"
                          ? "#22c55e"
                          : doc.status === "Pending"
                            ? "#f59e0b"
                            : "var(--accent-orange)",
                      ),
                      fontSize: 11,
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>

            {/* action buttons */}
            <div style={S.actionRow}>
              <button
                style={S.btn("primary")}
                onClick={() => handleVerify(selectedRow.rider.id, selectedRow.rider.user.fullName)}
              >
                <BadgeCheck size={15} /> Verify
              </button>
              <button
                style={S.btn("danger")}
                onClick={() => handleReject(selectedRow.rider.id, selectedRow.rider.user.fullName)}
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                style={S.btn("success")}
                onClick={handleApproveAll}
              >
                <CheckCircle size={15} /> Approve All
              </button>
              <button
                style={S.btn("info")}
                onClick={() => handleRequestInfo(selectedRow.rider.user.fullName)}
              >
                <MessageSquare size={15} /> Request Info
              </button>
              <button
                style={S.btn("primary")}
                onClick={() => handleScheduleInterview(selectedRow.rider.user.fullName)}
              >
                <Calendar size={15} /> Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
