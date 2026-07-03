"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { useGeoLocation } from "@/components/passenger/hooks/use-geo-location";
import type { MapMarker } from "@/components/passenger/map/interactive-map";
import { RiderAppFrame } from "@/components/rider/layout/app-frame";
import { useRiderData } from "@/components/rider/hooks/use-rider-data";
import { useRiderLocation } from "@/components/rider/hooks/use-rider-location";
import { ActiveRidePanel, DashboardStats } from "@/components/rider/ui/dashboard-panel";
import { OnlineStatusControl } from "@/components/rider/ui/online-toggle";
import { DashboardSkeleton } from "@/components/rider/ui/skeletons";
import {
  ACCRA_CENTER,
  formatStatus,
  parseCoord,
  riderDeficitOfflineThreshold
} from "@/components/rider/types";

const RideMap = dynamic(
  () => import("@/components/passenger/map/ride-map").then((m) => m.RideMap),
  {
    ssr: false,
    loading: () => <div className="pax-map-root rdr-map-root rdr-map-root--loading" />
  }
);

export function DashboardView() {
  const data = useRiderData();
  const { center, coords, refresh, hasFix } = useGeoLocation();
  const [recenterSignal, setRecenterSignal] = useState(0);

  const { displayIsOnline, updateAvailability, advanceRideStatus } = useRiderLocation({
    riderProfileId: data.riderProfileId,
    rider: data.rider,
    activeRide: data.activeRide,
    userId: data.userId,
    isDeficitLocked: data.isDeficitLocked
  });

  const userLocation = useMemo(
    () => (hasFix && coords ? { lat: coords[0], lng: coords[1] } : null),
    [hasFix, coords]
  );

  const mapCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng] as [number, number];
    if (data.rider?.currentLatitude != null && data.rider.currentLongitude != null) {
      return [parseCoord(data.rider.currentLatitude), parseCoord(data.rider.currentLongitude)] as [number, number];
    }
    return ACCRA_CENTER;
  }, [userLocation, data.rider]);

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    if (data.activeRide) {
      list.push({
        id: "pickup",
        lat: parseCoord(data.activeRide.pickupLatitude),
        lng: parseCoord(data.activeRide.pickupLongitude),
        kind: "pickup"
      });
      list.push({
        id: "dropoff",
        lat: parseCoord(data.activeRide.destinationLatitude),
        lng: parseCoord(data.activeRide.destinationLongitude),
        kind: "dropoff"
      });
    }
    return list;
  }, [data.activeRide]);

  const balanceLabel = data.settlementWallet ? "Available balance" : "Settlement wallet";
  const balanceValue = data.settlementWallet
    ? formatMoney(data.settlementWallet.currency, data.settlementWallet.availableBalance)
    : "—";

  const deficitWarning = data.isDeficitWarning
    ? data.isDeficitLocked
      ? `Offline lock active. Pay down your ${formatMoney(data.currency, data.deficitAmount)} deficit to go online.`
      : `Deficit warning: ${formatMoney(data.currency, data.deficitAmount)}. Auto-offline at ${formatMoney(data.currency, riderDeficitOfflineThreshold)}.`
    : undefined;

  const statusLabel = data.isDeficitLocked
    ? "Offline — deficit lock"
    : displayIsOnline
      ? "You are online"
      : "You are offline";

  const onlineControl = (
    <OnlineStatusControl
      isOnline={displayIsOnline}
      isLocked={data.isDeficitLocked}
      isPending={updateAvailability.isPending}
      onToggle={() => updateAvailability.mutate(!displayIsOnline)}
    />
  );

  return (
    <RiderAppFrame fullBleed>
      <div className="rdr-split">
        <div className="rdr-split-map">
          <RideMap
            center={mapCenter}
            zoom={14}
            markers={markers}
            userLocation={userLocation}
            recenterSignal={recenterSignal}
          />

          <div className="rdr-header-overlay">
            <div className="rdr-glass-bar flex flex-1 items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="truncate text-base font-semibold">{statusLabel}</div>
                <div className="rdr-greeting-sub mt-0.5">
                  <MapPin size={10} />
                  <span>{data.rider?.serviceZone?.name ?? data.rider?.city ?? "Accra"}</span>
                </div>
              </div>
              <OnlineStatusControl
                isOnline={displayIsOnline}
                isLocked={data.isDeficitLocked}
                isPending={updateAvailability.isPending}
                onToggle={() => updateAvailability.mutate(!displayIsOnline)}
                variant="compact"
              />
            </div>
          </div>

          {data.activeRide ? (
            <div className="rdr-map-badge">{formatStatus(data.activeRide.status)} trip</div>
          ) : null}

          <button
            type="button"
            className="rdr-fab rdr-fab--mobile"
            aria-label="Recenter map"
            onClick={() => {
              refresh();
              if (hasFix) setRecenterSignal((value) => value + 1);
            }}
          >
            <Navigation size={22} className="fill-current" />
          </button>
        </div>

        <div className="rdr-split-panel">
          <div className="rdr-split-panel-inner">
            <h2 className="rdr-greeting">Drive</h2>
            <p className="rdr-text-secondary mb-4">{statusLabel}</p>
            <div className="mb-4">{onlineControl}</div>
            {data.isLoading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <DashboardStats
                  balanceLabel={balanceLabel}
                  balance={balanceValue}
                  trips={data.completedCount}
                  completionRate={data.completionRate}
                  zoneLabel={data.rider?.serviceZone?.name ?? "No service zone assigned"}
                  deficitWarning={deficitWarning}
                />
                {data.activeRide ? (
                  <ActiveRidePanel
                    ride={data.activeRide}
                    onAdvance={(status) => advanceRideStatus.mutate(status)}
                    isPending={advanceRideStatus.isPending}
                  />
                ) : (
                  <div className="rdr-empty-card">
                    <strong>No active trip</strong>
                    <p>Go online and wait for your next assignment.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="rdr-bottom-sheet px-5 pt-0">
          <div className="rdr-sheet-handle" />
          <div className="mb-4">{onlineControl}</div>
          {data.isLoading ? (
            <DashboardSkeleton />
          ) : data.activeRide ? (
            <ActiveRidePanel
              ride={data.activeRide}
              onAdvance={(status) => advanceRideStatus.mutate(status)}
              isPending={advanceRideStatus.isPending}
            />
          ) : (
            <>
              <DashboardStats
                balanceLabel={balanceLabel}
                balance={balanceValue}
                trips={data.completedCount}
                completionRate={data.completionRate}
                zoneLabel={data.rider?.serviceZone?.name ?? "No service zone assigned"}
                deficitWarning={deficitWarning}
              />
              <div className="rdr-empty-card mt-4">
                <strong>No active trip</strong>
                <p>Toggle online to receive ride requests.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </RiderAppFrame>
  );
}
