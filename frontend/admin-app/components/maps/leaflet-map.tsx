"use client";

import { useCallback, useEffect, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import { useIsMobile } from "@/hooks/use-mobile";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const useGoogleTiles = Boolean(googleMapsKey);

export type MapMarkerVariant = "default" | "pickup" | "destination" | "driver";

export interface LeafletMapMarker {
  id: string;
  position: [number, number];
  label: string;
  variant?: MapMarkerVariant;
  permanentLabel?: boolean;
  lastUpdated?: string;
  profileUrl?: string;
}

export interface LeafletMapCurrentPosition {
  position: [number, number];
  label?: string;
}

export interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: LeafletMapMarker[];
  route?: Array<[number, number]>;
  currentPosition?: LeafletMapCurrentPosition | null;
  viewportSync?: boolean;
  onRecenter?: () => void;
  showFitAll?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ICONS: Record<string, L.DivIcon> = {
  pickup: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker pickup"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  destination: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker destination"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  driver: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker driver pulsing"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  passenger: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker passenger"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
};

function pickIcon(variant: MapMarkerVariant | undefined): L.DivIcon | undefined {
  if (variant && variant !== "default" && ICONS[variant]) {
    return ICONS[variant];
  }
  return undefined;
}

function FitAllButton({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  const handleClick = useCallback(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
  }, [map, positions]);

  if (positions.length < 2) return null;

  return (
    <button
      type="button"
      className="map-fit-all-btn"
      onClick={handleClick}
      aria-label="Fit map to show all riders"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
      Fit All
    </button>
  );
}

function ViewportSync({
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
    const current = map.getCenter();
    const moved =
      Math.abs(current.lat - center[0]) > 0.0001 ||
      Math.abs(current.lng - center[1]) > 0.0001;
    const zoomed = map.getZoom() !== zoom;
    if (moved || zoomed) {
      map.setView(center, zoom, { animate: false });
    }
    map.invalidateSize();
  }, [center, map, zoom]);

  return null;
}

function InitialSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
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
  onRecenter,
  showFitAll = false,
  className = "leaflet-map-surface",
  style = { width: "100%", height: "100%", minHeight: 440 }
}: LeafletMapProps) {
  const isMobile = useIsMobile();
  const [tilesReady, setTilesReady] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);

  const onTileLoad = useCallback(() => {
    setTilesReady(true);
  }, []);

  const onTileError = useCallback(() => {
    setTileError("Map tiles could not be loaded right now.");
  }, []);

  const mapKey = `osm:${center[0].toFixed(5)}:${center[1].toFixed(5)}:${zoom}`;

  const driverPositions = markers
    .filter((m) => m.variant === "driver")
    .map((m) => m.position);

  return (
    <>
      {!tilesReady && (
        <div className="map-skeleton" aria-hidden="true">
          <div className="map-skeleton-pulse" />
        </div>
      )}
      {onRecenter && (
        <button
          type="button"
          className="map-recenter-btn"
          onClick={onRecenter}
          aria-label="Re-center map on current location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}
      <MapContainer
        key={mapKey}
        center={center}
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
        <InitialSize />
        {viewportSync && <ViewportSync center={center} zoom={zoom} />}
        {showFitAll && <FitAllButton positions={driverPositions} />}
        <TileLayer
          attribution={
            useGoogleTiles
              ? '&copy; <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank" rel="noreferrer">Google Maps</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          }
          url={
            useGoogleTiles
              ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsKey}`
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          subdomains={useGoogleTiles ? ["0", "1", "2", "3"] : ["a", "b", "c"]}
          eventHandlers={{
            tileerror: onTileError,
            tileload: onTileLoad
          }}
        />
        {route.length > 1 && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#111315", weight: 5, opacity: 0.75 }}
          />
        )}
        {currentPosition && (
          <>
            <CircleMarker
              center={currentPosition.position}
              radius={22}
              pathOptions={{ color: "#21c45d", fillColor: "#21c45d", fillOpacity: 0.12 }}
            />
            <Marker position={currentPosition.position} icon={ICONS.passenger}>
              {currentPosition.label && (
                <Tooltip direction="top" offset={[0, -10]} permanent>
                  {currentPosition.label}
                </Tooltip>
              )}
            </Marker>
          </>
        )}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            {...(pickIcon(m.variant) ? { icon: pickIcon(m.variant) } : {})}
          >
            {m.label && (
              <Tooltip direction="top" offset={[0, -10]} permanent={!!m.permanentLabel}>
                {m.label}
              </Tooltip>
            )}
            {m.variant === "driver" && (
              <Popup>
                <div className="rider-popup">
                  <strong className="rider-popup-name">{m.label}</strong>
                  {m.lastUpdated && (
                    <span className="rider-popup-updated">
                      Last updated: {m.lastUpdated}
                    </span>
                  )}
                  {m.profileUrl && (
                    <a
                      className="rider-popup-link"
                      href={m.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Profile
                    </a>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
      {tileError && (
        <div className="map-tile-warning" role="status">
          <span className="map-tile-warning-icon" aria-hidden="true">
            🗺️
          </span>
          {tileError}
        </div>
      )}
    </>
  );
}
