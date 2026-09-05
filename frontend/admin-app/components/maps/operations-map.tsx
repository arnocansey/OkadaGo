"use client";

import dynamic from "next/dynamic";
import type { LeafletBasemap, LeafletMapMarker, LeafletMapCurrentPosition, DemandHotspot } from "./leaflet-map";
import { MapErrorBoundary } from "./map-error-boundary";

const DynamicLeafletMap = dynamic(
  () => import("./leaflet-map").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-note" aria-live="polite">
        <div className="map-empty-note-card">
          <strong>Loading live map</strong>
          <p>Preparing Accra fleet overlays…</p>
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
  basemap?: LeafletBasemap;
  demandHotspots?: DemandHotspot[];
  showSurgeBadges?: boolean;
  pickupRadius?: {
    center: [number, number];
    radiusMeters: number;
    label?: string;
  } | null;
  /** Compact chip at bottom — better for admin overview cards */
  emptyPlacement?: "top-left" | "bottom";
  className?: string;
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
  showFitAll = false,
  basemap = "auto",
  demandHotspots = [],
  showSurgeBadges = false,
  pickupRadius = null,
  emptyPlacement = "top-left",
  className
}: OperationsMapProps) {
  const hasOverlayContent = markers.length > 0 || route.length > 1 || Boolean(currentPosition) || demandHotspots.length > 0;
  const safeCenter = toTuple(center);
  const emptyClass =
    emptyPlacement === "bottom" ? "map-empty-note map-empty-note--bottom" : "map-empty-note";

  const emptyNode = !hasOverlayContent ? (
    <div className={emptyClass} aria-live="polite">
      <div className="map-empty-note-card">
        <strong>{emptyTitle}</strong>
        <p>{emptyDescription}</p>
      </div>
    </div>
  ) : null;

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
            basemap={basemap}
            demandHotspots={demandHotspots}
            showSurgeBadges={showSurgeBadges}
            pickupRadius={pickupRadius}
          />
        </MapErrorBoundary>
        {emptyNode}
      </>
    );
  }

  return (
    <div className={["map-shell", className].filter(Boolean).join(" ")}>
      <MapErrorBoundary>
        <DynamicLeafletMap
          center={safeCenter}
          zoom={zoom}
          markers={markers}
          route={route}
          currentPosition={currentPosition}
          showFitAll={showFitAll}
          basemap={basemap}
          demandHotspots={demandHotspots}
          showSurgeBadges={showSurgeBadges}
          pickupRadius={pickupRadius}
          style={{ width: "100%", height: "100%", minHeight: "100%" }}
        />
      </MapErrorBoundary>
      {emptyNode}
    </div>
  );
}
