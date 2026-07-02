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
import { useIsMobile } from "@/hooks/use-mobile";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export type MapMarkerVariant = "default" | "pickup" | "destination" | "driver";

export interface LeafletMapMarker {
  id: string;
  position: LatLngExpression;
  label: string;
  variant?: MapMarkerVariant;
  permanentLabel?: boolean;
}

export interface LeafletMapCurrentPosition {
  position: LatLngExpression;
  label?: string;
}

export interface LeafletMapProps {
  center: LatLngExpression;
  zoom?: number;
  markers?: LeafletMapMarker[];
  route?: Array<[number, number]>;
  currentPosition?: LeafletMapCurrentPosition | null;
  viewportSync?: boolean;
  className?: string;
  style?: React.CSSProperties;
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

type TileMode = "google" | "osm";

type TileConfig = {
  attribution: string;
  isGoogle: boolean;
  tileSize: number;
  url: string;
  zoomOffset: number;
  subdomains?: string[];
};

function resolveMarkerIcon(variant: MapMarkerVariant | undefined) {
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

function getTileConfig(mode: TileMode): TileConfig {
  if (mode === "google" && googleMapsKey) {
    return {
      attribution:
        '&copy; <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank" rel="noreferrer">Google Maps</a>',
      isGoogle: true,
      tileSize: 256,
      url: `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsKey}`,
      zoomOffset: 0,
      subdomains: ["0", "1", "2", "3"]
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    isGoogle: false,
    tileSize: 256,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    zoomOffset: 0,
    subdomains: ["a", "b", "c"]
  };
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

function MapTileLoader() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  route = [],
  currentPosition = null,
  viewportSync = false,
  className = "leaflet-map-surface",
  style = { width: "100%", height: "100%", minHeight: 440 }
}: LeafletMapProps) {
  const isMobile = useIsMobile();
  const [tileMode, setTileMode] = useState<TileMode>(googleMapsKey ? "google" : "osm");
  const [tileWarning, setTileWarning] = useState<string | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  const normalizedCenter = useMemo(() => normalizePosition(center), [center]);
  const tileConfig = useMemo(() => getTileConfig(tileMode), [tileMode]);
  const mapKey = `${tileMode}:${normalizedCenter[0].toFixed(5)}:${normalizedCenter[1].toFixed(5)}:${zoom}`;

  function handleTileError() {
    if (tileMode === "google") {
      setTileMode("osm");
      setTileWarning(
        "Google Maps tiles could not be loaded, so the map switched to OpenStreetMap."
      );
      return;
    }
    setTileWarning("OpenStreetMap tiles could not be loaded right now.");
  }

  function handleTileLoad() {
    if (!tilesLoaded) {
      setTilesLoaded(true);
    }
  }

  return (
    <>
      {!tilesLoaded && (
        <div className="map-skeleton" aria-hidden="true">
          <div className="map-skeleton-pulse" />
        </div>
      )}
      <MapContainer
        key={mapKey}
        center={normalizedCenter}
        zoom={zoom}
        scrollWheelZoom={!isMobile}
        zoomControl={!isMobile}
        dragging
        doubleClickZoom={!isMobile}
        touchZoom
        boxZoom={!isMobile}
        keyboard={!isMobile}
        className={className}
        style={style}
      >
        <MapTileLoader />
        {viewportSync && <MapViewportSync center={normalizedCenter} zoom={zoom} />}
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          tileSize={tileConfig.tileSize}
          zoomOffset={tileConfig.zoomOffset}
          subdomains={tileConfig.subdomains}
          eventHandlers={{
            tileerror: () => handleTileError(),
            tileload: () => handleTileLoad()
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
      {tileWarning ? (
        <div className="map-tile-warning" role="status">
          <span className="map-tile-warning-icon" aria-hidden="true">
            {tileConfig.isGoogle ? "🌐" : "🗺️"}
          </span>
          {tileWarning}
        </div>
      ) : null}
    </>
  );
}
