"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { OperationsMap } from "@/components/maps/operations-map";
import type { LeafletMapMarker } from "@/components/maps/leaflet-map";
import type { AdminIncidentRecord, AdminAccountRecord } from "./types";
import { formatDateTime, parseNumber } from "./utils";
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Bike,
  Phone,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Eye,
  MessageSquare,
  Activity,
  Radio,
  Calendar,
  ArrowRight,
  CircleDot,
  Zap
} from "lucide-react";

/* ── Constants ────────────────────────────────────────────────────────────── */

const SOS_SLA_MINUTES = 15;

const ACCRA_MAP_CENTER: [number, number] = [5.6037, -0.1870];
const ACCRA_MAP_ZOOM_METRO = 12;
const ACCRA_MAP_ZOOM_CITY = 11;

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SafetyIncidentCenterProps = {
  incidents: AdminIncidentRecord[];
  incidentsTotal: number;
  adminAccounts: AdminAccountRecord[];
  rides: Array<{ id: string; pickupAddress: string; destinationAddress: string; pickupLatitude?: string | number | null; pickupLongitude?: string | number | null; status: string }>;
  onIncidentAction: (incidentId: string, status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED") => void;
  onIncidentAssign?: (incidentId: string, assignedToId: string) => void;
  isMutating: boolean;
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

type StatusTab = "all" | "open" | "critical" | "under_review" | "resolved";

interface TimelineEvent {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  icon: typeof Clock;
  color: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function isSosIncident(i: AdminIncidentRecord) {
  const sev = (i.severity ?? "").toUpperCase();
  const cat = (i.category ?? "").toUpperCase();
  return sev === "CRITICAL" || cat === "SOS" || cat.includes("SOS");
}

function isOpenStatus(s: string) {
  return ["open", "under_review", "actioned"].includes(s.toLowerCase());
}

function ageMinutes(iso: string) {
  return Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function severityColor(s: string) {
  switch (s.toUpperCase()) {
    case "CRITICAL": return "#ef4444";
    case "HIGH": return "#f59e0b";
    case "MEDIUM": return "#3b82f6";
    case "LOW": return "#6b7280";
    default: return "#6b7280";
  }
}

function statusColor(s: string) {
  switch (s.toUpperCase()) {
    case "OPEN": return "#ef4444";
    case "UNDER_REVIEW": return "#f59e0b";
    case "ACTIONED": return "#3b82f6";
    case "RESOLVED": return "#22c55e";
    case "CLOSED": return "#6b7280";
    default: return "#6b7280";
  }
}

function buildTimeline(incident: AdminIncidentRecord): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const created = incident.createdAt;
  const status = (incident.status ?? "").toUpperCase();

  events.push({
    id: "created",
    label: "Incident Reported",
    detail: `Reported by ${incident.reporter?.fullName ?? "Unknown"}`,
    timestamp: created,
    icon: AlertTriangle,
    color: "#ef4444"
  });

  if (status === "UNDER_REVIEW" || status === "ACTIONED" || status === "RESOLVED" || status === "CLOSED") {
    events.push({
      id: "review",
      label: "Under Review",
      detail: incident.assignedTo ? `Assigned to ${incident.assignedTo.fullName}` : "Being reviewed",
      timestamp: created,
      icon: Eye,
      color: "#f59e0b"
    });
  }

  if (status === "ACTIONED" || status === "RESOLVED" || status === "CLOSED") {
    events.push({
      id: "actioned",
      label: "Action Taken",
      detail: "Administrative action applied",
      timestamp: created,
      icon: Activity,
      color: "#3b82f6"
    });
  }

  if (status === "RESOLVED" || status === "CLOSED") {
    events.push({
      id: "resolved",
      label: status === "CLOSED" ? "Incident Closed" : "Incident Resolved",
      detail: incident.resolvedAt ? `Resolved at ${formatDateTime(incident.resolvedAt)}` : "Resolved",
      timestamp: incident.resolvedAt ?? created,
      icon: CheckCircle2,
      color: "#22c55e"
    });
  }

  return events;
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function SafetyIncidentCenter({
  incidents,
  incidentsTotal,
  adminAccounts,
  rides,
  onIncidentAction,
  onIncidentAssign,
  isMutating,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange
}: SafetyIncidentCenterProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<AdminIncidentRecord | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  /* ── Derived data ── */

  const kpis = useMemo(() => {
    const open = incidents.filter((i) => isOpenStatus(i.status));
    const critical = incidents.filter((i) => isSosIncident(i) && isOpenStatus(i.status));
    const underReview = incidents.filter((i) => i.status.toUpperCase() === "UNDER_REVIEW");
    const resolved = incidents.filter((i) => i.status.toUpperCase() === "RESOLVED" || i.status.toUpperCase() === "CLOSED");
    const avgResponseMins = resolved.length > 0
      ? Math.round(resolved.reduce((s, i) => {
          const created = Date.parse(i.createdAt);
          const resolvedAt = i.resolvedAt ? Date.parse(i.resolvedAt) : Date.now();
          return s + (resolvedAt - created) / 60000;
        }, 0) / resolved.length)
      : 0;
    return { openCount: open.length, criticalCount: critical.length, underReviewCount: underReview.length, resolvedCount: resolved.length, avgResponseMins };
  }, [incidents]);

  const filtered = useMemo(() => {
    let list = incidents;
    if (activeTab === "open") list = list.filter((i) => isOpenStatus(i.status));
    else if (activeTab === "critical") list = list.filter((i) => isSosIncident(i) && isOpenStatus(i.status));
    else if (activeTab === "under_review") list = list.filter((i) => i.status.toUpperCase() === "UNDER_REVIEW");
    else if (activeTab === "resolved") list = list.filter((i) => i.status.toUpperCase() === "RESOLVED" || i.status.toUpperCase() === "CLOSED");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.reporter?.fullName?.toLowerCase().includes(q) ||
          i.rider?.user?.fullName?.toLowerCase().includes(q) ||
          i.ride?.pickupAddress?.toLowerCase().includes(q) ||
          i.ride?.destinationAddress?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [incidents, activeTab, search]);

  const mapMarkers = useMemo((): LeafletMapMarker[] => {
    return incidents
      .filter((i) => isOpenStatus(i.status) && i.ride?.pickupAddress)
      .slice(0, 50)
      .map((i) => ({
        id: i.id,
        position: [5.6037 + (Math.random() - 0.5) * 0.08, -0.1870 + (Math.random() - 0.5) * 0.08] as [number, number],
        label: `${i.severity} — ${i.category}`,
        variant: "incident" as const
      }));
  }, [incidents]);

  const selectedTimeline = useMemo(() => {
    if (!selectedIncident) return [];
    return buildTimeline(selectedIncident);
  }, [selectedIncident]);

  const selectedLinkedRide = useMemo(() => {
    if (!selectedIncident?.ride) return null;
    return rides.find((r) => r.id === selectedIncident.ride?.id) ?? null;
  }, [selectedIncident, rides]);

  const handleAssign = useCallback(
    (incidentId: string, assignedToId: string) => {
      if (onIncidentAssign) onIncidentAssign(incidentId, assignedToId);
      setShowAssignModal(null);
    },
    [onIncidentAssign]
  );

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={6} cols={7} />;
  }

  return (
    <div className="sic-mgmt">
      <AdminPageHeader
        title="Safety & Incident Center"
        subtitle="Monitor, triage, and resolve safety incidents across the platform."
      />

      {/* ── Critical Banner ── */}
      {kpis.criticalCount > 0 && (
        <div className="sic-banner">
          <div className="sic-banner-pulse" />
          <div className="sic-banner-content">
            <AlertTriangle size={18} />
            <span>
              <strong>{kpis.criticalCount} Critical / SOS incident{kpis.criticalCount !== 1 ? "s" : ""}</strong> require immediate attention
            </span>
          </div>
          <span className="sic-banner-sla">
            {incidents.filter((i) => isSosIncident(i) && isOpenStatus(i.status) && ageMinutes(i.createdAt) > SOS_SLA_MINUTES).length} SLA breach{incidents.filter((i) => isSosIncident(i) && isOpenStatus(i.status) && ageMinutes(i.createdAt) > SOS_SLA_MINUTES).length !== 1 ? "es" : ""}
          </span>
        </div>
      )}

      {/* ── KPIs ── */}
      <section className="sic-kpis">
        <article className="sic-kpi sic-kpi--active">
          <div className="sic-kpi-icon"><Radio size={18} /></div>
          <div className="sic-kpi-body">
            <span className="sic-kpi-label">Active Incidents</span>
            <strong className="sic-kpi-value">{kpis.openCount}</strong>
            <small>Open across platform</small>
          </div>
        </article>
        <article className="sic-kpi sic-kpi--critical">
          <div className="sic-kpi-icon"><AlertTriangle size={18} /></div>
          <div className="sic-kpi-body">
            <span className="sic-kpi-label">Critical / SOS</span>
            <strong className="sic-kpi-value">{kpis.criticalCount}</strong>
            <small>Require immediate action</small>
          </div>
        </article>
        <article className="sic-kpi sic-kpi--review">
          <div className="sic-kpi-icon"><Eye size={18} /></div>
          <div className="sic-kpi-body">
            <span className="sic-kpi-label">Under Review</span>
            <strong className="sic-kpi-value">{kpis.underReviewCount}</strong>
            <small>Being investigated</small>
          </div>
        </article>
        <article className="sic-kpi sic-kpi--resolved">
          <div className="sic-kpi-icon"><CheckCircle2 size={18} /></div>
          <div className="sic-kpi-body">
            <span className="sic-kpi-label">Resolved</span>
            <strong className="sic-kpi-value">{kpis.resolvedCount}</strong>
            <small>All time</small>
          </div>
        </article>
        <article className="sic-kpi sic-kpi--response">
          <div className="sic-kpi-icon"><Clock size={18} /></div>
          <div className="sic-kpi-body">
            <span className="sic-kpi-label">Avg Response</span>
            <strong className="sic-kpi-value">{formatDuration(kpis.avgResponseMins)}</strong>
            <small>Resolution time</small>
          </div>
        </article>
      </section>

      {/* ── Tabs ── */}
      <div className="sic-tabs">
        {([
          { id: "all" as StatusTab, label: "All Incidents" },
          { id: "open" as StatusTab, label: "Open" },
          { id: "critical" as StatusTab, label: "Critical / SOS" },
          { id: "under_review" as StatusTab, label: "Under Review" },
          { id: "resolved" as StatusTab, label: "Resolved" }
        ]).map((tab) => {
          const count = tab.id === "all" ? incidents.length :
            tab.id === "open" ? kpis.openCount :
            tab.id === "critical" ? kpis.criticalCount :
            tab.id === "under_review" ? kpis.underReviewCount :
            kpis.resolvedCount;
          return (
            <button
              key={tab.id}
              type="button"
              className={`sic-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="sic-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      <div className="sic-layout">
        {/* ── Table Panel ── */}
        <div className="sic-panel sic-panel--table">
          <div className="sic-toolbar">
            <div className="sic-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search incidents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sic-table-wrap">
            {filtered.length === 0 ? (
              <div className="sic-empty"><EmptyCard title="No incidents" body="No incidents match the current filter." /></div>
            ) : (
              <table className="sic-table">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Passenger / Rider</th>
                    <th>Trip</th>
                    <th>Severity</th>
                    <th>Assigned</th>
                    <th>Status</th>
                    <th>Age</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((incident) => {
                    const age = ageMinutes(incident.createdAt);
                    const isSos = isSosIncident(incident);
                    const isSlaBreach = isSos && age > SOS_SLA_MINUTES;
                    return (
                      <tr
                        key={incident.id}
                        className={`sic-row${selectedIncident?.id === incident.id ? " selected" : ""}${isSlaBreach ? " sic-row--sla" : ""}`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <td>
                          <div className="sic-incident-ref">
                            {isSos && <Zap size={12} className="sic-sos-icon" />}
                            <div>
                              <span className="sic-incident-cat">{incident.category}</span>
                              <span className="sic-incident-desc">{incident.description.slice(0, 50)}{incident.description.length > 50 ? "…" : ""}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="sic-person">
                            <span className="sic-person-name">{incident.reporter?.fullName ?? "—"}</span>
                            {incident.rider && (
                              <span className="sic-person-sub">Rider: {incident.rider.user.fullName}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {incident.ride ? (
                            <div className="sic-trip">
                              <span className="sic-trip-route">{incident.ride.pickupAddress?.slice(0, 20)}…</span>
                              <span className="sic-trip-status">{incident.ride.status}</span>
                            </div>
                          ) : (
                            <span className="sic-no-trip">—</span>
                          )}
                        </td>
                        <td>
                          <span className="sic-severity" style={{ background: `${severityColor(incident.severity)}18`, color: severityColor(incident.severity) }}>
                            {incident.severity}
                          </span>
                        </td>
                        <td>
                          <span className="sic-assigned">
                            {incident.assignedTo ? incident.assignedTo.fullName : <span className="sic-unassigned">Unassigned</span>}
                          </span>
                        </td>
                        <td>
                          <span className="sic-status" style={{ background: `${statusColor(incident.status)}18`, color: statusColor(incident.status) }}>
                            {incident.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          <span className={`sic-age${isSlaBreach ? " sic-age--breach" : ""}`}>
                            {formatDuration(age)}
                            {isSlaBreach && <AlertTriangle size={10} />}
                          </span>
                        </td>
                        <td>
                          <ChevronRight size={14} className="sic-chevron" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedIncident && (
          <div className="sic-panel sic-panel--detail">
            <div className="sic-detail-header">
              <h3>Incident Details</h3>
              <button type="button" className="sic-detail-close" onClick={() => setSelectedIncident(null)}>
                <XCircle size={16} />
              </button>
            </div>

            {/* ── Incident Summary ── */}
            <div className="sic-detail-card">
              <div className="sic-detail-card-top">
                <span className="sic-severity" style={{ background: `${severityColor(selectedIncident.severity)}18`, color: severityColor(selectedIncident.severity) }}>
                  {selectedIncident.severity}
                </span>
                <span className="sic-status" style={{ background: `${statusColor(selectedIncident.status)}18`, color: statusColor(selectedIncident.status) }}>
                  {selectedIncident.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="sic-detail-row">
                <span className="sic-detail-label">Category</span>
                <span className="sic-detail-value">{selectedIncident.category}</span>
              </div>
              <div className="sic-detail-row">
                <span className="sic-detail-label">Description</span>
                <span className="sic-detail-value sic-detail-value--wrap">{selectedIncident.description}</span>
              </div>
              <div className="sic-detail-row">
                <span className="sic-detail-label">Reported</span>
                <span className="sic-detail-value">{formatDateTime(selectedIncident.createdAt)}</span>
              </div>
              {selectedIncident.resolvedAt && (
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Resolved</span>
                  <span className="sic-detail-value">{formatDateTime(selectedIncident.resolvedAt)}</span>
                </div>
              )}
            </div>

            {/* ── People ── */}
            <div className="sic-detail-card">
              <h4><User size={14} /> People Involved</h4>
              <div className="sic-detail-row">
                <span className="sic-detail-label">Reporter</span>
                <span className="sic-detail-value">{selectedIncident.reporter?.fullName ?? "—"}</span>
              </div>
              {selectedIncident.reporter?.phoneE164 && (
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Phone</span>
                  <span className="sic-detail-value sic-detail-value--mono">
                    <Phone size={11} /> {selectedIncident.reporter.phoneE164}
                  </span>
                </div>
              )}
              {selectedIncident.rider && (
                <>
                  <div className="sic-detail-row">
                    <span className="sic-detail-label">Rider</span>
                    <span className="sic-detail-value">{selectedIncident.rider.user.fullName}</span>
                  </div>
                  <div className="sic-detail-row">
                    <span className="sic-detail-label">Rider Code</span>
                    <span className="sic-detail-value sic-detail-value--mono">{selectedIncident.rider.displayCode}</span>
                  </div>
                </>
              )}
              {selectedIncident.assignedTo && (
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Assigned</span>
                  <span className="sic-detail-value sic-detail-value--assigned">{selectedIncident.assignedTo.fullName}</span>
                </div>
              )}
            </div>

            {/* ── Linked Trip ── */}
            {selectedLinkedRide && (
              <div className="sic-detail-card">
                <h4><Bike size={14} /> Linked Trip</h4>
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Pickup</span>
                  <span className="sic-detail-value sic-detail-value--small">
                    <MapPin size={10} /> {selectedLinkedRide.pickupAddress}
                  </span>
                </div>
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Destination</span>
                  <span className="sic-detail-value sic-detail-value--small">
                    <MapPin size={10} /> {selectedLinkedRide.destinationAddress}
                  </span>
                </div>
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Status</span>
                  <span className="sic-detail-value">{selectedLinkedRide.status}</span>
                </div>
                <div className="sic-detail-actions">
                  <a
                    href={`/rides/${selectedIncident.ride!.id}`}
                    className="sic-link-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/rides/${selectedIncident.ride!.id}`;
                    }}
                  >
                    <ExternalLink size={12} /> View Ride Details
                  </a>
                </div>
              </div>
            )}

            {selectedIncident.ride && !selectedLinkedRide && (
              <div className="sic-detail-card">
                <h4><Bike size={14} /> Linked Trip</h4>
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Trip ID</span>
                  <span className="sic-detail-value sic-detail-value--mono">{selectedIncident.ride.id.slice(0, 12)}…</span>
                </div>
                <div className="sic-detail-row">
                  <span className="sic-detail-label">Status</span>
                  <span className="sic-detail-value">{selectedIncident.ride.status}</span>
                </div>
              </div>
            )}

            {/* ── Timeline ── */}
            <div className="sic-detail-card">
              <h4><Calendar size={14} /> Incident Timeline</h4>
              <div className="sic-timeline">
                {selectedTimeline.map((event, idx) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="sic-timeline-item">
                      <div className="sic-timeline-line">
                        <div className="sic-timeline-dot" style={{ background: event.color }} />
                        {idx < selectedTimeline.length - 1 && <div className="sic-timeline-connector" />}
                      </div>
                      <div className="sic-timeline-content">
                        <div className="sic-timeline-header">
                          <Icon size={13} style={{ color: event.color }} />
                          <span className="sic-timeline-label">{event.label}</span>
                        </div>
                        <span className="sic-timeline-detail">{event.detail}</span>
                        <span className="sic-timeline-time">{formatDateTime(event.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Actions ── */}
            {isOpenStatus(selectedIncident.status) && (
              <div className="sic-detail-card">
                <h4><Shield size={14} /> Actions</h4>
                <div className="sic-action-list">
                  {selectedIncident.status.toUpperCase() === "OPEN" && (
                    <button
                      type="button"
                      className="sic-action-btn sic-action-btn--review"
                      onClick={() => onIncidentAction(selectedIncident.id, "UNDER_REVIEW")}
                      disabled={isMutating}
                    >
                      <Eye size={13} /> Mark Under Review
                    </button>
                  )}
                  <button
                    type="button"
                    className="sic-action-btn sic-action-btn--assign"
                    onClick={() => setShowAssignModal(selectedIncident.id)}
                    disabled={isMutating}
                  >
                    <User size={13} /> Assign Staff
                  </button>
                  <button
                    type="button"
                    className="sic-action-btn sic-action-btn--action"
                    onClick={() => onIncidentAction(selectedIncident.id, "ACTIONED")}
                    disabled={isMutating}
                  >
                    <Activity size={13} /> Mark Actioned
                  </button>
                  <button
                    type="button"
                    className="sic-action-btn sic-action-btn--resolve"
                    onClick={() => onIncidentAction(selectedIncident.id, "RESOLVED")}
                    disabled={isMutating}
                  >
                    <CheckCircle2 size={13} /> Resolve
                  </button>
                  <button
                    type="button"
                    className="sic-action-btn sic-action-btn--close"
                    onClick={() => onIncidentAction(selectedIncident.id, "CLOSED")}
                    disabled={isMutating}
                  >
                    <XCircle size={13} /> Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Live Map ── */}
      <section className="sic-map-section">
        <div className="sic-map-header">
          <h3><MapPin size={15} /> Active Incident Map</h3>
          <span className="sic-map-count">{mapMarkers.length} active incidents shown</span>
        </div>
        <div className="sic-map-container">
          <OperationsMap
            center={ACCRA_MAP_CENTER}
            zoom={ACCRA_MAP_ZOOM_METRO}
            emptyTitle="No active incidents"
            emptyDescription="Incident locations will appear on the map when available."
            markers={mapMarkers}
          />
        </div>
      </section>

      {/* ── Assign Modal ── */}
      {showAssignModal && (
        <div className="sic-modal-backdrop" onClick={() => setShowAssignModal(null)}>
          <div className="sic-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Staff Member</h3>
            <p className="sic-modal-desc">Select an admin to assign this incident to.</p>
            <div className="sic-assign-list">
              {adminAccounts.map((admin) => (
                <button
                  key={admin.id}
                  type="button"
                  className="sic-assign-option"
                  onClick={() => handleAssign(showAssignModal, admin.id)}
                >
                  <User size={14} />
                  <div>
                    <span className="sic-assign-name">{admin.user?.fullName ?? "Admin"}</span>
                    <span className="sic-assign-role">{admin.title ?? "Staff"}</span>
                  </div>
                </button>
              ))}
              {adminAccounts.length === 0 && (
                <span className="sic-assign-empty">No admin accounts available</span>
              )}
            </div>
            <div className="sic-modal-actions">
              <button type="button" className="sic-btn sic-btn--ghost" onClick={() => setShowAssignModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
