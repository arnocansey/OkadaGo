"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  X,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Bike,
  Shield,
  Calendar,
  MessageSquare,
  Eye,
  BadgeCheck,
  Users,
  Star,
  ChevronRight,
  Download,
  Camera,
  Send
} from "lucide-react";
import type { RiderRecord, RiderDocumentRecord } from "./types";
import { formatDateTime, formatEnumLabel } from "./utils";
import { useAdminToast } from "./AdminToast";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPageSkeleton } from "./AdminSkeleton";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RiderVerificationCenterProps = {
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
  riderDocuments: RiderDocumentRecord[];
  onRiderApproval?: (riderProfileId: string, action: "approve" | "reject", reason?: string) => void;
  onRequestInfo?: (riderProfileId: string, message: string) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

type QueueFilter = "all" | "pending" | "ready" | "approved" | "rejected";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function statusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "approved": return <CheckCircle size={14} />;
    case "rejected": return <XCircle size={14} />;
    case "ready": return <Eye size={14} />;
    default: return <Clock size={14} />;
  }
}

function statusToneClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "vr-success";
  if (s === "rejected") return "vr-danger";
  if (s === "ready") return "vr-info";
  return "vr-warning";
}

function documentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    NATIONAL_ID: "National ID",
    RIDER_LICENSE: "Driver's License",
    VEHICLE_REGISTRATION: "Vehicle Registration",
    INSURANCE: "Insurance",
    PROFILE_PHOTO: "Profile Photo",
    OTHER: "Other"
  };
  return map[type] ?? type;
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function RiderVerificationCenter({
  riderVerificationRows,
  riderVerificationStats,
  riderDocuments,
  onRiderApproval,
  onRequestInfo,
  isMutating = false,
  dataLoading = false
}: RiderVerificationCenterProps) {
  const { addToast } = useAdminToast();

  const [filter, setFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [requestInfoMessage, setRequestInfoMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = riderVerificationRows;
    if (filter !== "all") {
      list = list.filter((r) => {
        if (filter === "pending") return r.verificationStatus === "Pending";
        if (filter === "ready") return r.verificationStatus === "Ready";
        if (filter === "approved") return r.verificationStatus === "Approved";
        if (filter === "rejected") return r.verificationStatus === "Rejected";
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.rider.user.fullName?.toLowerCase().includes(q) ||
          r.rider.displayCode?.toLowerCase().includes(q) ||
          r.rider.user.phoneE164?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [riderVerificationRows, filter, search]);

  const selected = useMemo(
    () => riderVerificationRows.find((r) => r.rider.id === selectedId) ?? null,
    [riderVerificationRows, selectedId]
  );

  const selectedDocs = useMemo(
    () => riderDocuments.filter((d) => d.riderId === selectedId),
    [riderDocuments, selectedId]
  );

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={5} rows={8} cols={4} />;
  }

  function handleApprove() {
    if (!selected || !onRiderApproval) return;
    onRiderApproval(selected.rider.id, "approve");
    addToast(`${selected.rider.user.fullName} approved`, "success");
    setSelectedId(null);
  }

  function handleReject() {
    if (!selected || !onRiderApproval) return;
    onRiderApproval(selected.rider.id, "reject", rejectReason || undefined);
    addToast(`${selected.rider.user.fullName} rejected`, "error");
    setRejectOpen(false);
    setRejectReason("");
    setSelectedId(null);
  }

  function handleRequestInfo() {
    if (!selected || !onRequestInfo) return;
    const msg = requestInfoMessage.trim();
    if (msg.length < 5) {
      addToast("Write a message describing what you need from the rider", "info");
      return;
    }
    onRequestInfo(selected.rider.id, msg);
    addToast(`Info request sent to ${selected.rider.user.fullName}`, "success");
    setRequestInfoOpen(false);
    setRequestInfoMessage("");
  }

  return (
    <div className="vr-center">
      <AdminPageHeader
        title="Rider Verification Center"
        subtitle="Review pending applications, verify documents, and approve or reject riders."
      />

      {/* ── Stats ── */}
      <section className="vr-stats">
        <article className="vr-stat vr-stat-warning">
          <Clock size={16} />
          <div>
            <strong>{riderVerificationStats.pending}</strong>
            <span>Pending</span>
          </div>
        </article>
        <article className="vr-stat vr-stat-info">
          <Eye size={16} />
          <div>
            <strong>{riderVerificationStats.underReview}</strong>
            <span>Under Review</span>
          </div>
        </article>
        <article className="vr-stat vr-stat-success">
          <CheckCircle size={16} />
          <div>
            <strong>{riderVerificationStats.approved}</strong>
            <span>Approved</span>
          </div>
        </article>
        <article className="vr-stat vr-stat-danger">
          <XCircle size={16} />
          <div>
            <strong>{riderVerificationStats.rejected}</strong>
            <span>Rejected</span>
          </div>
        </article>
        <article className="vr-stat vr-stat-neutral">
          <BadgeCheck size={16} />
          <div>
            <strong>{riderVerificationStats.today}</strong>
            <span>Applied Today</span>
          </div>
        </article>
      </section>

      {/* ── Main Layout ── */}
      <div className="vr-layout">
        {/* ── Queue Panel ── */}
        <div className="vr-queue">
          <div className="vr-queue-toolbar">
            <div className="vr-queue-filters">
              {(["all", "pending", "ready", "approved", "rejected"] as QueueFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`vr-queue-filter${filter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "ready" ? "Ready" : formatEnumLabel(f)}
                </button>
              ))}
            </div>
            <div className="vr-queue-search">
              <Search size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search riders..."
              />
              {search && (
                <button type="button" className="vr-queue-search-clear" onClick={() => setSearch("")}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="vr-queue-list">
            {filtered.length === 0 ? (
              <div className="vr-queue-empty">No riders match your filters.</div>
            ) : (
              filtered.map((row) => (
                <button
                  key={row.rider.id}
                  type="button"
                  className={`vr-queue-item${selectedId === row.rider.id ? " selected" : ""}`}
                  onClick={() => setSelectedId(row.rider.id)}
                >
                  <div className="vr-queue-item-avatar">
                    {row.rider.user.fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                  </div>
                  <div className="vr-queue-item-info">
                    <strong>{row.rider.user.fullName}</strong>
                    <span>{row.rider.displayCode} · {row.rider.city ?? "No city"}</span>
                  </div>
                  <div className="vr-queue-item-status">
                    <span className={`vr-queue-badge ${statusToneClass(row.verificationStatus)}`}>
                      {statusIcon(row.verificationStatus)} {row.verificationStatus}
                    </span>
                  </div>
                  <ChevronRight size={14} className="vr-queue-item-arrow" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Review Panel ── */}
        <div className="vr-review">
          {!selected ? (
            <div className="vr-review-empty">
              <User size={40} />
              <h3>Select a rider to review</h3>
              <p>Choose an applicant from the queue to view their profile, documents, and verification status.</p>
            </div>
          ) : (
            <>
              {/* ── Review Header ── */}
              <div className="vr-review-header">
                <div className="vr-review-avatar">
                  {selected.rider.user.fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                </div>
                <div className="vr-review-header-info">
                  <h3>{selected.rider.user.fullName}</h3>
                  <div className="vr-review-header-meta">
                    <code>{selected.rider.displayCode}</code>
                    <span className={`vr-queue-badge ${statusToneClass(selected.verificationStatus)}`}>
                      {statusIcon(selected.verificationStatus)} {selected.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Profile Info ── */}
              <div className="vr-section">
                <h4 className="vr-section-title"><User size={14} /> Profile Information</h4>
                <div className="vr-info-grid">
                  <div className="vr-info-row">
                    <span className="vr-info-label">Full Name</span>
                    <span className="vr-info-value">{selected.rider.user.fullName}</span>
                  </div>
                  <div className="vr-info-row">
                    <span className="vr-info-label">Phone</span>
                    <span className="vr-info-value"><Phone size={11} /> {selected.rider.user.phoneE164}</span>
                  </div>
                  <div className="vr-info-row">
                    <span className="vr-info-label">Email</span>
                    <span className="vr-info-value"><Mail size={11} /> {selected.rider.user.email ?? "—"}</span>
                  </div>
                  <div className="vr-info-row">
                    <span className="vr-info-label">City</span>
                    <span className="vr-info-value"><MapPin size={11} /> {selected.rider.city ?? "—"}</span>
                  </div>
                  <div className="vr-info-row">
                    <span className="vr-info-label">Zone</span>
                    <span className="vr-info-value">{selected.rider.serviceZone?.name ?? "—"}</span>
                  </div>
                  <div className="vr-info-row">
                    <span className="vr-info-label">Applied</span>
                    <span className="vr-info-value"><Calendar size={11} /> {formatDateTime(selected.rider.createdAt ?? "")}</span>
                  </div>
                </div>
              </div>

              {/* ── Checklist ── */}
              <div className="vr-section">
                <h4 className="vr-section-title"><Shield size={14} /> Verification Checklist</h4>
                <div className="vr-checklist">
                  <div className={`vr-checklist-item${selected.hasContact ? " done" : ""}`}>
                    {selected.hasContact ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>Contact Information</span>
                  </div>
                  <div className={`vr-checklist-item${selected.hasVehicle ? " done" : ""}`}>
                    {selected.hasVehicle ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>Vehicle Registered</span>
                  </div>
                  <div className={`vr-checklist-item${selected.hasZone ? " done" : ""}`}>
                    {selected.hasZone ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>Zone Assigned</span>
                  </div>
                </div>
              </div>

              {/* ── Motorcycle Info ── */}
              {selected.rider.vehicle && (
                <div className="vr-section">
                  <h4 className="vr-section-title"><Bike size={14} /> Motorcycle Information</h4>
                  <div className="vr-info-grid">
                    <div className="vr-info-row">
                      <span className="vr-info-label">Make & Model</span>
                      <span className="vr-info-value">{selected.rider.vehicle.make} {selected.rider.vehicle.model}</span>
                    </div>
                    <div className="vr-info-row">
                      <span className="vr-info-label">Plate Number</span>
                      <span className="vr-info-value">{selected.rider.vehicle.plateNumber}</span>
                    </div>
                    <div className="vr-info-row">
                      <span className="vr-info-label">Vehicle Type</span>
                      <span className="vr-info-value">{selected.rider.vehicle.vehicleType ?? "—"}</span>
                    </div>
                    <div className="vr-info-row">
                      <span className="vr-info-label">Status</span>
                      <span className={`vr-queue-badge ${selected.rider.vehicle.status === "ACTIVE" ? "vr-success" : "vr-neutral"}`}>
                        {selected.rider.vehicle.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Documents ── */}
              <div className="vr-section">
                <h4 className="vr-section-title"><FileText size={14} /> Uploaded Documents</h4>
                {selectedDocs.length === 0 ? (
                  <div className="vr-docs-empty">
                    <FileText size={20} />
                    <span>No documents uploaded yet</span>
                  </div>
                ) : (
                  <div className="vr-docs-grid">
                    {selectedDocs.map((doc) => (
                      <div key={doc.id} className="vr-doc-card">
                        <div className="vr-doc-card-icon">
                          {doc.type === "PROFILE_PHOTO" ? <Camera size={18} /> : <FileText size={18} />}
                        </div>
                        <div className="vr-doc-card-info">
                          <strong>{documentTypeLabel(doc.type)}</strong>
                          <span>Uploaded {formatDateTime(doc.createdAt)}</span>
                          {doc.expiresAt && <span>Expires {formatDateTime(doc.expiresAt)}</span>}
                        </div>
                        <span className={`vr-queue-badge ${doc.status === "APPROVED" ? "vr-success" : doc.status === "PENDING" ? "vr-warning" : "vr-danger"}`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Actions ── */}
              {selected.verificationStatus !== "Approved" && selected.verificationStatus !== "Rejected" && (
                <div className="vr-actions">
                  <button
                    type="button"
                    className="vr-action-btn approve"
                    onClick={handleApprove}
                    disabled={isMutating}
                  >
                    <CheckCircle size={14} /> Approve Rider
                  </button>
                  <button
                    type="button"
                    className="vr-action-btn reject"
                    onClick={() => setRejectOpen(true)}
                    disabled={isMutating}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    type="button"
                    className="vr-action-btn info"
                    onClick={() => setRequestInfoOpen(true)}
                    disabled={isMutating}
                  >
                    <MessageSquare size={14} /> Request Info
                  </button>
                </div>
              )}

              {selected.verificationStatus === "Approved" && (
                <div className="vr-actions">
                  <span className="vr-action-done"><CheckCircle size={14} /> Rider has been approved</span>
                </div>
              )}

              {selected.verificationStatus === "Rejected" && (
                <div className="vr-actions">
                  <span className="vr-action-done danger"><XCircle size={14} /> Rider application was rejected</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Reject Modal ── */}
      {rejectOpen && selected && (
        <div className="vr-modal-backdrop" onClick={() => setRejectOpen(false)}>
          <div className="vr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Application</h3>
            <p>Are you sure you want to reject <strong>{selected.rider.user.fullName}</strong>?</p>
            <label className="vr-modal-field">
              <span>Reason (optional)</span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                rows={3}
              />
            </label>
            <div className="vr-modal-actions">
              <button type="button" className="vr-action-btn ghost" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button type="button" className="vr-action-btn reject" onClick={handleReject} disabled={isMutating}>
                <XCircle size={14} /> Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Info Modal ── */}
      {requestInfoOpen && selected && (
        <div className="vr-modal-backdrop" onClick={() => setRequestInfoOpen(false)}>
          <div className="vr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Request More Information</h3>
            <p>Send a message to <strong>{selected.rider.user.fullName}</strong> requesting additional information.</p>
            <label className="vr-modal-field">
              <span>Message</span>
              <textarea
                value={requestInfoMessage}
                onChange={(e) => setRequestInfoMessage(e.target.value)}
                placeholder="Describe what information or documents you need from the rider..."
                rows={4}
              />
            </label>
            <div className="vr-modal-actions">
              <button type="button" className="vr-action-btn ghost" onClick={() => setRequestInfoOpen(false)}>Cancel</button>
              <button type="button" className="vr-action-btn info" onClick={handleRequestInfo} disabled={isMutating}>
                <Send size={14} /> Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
