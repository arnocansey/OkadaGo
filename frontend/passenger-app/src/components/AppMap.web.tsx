import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { Crosshair, Navigation } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { getGoogleMapsApiKey } from "@/lib/googleMapsConfig";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";
import { VehicleInterpolator } from "@/lib/vehicleInterpolator";
import { createMotorcycleMarkerHtml } from "./MotorcycleMarker";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
  type?: "rider" | "pickup" | "destination" | "dropoff" | "default";
  heading?: number;
  speed?: number;
  etaLabel?: string;
  etaMinutes?: number;
  isSelected?: boolean;
};

type MapPressCoordinate = { latitude: number; longitude: number };

type Props = {
  region?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  markers?: MapMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  fitToMarkers?: boolean;
  autoCenterOnLocation?: boolean;
  showCenterButton?: boolean;
  centerButtonInset?: { top?: number; right?: number; bottom?: number; left?: number };
  style?: object;
  children?: React.ReactNode;
  onMapPress?: (coordinate: MapPressCoordinate) => void;
  pinDropHint?: string;
  selectedRiderId?: string;
};

let leafletModulePromise: Promise<any> | null = null;
function getLeaflet(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet is only available in the browser"));
  }
  if (!leafletModulePromise) {
    leafletModulePromise = import("leaflet").then((m) => m.default || m);
  }
  return leafletModulePromise;
}

interface ActiveMarkerEntry {
  marker: any;
  interpolator?: VehicleInterpolator;
  isRider: boolean;
  isSelected: boolean;
  type: string;
}

export function AppMap({
  region = ACCRA_REGION,
  markers = [],
  routeCoordinates,
  fitToMarkers = false,
  autoCenterOnLocation = false,
  showCenterButton = false,
  centerButtonInset,
  style,
  children,
  onMapPress,
  selectedRiderId,
}: Props) {
  const { colors, isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const activeMarkersRef = useRef<Map<string, ActiveMarkerEntry>>(new Map());
  const polylineRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const userInteractingRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [isFollowingRider, setIsFollowingRider] = useState(false);

  const googleKey = getGoogleMapsApiKey().trim();

  // Find if there is an active assigned or selected rider to follow
  const targetRiderMarker = markers.find(
    (m) =>
      m.isSelected ||
      m.id === selectedRiderId ||
      (selectedRiderId && m.id === `rider-${selectedRiderId}`) ||
      m.id === "rider"
  );

  // Initialize Leaflet Map safely in browser environment
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    let isMounted = true;

    getLeaflet()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;
        leafletRef.current = L;

        if (!mapInstanceRef.current) {
          const initialLat = region?.latitude || ACCRA_REGION.latitude;
          const initialLng = region?.longitude || ACCRA_REGION.longitude;

          const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
          });

          const tileUrl = googleKey
            ? `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleKey}`
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

          const subdomains = googleKey ? ["0", "1", "2", "3"] : ["a", "b", "c"];

          L.tileLayer(tileUrl, {
            subdomains,
            maxZoom: 19,
            className: isDark ? "okada-map-dark-tiles" : "",
          }).addTo(map);

          // User interaction disables auto-follow so passenger can freely pan
          map.on("dragstart", () => {
            userInteractingRef.current = true;
            setIsFollowingRider(false);
          });
          map.on("dragend", () => {
            userInteractingRef.current = false;
          });
          map.on("zoomstart", () => {
            userInteractingRef.current = true;
          });
          map.on("zoomend", () => {
            userInteractingRef.current = false;
          });

          if (onMapPress) {
            map.on("click", (e: any) => {
              if (e.latlng) {
                onMapPress({ latitude: e.latlng.lat, longitude: e.latlng.lng });
              }
            });
          }

          mapInstanceRef.current = map;
          setMapReady(true);

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }
      })
      .catch((err) => {
        console.warn("Leaflet map initialization skipped or failed:", err);
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      activeMarkersRef.current.clear();
    };
  }, [googleKey, isDark]);

  // Center on region when explicitly set (if not following rider)
  useEffect(() => {
    if (!mapInstanceRef.current || !region?.latitude || !region?.longitude) return;
    if (isFollowingRider) return;

    mapInstanceRef.current.setView([region.latitude, region.longitude], mapInstanceRef.current.getZoom(), {
      animate: true,
    });
  }, [region?.latitude, region?.longitude, isFollowingRider]);

  // Persistent Marker Pool & In-Place Movement Updates (NO Flickering/Re-creation)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReady) return;

    const activeMap = activeMarkersRef.current;
    const incomingIds = new Set(markers.map((m) => m.id));

    // 1. Remove markers that are no longer present
    activeMap.forEach((entry, id) => {
      if (!incomingIds.has(id)) {
        entry.marker.remove();
        activeMap.delete(id);
      }
    });

    const latLngs: any[] = [];

    // 2. Add or update incoming markers in-place
    markers.forEach((m) => {
      const pinColor = m.pinColor || colors.primary;
      const isRider =
        m.type === "rider" ||
        m.title === "Okada" ||
        m.title === "Rider" ||
        m.id === "rider" ||
        m.id.startsWith("rider") ||
        m.id.startsWith("biker");

      const isSelected = Boolean(
        m.isSelected ||
          m.id === selectedRiderId ||
          (selectedRiderId && m.id === `rider-${selectedRiderId}`) ||
          m.id === "rider"
      );

      latLngs.push([m.latitude, m.longitude]);

      const existing = activeMap.get(m.id);

      if (isRider) {
        if (existing && existing.interpolator) {
          // Push new target to existing interpolator (smooth continuous animation)
          existing.interpolator.pushTarget({
            latitude: m.latitude,
            longitude: m.longitude,
            heading: m.heading ?? 0,
            speed: m.speed ?? 0,
            timestamp: Date.now(),
          });
          existing.isSelected = isSelected;
        } else {
          // New motorcycle marker: initialize interpolator and DOM element
          const interpolator = new VehicleInterpolator({
            latitude: m.latitude,
            longitude: m.longitude,
            heading: m.heading ?? 0,
            speed: m.speed ?? 0,
            timestamp: Date.now(),
          });

          const icon = L.divIcon({
            className: "okada-rider-marker-wrapper",
            html: createMotorcycleMarkerHtml({
              heading: m.heading,
              isSelected,
              pinColor,
              title: m.title,
              speed: m.speed,
              etaMinutes: m.etaMinutes,
              isMoving: (m.speed ?? 0) > 1,
            }),
            iconSize: [isSelected ? 44 : 34, isSelected ? 44 : 34],
            iconAnchor: [isSelected ? 22 : 22, isSelected ? 22 : 22],
          });

          const marker = L.marker([m.latitude, m.longitude], { icon, zIndexOffset: isSelected ? 1000 : 100 }).addTo(
            map
          );

          activeMap.set(m.id, {
            marker,
            interpolator,
            isRider: true,
            isSelected,
            type: "rider",
          });
        }
      } else {
        // Non-rider point (pickup, destination)
        if (existing) {
          existing.marker.setLatLng([m.latitude, m.longitude]);
        } else {
          const isPickup = m.type === "pickup" || m.id === "pickup";
          const icon = L.divIcon({
            className: "okada-custom-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 28px; height: 28px; border-radius: 14px; background: ${pinColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); border: 2.5px solid #FFFFFF;">
                  <div style="width: 10px; height: 10px; border-radius: 5px; background: #FFFFFF;"></div>
                </div>
                ${
                  m.etaLabel || m.title
                    ? `<div style="margin-top: 4px; background: #0F172A; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">${
                        m.etaLabel ? `${m.title ?? (isPickup ? "Pickup" : "Destination")} · ${m.etaLabel}` : m.title
                      }</div>`
                    : ""
                }
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([m.latitude, m.longitude], { icon, zIndexOffset: 200 }).addTo(map);
          activeMap.set(m.id, {
            marker,
            isRider: false,
            isSelected: false,
            type: m.type || "pin",
          });
        }
      }
    });

    // Update Route Polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const routePoints = routeCoordinates.map((c) => [c.latitude, c.longitude]);
      polylineRef.current = L.polyline(routePoints, {
        color: colors.primary,
        weight: 5,
        opacity: 0.88,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routePoints.forEach((p) => latLngs.push(p));
    }

    if (fitToMarkers && latLngs.length > 1 && !isFollowingRider && !userInteractingRef.current) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [markers, routeCoordinates, fitToMarkers, mapReady, colors.primary, selectedRiderId]);

  // ─── 60 FPS RequestAnimationFrame Animation & Smooth Heading Loop ─────────
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const map = mapInstanceRef.current;
      const activeMap = activeMarkersRef.current;

      activeMap.forEach((entry, id) => {
        if (entry.isRider && entry.interpolator) {
          const state = entry.interpolator.step(now);

          // Update Leaflet marker coordinates continuously
          entry.marker.setLatLng([state.latitude, state.longitude]);

          // Update CSS rotation directly without re-rendering DOM
          const el = entry.marker.getElement();
          if (el) {
            const rotator = el.querySelector(".okada-moto-rotator") as HTMLElement | null;
            if (rotator) {
              rotator.style.transform = `rotate(${state.heading}deg)`;
            }
          }

          // Camera Follow Mode: Keep selected rider in camera view
          if (
            isFollowingRider &&
            map &&
            !userInteractingRef.current &&
            (entry.isSelected || id === "rider" || id === selectedRiderId)
          ) {
            map.panTo([state.latitude, state.longitude], { animate: true, duration: 0.25 });
          }
        }
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isFollowingRider, selectedRiderId]);

  // Handlers
  const centerOnRegion = useCallback(() => {
    if (mapInstanceRef.current && region?.latitude && region?.longitude) {
      mapInstanceRef.current.setView([region.latitude, region.longitude], 15, { animate: true });
    }
  }, [region]);

  const handleToggleFollowRider = useCallback(() => {
    if (isFollowingRider) {
      setIsFollowingRider(false);
    } else {
      setIsFollowingRider(true);
      if (targetRiderMarker && mapInstanceRef.current) {
        mapInstanceRef.current.setView([targetRiderMarker.latitude, targetRiderMarker.longitude], 16, {
          animate: true,
        });
      }
    }
  }, [isFollowingRider, targetRiderMarker]);

  return (
    <View style={[styles.wrap, { backgroundColor: isDark ? "#060A12" : "#F1F5F9" }, style]}>
      {/* Full Leaflet Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />

      {/* Floating Map Actions */}
      <View style={styles.controlsContainer} pointerEvents="box-none">
        {/* Follow Rider Camera Button */}
        {targetRiderMarker && (
          <Pressable
            style={[
              styles.followButton,
              isFollowingRider
                ? { backgroundColor: colors.primary, borderColor: "#000000" }
                : { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.md,
            ]}
            onPress={handleToggleFollowRider}
            accessibilityLabel="Follow rider camera"
          >
            <Navigation
              size={18}
              color={isFollowingRider ? "#000000" : colors.primary}
              style={{ transform: [{ rotate: "-45deg" }] }}
            />
            <Text
              style={[
                styles.followButtonText,
                { color: isFollowingRider ? "#000000" : colors.text },
              ]}
            >
              {isFollowingRider ? "Following Rider" : "Follow Rider"}
            </Text>
          </Pressable>
        )}

        {/* Center On My Location Button */}
        {showCenterButton ? (
          <Pressable
            style={[
              styles.centerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                top: centerButtonInset?.top,
                right: centerButtonInset?.right ?? spacing.lg,
                bottom: centerButtonInset?.bottom ?? spacing.lg,
                left: centerButtonInset?.left,
              },
              shadows.md,
            ]}
            onPress={centerOnRegion}
            accessibilityLabel="Center map on my location"
          >
            <Crosshair size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {/* Embedded UI Sheets or Modals */}
      <View style={styles.overlay} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden", position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: "flex-end",
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  centerButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  followButton: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
