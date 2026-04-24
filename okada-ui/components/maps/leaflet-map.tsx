"use client";

import { useMemo, useState } from "react";
import L, { type LatLngExpression } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip
} from "react-leaflet";

const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const mapboxStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID?.trim() || "mapbox/streets-v12";
const defaultMapboxStyle = "mapbox/streets-v12";
const allowCustomMapboxStyle =
  (process.env.NEXT_PUBLIC_MAPBOX_USE_CUSTOM_STYLE ?? "").trim().toLowerCase() === "true";

interface LeafletMapProps {
  center: LatLngExpression;
  zoom?: number;
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

type TileMode = "custom" | "defaultMapbox" | "osm";

type TileConfig = {
  attribution: string;
  isMapbox: boolean;
  tileSize: number;
  url: string;
  zoomOffset: number;
};

function resolveMarkerIcon(
  variant: "default" | "pickup" | "destination" | "driver" | undefined
) {
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

function getTileConfig(styleId?: string | null): TileConfig {
  if (mapboxPublicToken && styleId) {
    return {
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      isMapbox: true,
      tileSize: 512,
      url: `https://api.mapbox.com/styles/v1/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxPublicToken}`,
      zoomOffset: -1
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    isMapbox: false,
    tileSize: 256,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    zoomOffset: 0
  };
}

export function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  route = [],
  currentPosition = null
}: LeafletMapProps) {
  const [tileMode, setTileMode] = useState<TileMode>(
    mapboxPublicToken ? (allowCustomMapboxStyle ? "custom" : "defaultMapbox") : "osm"
  );
  const [tileWarning, setTileWarning] = useState<string | null>(null);

  const normalizedCenter = useMemo(() => {
    if (Array.isArray(center)) {
      return [Number(center[0]), Number(center[1])] as [number, number];
    }

    if ("lat" in center && "lng" in center) {
      return [center.lat, center.lng] as [number, number];
    }

    return [5.6037, -0.187] as [number, number];
  }, [center]);

  const tileStyleId =
    tileMode === "custom"
      ? mapboxStyle
      : tileMode === "defaultMapbox"
        ? defaultMapboxStyle
        : null;
  const tileConfig = useMemo(() => getTileConfig(tileStyleId), [tileStyleId]);

  const mapKey = `${normalizedCenter[0].toFixed(5)}:${normalizedCenter[1].toFixed(5)}:${zoom}`;

  function fallbackTileMode(current: TileMode) {
    if (current === "custom") {
      setTileMode("defaultMapbox");
      setTileWarning(
        "Your custom Mapbox style could not be loaded, so the map switched to the default streets style."
      );
      return;
    }

    if (current === "defaultMapbox") {
      setTileMode("osm");
      setTileWarning(
        "Mapbox tiles could not be loaded right now, so the map switched to OpenStreetMap."
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
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          tileSize={tileConfig.tileSize}
          zoomOffset={tileConfig.zoomOffset}
          eventHandlers={{
            tileerror: () => {
              fallbackTileMode(tileMode);
            }
          }}
        />
        {route.length > 1 ? (
          <Polyline
            positions={route}
            pathOptions={{ color: "#111315", weight: 5, opacity: 0.75 }}
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
