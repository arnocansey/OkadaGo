import { useCallback, useEffect, useRef, useState } from "react";
import MapViewBase, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Crosshair, MapPin, Navigation } from "lucide-react-native";
import { MotorcycleMarker } from "./MotorcycleMarker";
import { useTheme } from "@/context/ThemeContext";
import {
  getGoogleMapsApiKey,
  GOOGLE_MAPS_SETUP_HINT,
  isGoogleMapsApiKeyConfigured,
} from "@/lib/googleMapsConfig";
import { mapDarkStyle } from "@/theme/mapStyle";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";

const MAP_LOAD_TIMEOUT_MS = 8000;

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
  region?: Region;
  markers?: MapMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  fitToMarkers?: boolean;
  autoCenterOnLocation?: boolean;
  showCenterButton?: boolean;
  centerButtonInset?: { top?: number; right?: number; bottom?: number; left?: number };
  style?: object;
  children?: React.ReactNode;
  /** When set, the map becomes tappable and reports the tapped coordinate (e.g. manual pin-drop). */
  onMapPress?: (coordinate: MapPressCoordinate) => void;
  pinDropHint?: string;
  selectedRiderId?: string;
};

function MapUnavailable({ title, detail }: { title: string; detail: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.unavailable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <MapPin size={28} color={colors.textMuted} />
      <Text style={[styles.unavailableTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.unavailableDetail, { color: colors.textMuted }]}>{detail}</Text>
    </View>
  );
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
  pinDropHint,
  selectedRiderId,
}: Props) {
  const mapRef = useRef<MapViewBase>(null);
  const didAutoCenter = useRef(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors, isDark } = useTheme();
  const mapsApiKey = getGoogleMapsApiKey();
  const hasConfiguredKey = isGoogleMapsApiKeyConfigured(mapsApiKey);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "failed">(
    hasConfiguredKey ? "loading" : "failed",
  );
  const [isFollowingRider, setIsFollowingRider] = useState(false);

  // Identify target rider to follow
  const targetRiderMarker = markers.find(
    (m) =>
      m.isSelected ||
      m.id === selectedRiderId ||
      (selectedRiderId && m.id === `rider-${selectedRiderId}`) ||
      m.id === "rider"
  );

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const handleMapReady = useCallback(() => {
    clearLoadTimeout();
    setMapStatus("ready");
  }, [clearLoadTimeout]);

  const centerOnRegion = useCallback(() => {
    mapRef.current?.animateToRegion(region, 450);
  }, [region]);

  useEffect(() => {
    if (!hasConfiguredKey) return;

    loadTimeoutRef.current = setTimeout(() => {
      setMapStatus((current) => (current === "loading" ? "failed" : current));
    }, MAP_LOAD_TIMEOUT_MS);

    return clearLoadTimeout;
  }, [clearLoadTimeout, hasConfiguredKey]);

  useEffect(() => {
    if (!fitToMarkers || isFollowingRider) return;
    const points = [
      ...markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      ...(routeCoordinates ?? []),
    ];
    if (points.length === 0) return;
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [fitToMarkers, markers, routeCoordinates, isFollowingRider]);

  // Camera Follow Rider Animation
  useEffect(() => {
    if (!isFollowingRider || !targetRiderMarker || mapStatus !== "ready") return;
    mapRef.current?.animateCamera(
      {
        center: { latitude: targetRiderMarker.latitude, longitude: targetRiderMarker.longitude },
        heading: targetRiderMarker.heading ?? 0,
        zoom: 16,
      },
      { duration: 350 }
    );
  }, [
    isFollowingRider,
    targetRiderMarker?.latitude,
    targetRiderMarker?.longitude,
    targetRiderMarker?.heading,
    mapStatus,
  ]);

  useEffect(() => {
    if (!autoCenterOnLocation || didAutoCenter.current || mapStatus !== "ready" || isFollowingRider) return;

    const isDefault =
      Math.abs(region.latitude - ACCRA_REGION.latitude) < 0.001 &&
      Math.abs(region.longitude - ACCRA_REGION.longitude) < 0.001;
    if (isDefault) return;

    mapRef.current?.animateToRegion(region, 600);
    didAutoCenter.current = true;
  }, [
    autoCenterOnLocation,
    mapStatus,
    region.latitude,
    region.longitude,
    region.latitudeDelta,
    region.longitudeDelta,
    isFollowingRider,
  ]);

  if (!hasConfiguredKey) {
    return (
      <View style={[styles.wrap, style]}>
        <MapUnavailable
          title="Map unavailable"
          detail={`Google Maps API key is missing in this build. ${GOOGLE_MAPS_SETUP_HINT}`}
        />
      </View>
    );
  }

  if (mapStatus === "failed") {
    return (
      <View style={[styles.wrap, style]}>
        <MapUnavailable
          title="Map failed to load"
          detail={`Google Maps could not initialize. Confirm Maps SDK for Android is enabled, the release SHA-1 is registered in Google Cloud Console, and billing is active. ${GOOGLE_MAPS_SETUP_HINT}`}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <MapViewBase
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={ACCRA_REGION}
        customMapStyle={isDark ? mapDarkStyle : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        onMapReady={handleMapReady}
        onPress={onMapPress ? (event) => onMapPress(event.nativeEvent.coordinate) : undefined}
        onPanDrag={() => setIsFollowingRider(false)}
      >
        {routeCoordinates?.length ? (
          <Polyline coordinates={routeCoordinates} strokeColor={colors.mapRoute} strokeWidth={4} />
        ) : null}
        {markers.map((m) => {
          const isRider =
            m.type === "rider" ||
            m.title === "Okada" ||
            m.title === "Rider" ||
            m.id === "rider" ||
            m.id.startsWith("rider");

          if (isRider) {
            const badgeBg = m.pinColor ?? colors.primary;
            const isSelected = Boolean(
              m.isSelected ||
                m.id === selectedRiderId ||
                (selectedRiderId && m.id === `rider-${selectedRiderId}`) ||
                m.id === "rider"
            );

            return (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                title={m.title ?? "Okada Rider"}
                anchor={{ x: 0.5, y: 0.5 }}
                flat={true}
                rotation={m.heading ?? 0}
              >
                <MotorcycleMarker
                  heading={m.heading}
                  disableRotation={true}
                  isSelected={isSelected}
                  isMoving={(m.speed ?? 0) > 1}
                  pinColor={badgeBg}
                  title={m.title}
                  speed={m.speed}
                  etaLabel={m.etaLabel}
                />
              </Marker>
            );
          }

          if (m.etaLabel) {
            const isPickup = m.type === "pickup" || m.id === "pickup";
            const pillBg = isPickup ? (m.pinColor ?? colors.primary) : (isDark ? "#1F2937" : "#111827");
            const textColor = isPickup ? "#000000" : "#FFFFFF";
            return (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                title={m.title}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.etaPillContainer}>
                  <View style={[styles.etaPill, { backgroundColor: pillBg }]}>
                    <Text style={[styles.etaPillTitle, { color: textColor }]}>
                      {m.title ?? (isPickup ? "Pickup" : "Dropoff")}
                    </Text>
                    <View
                      style={[
                        styles.etaPillDot,
                        { backgroundColor: isPickup ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)" },
                      ]}
                    />
                    <Text style={[styles.etaPillTime, { color: textColor }]}>{m.etaLabel}</Text>
                  </View>
                  <View style={[styles.etaPillPointer, { borderTopColor: pillBg }]} />
                </View>
              </Marker>
            );
          }

          return (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              title={m.title}
              pinColor={m.pinColor ?? colors.mapTint}
            />
          );
        })}
        {children}
      </MapViewBase>

      {/* Follow Rider Floating Action Button */}
      {targetRiderMarker && (
        <Pressable
          style={[
            styles.followButton,
            isFollowingRider
              ? { backgroundColor: colors.primary, borderColor: "#000000" }
              : { backgroundColor: colors.surface, borderColor: colors.border },
            shadows.md,
          ]}
          onPress={() => setIsFollowingRider((prev) => !prev)}
          accessibilityLabel="Follow rider camera"
        >
          <Navigation
            size={16}
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

      {onMapPress && pinDropHint ? (
        <View style={[styles.pinDropBanner, { backgroundColor: colors.primary }]} pointerEvents="none">
          <MapPin size={14} color={colors.textOnPrimary} />
          <Text style={[styles.pinDropText, { color: colors.textOnPrimary }]}>{pinDropHint}</Text>
        </View>
      ) : null}

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
  wrap: { flex: 1, overflow: "hidden" },
  unavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  unavailableDetail: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  centerButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDropBanner: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    ...shadows.md,
  },
  pinDropText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  riderMarkerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  etaPillContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  etaPillTitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  etaPillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  etaPillTime: {
    fontSize: 11,
    fontWeight: "600",
  },
  etaPillPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
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
