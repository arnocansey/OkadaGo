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
  ThumbsUp,
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { useAdminNotes } from "./useAdminNotes";
import type { AdminIncidentRecord, AdminAccountRecord } from "./types";
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
  onIncidentAssign?: (incidentId: string, assignedToId: string) => void;
  adminAccounts?: AdminAccountRecord[];
  token?: string | null;
  isMutating: boolean;
  dataLoading?: boolean;
};

const TABS = ["All", "Open", "In Progress", "Resolved", "Closed"] as const;
const PAGE_SIZE = 6;

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
  onIncidentAssign,
  adminAccounts = [],
  token,
  isMutating,
  dataLoading = false,
}: RiderComplaintsScreenProps) {
  const toast = useAdminToast();
  const [activeTab, setActiveTab] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");

  const activeComplaintId =
    selectedComplaint !== null ? riderIncidents[selectedComplaint]?.id ?? null : null;
  const { notes, addNote, addingNote } = useAdminNotes(token, "INCIDENT", activeComplaintId);

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
    return <AdminPageSkeleton variant="cards" kpis={4} rows={4} />;
  }

  const totalResolved = riderComplaintResolved.length;
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
      <AdminPageHeader
        title="Cases & Disputes"
        subtitle="Rider-linked cases and disputes for Accra operations."
      />

      <AdminKpiRow
        items={[
          { label: "Open", value: riderComplaintOpen.length, hint: "Require first response", icon: <AlertTriangle size={18} />, tone: "red" },
          { label: "In Progress", value: riderComplaintInProgress.length, hint: "Being actioned", icon: <Clock size={18} />, tone: "yellow" },
          { label: "Resolved", value: totalResolved, hint: "Closed complaints", icon: <CheckCircle size={18} />, tone: "green" },
          { label: "Satisfaction", value: `${satisfactionRate}%`, hint: "Positive resolution rate", icon: <ThumbsUp size={18} />, tone: "yellow" },
        ]}
      />

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-tabs" style={{ overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`admin-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700 }}>
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

          <div className="admin-screen-toolbar">
            <label className="admin-filter-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </label>
            <select
              className="admin-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
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
                                background: "var(--accent-yellow-light)",
                                color: "var(--accent-yellow)",
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
                   <ChevronLeft size={13} />
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
                   <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </article>

        {/* ── RIGHT: Detail Panel ── */}
        {detailComplaint && (
          <article className="admin-reference-card" style={{ position: "sticky", top: 0 }}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={isMutating}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => {
                    onIncidentAction(detailComplaint.id, "UNDER_REVIEW");
                  }}
                >
                  <MessageSquare size={13} />
                  Mark Under Review
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={!token}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => setNoteOpen((open) => !open)}
                >
                  <StickyNote size={13} />
                  Note
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={!onIncidentAssign || adminAccounts.length === 0}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => setAssignOpen((open) => !open)}
                >
                  <UserCheck size={13} />
                  Assign
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isMutating}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => {
                    onIncidentAction(detailComplaint.id, "RESOLVED");
                  }}
                >
                  <CheckCircle size={13} />
                  Resolve
                </button>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isMutating}
                style={{ width: "100%", justifyContent: "center", fontSize: "0.78rem" }}
                onClick={() => {
                  onIncidentAction(detailComplaint.id, "CLOSED");
                }}
              >
                Close Complaint
              </button>
            </div>

            {/* Assign to admin */}
            {assignOpen && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <select
                  className="admin-select-sm"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Choose an admin…</option>
                  {adminAccounts.map((account) => (
                    <option key={account.id} value={account.user.id}>
                      {account.user.fullName}
                      {account.title ? ` — ${account.title}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={!assigneeId || isMutating}
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => {
                    if (onIncidentAssign && assigneeId) {
                      onIncidentAssign(detailComplaint.id, assigneeId);
                      setAssignOpen(false);
                      setAssigneeId("");
                    }
                  }}
                >
                  <UserCheck size={13} /> Assign
                </button>
              </div>
            )}

            {/* Ops notes */}
            {noteOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add an internal ops note about this complaint…"
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
                    style={{ fontSize: "0.78rem" }}
                    onClick={() => {
                      addNote(noteDraft.trim());
                      setNoteDraft("");
                    }}
                  >
                    <StickyNote size={13} /> Save Note
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{ fontSize: "0.78rem" }}
                    onClick={() => { setNoteOpen(false); setNoteDraft(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "var(--text-secondary, #9ca3af)", marginBottom: 8 }}>
                  Ops Notes ({notes.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
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
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{note.body}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary, #9ca3af)", marginTop: 4 }}>
                        {note.author.fullName} · {formatDateTime(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
