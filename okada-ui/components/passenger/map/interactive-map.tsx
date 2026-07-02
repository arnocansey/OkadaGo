"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  AdvancedMarker,
  Map,
  Marker,
  Polyline,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { mapDarkStyle } from "@/lib/map-style";
import { hasGoogleMapsKey } from "@/components/passenger/map/google-maps-provider";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  kind: "pickup" | "dropoff" | "rider" | "user";
};

type InteractiveMapProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  route?: Array<[number, number]>;
  /** Increment to pan the map back to the user location or center. */
  recenterSignal?: number;
  /** Live GPS position — renders a dedicated current-location pin. */
  userLocation?: { lat: number; lng: number } | null;
};

const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();

function routeKey(route: Array<[number, number]>) {
  return route.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|");
}

function MapController({
  center,
  zoom,
  route,
  recenterSignal = 0,
  userLocation = null
}: {
  center: [number, number];
  zoom: number;
  route: Array<[number, number]>;
  recenterSignal: number;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const core = useMapsLibrary("core");
  const lastRecenter = useRef(recenterSignal);
  const lastRouteKey = useRef("");
  const didAutoCenter = useRef(false);

  useEffect(() => {
    if (!map || !userLocation || didAutoCenter.current) return;

    map.panTo(userLocation);
    map.setZoom(zoom);
    didAutoCenter.current = true;
  }, [map, userLocation, zoom]);

  useEffect(() => {
    if (!map || recenterSignal === lastRecenter.current) return;

    lastRecenter.current = recenterSignal;
    const target = userLocation ?? { lat: center[0], lng: center[1] };
    map.panTo(target);
    map.setZoom(zoom);
  }, [map, recenterSignal, center, zoom, userLocation]);

  useEffect(() => {
    if (!map || !core || route.length < 2) return;

    const key = routeKey(route);
    if (key === lastRouteKey.current) return;

    lastRouteKey.current = key;
    const bounds = new core.LatLngBounds();
    for (const [lat, lng] of route) {
      bounds.extend({ lat, lng });
    }
    map.fitBounds(bounds, 48);
  }, [map, core, route]);

  return null;
}

function PaxMarker({ kind }: { kind: MapMarker["kind"] }) {
  return <div className={`pax-marker-dot pax-marker-dot--${kind}`} />;
}

function UserLocationPin() {
  return (
    <div className="pax-user-location" aria-hidden>
      <span className="pax-user-location-pulse" />
      <span className="pax-user-location-dot" />
    </div>
  );
}

function UserLocationMarker({ position }: { position: { lat: number; lng: number } }) {
  if (mapId) {
    return (
      <AdvancedMarker position={position} zIndex={100}>
        <UserLocationPin />
      </AdvancedMarker>
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="rgba(10,132,255,0.2)"/><circle cx="14" cy="14" r="6" fill="#0A84FF" stroke="white" stroke-width="3"/></svg>`;

  return (
    <Marker
      position={position}
      zIndex={100}
      icon={{
        url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
        scaledSize: { width: 28, height: 28 },
        anchor: { x: 14, y: 14 }
      }}
    />
  );
}

function GoogleInteractiveMap({
  center,
  zoom = 14,
  markers = [],
  route = [],
  recenterSignal = 0,
  userLocation = null
}: InteractiveMapProps) {
  const mapCenter = useMemo(() => ({ lat: center[0], lng: center[1] }), [center[0], center[1]]);
  const path = useMemo(
    () => route.map(([lat, lng]) => ({ lat, lng })),
    [route]
  );

  return (
    <Map
      className="pax-google-map"
      defaultCenter={mapCenter}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      styles={mapDarkStyle}
      mapId={mapId || undefined}
      colorScheme="DARK"
    >
      <MapController
        center={center}
        zoom={zoom}
        route={route}
        recenterSignal={recenterSignal}
        userLocation={userLocation}
      />

      {userLocation ? <UserLocationMarker position={userLocation} /> : null}

      {markers.map((marker) => (
        <PaxMapMarker key={marker.id} marker={marker} />
      ))}

      {path.length >= 2 ? (
        <Polyline
          path={path}
          strokeColor="#FFC107"
          strokeOpacity={0.85}
          strokeWeight={5}
        />
      ) : null}
    </Map>
  );
}

function markerIconUrl(kind: MapMarker["kind"]) {
  const colors: Record<MapMarker["kind"], string> = {
    pickup: "#FFC107",
    dropoff: "#FF3B30",
    rider: "#FFC107",
    user: "#0A84FF"
  };
  const color = colors[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="7" fill="${color}" stroke="white" stroke-width="3"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function PaxMapMarker({ marker }: { marker: MapMarker }) {
  if (mapId) {
    return (
      <AdvancedMarker
        position={{ lat: marker.lat, lng: marker.lng }}
        zIndex={marker.kind === "user" ? 10 : 5}
      >
        <PaxMarker kind={marker.kind} />
      </AdvancedMarker>
    );
  }

  return (
    <Marker
      position={{ lat: marker.lat, lng: marker.lng }}
      icon={{
        url: markerIconUrl(marker.kind),
        scaledSize: { width: 20, height: 20 },
        anchor: { x: 10, y: 10 }
      }}
    />
  );
}

function MapUnavailable() {
  return (
    <div className="pax-map-unavailable">
      <p className="text-sm font-medium">Map unavailable</p>
      <p className="mt-1 text-xs pax-text-secondary">
        Add <code className="text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable Google Maps.
      </p>
    </div>
  );
}

export function InteractiveMap(props: InteractiveMapProps) {
  if (!hasGoogleMapsKey()) {
    return (
      <div className="pax-map-root">
        <MapUnavailable />
      </div>
    );
  }

  return (
    <div className="pax-map-root">
      <GoogleInteractiveMap {...props} />
    </div>
  );
}
