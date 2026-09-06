import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Navigation, Phone, Star } from "lucide-react-native";
import type { LiveMapRider } from "@/hooks/useLiveNearbyRiders";
import { useTheme } from "@/context/ThemeContext";
import { shadows, spacing } from "@/theme/tokens";

type Props = {
  rider: LiveMapRider;
  onRequestRide: (rider: LiveMapRider) => void;
  onDismiss: () => void;
};

/**
 * RiderInfoCard — Floating card shown when a passenger taps a motorcycle marker.
 * Shows rider details, ETA, distance, and a "Request Ride" button.
 */
export function RiderInfoCard({ rider, onRequestRide, onDismiss }: Props) {
  const { colors, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const etaText = rider.etaMinutes
    ? `~${Math.round(rider.etaMinutes)} min`
    : rider.distanceKm
    ? `${rider.distanceKm.toFixed(1)} km`
    : "Nearby";

  const distanceText = rider.distanceKm
    ? `${rider.distanceKm.toFixed(1)} km away`
    : "Calculating...";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.97)" : "rgba(255, 255, 255, 0.97)",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        shadows.lg,
      ]}
    >
      {/* Rider Info Row */}
      <View style={styles.infoRow}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {rider.name?.charAt(0) || "O"}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {rider.name || "Okada Rider"}
          </Text>
          <Text style={[styles.vehicle, { color: colors.textSecondary }]}>
            {rider.vehicleType === "motorcycle" ? "Okada" : rider.vehicleType || "Motorcycle"}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={12} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.rating, { color: colors.text }]}>
              {rider.rating?.toFixed(1) || "5.0"}
            </Text>
          </View>
        </View>

        {/* ETA Badge */}
        <View style={[styles.etaBadge, { backgroundColor: colors.primary }]}>
          <Navigation size={14} color="#000" style={{ transform: [{ rotate: "45deg" }] }} />
          <Text style={styles.etaText}>{etaText}</Text>
        </View>
      </View>

      {/* Distance */}
      <Text style={[styles.distance, { color: colors.textMuted }]}>
        {distanceText}
      </Text>

      {/* Request Ride Button */}
      <Pressable
        style={[styles.requestBtn, { backgroundColor: colors.primary }]}
        onPress={() => onRequestRide(rider)}
        accessibilityRole="button"
        accessibilityLabel={`Request ride with ${rider.name}`}
      >
        <Text style={styles.requestBtnText}>Request Ride</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 16,
    zIndex: 100,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  },
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  vehicle: {
    fontSize: 12,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  etaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  distance: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 12,
  },
  requestBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  requestBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
});
