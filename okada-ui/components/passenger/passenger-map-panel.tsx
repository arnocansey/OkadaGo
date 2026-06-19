"use client";

import { PassengerRouteMap } from "@/components/maps/passenger-route-map";

type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

type ActiveRide = {
  id: string;
  status: string;
  destinationAddress: string;
  rider: {
    currentLatitude: string | number | null;
    currentLongitude: string | number | null;
    user: {
      fullName: string;
    };
  } | null;
} | null;

type RoutePreviewData = {
  provider: "mapbox" | "osrm";
  distanceKm: number;
  durationMinutes: number;
  route: Array<[number, number]>;
} | null;

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  paymentMethod
}: PassengerMapPanelProps) {
  const liveRideHeading = activeRide
    ? `${formatStatus(activeRide.status)} - ${activeRide.destinationAddress}`
    : routePreviewData
      ? "Route ready to request"
      : "Start with a pickup and destination";

  const liveRideDescription = activeRide
    ? `Rider: ${activeRide.rider?.user.fullName ?? "Matching in progress"}`
    : routePreviewData
      ? `Previewing a ${routeDistanceLabel} route in ${routeDurationLabel}.`
      : "Choose a pickup and destination to preview the live route before you book.";

  return (
    <section className="exact-passenger-map">
      <div className="map-shell exact-passenger-map-stage">
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

        <div className="exact-passenger-map-topbar">
          <div className="exact-passenger-map-chip">
            <span>Operating city</span>
            <strong>{selectedZone?.city ?? "Accra"}</strong>
          </div>
          <div className="exact-passenger-map-chip">
            <span>Availability</span>
            <strong>
              {onlineRiderCount > 0 ? `${onlineRiderCount} riders online` : "Matching live"}
            </strong>
          </div>
        </div>

        <div className="exact-passenger-map-floating exact-passenger-map-floating-left">
          <div className="exact-passenger-map-card route">
            <span className="exact-passenger-map-card-label">Live route preview</span>
            <strong>{pickupAddress || "Choose pickup"} to {destinationAddress || "Choose destination"}</strong>
            <p>
              {routePreviewData
                ? `${routeDistanceLabel} · ${routeDurationLabel} via ${routePreviewData.provider.toUpperCase()}`
                : "Search both ends of the trip to draw the route on the live map."}
            </p>
            <div className="exact-passenger-map-metrics">
              <div>
                <span>Distance</span>
                <strong>{routeDistanceLabel}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{routeDurationLabel}</strong>
              </div>
              <div>
                <span>Fare</span>
                <strong>{farePreviewLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="exact-passenger-map-floating exact-passenger-map-floating-right">
          <div className="exact-passenger-map-card status">
            <span className="exact-passenger-map-card-label">Ride status</span>
            <strong>{liveRideHeading}</strong>
            <p>{liveRideDescription}</p>
            <div className="exact-passenger-map-status-grid">
              <div>
                <span>Pickup</span>
                <strong>{pickupAddress || "Not set"}</strong>
              </div>
              <div>
                <span>Destination</span>
                <strong>{destinationAddress || "Not set"}</strong>
              </div>
              <div>
                <span>GPS</span>
                <strong>{liveLocationReady ? "Ready" : "Waiting"}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{paymentMethod.replace("_", " ")}</strong>
              </div>
            </div>
            <div className="button-row exact-passenger-map-actions">
              <a href="/passenger/history" className="button-secondary">
                History
              </a>
              <a href="/passenger/wallet" className="button-secondary">
                Wallet
              </a>
              <a href="/passenger/service" className="button-secondary">
                Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
