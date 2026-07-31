import { useState, useMemo } from "react";
import {
  Shield,
  Clock,
  AlertTriangle,
  Search,
  MoreVertical,
  X,
  Mail,
  ClipboardList,
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { useAdminNotes } from "./useAdminNotes";
import type { AuditLogRecord } from "./types";

export type SuspendedRiderRow = {
  id: string;
  displayCode: string;
  onlineStatus: boolean;
  approvalStatus?: string;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  suspensionEndsAt?: string | null;
  user: { fullName: string; email?: string | null; phoneE164: string; accountStatus?: string };
  vehicle?: { plateNumber: string } | null;
  serviceZone?: { name: string } | null;
  createdAt?: string;
};

export type RiderSuspensionsScreenProps = {
  suspendedRiders: SuspendedRiderRow[];
  totalRiders: number;
  auditLogs?: AuditLogRecord[];
  onSuspensionAction?: (
    riderProfileId: string,
    action: "suspend" | "reinstate" | "extend" | "warn",
    reason?: string,
    durationDays?: number
  ) => void;
  token?: string | null;
  isMutating?: boolean;
  dataLoading?: boolean;
};

const TABS = ["All Suspensions", "Active", "Expired"] as const;
type TabKey = (typeof TABS)[number];
const PAGE_SIZE = 8;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Accra",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  });
}

function durationLabel(suspendedAt?: string | null, endsAt?: string | null) {
  if (!endsAt) return "Indefinite";
  if (!suspendedAt) return "Timed";
  const start = new Date(suspendedAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "Timed";
  const days = Math.max(1, Math.round((end - start) / 86400000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function isCurrentlySuspended(rider: SuspendedRiderRow) {
  const account = (rider.user.accountStatus ?? "").toUpperCase();
  const approval = (rider.approvalStatus ?? "").toUpperCase();
  return account === "SUSPENDED" || approval === "SUSPENDED" || Boolean(rider.suspendedAt);
}

function suspensionLifecycle(rider: SuspendedRiderRow): "Active" | "Expired" {
  if (!isCurrentlySuspended(rider)) return "Expired";
  if (rider.suspensionEndsAt) {
    const ends = new Date(rider.suspensionEndsAt).getTime();
    if (!Number.isNaN(ends) && ends <= Date.now()) return "Expired";
  }
  return "Active";
}

function getSuspensionView(rider: SuspendedRiderRow) {
  const status = suspensionLifecycle(rider);
  const reason = rider.suspensionReason?.trim() || "No reason recorded";
  return {
    reason,
    description:
      status === "Active"
        ? "Rider access is restricted until reinstated or the timed suspension ends."
        : "Timed suspension end date has passed — reinstate or extend from ops actions.",
    duration: durationLabel(rider.suspendedAt, rider.suspensionEndsAt),
    status,
    suspendedOn: formatDate(rider.suspendedAt),
    endsOn: rider.suspensionEndsAt ? formatDate(rider.suspensionEndsAt) : "Until reinstated",
  };
}

function getStatusStyle(status: string) {
  if (status === "Active") return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
  return { background: "rgba(107,114,128,0.15)", color: "var(--text-secondary)" };
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(245,158,11,0.2)",
        color: "#f59e0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export function RiderSuspensionsScreen({
  suspendedRiders,
  totalRiders,
  auditLogs = [],
  onSuspensionAction,
  token,
  isMutating = false,
  dataLoading = false,
}: RiderSuspensionsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("All Suspensions");
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [durationFilter, setDurationFilter] = useState("All Durations");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSuspension, setSelectedSuspension] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const { isMobile, isTablet } = useBreakpoint();
  const { addToast } = useAdminToast();
  const { notes, addNote, addingNote } = useAdminNotes(token, "RIDER", selectedSuspension);

  const reasonOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of suspendedRiders) {
      const reason = r.suspensionReason?.trim();
      if (reason) set.add(reason);
    }
    return ["All Reasons", ...Array.from(set).sort()];
  }, [suspendedRiders]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "Active")
      return suspendedRiders.filter((r) => suspensionLifecycle(r) === "Active");
    if (activeTab === "Expired")
      return suspendedRiders.filter((r) => suspensionLifecycle(r) === "Expired");
    return suspendedRiders;
  }, [activeTab, suspendedRiders]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tabFiltered.filter((r) => {
      const view = getSuspensionView(r);
      if (q) {
        const hay = `${r.user.fullName} ${r.user.phoneE164} ${r.displayCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (reasonFilter !== "All Reasons" && view.reason !== reasonFilter) return false;
      if (statusFilter !== "All Status" && view.status !== statusFilter) return false;
      if (durationFilter !== "All Durations" && view.duration !== durationFilter) return false;
      return true;
    });
  }, [tabFiltered, searchQuery, reasonFilter, statusFilter, durationFilter]);

  const selectedRider = useMemo(
    () => suspendedRiders.find((r) => r.id === selectedSuspension) ?? null,
    [suspendedRiders, selectedSuspension]
  );

  const suspensionHistory = useMemo(() => {
    if (!selectedRider) return [];
    const fromAudit = auditLogs
      .filter(
        (log) =>
          log.entityId === selectedRider.id &&
          /RIDER_(SUSPEND|REINSTATE|SUSPENSION_EXTEND|WARN)/i.test(log.action)
      )
      .slice(0, 8)
      .map((log) => ({
        event: log.action.replace(/_/g, " "),
        date: formatDateTime(log.createdAt),
        reason:
          typeof log.details?.reason === "string"
            ? log.details.reason
            : selectedRider.suspensionReason || "—",
      }));

    if (fromAudit.length > 0) return fromAudit;

    if (!selectedRider.suspendedAt) return [];
    return [
      {
        event: "Suspended",
        date: formatDateTime(selectedRider.suspendedAt),
        reason: selectedRider.suspensionReason || "No reason recorded",
      },
    ];
  }, [selectedRider, auditLogs]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={5} cols={5} />;
  }

  const activeCount = suspendedRiders.filter((r) => suspensionLifecycle(r) === "Active").length;
  const expiredCount = suspendedRiders.filter((r) => suspensionLifecycle(r) === "Expired").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedSuspension(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const suspDetails = selectedRider ? getSuspensionView(selectedRider) : null;

  const handleSendWarning = () => {
    if (!selectedRider || !onSuspensionAction) {
      addToast("Warning action unavailable", "error");
      return;
    }
    onSuspensionAction(selectedRider.id, "warn", selectedRider.suspensionReason || undefined);
  };

  const handleAddNote = () => {
    if (!token) {
      addToast("Ops notes are unavailable without a session", "error");
      return;
    }
    setNoteOpen((open) => !open);
  };

  const handleReinstate = () => {
    if (!selectedRider || !onSuspensionAction) {
      addToast("Reinstate action unavailable", "error");
      return;
    }
    onSuspensionAction(selectedRider.id, "reinstate");
  };

  const handleExtend = () => {
    if (!selectedRider || !onSuspensionAction) {
      addToast("Extend action unavailable", "error");
      return;
    }
    onSuspensionAction(
      selectedRider.id,
      "extend",
      selectedRider.suspensionReason || "Suspension extended",
      extendDays
    );
  };

  const fleetShare =
    totalRiders > 0 ? Math.round((suspendedRiders.length / totalRiders) * 100) : 0;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Suspensions"
        subtitle="Accra banned and restricted riders pending review or reinstatement."
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Suspended",
            value: suspendedRiders.length,
            hint: `${fleetShare}% of Accra fleet`,
            icon: <Shield size={22} />,
            tone: "red",
          },
          {
            label: "Currently Suspended",
            value: activeCount,
            hint: "Active restrictions",
            icon: <Clock size={22} />,
            tone: "yellow",
          },
          {
            label: "Timed Expired",
            value: expiredCount,
            hint: "End date passed",
            icon: <AlertTriangle size={22} />,
            tone: "neutral",
          },
        ]}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: !selectedSuspension || isMobile ? "1fr" : isTablet ? "1fr 320px" : "1fr 400px",
          gap: 20,
          alignItems: "start",
        }}
      >
        <article className="admin-reference-card" style={{ minWidth: 0, padding: 20 }}>
          <div className="admin-tabs" style={{ marginBottom: 16 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="admin-filter-bar">
            <label className="admin-filter-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                placeholder="Search rider..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </label>
            <select
              className="admin-select-sm"
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {reasonOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              className="admin-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Expired</option>
            </select>
            <select
              className="admin-select-sm"
              value={durationFilter}
              onChange={(e) => {
                setDurationFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option>All Durations</option>
              <option>Indefinite</option>
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Rider", "Reason", "Duration", "Status", "Suspended On", "Ends On", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: 0.05,
                        borderBottom: "1px solid var(--border-color)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      <AlertTriangle size={20} style={{ marginBottom: 6, opacity: 0.5 }} />
                      <div style={{ fontSize: 13 }}>No suspensions found.</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((rider) => {
                    const susp = getSuspensionView(rider);
                    const isSelected = selectedSuspension === rider.id;
                    return (
                      <tr
                        key={rider.id}
                        onClick={() => setSelectedSuspension(isSelected ? null : rider.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "rgba(245,158,11,0.06)" : "transparent",
                          borderLeft: isSelected ? "3px solid #f59e0b" : "3px solid transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={rider.user.fullName} size={34} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                                {rider.user.fullName}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{rider.user.phoneE164}</div>
                              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                <code style={{ fontSize: 10, opacity: 0.7, color: "var(--text-secondary)" }}>
                                  {rider.displayCode}
                                </code>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{susp.reason}</span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <span
                            style={{
                              background: "rgba(245,158,11,0.15)",
                              color: "#f59e0b",
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {susp.duration}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <span
                            style={{
                              ...getStatusStyle(susp.status),
                              borderRadius: 20,
                              padding: "3px 10px",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {susp.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{susp.suspendedOn}</span>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{susp.endsOn}</span>
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid var(--border-color)",
                            textAlign: "center",
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSuspension(rider.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-secondary)",
                              padding: 4,
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                paddingTop: 12,
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="admin-btn-secondary"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="admin-btn-secondary"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </article>

        {selectedRider && suspDetails && (
          <article
            className="admin-reference-card"
            style={{
              padding: 24,
              position: "sticky",
              top: 24,
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                Suspension Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedSuspension(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <Avatar name={selectedRider.user.fullName} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                  {selectedRider.user.fullName}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{selectedRider.user.phoneE164}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{selectedRider.displayCode}</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Status</span>
                <span
                  style={{
                    ...getStatusStyle(suspDetails.status),
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {suspDetails.status}
                </span>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Reason</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "right",
                      maxWidth: "60%",
                      color: "var(--text-primary)",
                    }}
                  >
                    {suspDetails.reason}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 }}>
                  {suspDetails.description}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Duration</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{suspDetails.duration}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Suspended On</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{suspDetails.suspendedOn}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Ends On</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{suspDetails.endsOn}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Zone / Plate</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {selectedRider.serviceZone?.name ?? "—"} · {selectedRider.vehicle?.plateNumber ?? "No plate"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleSendWarning}
                disabled={isMutating}
                className="admin-btn-secondary"
                style={{ flex: 1, justifyContent: "center", gap: 6, opacity: isMutating ? 0.6 : 1 }}
              >
                <Mail size={14} />
                Send Warning
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="admin-btn-secondary"
                style={{ flex: 1, justifyContent: "center", gap: 6 }}
              >
                <ClipboardList size={14} />
                Add Note
              </button>
            </div>

            {noteOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add an internal ops note about this rider…"
                  rows={3}
                  maxLength={1000}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    fontSize: 13,
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={addingNote || noteDraft.trim().length < 2}
                    onClick={() => {
                      addNote(noteDraft.trim());
                      setNoteDraft("");
                    }}
                  >
                    Save Note
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => { setNoteOpen(false); setNoteDraft(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  Ops Notes ({notes.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-primary)",
                      }}
                    >
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>{note.body}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        {note.author.fullName} · {formatDateTime(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
              Extend by (days)
              <select
                className="admin-select-sm"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                style={{ display: "block", width: "100%", marginTop: 6 }}
              >
                <option value={7}>7</option>
                <option value={14}>14</option>
                <option value={30}>30</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleReinstate}
              disabled={isMutating}
              style={{
                width: "100%",
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: isMutating ? "default" : "pointer",
                marginBottom: 8,
                opacity: isMutating ? 0.6 : 1,
              }}
            >
              Reinstate Rider
            </button>

            <button
              type="button"
              onClick={handleExtend}
              disabled={isMutating}
              style={{
                width: "100%",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: isMutating ? "default" : "pointer",
                marginBottom: 24,
                opacity: isMutating ? 0.6 : 1,
              }}
            >
              Extend Suspension
            </button>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Suspension History
              </div>
              {suspensionHistory.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
                  No audit events recorded for this rider yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 16, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 4,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      background: "var(--border-color)",
                    }}
                  />
                  {suspensionHistory.map((h, i) => (
                    <div
                      key={`${h.event}-${h.date}-${i}`}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        position: "relative",
                        paddingBottom: i < suspensionHistory.length - 1 ? 20 : 0,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: i === 0 ? "var(--accent-yellow)" : "var(--text-muted)",
                          flexShrink: 0,
                          marginTop: 4,
                          zIndex: 1,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{h.event}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{h.date}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Reason: {h.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
