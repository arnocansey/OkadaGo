"use client";

import dynamic from "next/dynamic";
import type { LeafletMapMarker, LeafletMapCurrentPosition } from "./leaflet-map";
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
  center: [number, number];
  zoom?: number;
  emptyTitle: string;
  emptyDescription: string;
  bare?: boolean;
  markers?: LeafletMapMarker[];
  route?: Array<[number, number]>;
  currentPosition?: LeafletMapCurrentPosition | null;
  showFitAll?: boolean;
}

function toTuple(center: [number, number]): [number, number] {
  return [Number(center[0]), Number(center[1])];
}

export function OperationsMap({
  center,
  zoom = 12,
  emptyTitle,
  emptyDescription,
  bare = false,
  markers = [],
  route = [],
  currentPosition = null,
  showFitAll = false
}: OperationsMapProps) {
  const hasOverlayContent = markers.length > 0 || route.length > 1 || Boolean(currentPosition);
  const safeCenter = toTuple(center);

  if (bare) {
    return (
      <>
        <MapErrorBoundary>
          <DynamicLeafletMap
            center={safeCenter}
            zoom={zoom}
            markers={markers}
            route={route}
            currentPosition={currentPosition}
            showFitAll={showFitAll}
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
          center={safeCenter}
          zoom={zoom}
          markers={markers}
          route={route}
          currentPosition={currentPosition}
          showFitAll={showFitAll}
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
