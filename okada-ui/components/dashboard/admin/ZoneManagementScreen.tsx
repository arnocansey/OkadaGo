import { Globe, DollarSign, MapPin, Settings } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { ServiceZoneRecord } from "./types";
import { parseNumber } from "./utils";

export type ZoneManagementScreenProps = {
  zones: ServiceZoneRecord[];
  ridersPerZone: Record<string, number>;
  ridesPerZone: Record<string, number>;
  adminCurrency: string;
};

export function ZoneManagementScreen({
  zones,
  ridersPerZone,
  ridesPerZone,
  adminCurrency
}: ZoneManagementScreenProps) {
  const activeZones = zones.filter((z) => z.isActive);
  const inactiveZones = zones.filter((z) => !z.isActive);

  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Globe size={22} /></div>
          <div>
            <span>Total Zones</span>
            <strong>{zones.length}</strong>
            <small>{activeZones.length} active</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Globe size={22} /></div>
          <div>
            <span>Active Zones</span>
            <strong>{activeZones.length}</strong>
            <small>Accepting dispatches</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><Globe size={22} /></div>
          <div>
            <span>Inactive Zones</span>
            <strong>{inactiveZones.length}</strong>
            <small>Paused or disabled</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><MapPin size={22} /></div>
          <div>
            <span>Zones with Riders</span>
            <strong>
              {zones.filter((z) => (ridersPerZone[z.id] ?? 0) > 0).length}
            </strong>
            <small>Currently occupied</small>
          </div>
        </article>
      </section>

      <article className="admin-reference-card" style={{ marginBottom: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Service Zone Directory</h3>
            <p>All configured service zones with pricing parameters and activity levels.</p>
          </div>
        </div>
        {zones.length === 0 ? (
          <EmptyCard
            title="No service zones."
            body="Service zones need to be created from the backend API."
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>City</th>
                  <th>Currency</th>
                  <th>Base Fare</th>
                  <th>Per KM</th>
                  <th>Per Min</th>
                  <th>Min Fare</th>
                  <th>Cancel Fee</th>
                  <th>Waiting Fee</th>
                  <th>Active Riders</th>
                  <th>Total Rides</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id}>
                    <td><strong>{zone.name}</strong></td>
                    <td>{zone.city}</td>
                    <td><small>{zone.currency}</small></td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.baseFare))}</td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.perKmFee))}</td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.perMinuteFee))}</td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.minimumFare))}</td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.cancellationFee))}</td>
                    <td>{formatMoney(zone.currency, parseNumber(zone.waitingFeePerMin))}/min</td>
                    <td>
                      <strong>{ridersPerZone[zone.id] ?? 0}</strong>
                    </td>
                    <td>{ridesPerZone[zone.id] ?? 0}</td>
                    <td>
                      <em className={`admin-reference-tag ${zone.isActive ? "success" : "neutral"}`}>
                        {zone.isActive ? "Active" : "Inactive"}
                      </em>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* Zone cards for quick view */}
      <div className="admin-zone-cards">
        {zones.map((zone) => (
          <article key={zone.id} className={`admin-zone-card ${zone.isActive ? "" : "inactive"}`}>
            <div className="admin-zone-card-head">
              <div>
                <strong>{zone.name}</strong>
                <small>{zone.city}</small>
              </div>
              <em className={`admin-reference-tag ${zone.isActive ? "success" : "neutral"}`}>
                {zone.isActive ? "Active" : "Inactive"}
              </em>
            </div>
            <div className="admin-zone-card-stats">
              <div>
                <span>Riders</span>
                <strong>{ridersPerZone[zone.id] ?? 0}</strong>
              </div>
              <div>
                <span>Rides</span>
                <strong>{ridesPerZone[zone.id] ?? 0}</strong>
              </div>
              <div>
                <span>Base Fare</span>
                <strong>{formatMoney(zone.currency, parseNumber(zone.baseFare))}</strong>
              </div>
              <div>
                <span>Min Fare</span>
                <strong>{formatMoney(zone.currency, parseNumber(zone.minimumFare))}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
