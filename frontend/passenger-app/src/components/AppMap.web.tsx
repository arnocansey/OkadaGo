import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Crosshair } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { getGoogleMapsApiKey } from "@/lib/googleMapsConfig";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";

type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
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
}: Props) {
  const { colors, isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const googleKey = getGoogleMapsApiKey().trim();

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
            zoom: 14,
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
    };
  }, [googleKey, isDark]);

  // Update map center when region changes
  useEffect(() => {
    if (!mapInstanceRef.current || !region?.latitude || !region?.longitude) return;
    mapInstanceRef.current.setView([region.latitude, region.longitude], mapInstanceRef.current.getZoom(), {
      animate: true,
    });
  }, [region?.latitude, region?.longitude]);

  // Update Markers & Route
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    leafletMarkersRef.current.forEach((m) => m.remove());
    leafletMarkersRef.current = [];

    const latLngs: any[] = [];

    markers.forEach((m) => {
      const pinColor = m.pinColor || colors.primary;
      const pin = L.divIcon({
        className: "okada-custom-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 28px; height: 28px; border-radius: 14px; background: ${pinColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); border: 2px solid #FFFFFF;">
              <div style="width: 10px; height: 10px; border-radius: 5px; background: #FFFFFF;"></div>
            </div>
            ${
              m.title
                ? `<div style="margin-top: 4px; background: rgba(15,23,42,0.9); color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">${m.title}</div>`
                : ""
            }
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: pin }).addTo(map);
      leafletMarkersRef.current.push(marker);
      latLngs.push([m.latitude, m.longitude]);
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
        opacity: 0.85,
      }).addTo(map);

      routePoints.forEach((p) => latLngs.push(p));
    }

    if (fitToMarkers && latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [markers, routeCoordinates, fitToMarkers, mapReady, colors.primary]);

  const centerOnRegion = useCallback(() => {
    if (mapInstanceRef.current && region?.latitude && region?.longitude) {
      mapInstanceRef.current.setView([region.latitude, region.longitude], 15, { animate: true });
    }
  }, [region]);

  return (
    <View style={[styles.wrap, { backgroundColor: isDark ? "#060A12" : "#F1F5F9" }, style]}>
      {/* Full Map Canvas */}
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

      {children}

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
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  centerButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
});
