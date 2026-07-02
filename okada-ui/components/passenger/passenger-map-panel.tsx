"use client";

import { PassengerRouteMap } from "@/components/maps/passenger-route-map";
import { MapErrorBoundary } from "@/components/maps/map-error-boundary";
import { MapTopBar, RoutePreviewCard, RideStatusCard } from "./map-panel-cards";
import type { ServiceZoneRecord, ActiveRide, RoutePreviewData } from "./passenger-types";

type PassengerMapPanelProps = {
  mapCenter: [number, number];
  mapZoom: number;
  mapMarkers: Array<{
    id: string;
    label: string;
    permanentLabel?: boolean;
    position: [number, number];
    variant: "pickup" | "destination" | "driver";
  }>;
  route: Array<[number, number]>;
  liveLocation: { latitude: number; longitude: number } | null;
  liveLocationReady: boolean;
  selectedZone: ServiceZoneRecord | null;
  onlineRiderCount: number;
  pickupAddress: string;
  destinationAddress: string;
  routePreviewData: RoutePreviewData;
  routeDistanceLabel: string;
  routeDurationLabel: string;
  farePreviewLabel: string;
  activeRide: ActiveRide;
  paymentMethod: string;
  onRecenter?: () => void;
};

export function PassengerMapPanel({
  mapCenter,
  mapZoom,
  mapMarkers,
  route,
  liveLocation,
  liveLocationReady,
  selectedZone,
  onlineRiderCount,
  pickupAddress,
  destinationAddress,
  routePreviewData,
  routeDistanceLabel,
  routeDurationLabel,
  farePreviewLabel,
  activeRide,
  paymentMethod,
  onRecenter
}: PassengerMapPanelProps) {
  return (
    <section className="exact-passenger-map">
      <div className="map-shell exact-passenger-map-stage">
        <MapErrorBoundary fallbackTitle="Map unavailable" fallbackDescription="The passenger map could not be loaded.">
          <PassengerRouteMap
            center={mapCenter}
            zoom={mapZoom}
            markers={mapMarkers}
            route={route}
            currentPosition={
              liveLocationReady
                ? {
                    position: [liveLocation!.latitude, liveLocation!.longitude] as [number, number],
                    label: "You"
                  }
                : null
            }
          />
        </MapErrorBoundary>

        {mapMarkers.length === 0 &&
        (route?.length ?? 0) <= 1 &&
        !liveLocationReady ? (
          <div className="map-empty-note" aria-live="polite">
            <div className="map-empty-note-card">
              <strong>Start with pickup and destination</strong>
              <p>Choose a pickup and destination to preview the route on the live passenger map.</p>
            </div>
          </div>
        ) : null}

        <MapTopBar selectedZone={selectedZone} onlineRiderCount={onlineRiderCount} />

        {liveLocationReady && onRecenter ? (
          <button
            type="button"
            className="exact-passenger-recenter"
            onClick={onRecenter}
            aria-label="Re-center map on current location"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
        ) : null}

        <RoutePreviewCard
          pickupAddress={pickupAddress}
          destinationAddress={destinationAddress}
          routePreviewData={routePreviewData}
          routeDistanceLabel={routeDistanceLabel}
          routeDurationLabel={routeDurationLabel}
          farePreviewLabel={farePreviewLabel}
        />

        <RideStatusCard
          activeRide={activeRide}
          routePreviewData={routePreviewData}
          routeDistanceLabel={routeDistanceLabel}
          routeDurationLabel={routeDurationLabel}
          pickupAddress={pickupAddress}
          destinationAddress={destinationAddress}
          liveLocationReady={liveLocationReady}
          paymentMethod={paymentMethod}
        />
      </div>
    </section>
  );
}
