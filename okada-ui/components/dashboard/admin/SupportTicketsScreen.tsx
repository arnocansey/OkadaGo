import { Headphones, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { AdminIncidentRecord } from "./types";
import { formatDateTime, statusTone, formatEnumLabel } from "./utils";

export type SupportTicketsScreenProps = {
  incidents: AdminIncidentRecord[];
  openTickets: AdminIncidentRecord[];
  inProgressTickets: AdminIncidentRecord[];
  resolvedTickets: AdminIncidentRecord[];
  onIncidentAction: (
    incidentId: string,
    status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED"
  ) => void;
  isMutating: boolean;
};

export function SupportTicketsScreen({
  incidents,
  openTickets,
  inProgressTickets,
  resolvedTickets,
  onIncidentAction,
  isMutating
}: SupportTicketsScreenProps) {
  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><AlertTriangle size={22} /></div>
          <div>
            <span>Open Tickets</span>
            <strong>{openTickets.length}</strong>
            <small>Awaiting first response</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Clock size={22} /></div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressTickets.length}</strong>
            <small>Under review or actioned</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CheckCircle size={22} /></div>
          <div>
            <span>Resolved</span>
            <strong>{resolvedTickets.length}</strong>
            <small>Closed tickets</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Headphones size={22} /></div>
          <div>
            <span>Total Tickets</span>
            <strong>{incidents.length}</strong>
            <small>All time</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
        {/* Open tickets priority list */}
        <div>
          <article className="admin-reference-card" style={{ marginBottom: 16 }}>
            <div className="admin-reference-cardhead">
              <div>
                <h3>Open & In Progress</h3>
                <p>Tickets requiring admin attention.</p>
              </div>
            </div>
            {openTickets.length === 0 && inProgressTickets.length === 0 ? (
              <EmptyCard title="No open tickets." body="All caught up! Tickets will appear as they're submitted." />
            ) : (
              <div className="admin-incident-list">
                {[...openTickets, ...inProgressTickets]
                  .slice()
                  .sort((a, b) => {
                    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                    return (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
                      (severityOrder[b.severity as keyof typeof severityOrder] ?? 3);
                  })
                  .map((ticket) => (
                    <article key={ticket.id} className="admin-incident-card">
                      <div className="admin-incident-card-head">
                        <div>
                          <strong>{ticket.category}</strong>
                          <small>
                            {ticket.reporter.fullName} · {ticket.reporter.phoneE164}
                          </small>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <em
                            className={`admin-reference-tag ${ticket.severity === "HIGH" ? "danger" : ticket.severity === "MEDIUM" ? "warning" : "neutral"}`}
                          >
                            {ticket.severity}
                          </em>
                          <em className={`admin-reference-tag ${statusTone(ticket.status)}`}>
                            {formatEnumLabel(ticket.status)}
                          </em>
                        </div>
                      </div>
                      <p className="admin-incident-desc">{ticket.description}</p>
                      {ticket.ride && (
                        <div className="admin-incident-ride">
                          <small>
                            Ride: {ticket.ride.pickupAddress} → {ticket.ride.destinationAddress}
                          </small>
                        </div>
                      )}
                      {ticket.rider && (
                        <div className="admin-incident-rider">
                          <small>
                            Rider: {ticket.rider.user.fullName} ({ticket.rider.displayCode})
                          </small>
                        </div>
                      )}
                      {ticket.assignedTo && (
                        <div className="admin-incident-rider">
                          <small>Assigned to: {ticket.assignedTo.fullName}</small>
                        </div>
                      )}
                      <div className="admin-incident-footer">
                        <small>{formatDateTime(ticket.createdAt)}</small>
                      </div>
                      <div className="admin-incident-actions">
                        <button
                          type="button"
                          className="button-sm"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "UNDER_REVIEW")}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="button-sm"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "ACTIONED")}
                        >
                          Action
                        </button>
                        <button
                          type="button"
                          className="button-sm success"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "RESOLVED")}
                        >
                          <CheckCircle size={14} /> Resolve
                        </button>
                        <button
                          type="button"
                          className="button-sm"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "CLOSED")}
                        >
                          Close
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </article>
        </div>

        {/* All tickets sidebar */}
        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card" style={{ marginBottom: 16 }}>
            <div className="admin-reference-cardhead">
              <div><h3>Ticket Status</h3></div>
            </div>
            <ul className="admin-summary-list">
              <li>
                <span>Open</span>
                <em className="admin-reference-tag danger">{openTickets.length}</em>
              </li>
              <li>
                <span>In Progress</span>
                <em className="admin-reference-tag warning">{inProgressTickets.length}</em>
              </li>
              <li>
                <span>Resolved</span>
                <em className="admin-reference-tag success">{resolvedTickets.length}</em>
              </li>
              <li>
                <span>Resolution Rate</span>
                <strong>
                  {incidents.length > 0 ? Math.round((resolvedTickets.length / incidents.length) * 100) : 0}%
                </strong>
              </li>
            </ul>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Severity Breakdown</h3></div>
            </div>
            <ul className="admin-summary-list">
              {["HIGH", "MEDIUM", "LOW"].map((severity) => (
                <li key={severity}>
                  <em
                    className={`admin-reference-tag ${severity === "HIGH" ? "danger" : severity === "MEDIUM" ? "warning" : "neutral"}`}
                  >
                    {severity}
                  </em>
                  <strong>
                    {incidents.filter((i) => i.severity.toUpperCase() === severity).length}
                  </strong>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>

      {/* All tickets table */}
      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>All Tickets</h3>
            <p>Complete history of support tickets.</p>
          </div>
        </div>
        {incidents.length === 0 ? (
          <EmptyCard title="No support tickets." body="Tickets will appear here when submitted via the app." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Rider</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {incidents
                  .slice()
                  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                  .map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.reporter.fullName}</strong>
                        <br />
                        <small>{ticket.reporter.phoneE164}</small>
                      </td>
                      <td><small>{ticket.category}</small></td>
                      <td>
                        <em
                          className={`admin-reference-tag ${ticket.severity === "HIGH" ? "danger" : ticket.severity === "MEDIUM" ? "warning" : "neutral"}`}
                        >
                          {ticket.severity}
                        </em>
                      </td>
                      <td>
                        <em className={`admin-reference-tag ${statusTone(ticket.status)}`}>
                          {formatEnumLabel(ticket.status)}
                        </em>
                      </td>
                      <td>
                        <small>{ticket.rider?.user.fullName ?? "—"}</small>
                      </td>
                      <td>
                        <small>{ticket.assignedTo?.fullName ?? "Unassigned"}</small>
                      </td>
                      <td><small>{formatDateTime(ticket.createdAt)}</small></td>
                      <td>
                        <small>{ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : "—"}</small>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
