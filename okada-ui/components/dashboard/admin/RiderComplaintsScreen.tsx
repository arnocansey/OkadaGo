"use client";

import { CheckCircle, Clock, Headphones, ShieldAlert, XCircle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { AdminIncidentRecord } from "./types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit", "pending", "requested", "reviewing", "under review", "processing"].includes(normalized)) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type RiderComplaintsScreenProps = {
  riderIncidents: AdminIncidentRecord[];
  riderComplaintOpen: AdminIncidentRecord[];
  riderComplaintInProgress: AdminIncidentRecord[];
  riderComplaintResolved: AdminIncidentRecord[];
};

export function RiderComplaintsScreen({
  riderIncidents,
  riderComplaintOpen,
  riderComplaintInProgress,
  riderComplaintResolved
}: RiderComplaintsScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <Headphones size={22} />
          <span>Total Tickets</span>
          <strong>{riderIncidents.length}</strong>
          <small>Support incidents attached to riders</small>
        </article>
        <article className="admin-dark-kpi">
          <Clock size={22} />
          <span>Open Tickets</span>
          <strong>{riderComplaintOpen.length}</strong>
          <small>New or open rider issues</small>
        </article>
        <article className="admin-dark-kpi">
          <ShieldAlert size={22} />
          <span>In Progress</span>
          <strong>{riderComplaintInProgress.length}</strong>
          <small>Assigned or under review</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Resolved</span>
          <strong>{riderComplaintResolved.length}</strong>
          <small>Resolved or closed tickets</small>
        </article>
        <article className="admin-dark-kpi danger">
          <XCircle size={22} />
          <span>High Severity</span>
          <strong>{riderIncidents.filter((incident) => incident.severity.toLowerCase() === "high").length}</strong>
          <small>Requires immediate attention</small>
        </article>
      </section>

      <section className="admin-rider-dashboard-grid complaints">
        <article className="admin-dark-card admin-rider-wide-table">
          <div className="admin-dark-cardhead">
            <div>
              <h3>All Tickets</h3>
              <p>Support incidents attached to rider profiles.</p>
            </div>
            <a href="/admin/reports-analytics">Open reports</a>
          </div>
          {riderIncidents.length === 0 ? (
            <EmptyCard title="No rider complaints." body="Rider-linked incidents will appear after passengers or admins submit reports." />
          ) : (
            <div className="table-wrapper admin-rider-subset-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Rider</th>
                    <th>Category</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {riderIncidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>#{incident.id.slice(-10).toUpperCase()}</td>
                      <td>
                        <strong>{incident.rider?.user.fullName ?? "Unknown rider"}</strong>
                        <div>{incident.rider?.displayCode ?? "No rider code"}</div>
                      </td>
                      <td>{formatEnumLabel(incident.category)}</td>
                      <td>{incident.description.slice(0, 68)}{incident.description.length > 68 ? "..." : ""}</td>
                      <td><span className={`status-chip ${incident.severity.toLowerCase() === "high" ? "danger" : statusTone(incident.severity)}`}>{formatEnumLabel(incident.severity)}</span></td>
                      <td><span className={`status-chip ${statusTone(incident.status)}`}>{formatEnumLabel(incident.status)}</span></td>
                      <td>{formatDateTime(incident.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-rider-side-stack">
          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Ticket Details</h3>
                <p>Latest rider support case.</p>
              </div>
            </div>
            {riderIncidents.length === 0 ? (
              <EmptyCard title="No ticket selected." body="Latest rider complaint details will appear here." />
            ) : (
              <div className="admin-rider-ticket-detail">
                <strong>#{riderIncidents[0].id.slice(-10).toUpperCase()}</strong>
                <span className={`status-chip ${statusTone(riderIncidents[0].status)}`}>{formatEnumLabel(riderIncidents[0].status)}</span>
                <p>{riderIncidents[0].description}</p>
                <div>
                  <span>Rider</span>
                  <strong>{riderIncidents[0].rider?.user.fullName ?? "Unknown rider"}</strong>
                </div>
                <div>
                  <span>Reporter</span>
                  <strong>{riderIncidents[0].reporter.fullName}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{formatEnumLabel(riderIncidents[0].severity)}</strong>
                </div>
              </div>
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
