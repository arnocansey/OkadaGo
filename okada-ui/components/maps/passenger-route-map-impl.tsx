"use client";

import { LeafletMap, type LeafletMapProps } from "./leaflet-map";

export type PassengerRouteMapProps = LeafletMapProps;

export function PassengerRouteMapImpl(props: LeafletMapProps) {
  return <LeafletMap {...props} viewportSync />;
}
