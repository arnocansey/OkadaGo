import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Clock, MapPin, Navigation, Route } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import type { RoutePreview } from "@/types";

type Props = {
  pickupAddress: string;
  destinationAddress: string;
  estimate: RoutePreview | null;
  onChooseRide: () => void;
  loading?: boolean;
};

/**
 * RoutePreviewSheet — Compact bottom sheet shown after destination
 * is confirmed and route is estimated.
 *
 * ┌──────────────────────────────────────┐
 * │  ─── handle ───                      │
 * │                                      │
 * │  ● Pickup address                    │
 * │  │                                   │
 * │  ▼ Destination address               │
 * │                                      │
 * │  ┌──────────┬──────────┐            │
 * │  │ 2.4 km   │ ~8 min   │            │
 * │  └──────────┴──────────┘            │
 * │                                      │
 * │  ┌──────────────────────────────┐   │
 * │  │      Choose Ride  →          │   │
 * │  └──────────────────────────────┘   │
 * └──────────────────────────────────────┘
 */
export function RoutePreviewSheet({
  pickupAddress,
  destinationAddress,
  estimate,
  onChooseRide,
  loading,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || 16,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 12,
          marginBottom: 16,
        },
        inner: {
          paddingHorizontal: 20,
        },

        /* ─── Route Stops ──────────────────────────────── */
        routeStops: {
          marginBottom: 16,
        },
        stopRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        },
        stopIconCol: {
          alignItems: "center",
          width: 20,
          paddingTop: 2,
        },
        stopDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        stopDotDest: {
          backgroundColor: colors.danger,
        },
        stopLine: {
          width: 2,
          flex: 1,
          minHeight: 20,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
          borderRadius: 1,
          marginTop: 4,
          marginBottom: 4,
        },
        stopTextCol: {
          flex: 1,
        },
        stopLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 2,
        },
        stopAddress: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
          lineHeight: 20,
        },

        /* ─── Stats Row ────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 16,
        },
        statCard: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.12)",
        },
        statIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        },
        statValue: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
        },
        statLabel: {
          fontSize: 11,
          fontWeight: "500",
          color: colors.textMuted,
        },
        statTextCol: {
          flex: 1,
        },

        /* ─── CTA ──────────────────────────────────────── */
        ctaBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        ctaBtnDisabled: {
          opacity: 0.5,
        },
        ctaText: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <View style={s.inner}>
        {/* ─── Pickup → Destination ──────────────────────── */}
        <View style={s.routeStops}>
          {/* Pickup */}
          <View style={s.stopRow}>
            <View style={s.stopIconCol}>
              <View style={s.stopDot} />
            </View>
            <View style={s.stopTextCol}>
              <Text style={s.stopLabel}>Pickup</Text>
              <Text style={s.stopAddress} numberOfLines={2}>
                {pickupAddress || "Current location"}
              </Text>
            </View>
          </View>

          {/* Route line */}
          <View style={[s.stopRow, { minHeight: 28 }]}>
            <View style={s.stopIconCol}>
              <View style={s.stopLine} />
            </View>
            <View style={s.stopTextCol} />
          </View>

          {/* Destination */}
          <View style={s.stopRow}>
            <View style={s.stopIconCol}>
              <View style={[s.stopDot, s.stopDotDest]} />
            </View>
            <View style={s.stopTextCol}>
              <Text style={s.stopLabel}>Destination</Text>
              <Text style={s.stopAddress} numberOfLines={2}>
                {destinationAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Distance + Duration Stats ─────────────────── */}
        {estimate && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <View style={s.statIcon}>
                <Navigation size={16} color={colors.primary} />
              </View>
              <View style={s.statTextCol}>
                <Text style={s.statValue}>{estimate.distanceKm.toFixed(1)} km</Text>
                <Text style={s.statLabel}>Distance</Text>
              </View>
            </View>
            <View style={s.statCard}>
              <View style={s.statIcon}>
                <Clock size={16} color={colors.primary} />
              </View>
              <View style={s.statTextCol}>
                <Text style={s.statValue}>~{Math.round(estimate.durationMinutes)} min</Text>
                <Text style={s.statLabel}>Estimated time</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Choose Ride CTA ───────────────────────────── */}
        <Pressable
          style={[s.ctaBtn, loading && s.ctaBtnDisabled]}
          onPress={onChooseRide}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Choose ride type"
        >
          <Text style={s.ctaText}>Choose Ride</Text>
          <Route size={18} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
}
