"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

const DynamicLeafletMap = dynamic(
  () => import("./leaflet-map").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-note" aria-live="polite">
        <div className="map-empty-note-card">
          <strong>Loading live map</strong>
          <p>Preparing the Leaflet surface for trip, rider, and zone overlays.</p>
        </div>
      </div>
    )
  }
);

interface OperationsMapProps {
  center: LatLngExpression;
  zoom?: number;
  emptyTitle: string;
  emptyDescription: string;
  bare?: boolean;
  markers?: Array<{
    id: string;
    position: LatLngExpression;
    label: string;
    variant?: "default" | "pickup" | "destination" | "driver";
    permanentLabel?: boolean;
  }>;
  route?: Array<[number, number]>;
  currentPosition?: {
    position: LatLngExpression;
    label?: string;
  } | null;
}

export function OperationsMap({
  center,
  zoom = 12,
  emptyTitle,
  emptyDescription,
  bare = false,
  markers = [],
  route = [],
  currentPosition = null
}: OperationsMapProps) {
  const hasOverlayContent = markers.length > 0 || route.length > 1 || Boolean(currentPosition);

  if (bare) {
    return (
      <>
        <DynamicLeafletMap
          center={center}
          zoom={zoom}
          markers={markers}
          route={route}
          currentPosition={currentPosition}
        />
        {!hasOverlayContent ? (
          <div className="map-empty-note" aria-live="polite">
            <div className="map-empty-note-card">
              <strong>{emptyTitle}</strong>
              <p>{emptyDescription}</p>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="map-shell">
      <DynamicLeafletMap
        center={center}
        zoom={zoom}
        markers={markers}
        route={route}
        currentPosition={currentPosition}
      />
      {!hasOverlayContent ? (
        <div className="map-empty-note" aria-live="polite">
          <div className="map-empty-note-card">
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
