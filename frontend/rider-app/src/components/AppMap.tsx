import { useCallback, useEffect, useRef } from "react";
import MapViewBase, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { Pressable, StyleSheet, View } from "react-native";
import { Crosshair } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { mapDarkStyle } from "@/theme/mapStyle";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";

type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
};

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
};

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
}: Props) {
  const mapRef = useRef<MapViewBase>(null);
  const didAutoCenter = useRef(false);
  const { colors, isDark } = useTheme();

  const centerOnRegion = useCallback(() => {
    mapRef.current?.animateToRegion(region, 450);
  }, [region]);

  useEffect(() => {
    if (!fitToMarkers || markers.length === 0) return;
    mapRef.current?.fitToCoordinates(
      markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true },
    );
  }, [fitToMarkers, markers]);

  useEffect(() => {
    if (!autoCenterOnLocation || didAutoCenter.current) return;

    const isDefault =
      Math.abs(region.latitude - ACCRA_REGION.latitude) < 0.001 &&
      Math.abs(region.longitude - ACCRA_REGION.longitude) < 0.001;
    if (isDefault) return;

    mapRef.current?.animateToRegion(region, 600);
    didAutoCenter.current = true;
  }, [autoCenterOnLocation, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

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
      >
        {routeCoordinates?.length ? (
          <Polyline coordinates={routeCoordinates} strokeColor={colors.mapRoute} strokeWidth={4} />
        ) : null}
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            pinColor={m.pinColor ?? colors.mapTint}
          />
        ))}
        {children}
      </MapViewBase>

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
  centerButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
