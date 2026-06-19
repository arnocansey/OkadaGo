"use client";

import { OperationsMap } from "@/components/maps/operations-map";
import type { RiderRecord } from "./types";
import { EmptyCard } from "./EmptyCard";

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driver";
};

type RidersScreenProps = {
  riders: RiderRecord[];
  mapMarkers: MapMarker[];
  riderCitySnapshot: [string, number][];
  riderZoneSnapshot: [string, number][];
  riderRideLoadSnapshot: [string, number][];
};

export function RidersScreen({
  riders,
  mapMarkers,
  riderCitySnapshot,
  riderZoneSnapshot,
  riderRideLoadSnapshot
}: RidersScreenProps) {
  const activeRiders = riders.filter((rider) => rider.onlineStatus);
  const offlineRiders = Math.max(0, riders.length - activeRiders.length);
  const ridersWithCoords = riders.filter(
    (rider) => rider.currentLatitude !== null && rider.currentLongitude !== null
  );

  return (
    <>
      <section className="exact-admin-section">
        <div className="exact-admin-heading">
          <p className="exact-admin-eyebrow">Supply management</p>
          <h1>Riders</h1>
          <p>Monitor rider availability, city coverage, and live coordinate activity.</p>
        </div>

        <div className="exact-admin-kpis">
          <article className="exact-admin-kpi">
            <span>Total riders</span>
            <strong>{riders.length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Online riders</span>
            <strong>{activeRiders.length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Offline riders</span>
            <strong>{offlineRiders}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Live coordinates</span>
            <strong>{ridersWithCoords.length}</strong>
          </article>
        </div>
      </section>

      <div className="exact-admin-grid">
        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Rider map</h3>
              <p>Online riders with coordinates plotted from the live availability feed.</p>
            </div>
          </div>
          <div className="exact-admin-map">
            <OperationsMap
              center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
              zoom={mapMarkers.length > 0 ? 11 : 6}
              markers={mapMarkers}
              emptyTitle="No rider coordinates yet."
              emptyDescription="Riders appear here after their availability feed starts sending coordinates."
            />
          </div>
        </section>

        <div className="exact-admin-stack">
          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Supply pressure</h3>
                <p>Quick read on rider readiness across the network.</p>
              </div>
            </div>
            <div className="exact-admin-priority-grid">
              <article className="exact-admin-priority-card">
                <span>Online supply</span>
                <strong>{activeRiders.length}</strong>
                <small>Riders currently ready to take work.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Mapped riders</span>
                <strong>{ridersWithCoords.length}</strong>
                <small>Profiles already sending usable location coordinates.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Unassigned zones</span>
                <strong>{riders.filter((rider) => !rider.serviceZone?.id).length}</strong>
                <small>Riders that still need clearer zone alignment for dispatch.</small>
              </article>
            </div>
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>City coverage</h3>
                <p>How rider supply is clustering by city.</p>
              </div>
            </div>
            {riderCitySnapshot.length === 0 ? (
              <EmptyCard
                title="No rider city data yet."
                body="Rider city coverage will appear here as soon as rider profiles are created."
              />
            ) : (
              <ul className="workbench-list">
                {riderCitySnapshot.slice(0, 6).map(([city, count]) => (
                  <li key={city}>
                    <span>{city}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="exact-admin-grid">
        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Rider roster</h3>
              <p>Availability, zone assignment, and contact context.</p>
            </div>
          </div>
          {riders.length === 0 ? (
            <EmptyCard
              title="No riders created yet."
              body="Create riders in the operations lab and they will appear here."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Status</th>
                    <th>City</th>
                    <th>Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((rider) => (
                    <tr key={rider.id}>
                      <td>
                        <strong>{rider.user.fullName}</strong>
                        <div>{rider.displayCode}</div>
                      </td>
                      <td>
                        <span className={`status-chip ${rider.onlineStatus ? "success" : "neutral"}`}>
                          {rider.onlineStatus ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td>{rider.city ?? "No city"}</td>
                      <td>{rider.serviceZone?.name ?? "No zone"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="exact-admin-stack">
          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Zone rider distribution</h3>
                <p>Where rider headcount is currently concentrated.</p>
              </div>
            </div>
            {riderZoneSnapshot.length === 0 ? (
              <EmptyCard
                title="No rider zones yet."
                body="Zone assignment counts will show up here once rider profiles are distributed."
              />
            ) : (
              <ul className="workbench-list">
                {riderZoneSnapshot.slice(0, 6).map(([zone, count]) => (
                  <li key={zone}>
                    <span>{zone}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Rider trip load</h3>
                <p>Which riders are carrying the most trip volume so far.</p>
              </div>
            </div>
            {riderRideLoadSnapshot.length === 0 ? (
              <EmptyCard
                title="No rider trip load yet."
                body="Trip volume per rider will appear after rides start getting assigned."
              />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {riderRideLoadSnapshot.map(([name, count]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <strong>{count} rides</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
