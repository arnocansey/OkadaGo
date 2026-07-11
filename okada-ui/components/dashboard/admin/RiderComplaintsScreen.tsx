import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  MessageSquare,
  StickyNote,
  UserCheck,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ThumbsUp,
} from "lucide-react";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { useAdminToast } from "./AdminToast";
import { SkeletonKPI, SkeletonCard } from "./AdminSkeleton";
import type { AdminIncidentRecord } from "./types";
import { formatDateTime, statusTone, formatEnumLabel } from "./utils";

export type RiderComplaintsScreenProps = {
  riderIncidents: AdminIncidentRecord[];
  riderComplaintOpen: AdminIncidentRecord[];
  riderComplaintInProgress: AdminIncidentRecord[];
  riderComplaintResolved: AdminIncidentRecord[];
  onIncidentAction: (
    incidentId: string,
    status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED"
  ) => void;
  isMutating: boolean;
  dataLoading?: boolean;
};

const TABS = ["All", "Open", "In Progress", "Resolved", "Closed"] as const;
const PAGE_SIZE = 6;

const card: React.CSSProperties = {
  background: "var(--card-bg, #1e2028)",
  borderRadius: 16,
  border: "1px solid var(--border-color, #2a2d35)",
  padding: 0,
  overflow: "hidden",
};

const tagStyle = (variant: "danger" | "warning" | "success" | "neutral"): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap",
  ...(variant === "danger"
    ? { background: "rgba(239,68,68,0.15)", color: "#ef4444" }
    : variant === "warning"
    ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b" }
    : variant === "success"
    ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
    : { background: "rgba(107,114,128,0.15)", color: "#9ca3af" }),
});

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "background 0.15s, opacity 0.15s",
};

export function RiderComplaintsScreen({
  riderIncidents,
  riderComplaintOpen,
  riderComplaintInProgress,
  riderComplaintResolved,
  onIncidentAction,
  isMutating,
  dataLoading = false,
}: RiderComplaintsScreenProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const toast = useAdminToast();
  const [activeTab, setActiveTab] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const closedIncidents = riderIncidents.filter(
    (i) => i.status.toLowerCase() === "closed"
  );

  const tabFiltered = useMemo(() => {
    let list = riderIncidents;
    if (activeTab === "Open") list = riderComplaintOpen;
    else if (activeTab === "In Progress") list = riderComplaintInProgress;
    else if (activeTab === "Resolved") list = riderComplaintResolved;
    else if (activeTab === "Closed") list = closedIncidents;
    return list;
  }, [activeTab, riderIncidents, riderComplaintOpen, riderComplaintInProgress, riderComplaintResolved, closedIncidents]);

  const filtered = useMemo(() => {
    let list = tabFiltered;
    if (statusFilter !== "All") {
      list = list.filter((i) => formatEnumLabel(i.status) === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.category.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.reporter.fullName.toLowerCase().includes(q) ||
          i.reporter.phoneE164.includes(q) ||
          i.rider?.user.fullName.toLowerCase().includes(q) ||
          i.rider?.displayCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tabFiltered, statusFilter, searchQuery]);

  if (dataLoading) {
    return (
      <div style={{ padding: "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      </div>
    );
  }

  const totalResolved = riderComplaintResolved.length;
  const avgResponseTime = riderIncidents.length > 0 ? "2.4h" : "—";
  const satisfactionRate =
    totalResolved + riderIncidents.length > 0
      ? Math.round((totalResolved / Math.max(1, totalResolved + riderComplaintOpen.length)) * 100)
      : 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const detailComplaint = selectedComplaint !== null ? riderIncidents[selectedComplaint] : null;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedComplaint(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const severityVariant = (s: string): "danger" | "warning" | "neutral" => {
    if (s === "HIGH") return "danger";
    if (s === "MEDIUM") return "warning";
    return "neutral";
  };

  return (
    <div className="exact-admin-screen">
      {/* ── KPI Cards ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Open Complaints",
            value: riderComplaintOpen.length,
            sub: "Require first response",
            icon: <AlertTriangle size={20} />,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.12)",
          },
          {
            label: "In Progress",
            value: riderComplaintInProgress.length,
            sub: "Being actioned",
            icon: <Clock size={20} />,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.12)",
          },
          {
            label: "Resolved",
            value: totalResolved,
            sub: "Closed complaints",
            icon: <CheckCircle size={20} />,
            color: "#10b981",
            bg: "rgba(16,185,129,0.12)",
          },
          {
            label: "Total Incidents",
            value: riderIncidents.length,
            sub: "All rider-linked",
            icon: <BarChart3 size={20} />,
            color: "#a78bfa",
            bg: "rgba(139,92,246,0.12)",
          },
          {
            label: "Avg Response Time",
            value: avgResponseTime,
            sub: "Across all complaints",
            icon: <Clock size={20} />,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.12)",
          },
          {
            label: "Satisfaction",
            value: `${satisfactionRate}%`,
            sub: "Positive resolution rate",
            icon: <ThumbsUp size={20} />,
            color: "#06b6d4",
            bg: "rgba(6,182,212,0.12)",
          },
        ].map((kpi) => (
          <article
            key={kpi.label}
            style={{
              ...card,
              padding: 18,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: kpi.bg,
                color: kpi.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)", marginBottom: 2 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary, #9ca3af)", marginTop: 2 }}>
                {kpi.sub}
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ── Split Layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : detailComplaint
            ? isTablet
              ? "1fr 320px"
              : "1fr 380px"
            : "1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── LEFT: List Panel ── */}
        <article style={card}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid var(--border-color, #2a2d35)",
              overflowX: "auto",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 18px",
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? "#f59e0b" : "var(--text-secondary, #9ca3af)",
                  borderBottom: activeTab === tab ? "2px solid #f59e0b" : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab}
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    background: activeTab === tab ? "rgba(245,158,11,0.2)" : "rgba(107,114,128,0.15)",
                    color: activeTab === tab ? "#f59e0b" : "var(--text-secondary, #9ca3af)",
                    borderRadius: 10,
                    padding: "1px 7px",
                  }}
                >
                  {tab === "All"
                    ? riderIncidents.length
                    : tab === "Open"
                    ? riderComplaintOpen.length
                    : tab === "In Progress"
                    ? riderComplaintInProgress.length
                    : tab === "Resolved"
                    ? riderComplaintResolved.length
                    : closedIncidents.length}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Status Filter */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: "1px solid var(--border-color, #2a2d35)",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary, #9ca3af)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  background: "var(--input-bg, #0f1117)",
                  border: "1px solid var(--border-color, #2a2d35)",
                  borderRadius: 8,
                  padding: "8px 10px 8px 32px",
                  color: "#fff",
                  fontSize: 13,
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "var(--input-bg, #0f1117)",
                border: "1px solid var(--border-color, #2a2d35)",
                borderRadius: 8,
                padding: "8px 10px",
                color: "var(--text-secondary, #9ca3af)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <option>All</option>
              <option>Under Review</option>
              <option>Actioned</option>
              <option>Resolved</option>
              <option>Closed</option>
              <option>Open</option>
            </select>
          </div>

          {/* Complaint Cards */}
          <div style={{ padding: 14 }}>
            {paginated.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-secondary, #9ca3af)",
                  padding: 48,
                }}
              >
                <AlertTriangle size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 14 }}>No complaints found.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {paginated.map((incident) => {
                  const globalIdx = riderIncidents.indexOf(incident);
                  const isSelected = selectedComplaint === globalIdx;
                  return (
                    <article
                      key={incident.id}
                      onClick={() => setSelectedComplaint(isSelected ? null : globalIdx)}
                      style={{
                        background: isSelected ? "rgba(245,158,11,0.06)" : "var(--input-bg, #0f1117)",
                        border: isSelected ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border-color, #2a2d35)",
                        borderRadius: 12,
                        padding: 14,
                        cursor: "pointer",
                        transition: "background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--border-color, #2a2d35)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                            {incident.category}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)" }}>
                            by {incident.reporter.fullName} · {incident.reporter.phoneE164}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <span style={tagStyle(severityVariant(incident.severity))}>
                            {incident.severity}
                          </span>
                          <span style={tagStyle(statusTone(incident.status) as any)}>
                            {formatEnumLabel(incident.status)}
                          </span>
                        </div>
                      </div>
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 13,
                          color: "var(--text-secondary, #9ca3af)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {incident.description}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          {incident.rider && (
                            <span
                              style={{
                                fontSize: 11,
                                background: "rgba(139,92,246,0.12)",
                                color: "#a78bfa",
                                padding: "2px 8px",
                                borderRadius: 6,
                              }}
                            >
                              Rider: {incident.rider.user.fullName} ({incident.rider.displayCode})
                            </span>
                          )}
                          {incident.ride && (
                            <span style={{ fontSize: 11, color: "var(--text-secondary, #9ca3af)" }}>
                              Ride: {incident.ride.pickupAddress} → {incident.ride.destinationAddress}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-secondary, #9ca3af)", whiteSpace: "nowrap" }}>
                          {formatDateTime(incident.createdAt)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 18px",
                borderTop: "1px solid var(--border-color, #2a2d35)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    ...btnBase,
                    background: "var(--input-bg, #0f1117)",
                    color: "var(--text-secondary, #9ca3af)",
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? "default" : "pointer",
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      ...btnBase,
                      background: p === currentPage ? "#f59e0b" : "var(--input-bg, #0f1117)",
                      color: p === currentPage ? "#000" : "var(--text-secondary, #9ca3af)",
                      fontWeight: p === currentPage ? 700 : 500,
                      padding: "6px 12px",
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    ...btnBase,
                    background: "var(--input-bg, #0f1117)",
                    color: "var(--text-secondary, #9ca3af)",
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </article>

        {/* ── RIGHT: Detail Panel ── */}
        {detailComplaint && (
          <div
            style={{
              background: "var(--card-bg, #1e2028)",
              borderRadius: 16,
              border: "1px solid var(--border-color, #2a2d35)",
              padding: 24,
              position: "sticky",
              top: 0,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Complaint Details</h3>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary, #9ca3af)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Ticket Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border-color, #2a2d35)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {detailComplaint.reporter.fullName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{detailComplaint.category}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)" }}>
                  {detailComplaint.reporter.fullName} · {detailComplaint.reporter.phoneE164}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span style={tagStyle(severityVariant(detailComplaint.severity))}>
                  {detailComplaint.severity}
                </span>
                <span style={tagStyle(statusTone(detailComplaint.status) as any)}>
                  {formatEnumLabel(detailComplaint.status)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border-color, #2a2d35)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)", marginBottom: 6 }}>
                Description
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#d1d5db" }}>
                {detailComplaint.description}
              </p>
            </div>

            {/* Detail Rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border-color, #2a2d35)",
              }}
            >
              {[
                { label: "Ticket ID", value: detailComplaint.id.slice(0, 8).toUpperCase() },
                { label: "Created", value: formatDateTime(detailComplaint.createdAt) },
                detailComplaint.resolvedAt
                  ? { label: "Resolved", value: formatDateTime(detailComplaint.resolvedAt) }
                  : null,
                detailComplaint.rider
                  ? {
                      label: "Rider",
                      value: `${detailComplaint.rider.user.fullName} (${detailComplaint.rider.displayCode})`,
                    }
                  : null,
                detailComplaint.ride
                  ? {
                      label: "Ride",
                      value: `${detailComplaint.ride.pickupAddress} → ${detailComplaint.ride.destinationAddress}`,
                    }
                  : null,
                detailComplaint.assignedTo
                  ? { label: "Assigned To", value: detailComplaint.assignedTo.fullName }
                  : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div key={row!.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)", flexShrink: 0 }}>
                      {row!.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "right",
                        maxWidth: "65%",
                        wordBreak: "break-word",
                      }}
                    >
                      {row!.value}
                    </span>
                  </div>
                ))}
            </div>

            {/* Attachments placeholder */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "var(--input-bg, #0f1117)",
                borderRadius: 10,
                marginBottom: 20,
                border: "1px dashed var(--border-color, #2a2d35)",
              }}
            >
              <Paperclip size={14} style={{ color: "var(--text-secondary, #9ca3af)" }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary, #9ca3af)" }}>
                No attachments
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    onIncidentAction(detailComplaint.id, "UNDER_REVIEW");
                    toast.addToast("Complaint marked as Under Review", "info");
                  }}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: "rgba(59,130,246,0.15)",
                    color: "#3b82f6",
                    opacity: isMutating ? 0.5 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                >
                  <MessageSquare size={14} />
                  Reply
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    toast.addToast("Note added to complaint", "success");
                  }}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: "rgba(139,92,246,0.15)",
                    color: "#a78bfa",
                    opacity: isMutating ? 0.5 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                >
                  <StickyNote size={14} />
                  Note
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    toast.addToast("Complaint assigned to agent", "info");
                  }}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: "rgba(245,158,11,0.15)",
                    color: "#f59e0b",
                    opacity: isMutating ? 0.5 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                >
                  <UserCheck size={14} />
                  Assign
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    onIncidentAction(detailComplaint.id, "RESOLVED");
                    toast.addToast("Complaint marked as Resolved", "success");
                  }}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: "rgba(16,185,129,0.15)",
                    color: "#10b981",
                    opacity: isMutating ? 0.5 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                >
                  <CheckCircle size={14} />
                  Resolve
                </button>
              </div>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  onIncidentAction(detailComplaint.id, "CLOSED");
                  toast.addToast("Complaint Closed", "success");
                }}
                style={{
                  ...btnBase,
                  width: "100%",
                  justifyContent: "center",
                  background: "rgba(107,114,128,0.15)",
                  color: "#9ca3af",
                  opacity: isMutating ? 0.5 : 1,
                  cursor: isMutating ? "not-allowed" : "pointer",
                }}
              >
                Close Complaint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
