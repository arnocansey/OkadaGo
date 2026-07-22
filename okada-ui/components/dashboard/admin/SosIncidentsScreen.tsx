"use client";

import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { AdminIncidentRecord } from "./types";
import { formatDateTime, formatEnumLabel, statusTone } from "./utils";

export type SosIncidentsScreenProps = {
  incidents: AdminIncidentRecord[];
  onIncidentAction: (
    incidentId: string,
    status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED"
  ) => void;
  isMutating: boolean;
};

function isSosIncident(incident: AdminIncidentRecord) {
  const severity = (incident.severity ?? "").toUpperCase();
  const category = (incident.category ?? "").toUpperCase();
  return severity === "CRITICAL" || category === "SOS" || category.includes("SOS");
}

function isOpenStatus(status: string) {
  const s = status.toLowerCase();
  return ["pending", "open", "under_review", "actioned"].includes(s);
}

export function SosIncidentsScreen({
  incidents,
  onIncidentAction,
  isMutating
}: SosIncidentsScreenProps) {
  const sosIncidents = incidents.filter(isSosIncident);
  const openSos = sosIncidents.filter((i) => isOpenStatus(i.status));
  const resolvedSos = sosIncidents.filter((i) =>
    ["resolved", "closed"].includes(i.status.toLowerCase())
  );

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="SOS & Emergencies"
        subtitle="Critical safety incidents from riders and passengers requiring immediate review."
      />

      <AdminKpiRow
        items={[
          { label: "Open SOS", value: openSos.length, hint: "Needs attention", icon: <ShieldAlert size={22} />, tone: "red" },
          { label: "In queue", value: sosIncidents.filter((i) => ["pending", "open"].includes(i.status.toLowerCase())).length, hint: "Unassigned / pending", icon: <AlertTriangle size={22} />, tone: "yellow" },
          { label: "In progress", value: sosIncidents.filter((i) => ["under_review", "actioned"].includes(i.status.toLowerCase())).length, hint: "Being handled", icon: <Clock size={22} />, tone: "yellow" },
          { label: "Resolved", value: resolvedSos.length, hint: "Closed critical cases", icon: <CheckCircle size={22} />, tone: "green" }
        ]}
      />

      <article className="admin-reference-card">
        <div className="admin-reference-cardhead">
          <div>
            <h3>Priority queue</h3>
            <p>{openSos.length} open critical incidents</p>
          </div>
        </div>
        {openSos.length === 0 ? (
          <EmptyCard title="No open SOS incidents." body="Critical SOS alerts from the apps will appear here in real time." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Reporter</th>
                  <th>Rider</th>
                  <th>Trip</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openSos
                  .slice()
                  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                  .map((incident) => (
                    <tr key={incident.id}>
                      <td><small>{formatDateTime(incident.createdAt)}</small></td>
                      <td>
                        <strong>{incident.reporter.fullName}</strong>
                        <br />
                        <small>{incident.reporter.phoneE164}</small>
                      </td>
                      <td>
                        {incident.rider ? (
                          <>
                            <strong>{incident.rider.user.fullName}</strong>
                            <br />
                            <small>{incident.rider.displayCode}</small>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {incident.ride ? (
                          <small>
                            {incident.ride.pickupAddress} → {incident.ride.destinationAddress}
                          </small>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <em className="admin-reference-tag danger">{formatEnumLabel(incident.severity)}</em>{" "}
                        <em className="admin-reference-tag neutral">{formatEnumLabel(incident.category)}</em>
                        <br />
                        <small>{incident.description}</small>
                      </td>
                      <td>
                        <em className={`admin-reference-tag ${statusTone(incident.status)}`}>
                          {formatEnumLabel(incident.status)}
                        </em>
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            disabled={isMutating}
                            onClick={() => onIncidentAction(incident.id, "UNDER_REVIEW")}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            disabled={isMutating}
                            onClick={() => onIncidentAction(incident.id, "RESOLVED")}
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="admin-reference-card" style={{ marginTop: 20 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Recently resolved</h3>
            <p>Last critical cases closed by ops</p>
          </div>
        </div>
        {resolvedSos.length === 0 ? (
          <EmptyCard title="No resolved SOS cases yet." body="" />
        ) : (
          <ul className="admin-summary-list">
            {resolvedSos
              .slice()
              .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
              .slice(0, 8)
              .map((incident) => (
                <li key={incident.id}>
                  <span>
                    <strong>{incident.reporter.fullName}</strong>
                    <small> · {formatEnumLabel(incident.category)} · {formatDateTime(incident.createdAt)}</small>
                  </span>
                  <em className={`admin-reference-tag ${statusTone(incident.status)}`}>
                    {formatEnumLabel(incident.status)}
                  </em>
                </li>
              ))}
          </ul>
        )}
      </article>
    </div>
  );
}
