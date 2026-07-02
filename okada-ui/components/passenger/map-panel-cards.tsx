"use client";

import type { ServiceZoneRecord, ActiveRide, RoutePreviewData } from "./passenger-types";

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function MapTopBar({
  selectedZone,
  onlineRiderCount
}: {
  selectedZone: ServiceZoneRecord | null;
  onlineRiderCount: number;
}) {
  return (
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
  );
}

export function RoutePreviewCard({
  pickupAddress,
  destinationAddress,
  routePreviewData,
  routeDistanceLabel,
  routeDurationLabel,
  farePreviewLabel
}: {
  pickupAddress: string;
  destinationAddress: string;
  routePreviewData: RoutePreviewData;
  routeDistanceLabel: string;
  routeDurationLabel: string;
  farePreviewLabel: string;
}) {
  return (
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
  );
}

export function RideStatusCard({
  activeRide,
  routePreviewData,
  routeDistanceLabel,
  routeDurationLabel,
  pickupAddress,
  destinationAddress,
  liveLocationReady,
  paymentMethod
}: {
  activeRide: ActiveRide;
  routePreviewData: RoutePreviewData;
  routeDistanceLabel: string;
  routeDurationLabel: string;
  pickupAddress: string;
  destinationAddress: string;
  liveLocationReady: boolean;
  paymentMethod: string;
}) {
  const heading = activeRide
    ? `${formatStatus(activeRide.status)} - ${activeRide.destinationAddress}`
    : routePreviewData
      ? "Route ready to request"
      : "Start with a pickup and destination";

  const description = activeRide
    ? `Rider: ${activeRide.rider?.user.fullName ?? "Matching in progress"}`
    : routePreviewData
      ? `Previewing a ${routeDistanceLabel} route in ${routeDurationLabel}.`
      : "Choose a pickup and destination to preview the live route before you book.";

  return (
    <div className="exact-passenger-map-floating exact-passenger-map-floating-right">
      <div className="exact-passenger-map-card status">
        <span className="exact-passenger-map-card-label">Ride status</span>
        <strong>{heading}</strong>
        <p>{description}</p>
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
  );
}
