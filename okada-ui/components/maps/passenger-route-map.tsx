"use client";

import dynamic from "next/dynamic";
import type { PassengerRouteMapProps } from "./passenger-route-map-impl";

const DynamicPassengerRouteMap = dynamic(
  () =>
    import("./passenger-route-map-impl").then(
      (module) => module.PassengerRouteMapImpl
    ),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading-note" aria-live="polite">
        <div className="map-empty-note-card">
          <strong>Loading live map</strong>
          <p>Preparing the passenger route map with the same stable path as map-lab.</p>
        </div>
      </div>
    )
  }
);

export function PassengerRouteMap(props: PassengerRouteMapProps) {
  return <DynamicPassengerRouteMap {...props} />;
}
