"use client";

import { useEffect, useMemo, useState } from "react";
import L, { type LatLngExpression } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

type TileMode = "google" | "osm";

type TileConfig = {
  attribution: string;
  tileSize: number;
  url: string;
  zoomOffset: number;
  subdomains?: string[];
};

type MarkerVariant = "default" | "pickup" | "destination" | "driver" | undefined;

export interface PassengerRouteMapProps {
  center: LatLngExpression;
  currentPosition?: {
    label?: string;
    position: LatLngExpression;
  } | null;
  markers?: Array<{
    id: string;
    label: string;
    permanentLabel?: boolean;
    position: LatLngExpression;
    variant?: "default" | "pickup" | "destination" | "driver";
  }>;
  route?: Array<[number, number]>;
  zoom?: number;
}

const pickupIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker pickup"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destinationIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker destination"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const driverIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker driver"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const passengerIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker passenger"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function getTileConfig(mode: TileMode): TileConfig {
  if (mode === "google" && googleMapsKey) {
    return {
      attribution:
        '&copy; <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank" rel="noreferrer">Google Maps</a>',
      tileSize: 256,
      url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsKey}`,
      zoomOffset: 0,
      subdomains: ["0", "1", "2", "3"]
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    tileSize: 256,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    zoomOffset: 0
  };
}

function resolveMarkerIcon(variant: MarkerVariant) {
  switch (variant) {
    case "pickup":
      return pickupIcon;
    case "destination":
      return destinationIcon;
    case "driver":
      return driverIcon;
    default:
      return undefined;
  }
}

function normalizePosition(position: LatLngExpression): [number, number] {
  if (Array.isArray(position)) {
    return [Number(position[0]), Number(position[1])];
  }

  if ("lat" in position && "lng" in position) {
    return [position.lat, position.lng];
  }

  return [5.6037, -0.187];
}

function MapViewportSync({
  center,
  zoom
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    const currentCenter = map.getCenter();
    const latitudeChanged = Math.abs(currentCenter.lat - center[0]) > 0.0001;
    const longitudeChanged = Math.abs(currentCenter.lng - center[1]) > 0.0001;
    const zoomChanged = map.getZoom() !== zoom;

    if (latitudeChanged || longitudeChanged || zoomChanged) {
      map.setView(center, zoom, { animate: false });
    }

    map.invalidateSize();
  }, [center, map, zoom]);

  return null;
}

export function PassengerRouteMapImpl({
  center,
  zoom = 12,
  markers = [],
  route = [],
  currentPosition = null
}: PassengerRouteMapProps) {
  const [tileMode, setTileMode] = useState<TileMode>(googleMapsKey ? "google" : "osm");
  const [tileWarning, setTileWarning] = useState<string | null>(null);

  const normalizedCenter = useMemo(() => normalizePosition(center), [center]);

  const tileConfig = useMemo(() => getTileConfig(tileMode), [tileMode]);

  const mapKey = `${tileMode}:${normalizedCenter[0].toFixed(5)}:${normalizedCenter[1].toFixed(5)}:${zoom}`;

  function handleTileError() {
    if (tileMode === "google") {
      setTileMode("osm");
      setTileWarning(
        "Google Maps tiles could not be loaded right now, so the map switched to OpenStreetMap."
      );
      return;
    }

    setTileWarning("OpenStreetMap tiles could not be loaded right now.");
  }

  return (
    <>
      <MapContainer
        key={mapKey}
        center={normalizedCenter}
        zoom={zoom}
        scrollWheelZoom
        zoomControl
        dragging
        doubleClickZoom
        touchZoom
        boxZoom
        keyboard
        className="leaflet-map-surface"
        style={{ width: "100%", height: "100%", minHeight: 440 }}
      >
        <MapViewportSync center={normalizedCenter} zoom={zoom} />
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          tileSize={tileConfig.tileSize}
          zoomOffset={tileConfig.zoomOffset}
          subdomains={tileConfig.subdomains}
          eventHandlers={{
            tileerror: () => {
              handleTileError();
            }
          }}
        />
        {route.length > 1 ? (
          <Polyline
            positions={route}
            pathOptions={{ color: "#111315", opacity: 0.8, weight: 5 }}
          />
        ) : null}
        {currentPosition ? (
          <>
            <CircleMarker
              center={currentPosition.position}
              radius={22}
              pathOptions={{ color: "#21c45d", fillColor: "#21c45d", fillOpacity: 0.12 }}
            />
            <Marker position={currentPosition.position} icon={passengerIcon}>
              {currentPosition.label ? (
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  {currentPosition.label}
                </Tooltip>
              ) : null}
            </Marker>
          </>
        ) : null}
        {markers.map((marker) => {
          const icon = resolveMarkerIcon(marker.variant);

          return (
            <Marker
              key={marker.id}
              position={marker.position}
              {...(icon ? { icon } : {})}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent={Boolean(marker.permanentLabel)}>
                {marker.label}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      {tileWarning ? <div className="map-tile-warning">{tileWarning}</div> : null}
    </>
  );
}
