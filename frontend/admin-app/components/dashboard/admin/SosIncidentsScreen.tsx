"use client";

import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
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
  dataLoading?: boolean;
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

const SOS_SLA_MINUTES = 15;

function ageMinutes(iso: string) {
  return Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
}

function formatDurationMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function resolveMinutes(incident: AdminIncidentRecord) {
  if (!incident.resolvedAt) return null;
  return Math.max(0, Math.round((Date.parse(incident.resolvedAt) - Date.parse(incident.createdAt)) / 60000));
}

export function SosIncidentsScreen({
  incidents,
  onIncidentAction,
  isMutating,
  dataLoading = false
}: SosIncidentsScreenProps) {
  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={5} cols={5} />;
  }
  const sosIncidents = incidents.filter(isSosIncident);
  const openSos = sosIncidents
    .filter((i) => isOpenStatus(i.status))
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const resolvedSos = sosIncidents.filter((i) =>
    ["resolved", "closed"].includes(i.status.toLowerCase())
  );
  const breachedOpen = openSos.filter((i) => ageMinutes(i.createdAt) >= SOS_SLA_MINUTES).length;
  const liveFeed = sosIncidents
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12);

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="SOS & Emergencies"
        subtitle="Critical rider and passenger alerts — respond within SLA."
      />

      <AdminKpiRow
        items={[
          { label: "Open SOS", value: openSos.length, hint: "Needs attention", icon: <ShieldAlert size={22} />, tone: "red" },
          { label: `SLA > ${SOS_SLA_MINUTES}m`, value: breachedOpen, hint: "Open past target", icon: <AlertTriangle size={22} />, tone: "red" },
          { label: "In progress", value: sosIncidents.filter((i) => ["under_review", "actioned"].includes(i.status.toLowerCase())).length, hint: "Being handled", icon: <Clock size={22} />, tone: "yellow" },
          { label: "Resolved", value: resolvedSos.length, hint: "Closed critical cases", icon: <CheckCircle size={22} />, tone: "green" }
        ]}
      />

      {openSos.length > 0 ? (
        <div className="admin-critical-banner" role="alert">
          <div>
            <strong>CRITICAL: {openSos.length} active SOS in progress</strong>
            <span>
              {breachedOpen > 0
                ? `${breachedOpen} past ${SOS_SLA_MINUTES}m SLA — prioritize Accra response now.`
                : `All open alerts are within the ${SOS_SLA_MINUTES}m SLA target.`}
            </span>
          </div>
          <em className="admin-reference-tag danger">LIVE</em>
        </div>
      ) : null}

      <section className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Priority queue</h3>
              <p>{openSos.length} open critical incidents</p>
            </div>
          </div>
          {openSos.length === 0 ? (
            <EmptyCard
              title="No open SOS incidents."
              body="Critical SOS alerts from the apps will appear here in real time."
            />
          ) : (
            <div className="admin-incident-list">
              {openSos.map((incident) => {
                const age = ageMinutes(incident.createdAt);
                const breached = age >= SOS_SLA_MINUTES;
                return (
                  <div key={incident.id} className="admin-incident-item">
                    <div>
                      <strong>{incident.reporter.fullName}</strong>
                      <p>{incident.description}</p>
                      <small>
                        {formatDateTime(incident.createdAt)} · {formatDurationMinutes(age)} ·{" "}
                        {incident.ride
                          ? `${incident.ride.pickupAddress} → ${incident.ride.destinationAddress}`
                          : "No trip linked"}
                      </small>
                      <div className="admin-action-row" style={{ marginTop: 8 }}>
                        <em className={`admin-reference-tag ${breached ? "danger" : "warning"}`}>
                          {breached ? "SLA breach" : "Within SLA"}
                        </em>
                        <em className="admin-reference-tag danger">{formatEnumLabel(incident.severity)}</em>
                        <em className={`admin-reference-tag ${statusTone(incident.status)}`}>
                          {formatEnumLabel(incident.status)}
                        </em>
                      </div>
                    </div>
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
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live emergency feed</h3>
              <p>Latest SOS activity across Ghana ops</p>
            </div>
            <em className="admin-reference-tag danger">LIVE</em>
          </div>
          {liveFeed.length === 0 ? (
            <EmptyCard title="No SOS activity yet." body="" />
          ) : (
            <ul className="admin-summary-list">
              {liveFeed.map((incident) => {
                const open = isOpenStatus(incident.status);
                return (
                  <li key={incident.id}>
                    <span>
                      <strong>{incident.reporter.fullName}</strong>
                      <small>
                        {" "}
                        · {formatEnumLabel(incident.category)} · {formatDateTime(incident.createdAt)}
                        {!open && incident.resolvedAt
                          ? ` · resolved in ${formatDurationMinutes(resolveMinutes(incident) ?? 0)}`
                          : open
                            ? ` · open ${formatDurationMinutes(ageMinutes(incident.createdAt))}`
                            : ""}
                      </small>
                    </span>
                    <em className={`admin-reference-tag ${statusTone(incident.status)}`}>
                      {formatEnumLabel(incident.status)}
                    </em>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <article className="admin-reference-card" style={{ marginTop: 20 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Full priority table</h3>
            <p>Trip, rider, and SLA detail for open SOS</p>
          </div>
        </div>
        {openSos.length === 0 ? (
          <EmptyCard title="Queue clear." body="No open critical rows to expand." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Age / SLA</th>
                  <th>Reporter</th>
                  <th>Rider</th>
                  <th>Trip</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openSos.map((incident) => (
                  <tr key={`table-${incident.id}`}>
                    <td>
                      <small>{formatDateTime(incident.createdAt)}</small>
                    </td>
                    <td>
                      <small>{formatDurationMinutes(ageMinutes(incident.createdAt))}</small>
                      <br />
                      <em
                        className={`admin-reference-tag ${
                          ageMinutes(incident.createdAt) >= SOS_SLA_MINUTES ? "danger" : "warning"
                        }`}
                      >
                        {ageMinutes(incident.createdAt) >= SOS_SLA_MINUTES ? "SLA breach" : "Within SLA"}
                      </em>
                    </td>
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
    </div>
  );
}
