import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Crosshair, MapPin } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";

type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
};

type Props = {
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  markers?: MapMarker[];
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  fitToMarkers?: boolean;
  autoCenterOnLocation?: boolean;
  showCenterButton?: boolean;
  centerButtonInset?: { top?: number; right?: number; bottom?: number; left?: number };
  style?: object;
  children?: React.ReactNode;
};

export function AppMap({
  region = ACCRA_REGION,
  markers = [],
  showCenterButton = false,
  centerButtonInset,
  style,
  children,
}: Props) {
  const { colors, isDark } = useTheme();
  const [activeRegion, setActiveRegion] = useState(region);

  const centerOnRegion = useCallback(() => {
    setActiveRegion(region);
  }, [region]);

  return (
    <View style={[styles.wrap, { backgroundColor: isDark ? "#121A28" : "#E2E8F0" }, style]}>
      {/* Web Vector Grid Map Simulation */}
      <View style={styles.webGridOverlay}>
        <View style={[styles.roadHorizontal, { backgroundColor: isDark ? "#1E293B" : "#CBD5E1" }]} />
        <View style={[styles.roadVertical, { backgroundColor: isDark ? "#1E293B" : "#CBD5E1" }]} />
        <View style={[styles.roadSecondary, { backgroundColor: isDark ? "#1A2333" : "#D1D5DB" }]} />

        {/* Map Location Badge */}
        <View style={[styles.locationBadge, { backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)", borderColor: colors.border }]}>
          <MapPin size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.text }]}>Accra · Live Dispatch</Text>
        </View>

        {/* Map Markers */}
        {markers.map((m, index) => (
          <View
            key={m.id || index}
            style={[
              styles.markerPin,
              {
                backgroundColor: m.pinColor || colors.primary,
                top: `${40 + index * 12}%` as any,
                left: `${35 + index * 20}%` as any,
              },
            ]}
          >
            <MapPin size={16} color="#FFFFFF" />
            {m.title ? (
              <View style={[styles.markerCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.calloutText, { color: colors.text }]}>{m.title}</Text>
              </View>
            ) : null}
          </View>
        ))}

        {children}
      </View>

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
    position: "relative",
    overflow: "hidden",
  },
  webGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  roadHorizontal: {
    position: "absolute",
    top: "48%",
    left: 0,
    right: 0,
    height: 32,
  },
  roadVertical: {
    position: "absolute",
    left: "42%",
    top: 0,
    bottom: 0,
    width: 28,
  },
  roadSecondary: {
    position: "absolute",
    top: "25%",
    left: "10%",
    width: "80%",
    height: 14,
    transform: [{ rotate: "-25deg" }],
  },
  locationBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    zIndex: 10,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "700",
  },
  markerPin: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 15,
  },
  markerCallout: {
    position: "absolute",
    bottom: 38,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  calloutText: {
    fontSize: 11,
    fontWeight: "600",
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
