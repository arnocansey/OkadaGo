"use client";

import dynamic from "next/dynamic";
import type { LeafletMapMarker, LeafletMapCurrentPosition } from "./leaflet-map";
import type { LatLngExpression } from "leaflet";
import { MapErrorBoundary } from "./map-error-boundary";

const DynamicLeafletMap = dynamic(
  () => import("./leaflet-map").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-note" aria-live="polite">
        <div className="map-empty-note-card">
          <strong>Loading live map</strong>
          <p>Preparing the map surface for trip, rider, and zone overlays.</p>
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
  markers?: LeafletMapMarker[];
  route?: Array<[number, number]>;
  currentPosition?: LeafletMapCurrentPosition | null;
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
        <MapErrorBoundary>
          <DynamicLeafletMap
            center={center}
            zoom={zoom}
            markers={markers}
            route={route}
            currentPosition={currentPosition}
          />
        </MapErrorBoundary>
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
      <MapErrorBoundary>
        <DynamicLeafletMap
          center={center}
          zoom={zoom}
          markers={markers}
          route={route}
          currentPosition={currentPosition}
        />
      </MapErrorBoundary>
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
