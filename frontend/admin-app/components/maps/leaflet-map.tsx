"use client";

import { useCallback, useEffect, useState } from "react";
import L from "leaflet";
import {
  Circle,
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
import { MOTORCYCLE_MARKER_BASE64 } from "./motorcycleMarkerAsset";

export interface DemandHotspot {
  id: string;
  center: [number, number];
  radiusMeters: number;
  intensity: "high" | "surge" | "moderate";
  label: string;
  multiplier?: string;
  unfulfilledRequests?: number;
}

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const useGoogleTiles = Boolean(googleMapsKey);

export type MapMarkerVariant =
  | "default"
  | "pickup"
  | "destination"
  | "driver"
  | "driverOnline"
  | "driverTrip"
  | "driverIdle"
  | "passenger"
  | "incident";

export interface LeafletMapMarker {
  id: string;
  position: [number, number];
  label: string;
  variant?: MapMarkerVariant;
  permanentLabel?: boolean;
  lastUpdated?: string;
  profileUrl?: string;
  heading?: number;
  speed?: number;
  status?: string;
  extraDetails?: {
    distanceKm?: number;
    etaMinutes?: number;
    score?: number;
    rating?: number;
    vehiclePlate?: string | null;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export interface LeafletMapCurrentPosition {
  position: [number, number];
  label?: string;
}

export type LeafletBasemap = "auto" | "light" | "dark" | "streets";

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
  /** Prefer dark/light Carto basemap for admin ops. `streets` keeps OSM/Google. */
  basemap?: LeafletBasemap;
  demandHotspots?: DemandHotspot[];
  showSurgeBadges?: boolean;
  pickupRadius?: {
    center: [number, number];
    radiusMeters: number;
    label?: string;
  } | null;
}

function createDriverMarkerHtml(className: string, heading: number = 0) {
  return `
    <div class="okada-admin-moto-wrap ${className}" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
      <div class="moto-status-glow ${className}" style="position: absolute; width: 38px; height: 38px; border-radius: 50%; filter: blur(3px); opacity: 0.35; pointer-events: none;"></div>
      <div style="width: 44px; height: 44px; transform: rotate(${heading}deg); transform-origin: 50% 50%; will-change: transform; transition: transform 0.25s linear; display: flex; align-items: center; justify-content: center;">
        <img src="${MOTORCYCLE_MARKER_BASE64}" width="44" height="44" alt="Okada" style="display: block; width: 44px; height: 44px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" />
      </div>
    </div>
  `;
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
    html: createDriverMarkerHtml("driver", 0),
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }),
  driverOnline: L.divIcon({
    className: "leaflet-custom-icon",
    html: createDriverMarkerHtml("driver-online", 0),
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }),
  driverTrip: L.divIcon({
    className: "leaflet-custom-icon",
    html: createDriverMarkerHtml("driver-trip", 0),
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }),
  driverIdle: L.divIcon({
    className: "leaflet-custom-icon",
    html: createDriverMarkerHtml("driver-idle", 0),
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  }),
  passenger: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker passenger"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  }),
  incident: L.divIcon({
    className: "leaflet-custom-icon",
    html: '<div class="leaflet-marker incident"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 18]
  })
};

function pickIcon(variant: MapMarkerVariant | undefined, heading?: number): L.DivIcon | undefined {
  if (!variant || variant === "default") return undefined;
  if (isDriverVariant(variant)) {
    const className =
      variant === "driverOnline"
        ? "driver-online"
        : variant === "driverTrip"
        ? "driver-trip"
        : variant === "driverIdle"
        ? "driver-idle"
        : "driver";
    return L.divIcon({
      className: "leaflet-custom-icon",
      html: createDriverMarkerHtml(className, heading ?? 0),
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }
  return ICONS[variant];
}

function isDriverVariant(variant: MapMarkerVariant | undefined): boolean {
  return (
    variant === "driver" ||
    variant === "driverOnline" ||
    variant === "driverTrip" ||
    variant === "driverIdle"
  );
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

function useResolvedBasemap(basemap: LeafletBasemap = "dark"): "light" | "dark" | "streets" {
  const [resolved, setResolved] = useState<"light" | "dark" | "streets">(
    basemap === "auto" ? "dark" : basemap
  );

  useEffect(() => {
    if (basemap !== "auto") {
      setResolved(basemap);
      return;
    }
    const themed = document.querySelector<HTMLElement>("[data-theme]");
    const theme = themed?.getAttribute("data-theme");
    if (theme === "dark" || theme === "light") {
      setResolved(theme);
      return;
    }
    setResolved(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark");
  }, [basemap]);

  return resolved;
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
  style = { width: "100%", height: "100%", minHeight: 440 },
  basemap = "auto",
  demandHotspots = [],
  showSurgeBadges = false,
  pickupRadius = null
}: LeafletMapProps) {
  const isMobile = useIsMobile();
  const [tilesReady, setTilesReady] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const resolvedBasemap = useResolvedBasemap(basemap);

  const onTileLoad = useCallback(() => {
    setTilesReady(true);
  }, []);

  const onTileError = useCallback(() => {
    setTileError("Map tiles could not be loaded right now.");
  }, []);

  const tileUrl = useGoogleTiles
    ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = useGoogleTiles
    ? '&copy; <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank" rel="noreferrer">Google Maps</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

  const mapKey = `map:${resolvedBasemap}`;

  const driverPositions = markers
    .filter((m) => isDriverVariant(m.variant))
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
          className={resolvedBasemap === "dark" ? "leaflet-dark-tiles" : undefined}
          attribution={tileAttribution}
          url={tileUrl}
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
        {/* ─── Demand Heatmap & Surge Circles Layer ──────── */}
        {demandHotspots.map((h) => {
          const isSurge = h.intensity === "surge" || h.intensity === "high";
          const strokeColor = isSurge ? "#EF4444" : "#F59E0B";
          const fillColor = isSurge ? "#EF4444" : "#F59E0B";
          const fillOpacity = isSurge ? 0.28 : 0.18;

          return (
            <Circle
              key={h.id}
              center={h.center}
              radius={h.radiusMeters}
              pathOptions={{
                color: strokeColor,
                fillColor,
                fillOpacity,
                weight: isSurge ? 2 : 1.5,
                dashArray: isSurge ? undefined : "4, 4",
              }}
            >
              <Tooltip direction="center" permanent={showSurgeBadges}>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 11 }}>
                  <div>{h.label}</div>
                  {h.multiplier && (
                    <div style={{ color: "#EF4444", fontSize: 12, fontWeight: 800 }}>
                      ⚡ {h.multiplier}
                    </div>
                  )}
                  {typeof h.unfulfilledRequests === "number" && h.unfulfilledRequests > 0 && (
                    <div style={{ fontSize: 10, color: "#6B7280" }}>
                      {h.unfulfilledRequests} pending
                    </div>
                  )}
                </div>
              </Tooltip>
            </Circle>
          );
        })}

        {pickupRadius && (
          <Circle
            center={pickupRadius.center}
            radius={pickupRadius.radiusMeters}
            pathOptions={{
              color: "#10B981",
              fillColor: "#10B981",
              fillOpacity: 0.1,
              weight: 2,
              dashArray: "4, 6"
            }}
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
            {...(pickIcon(m.variant, m.heading) ? { icon: pickIcon(m.variant, m.heading) } : {})}
          >
            {m.label && (
              <Tooltip direction="top" offset={[0, -10]} permanent={!!m.permanentLabel}>
                {m.label}
              </Tooltip>
            )}
            {isDriverVariant(m.variant) && (
              <Popup>
                <div className="rider-popup">
                  <strong className="rider-popup-name">{m.label}</strong>
                  {m.speed !== undefined && (
                    <span style={{ display: "block", fontSize: 11, color: "#10B981", fontWeight: 600, marginTop: 2 }}>
                      ⚡ Speed: {Math.round(m.speed)} km/h {m.heading !== undefined ? `(${Math.round(m.heading)}°)` : ""}
                    </span>
                  )}
                  {m.status && (
                    <span style={{ display: "block", fontSize: 10, color: "#6B7280", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>
                      Status: {m.status}
                    </span>
                  )}
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
                  {m.extraDetails && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: 11, display: "flex", flexDirection: "column", gap: 2 }}>
                      {m.extraDetails.distanceKm !== undefined && (
                        <div style={{ color: "#9CA3AF" }}>
                          Distance: <strong style={{ color: "#F3F4F6" }}>{m.extraDetails.distanceKm.toFixed(1)} km</strong>
                        </div>
                      )}
                      {m.extraDetails.etaMinutes !== undefined && (
                        <div style={{ color: "#9CA3AF" }}>
                          ETA: <strong style={{ color: "#F3F4F6" }}>{m.extraDetails.etaMinutes} min</strong>
                        </div>
                      )}
                      {m.extraDetails.rating !== undefined && (
                        <div style={{ color: "#F59E0B" }}>
                          Rating: ⭐ {m.extraDetails.rating.toFixed(1)}
                        </div>
                      )}
                      {m.extraDetails.score !== undefined && (
                        <div style={{ color: "#10B981", fontWeight: 700 }}>
                          Match Score: {m.extraDetails.score.toFixed(0)} / 100
                        </div>
                      )}
                    </div>
                  )}
                  {m.actionButton && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        m.actionButton?.onClick();
                      }}
                      style={{
                        marginTop: 8,
                        width: "100%",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "#10B981",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4
                      }}
                    >
                      ⚡ {m.actionButton.label}
                    </button>
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
