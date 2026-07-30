import { Globe, MapPin } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { ServiceZoneRecord } from "./types";
import { parseNumber } from "./utils";

export type ZoneManagementScreenProps = {
  zones: ServiceZoneRecord[];
  ridersPerZone: Record<string, number>;
  ridesPerZone: Record<string, number>;
  adminCurrency: string;
  onZoneUpdate?: (
    zoneId: string,
    updates: Partial<Pick<ServiceZoneRecord, "isActive" | "ridesEnabled" | "deliveriesEnabled">>
  ) => void;
  isMutating?: boolean;
};

function ZoneToggle({
  label,
  active,
  disabled,
  onToggle
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`admin-reference-tag ${active ? "success" : "neutral"}`}
      style={{ cursor: disabled ? "not-allowed" : "pointer", border: "none", opacity: disabled ? 0.6 : 1 }}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      title={`Click to turn ${active ? "off" : "on"}`}
    >
      {label}: {active ? "On" : "Off"}
    </button>
  );
}

export function ZoneManagementScreen({
  zones,
  ridersPerZone,
  ridesPerZone,
  adminCurrency,
  onZoneUpdate,
  isMutating
}: ZoneManagementScreenProps) {
  const activeZones = zones.filter((z) => z.isActive);
  const inactiveZones = zones.filter((z) => !z.isActive);

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Service Zones"
        subtitle="Toggle Accra service zones and ride/delivery dispatch coverage."
      />
      <section className="admin-kpi-grid">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green">
            <Globe size={22} />
          </div>
          <div>
            <span>Total Zones</span>
            <strong>{zones.length}</strong>
            <small>{activeZones.length} active</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow">
            <Globe size={22} />
          </div>
          <div>
            <span>Active Zones</span>
            <strong>{activeZones.length}</strong>
            <small>Accepting dispatches</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red">
            <Globe size={22} />
          </div>
          <div>
            <span>Inactive Zones</span>
            <strong>{inactiveZones.length}</strong>
            <small>Paused or disabled</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow">
            <MapPin size={22} />
          </div>
          <div>
            <span>Zones with Riders</span>
            <strong>{zones.filter((z) => (ridersPerZone[z.id] ?? 0) > 0).length}</strong>
            <small>Currently occupied · {adminCurrency}</small>
          </div>
        </article>
      </section>

      {zones.length === 0 ? (
        <EmptyCard
          title="No service zones."
          body="Service zones need to be created from the backend API."
        />
      ) : (
        <>
          <div className="admin-zone-grid">
            {zones.map((zone) => (
              <article key={zone.id} className={`admin-zone-card ${zone.isActive ? "" : "inactive"}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div>
                    <h4>{zone.name}</h4>
                    <p>
                      {zone.city} · {zone.currency}
                    </p>
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
                <div className="admin-action-row" style={{ flexWrap: "wrap" }}>
                  <ZoneToggle
                    label="Zone"
                    active={zone.isActive}
                    disabled={!onZoneUpdate || isMutating}
                    onToggle={() => onZoneUpdate?.(zone.id, { isActive: !zone.isActive })}
                  />
                  <ZoneToggle
                    label="Rides"
                    active={zone.ridesEnabled ?? true}
                    disabled={!onZoneUpdate || isMutating}
                    onToggle={() => onZoneUpdate?.(zone.id, { ridesEnabled: !(zone.ridesEnabled ?? true) })}
                  />
                  <ZoneToggle
                    label="Delivery"
                    active={zone.deliveriesEnabled ?? true}
                    disabled={!onZoneUpdate || isMutating}
                    onToggle={() =>
                      onZoneUpdate?.(zone.id, { deliveriesEnabled: !(zone.deliveriesEnabled ?? true) })
                    }
                  />
                </div>
              </article>
            ))}
          </div>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Pricing directory</h3>
                <p>Full fare parameters for every configured zone.</p>
              </div>
            </div>
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
                    <th>Rides Module</th>
                    <th>Delivery Module</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={`dir-${zone.id}`}>
                      <td>
                        <strong>{zone.name}</strong>
                      </td>
                      <td>{zone.city}</td>
                      <td>
                        <small>{zone.currency}</small>
                      </td>
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
                        <ZoneToggle
                          label="Zone"
                          active={zone.isActive}
                          disabled={!onZoneUpdate || isMutating}
                          onToggle={() => onZoneUpdate?.(zone.id, { isActive: !zone.isActive })}
                        />
                      </td>
                      <td>
                        <ZoneToggle
                          label="Rides"
                          active={zone.ridesEnabled ?? true}
                          disabled={!onZoneUpdate || isMutating}
                          onToggle={() =>
                            onZoneUpdate?.(zone.id, { ridesEnabled: !(zone.ridesEnabled ?? true) })
                          }
                        />
                      </td>
                      <td>
                        <ZoneToggle
                          label="Delivery"
                          active={zone.deliveriesEnabled ?? true}
                          disabled={!onZoneUpdate || isMutating}
                          onToggle={() =>
                            onZoneUpdate?.(zone.id, {
                              deliveriesEnabled: !(zone.deliveriesEnabled ?? true)
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}
    </div>
  );
}
