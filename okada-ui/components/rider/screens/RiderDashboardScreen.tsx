"use client";

import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { parseNumber, formatStatus, type RideRecord, type RiderRecord } from "../rider-portal-types";

export function RiderDashboardScreen({
  rider,
  isDeficitLocked,
  displayIsOnline,
  deficitAmount,
  currency,
  activeRide
}: {
  rider: RiderRecord | null;
  isDeficitLocked: boolean;
  displayIsOnline: boolean;
  deficitAmount: number;
  currency: string;
  activeRide: RideRecord | null;
}) {
  const mapMarkers =
    rider && rider.currentLatitude !== null && rider.currentLongitude !== null
      ? [
          {
            id: rider.id,
            position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [
              number,
              number
            ],
            label: rider.user.fullName,
            variant: "driver" as const
          }
        ]
      : [];

  const currentMapPosition = mapMarkers[0]?.position ?? null;
  const dashboardMapCenter = currentMapPosition ?? ([5.6037, -0.187] as [number, number]);

  return (
    <section className="exact-rider-map">
      <OperationsMap
        center={dashboardMapCenter}
        zoom={12}
        bare
        markers={mapMarkers}
        currentPosition={
          currentMapPosition
            ? {
                position: currentMapPosition,
                label: "Your live location"
              }
            : null
        }
        emptyTitle="No live rider location yet"
        emptyDescription="Update rider availability with coordinates and your live Accra map position will render here."
      />

      <div className="exact-rider-status-pill">
        <div className="exact-live-dot" />
        <span>
          {isDeficitLocked
            ? "Offline due to deficit"
            : displayIsOnline
              ? "You're online"
              : "You're offline"}
        </span>
        <small>
          {isDeficitLocked
            ? `Settle ${formatMoney(currency, deficitAmount)} to restore access`
            : activeRide
              ? formatStatus(activeRide.status)
              : "Waiting for trips"}
        </small>
      </div>

      <div className="exact-rider-badge">
        {activeRide ? `${formatStatus(activeRide.status)} ride active` : "No active trips"}
      </div>
    </section>
  );
}
