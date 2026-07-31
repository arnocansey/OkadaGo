import { useMemo, useState } from "react";
import { MapPin, Download } from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { OperationsMap } from "@/components/maps/operations-map";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, usePagination } from "./ui/AdminPagination";
import type { RiderRecord } from "./types";
import { statusTone } from "./utils";
import { parseNumber, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY, ACCRA_MAP_ZOOM_METRO } from "./utils";

const PAGE_SIZE = 12;

export type RidersScreenProps = {
  riders: RiderRecord[];
  ridersTotal: number;
  activeRiders: RiderRecord[];
  ridersWithCoords: RiderRecord[];
  rideZoneSnapshot: [string, number][];
  riderCitySnapshot: [string, number][];
  riderZoneSnapshot: [string, number][];
  vehicleCount: number;
  onboardingPipeline: {
    total: number;
    signedUp: number;
    hasVehicle: number;
    hasZone: number;
    verified: number;
    active: number;
    pending?: number;
  };
  onBulkApprove?: (ids: string[]) => void;
  onBulkSuspend?: (ids: string[]) => void;
};

export function RidersScreen({
  riders,
  ridersTotal,
  activeRiders,
  ridersWithCoords,
  rideZoneSnapshot: _rideZoneSnapshot,
  riderCitySnapshot,
  riderZoneSnapshot,
  vehicleCount,
  onboardingPipeline,
  onBulkApprove,
  onBulkSuspend
}: RidersScreenProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sortedRiders = useMemo(
    () => riders.slice().sort((a, b) => Number(b.onlineStatus) - Number(a.onlineStatus)),
    [riders]
  );
  const { page, setPage, paginated: pagedRiders } = usePagination(sortedRiders, PAGE_SIZE);
  const allVisibleIds = pagedRiders.map((r) => r.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mapMarkers = ridersWithCoords.map((rider) => ({
    id: rider.id,
    position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [number, number],
    label: rider.user.fullName,
    variant: "driver" as const
  }));

  const pendingCount = onboardingPipeline.pending ?? Math.max(0, onboardingPipeline.signedUp - onboardingPipeline.verified);
  const verifiedCount = onboardingPipeline.verified;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Riders"
        subtitle="Fleet map, onboarding pipeline, and rider distribution by Accra zones."
      />
      <section className="admin-kpi-grid">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><MapPin size={22} /></div>
          <div>
            <span>Total Riders</span>
            <strong>{ridersTotal}</strong>
            <small>{vehicleCount} with vehicle</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><MapPin size={22} /></div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting verification</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><MapPin size={22} /></div>
          <div>
            <span>Verified</span>
            <strong>{verifiedCount}</strong>
            <small>Approved to ride</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><MapPin size={22} /></div>
          <div>
            <span>Online Now</span>
            <strong>{activeRiders.length}</strong>
            <small>Currently dispatching</small>
          </div>
        </article>
      </section>

      <article className="admin-reference-card" style={{ marginBottom: 16 }}>
        <div className="admin-reference-cardhead">
          <div><h3>Rider Onboarding Pipeline</h3><p>Registration progress across all stages</p></div>
        </div>
        <div style={{ display: "flex", gap: 2, padding: "16px 0" }}>
          {/* Each stage is a horizontal bar segment */}
          {[
            { label: "Signed Up", count: onboardingPipeline.signedUp, color: "var(--text-muted)" },
            { label: "Vehicle Added", count: onboardingPipeline.hasVehicle, color: "#d97706" },
            { label: "Zone Assigned", count: onboardingPipeline.hasZone, color: "var(--accent-orange)" },
            { label: "Verified", count: onboardingPipeline.verified, color: "var(--color-success)" },
            { label: "Active", count: onboardingPipeline.active, color: "#16a34a" }
          ].map((stage, i) => {
            const pct = onboardingPipeline.total > 0 ? (stage.count / onboardingPipeline.total) * 100 : 0;
            return (
              <div key={stage.label} style={{ flex: pct > 0 ? pct : 1, minWidth: pct > 0 ? 60 : 20 }}>
                <div style={{ height: 32, background: stage.color, borderRadius: i === 0 ? "8px 0 0 8px" : i === 4 ? "0 8px 8px 0" : 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: pct > 0 ? 1 : 0.3 }}>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{stage.count}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", textAlign: "center", marginTop: 4 }}>{stage.label}</span>
              </div>
            );
          })}
        </div>
      </article>

      <div className="admin-overview-split">
        <div>
          <article className="admin-reference-card" style={{ marginBottom: 16 }}>
            <div className="admin-reference-cardhead">
              <div><h3>Live Rider Map</h3><p>{activeRiders.length} riders online</p></div>
            </div>
            <div className="admin-reference-map">
              <OperationsMap
                basemap="auto"
                emptyPlacement="bottom"
                center={mapMarkers[0]?.position ?? ACCRA_MAP_CENTER}
                zoom={mapMarkers.length > 0 ? ACCRA_MAP_ZOOM_METRO : ACCRA_MAP_ZOOM_CITY}
                markers={mapMarkers}
                emptyTitle="Waiting for Accra GPS pings"
                emptyDescription="Riders appear when they share live location from the rider app."
              />
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>All Riders</h3><p>Sorted by online status</p></div>
              <button
                className="admin-select-sm"
                onClick={() =>
                  downloadCsv(
                    "riders.csv",
                    ["Name", "Display Code", "Phone", "City", "Zone", "Vehicle", "Online", "Status"],
                    riders.map((rider) => [
                      rider.user.fullName,
                      rider.displayCode,
                      rider.user.phoneE164 ?? "",
                      rider.city ?? "",
                      rider.serviceZone?.name ?? "",
                      rider.vehicle?.plateNumber ?? "",
                      rider.onlineStatus ? "Online" : "Offline",
                      rider.user.accountStatus ?? (rider.onlineStatus ? "active" : "offline")
                    ])
                  )
                }
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            {riders.length === 0 ? (
              <EmptyCard title="No riders yet." body="Rider registrations will appear here." />
            ) : (
              <ul className="admin-reference-list">
                <li className="admin-reference-list-row" style={{ fontWeight: 600, fontSize: 12, color: "var(--muted, #888)" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                  <div style={{ flex: 1 }}>Rider</div>
                  <div style={{ textAlign: "right" }}>Vehicle / Status</div>
                </li>
                {pagedRiders.map((rider) => (
                    <li key={rider.id} className="admin-reference-list-row">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rider.id)}
                        onChange={() => toggleId(rider.id)}
                      />
                      <span
                        className={`admin-reference-status-dot ${rider.onlineStatus ? "success" : "neutral"}`}
                      />
                      <div>
                        <strong>{rider.user.fullName}</strong>
                        <small>
                          {rider.displayCode} · {rider.city ?? rider.serviceZone?.name ?? "No location"}
                        </small>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <small>{rider.vehicle?.plateNumber ?? "No vehicle"}</small>
                        <em
                          className={`admin-reference-tag ${statusTone(
                            rider.user.accountStatus ?? (rider.onlineStatus ? "active" : "offline")
                          )}`}
                        >
                          {rider.onlineStatus ? "Online" : "Offline"}
                        </em>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
            <AdminPagination
              page={page}
              totalItems={sortedRiders.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </article>
        </div>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Zone Distribution</h3></div>
            </div>
            {riderZoneSnapshot.length === 0 ? (
              <EmptyCard title="No zone data." body="Riders will be distributed across zones here." />
            ) : (
              <ul className="admin-summary-list">
                {riderZoneSnapshot.map(([zone, count]) => (
                  <li key={zone}>
                    <span>{zone}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>City Breakdown</h3></div>
            </div>
            {riderCitySnapshot.length === 0 ? (
              <EmptyCard title="No city data." body="" />
            ) : (
              <ul className="admin-summary-list">
                {riderCitySnapshot.map(([city, count]) => (
                  <li key={city}>
                    <span>{city}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>

      {selectedIds.size > 0 && (
        <div
          className="admin-bulk-bar"
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--card-bg, #1a1b1e)",
            borderTop: "1px solid var(--border)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 10
          }}
        >
          <span style={{ fontSize: 13, color: "var(--muted, #aaa)" }}>
            {selectedIds.size} rider{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          {onBulkApprove && (
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => onBulkApprove(Array.from(selectedIds))}
            >
              Approve Selected
            </button>
          )}
          {onBulkSuspend && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => onBulkSuspend(Array.from(selectedIds))}
            >
              Suspend Selected
            </button>
          )}
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
