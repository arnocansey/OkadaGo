"use client";

import { CheckCircle, ChevronDown, Clock, Search, ShieldAlert, Users } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { RiderRecord } from "./types";

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type RiderSuspensionsScreenProps = {
  riders: RiderRecord[];
  suspendedRiders: RiderRecord[];
  selectedSuspendedRider: RiderRecord | null;
};

export function RiderSuspensionsScreen({
  riders,
  suspendedRiders,
  selectedSuspendedRider
}: RiderSuspensionsScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis suspensions">
        <article className="admin-dark-kpi danger"><ShieldAlert /><span>Total suspended riders</span><strong>{suspendedRiders.length}</strong><small>Blocked, suspended, or rejected accounts</small></article>
        <article className="admin-dark-kpi danger"><Clock /><span>Currently suspended</span><strong>{suspendedRiders.length}</strong><small>Real-time account status flags</small></article>
        <article className="admin-dark-kpi"><CheckCircle /><span>Clear accounts</span><strong>{Math.max(0, riders.length - suspendedRiders.length)}</strong><small>{riders.length} rider profiles checked</small></article>
        <article className="admin-dark-kpi"><Users /><span>Online while flagged</span><strong>{suspendedRiders.filter((rider) => rider.onlineStatus).length}</strong><small>Should be reviewed immediately</small></article>
      </section>

      <section className="admin-rider-suspension-layout">
        <article className="admin-dark-card">
          <div className="admin-rider-tabs">
            <span className="active">All Suspensions</span>
            <span>Active Suspensions</span>
            <span>Expired Suspensions</span>
            <span>Reinstated</span>
          </div>
          <div className="admin-rider-suspension-filters">
            <div><Search size={15} /><span>Search by rider name, ID or phone number...</span></div>
            <button type="button">All Reasons <ChevronDown size={14} /></button>
            <button type="button">All Status <ChevronDown size={14} /></button>
            <button type="button">All Durations <ChevronDown size={14} /></button>
            <button type="button" className="active">Apply</button>
          </div>
          {suspendedRiders.length === 0 ? (
            <EmptyCard
              title="No suspended riders."
              body="Suspended, blocked, or rejected riders will appear here when the backend account status reflects it."
            />
          ) : (
            <div className="table-wrapper admin-rider-subset-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Zone</th>
                    <th>Online</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suspendedRiders.map((rider) => (
                    <tr key={rider.id} className={selectedSuspendedRider?.id === rider.id ? "selected" : ""}>
                      <td>
                        <strong>{rider.user.fullName}</strong>
                        <div>{rider.displayCode}</div>
                      </td>
                      <td>{formatEnumLabel(rider.user.accountStatus ?? "Flagged account")}</td>
                      <td><span className="status-chip danger">{rider.user.accountStatus ?? "Flagged"}</span></td>
                      <td>{rider.user.phoneE164}</td>
                      <td>{rider.city ?? "No city"}</td>
                      <td>{rider.serviceZone?.name ?? "No zone"}</td>
                      <td>{rider.onlineStatus ? "Online" : "Offline"}</td>
                      <td><button className="admin-rider-row-menu" type="button">...</button></td>
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
                <h3>Suspension Details</h3>
                <p>{selectedSuspendedRider ? "Selected flagged rider account." : "No rider selected."}</p>
              </div>
              <span className="status-chip danger">{selectedSuspendedRider?.user.accountStatus ?? "None"}</span>
            </div>
            {selectedSuspendedRider ? (
              <div className="admin-rider-suspension-detail">
                <div className="admin-rider-selected-head">
                  <div className="exact-avatar">{selectedSuspendedRider.user.fullName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{selectedSuspendedRider.user.fullName}</strong>
                    <span>{selectedSuspendedRider.user.phoneE164}</span>
                    <small>{selectedSuspendedRider.displayCode}</small>
                  </div>
                </div>
                <dl>
                  <div><dt>Status</dt><dd>{selectedSuspendedRider.user.accountStatus ?? "Flagged"}</dd></div>
                  <div><dt>Reason</dt><dd>{formatEnumLabel(selectedSuspendedRider.user.accountStatus ?? "Suspended")}</dd></div>
                  <div><dt>Current Location</dt><dd>{selectedSuspendedRider.city ?? selectedSuspendedRider.serviceZone?.name ?? "No location"}</dd></div>
                  <div><dt>Vehicle</dt><dd>{selectedSuspendedRider.vehicle?.plateNumber ?? "No vehicle on file"}</dd></div>
                  <div><dt>Online</dt><dd>{selectedSuspendedRider.onlineStatus ? "Yes" : "No"}</dd></div>
                </dl>
                <div className="admin-rider-suspension-actions">
                  <a href="/admin/riders/verification">Open verification</a>
                  <a href="/admin/riders/complaints">View complaints</a>
                </div>
              </div>
            ) : (
              <EmptyCard title="No suspension selected." body="Flagged rider details appear here when account statuses are blocked, suspended, or rejected." />
            )}
          </article>
        </aside>
      </section>
    </div>
  );
}
