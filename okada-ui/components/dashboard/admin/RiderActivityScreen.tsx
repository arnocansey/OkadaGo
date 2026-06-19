"use client";

import { CheckCircle, Clock, MapPin, Users } from "lucide-react";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { RiderRecord } from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

type ActivityRow = {
  rider: RiderRecord;
  rideCount: number;
  completedCount: number;
  activeCount: number;
  earnings: number;
};

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driver";
};

type ActivityItem = {
  id: string;
  title: string;
  body: string;
  meta: string;
  tone: string;
};

type RiderActivityScreenProps = {
  riders: RiderRecord[];
  activeRiders: RiderRecord[];
  ridersWithCoords: RiderRecord[];
  rides: unknown[];
  completedTrips: unknown[];
  activeTrips: unknown[];
  ridesAwaitingPickup: unknown[];
  ridesInProgress: unknown[];
  totalRevenue: number;
  adminCurrency: string;
  mapMarkers: MapMarker[];
  activityRows: ActivityRow[];
  selectedActivityRow: ActivityRow | null;
  liveActivityItems: ActivityItem[];
};

export function RiderActivityScreen({
  riders,
  activeRiders,
  ridersWithCoords,
  completedTrips,
  activeTrips,
  ridesAwaitingPickup,
  ridesInProgress,
  totalRevenue,
  adminCurrency,
  mapMarkers,
  activityRows,
  selectedActivityRow,
  liveActivityItems
}: RiderActivityScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi"><Users /><span>Total active riders</span><strong>{activeRiders.length}</strong><small>{riders.length} rider profiles monitored</small></article>
        <article className="admin-dark-kpi"><span>Total trips</span><strong>{completedTrips.length}</strong><small>{completedTrips.length} completed trips</small></article>
        <article className="admin-dark-kpi"><MapPin /><span>Location signals</span><strong>{ridersWithCoords.length}</strong><small>{activeRiders.length} riders online now</small></article>
        <article className="admin-dark-kpi"><Clock /><span>Active trip load</span><strong>{activeTrips.length}</strong><small>{ridesAwaitingPickup.length + ridesInProgress.length} in motion</small></article>
        <article className="admin-dark-kpi"><CheckCircle /><span>Completed today</span><strong>{completedTrips.length}</strong><small>{formatMoney(adminCurrency, totalRevenue)} captured</small></article>
      </section>

      <section className="admin-rider-activity-layout">
        <div className="admin-rider-activity-main">
          <article className="admin-dark-card">
            <div className="admin-rider-tabs">
              <span className="active">Live Map</span>
              <span>Rider Activity Feed</span>
              <span>Geofence Zones</span>
              <span>Heatmap</span>
            </div>
            <div className="admin-rider-activity-map">
              <OperationsMap
                center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                zoom={12}
                bare
                markers={mapMarkers}
                emptyTitle="No live rider coordinates"
                emptyDescription="Rider locations appear here after the mobile app sends current latitude and longitude."
              />
              <div className="admin-rider-map-legend">
                <span><i className="green" /> High Activity</span>
                <span><i className="yellow" /> Medium Activity</span>
                <span><i className="red" /> Low Activity</span>
                <span><i className="neutral" /> Offline</span>
              </div>
            </div>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Active Riders (Live)</h3>
                <p>Online state, location readiness, service zone and active ride load from backend records.</p>
              </div>
              <span>Showing {activityRows.length} riders</span>
            </div>
            {activityRows.length === 0 ? (
              <EmptyCard title="No rider activity yet." body="Activity tracking starts once rider profiles are created." />
            ) : (
              <div className="table-wrapper admin-rider-subset-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rider</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Trips</th>
                      <th>Distance signal</th>
                      <th>Earnings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityRows.map((row) => {
                      const hasLocation =
                        row.rider.currentLatitude !== null && row.rider.currentLongitude !== null;

                      return (
                        <tr key={row.rider.id}>
                          <td>
                            <strong>{row.rider.user.fullName}</strong>
                            <div>{row.rider.displayCode}</div>
                          </td>
                          <td>
                            <strong>{row.rider.city ?? row.rider.serviceZone?.name ?? "No location"}</strong>
                            <div>{hasLocation ? "Live coordinates available" : "No coordinates yet"}</div>
                          </td>
                          <td>
                            <span className={`status-chip ${row.rider.onlineStatus ? "success" : "neutral"}`}>
                              {row.rider.onlineStatus ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td>{row.rideCount}</td>
                          <td>{hasLocation ? `${row.rider.currentLatitude}, ${row.rider.currentLongitude}` : "Waiting"}</td>
                          <td>{formatMoney(adminCurrency, row.earnings)}</td>
                          <td><a className="admin-rider-mini-action" href="/admin/riders">View</a></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <aside className="admin-rider-side-stack">
          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Selected Rider</h3>
                <p>{selectedActivityRow ? "Highest priority live rider snapshot." : "No rider selected."}</p>
              </div>
              {selectedActivityRow ? (
                <span className={`status-chip ${selectedActivityRow.rider.onlineStatus ? "success" : "neutral"}`}>
                  {selectedActivityRow.rider.onlineStatus ? "Online" : "Offline"}
                </span>
              ) : null}
            </div>
            {selectedActivityRow ? (
              <div className="admin-rider-selected-card">
                <div className="admin-rider-selected-head">
                  <div className="exact-avatar">{selectedActivityRow.rider.user.fullName.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{selectedActivityRow.rider.user.fullName}</strong>
                    <span>{selectedActivityRow.rider.displayCode}</span>
                    <small>{selectedActivityRow.rider.user.phoneE164}</small>
                  </div>
                </div>
                <div className="admin-rider-selected-stats">
                  <span><strong>{selectedActivityRow.rideCount}</strong>Trips</span>
                  <span><strong>{selectedActivityRow.completedCount}</strong>Completed</span>
                  <span><strong>{formatMoney(adminCurrency, selectedActivityRow.earnings)}</strong>Earnings</span>
                </div>
                <div className="admin-rider-selected-location">
                  <MapPin size={15} />
                  <span>{selectedActivityRow.rider.city ?? selectedActivityRow.rider.serviceZone?.name ?? "No current location"}</span>
                </div>
                <a className="button" href="/admin/riders">View Rider Profile</a>
              </div>
            ) : (
              <EmptyCard title="No rider selected." body="Create or approve riders to populate the live activity panel." />
            )}
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest rides, deliveries, registrations and rider state changes.</p>
              </div>
            </div>
            <ul className="admin-rider-activity-feed">
              {liveActivityItems.map((item) => (
                <li key={item.id}>
                  <span className={`admin-rider-feed-dot ${item.tone}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </div>
                  <small>{item.meta}</small>
                </li>
              ))}
            </ul>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead"><h3>Quick Filters</h3></div>
            <div className="admin-rider-filter-grid">
              <button type="button" className="active">All Riders</button>
              <button type="button">Online</button>
              <button type="button">Offline</button>
              <button type="button">High Activity</button>
              <button type="button">Low Activity</button>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
