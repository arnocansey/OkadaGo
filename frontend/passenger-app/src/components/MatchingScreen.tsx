import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppMap } from "@/components/AppMap";
import { MapPin, Phone, Star, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { usePassengerTripRealtime } from "@/hooks/usePassengerTripRealtime";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { api, money } from "@/lib/api";
import { mapDarkStyle } from "@/theme/mapStyle";
import { ACCRA_REGION, radius, shadows, spacing } from "@/theme/tokens";
import {
  getGoogleMapsApiKey,
  isGoogleMapsApiKeyConfigured,
} from "@/lib/googleMapsConfig";

const NUM_MOTORCYCLES = 3;
const ORBIT_RADIUS = 60;
const PULSE_COUNT = 3;

type RiderData = {
  name: string;
  avatarUrl?: string | null;
  rating?: number | null;
  completedTrips?: number | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
  phoneE164?: string | null;
};

type TripData = {
  id: string;
  status: string;
  estimatedFare?: number | string | null;
  currency?: string;
  pickupLatitude?: number | string | null;
  pickupLongitude?: number | string | null;
  destinationLatitude?: number | string | null;
  destinationLongitude?: number | string | null;
  rider?: RiderData | null;
};

type Props = {
  tripId: string;
  isDelivery?: boolean;
  onCancel: () => void;
  onMatched: (trip: TripData) => void;
  /** Fare to display during searching state */
  fare?: string;
  /** Destination address to display during searching state */
  destinationAddress?: string;
};

function MotorcycleDot({ index, total, animValue }: { index: number; total: number; animValue: Animated.Value }) {
  const { colors } = useTheme();
  const angle = (index / total) * Math.PI * 2;

  const x = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.cos(angle) * ORBIT_RADIUS, Math.cos(angle + Math.PI * 2) * ORBIT_RADIUS],
  });

  const y = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.sin(angle) * ORBIT_RADIUS, Math.sin(angle + Math.PI * 2) * ORBIT_RADIUS],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.4, 1, 0.4, 1, 0.4],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ translateX: x }, { translateY: y }],
        opacity,
        ...shadows.sm,
      }}
    >
      <Text style={{ fontSize: 10 }}>🏍</Text>
    </Animated.View>
  );
}

function PulseRing({ index, delay }: { index: number; delay: number }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay + index * 400),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, index, scale, opacity]);

  const size = 40 + index * 30;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: colors.primary,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/**
 * MatchingScreen — Rider-matching animation with map background.
 *
 * Shows animated motorcycle indicators orbiting the pickup point
 * while searching. On match, the floating status card morphs into
 * the rider profile card.
 */
export function MatchingScreen({ tripId, isDelivery, onCancel, onMatched, fare, destinationAddress }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [trip, setTrip] = useState<TripData | null>(null);
  const [matched, setMatched] = useState(false);

  const orbitAnim = useRef(new Animated.Value(0)).current;
  const cardHeight = useRef(new Animated.Value(90)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const matchPulse = useRef(new Animated.Value(0)).current;

  const mapsApiKey = getGoogleMapsApiKey();
  const hasKey = isGoogleMapsApiKeyConfigured(mapsApiKey);

  const pickupLat = Number(trip?.pickupLatitude ?? 0);
  const pickupLon = Number(trip?.pickupLongitude ?? 0);
  const destLat = Number(trip?.destinationLatitude ?? 0);
  const destLon = Number(trip?.destinationLongitude ?? 0);

  const riderLat = Number(trip?.rider?.rating != null ? 0 : 0);
  const livePreview = useLiveRoutePreview(
    undefined,
    null,
    null,
    false,
  );

  // Start orbit animation
  useEffect(() => {
    if (matched) return;
    const loop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [matched, orbitAnim]);

  // Poll for trip status
  useEffect(() => {
    if (!tripId) return;
    let active = true;
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const data = await api<TripData>(`/rides/${tripId}`, {});
        if (!active) return;
        setTrip(data);
        if (data.status === "assigned" || data.status === "arriving") {
          setMatched(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Animate card expansion
          Animated.parallel([
            Animated.timing(cardHeight, {
              toValue: 280,
              duration: 400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.sequence([
              Animated.delay(200),
              Animated.spring(matchPulse, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            // Notify parent after animation
            setTimeout(() => onMatched(data), 800);
          });
        }
      } catch {
        // Trip not ready yet
      }
    }

    poll();
    timer = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tripId, onMatched, cardHeight, matchPulse]);

  const rider = trip?.rider;

  const markers = useMemo(() => {
    const pts: Array<{ id: string; latitude: number; longitude: number; title?: string; pinColor?: string }> = [];
    if (pickupLat && pickupLon) {
      pts.push({ id: "pickup", latitude: pickupLat, longitude: pickupLon, title: "Pickup", pinColor: colors.mapMarkerPickup });
    }
    if (destLat && destLon) {
      pts.push({ id: "dest", latitude: destLat, longitude: destLon, title: "Destination", pinColor: colors.mapMarkerDestination });
    }
    return pts;
  }, [pickupLat, pickupLon, destLat, destLon, colors]);

  const routeCoordinates = useMemo(() => {
    if (pickupLat && pickupLon && destLat && destLon) {
      return [
        { latitude: pickupLat, longitude: pickupLon },
        { latitude: destLat, longitude: destLon },
      ];
    }
    return undefined;
  }, [pickupLat, pickupLon, destLat, destLon]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        mapWrap: { ...StyleSheet.absoluteFillObject },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
        },
        searchArea: {
          alignItems: "center",
          justifyContent: "center",
          width: 180,
          height: 180,
        },
        searchingLabel: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
          marginTop: ORBIT_RADIUS + 30,
        },
        searchingSub: {
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 4,
        },

        /* ─── Status Card ─────────────────────────────── */
        cardWrap: {
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
        },
        statusCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: radius.lg,
          paddingHorizontal: 20,
          paddingVertical: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        statusText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        cancelBtn: {
          marginLeft: "auto",
          padding: 12,
          borderRadius: 22,
          backgroundColor: colors.surfaceOverlay,
        },

        /* ─── Searching Details ──────────────────────────── */
        detailsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        destRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flex: 1,
        },
        destDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.danger,
        },
        destText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          flex: 1,
        },
        farePill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: colors.primaryLight,
        },
        fareText: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.primary,
        },

        /* ─── Matched Rider Card ────────────────────────── */
        riderCard: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderRadius: radius.lg,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 16,
          elevation: 8,
        },
        riderHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
        },
        riderInfo: { flex: 1 },
        riderName: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
        },
        riderMeta: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        riderFare: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.primary,
          textAlign: "right",
        },
        riderFareSub: {
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "right",
        },
        statsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 14,
        },
        statChip: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingVertical: 8,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceOverlay,
        },
        statText: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        vehicleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          marginBottom: 14,
        },
        vehicleText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        plateText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.primary,
          letterSpacing: 0.5,
        },
        actionRow: {
          flexDirection: "row",
          gap: 10,
        },
        callBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        callBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.primary,
        },
        continueBtn: {
          flex: 1.5,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
        },
        continueBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#000",
        },

        /* ─── Match Success Badge ─────────────────────── */
        matchBadge: {
          position: "absolute",
          top: insets.top + 12,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: radius.full,
          backgroundColor: colors.success,
          ...shadows.md,
        },
        matchBadgeText: {
          fontSize: 13,
          fontWeight: "700",
          color: "#FFFFFF",
        },
      }),
    [colors, isDark, insets],
  );

  return (
    <View style={styles.screen}>
      {/* Map Background */}
      {hasKey ? (
        <View style={styles.mapWrap}>
          <AppMap
            style={StyleSheet.absoluteFill}
            region={{
              latitude: pickupLat || ACCRA_REGION.latitude,
              longitude: pickupLon || ACCRA_REGION.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            routeCoordinates={routeCoordinates}
            markers={markers}
          />
        </View>
      ) : (
        <View style={[styles.mapWrap, { backgroundColor: colors.surface }]} />
      )}

      {/* Searching Animation — Motorcycle Indicators */}
      {!matched ? (
        <View style={styles.overlay}>
          <View style={styles.searchArea}>
            {Array.from({ length: PULSE_COUNT }).map((_, i) => (
              <PulseRing key={`pulse-${i}`} index={i} delay={0} />
            ))}
            {Array.from({ length: NUM_MOTORCYCLES }).map((_, i) => (
              <MotorcycleDot
                key={`mc-${i}`}
                index={i}
                total={NUM_MOTORCYCLES}
                animValue={orbitAnim}
              />
            ))}
          </View>
          <Text style={styles.searchingLabel}>Finding your rider</Text>
          <Text style={styles.searchingSub}>Nearby riders are being matched to you</Text>
        </View>
      ) : null}

      {/* Match Success Badge */}
      {matched ? (
        <Animated.View
          style={[
            styles.matchBadge,
            {
              opacity: matchPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  scale: matchPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.matchBadgeText}>Rider matched!</Text>
        </Animated.View>
      ) : null}

      {/* Floating Status / Rider Card */}
      <View style={styles.cardWrap}>
        {matched && rider ? (
          <Animated.View
            style={[
              styles.riderCard,
              {
                opacity: cardOpacity,
                transform: [
                  {
                    translateY: matchPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Rider Header */}
            <View style={styles.riderHeader}>
              <Avatar name={rider.name} size={52} imageUri={rider.avatarUrl ?? undefined} />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderMeta}>
                  {rider.completedTrips != null ? `${rider.completedTrips} trips` : "New rider"}
                  {rider.rating != null ? ` · ${rider.rating.toFixed(1)} ★` : ""}
                </Text>
              </View>
              {trip?.estimatedFare != null ? (
                <View>
                  <Text style={styles.riderFare}>
                    {money(Number(trip.estimatedFare), trip.currency)}
                  </Text>
                  <Text style={styles.riderFareSub}>estimated</Text>
                </View>
              ) : null}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {rider.rating != null ? (
                <View style={styles.statChip}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.statText}>{rider.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {rider.completedTrips != null ? (
                <View style={styles.statChip}>
                  <Text style={styles.statText}>{rider.completedTrips} trips</Text>
                </View>
              ) : null}
              <View style={styles.statChip}>
                <Text style={styles.statText}>Arriving soon</Text>
              </View>
            </View>

            {/* Vehicle */}
            {rider.vehicle?.plateNumber ? (
              <View style={styles.vehicleRow}>
                <Text style={styles.vehicleText}>
                  {[rider.vehicle.color, rider.vehicle.make, rider.vehicle.model].filter(Boolean).join(" ")}
                </Text>
                <Text style={styles.plateText}>{rider.vehicle.plateNumber}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actionRow}>
              {rider.phoneE164 ? (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${rider.phoneE164}`)}
                >
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.callBtnText}>Call</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.callBtn} onPress={onCancel}>
                <X size={16} color={colors.danger} />
                <Text style={[styles.callBtnText, { color: colors.danger }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.continueBtn}
                onPress={() => onMatched(trip!)}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.statusCard, { height: cardHeight }]}>
            <View style={styles.statusRow}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    opacity: orbitAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1, 0.3],
                    }),
                  },
                ]}
              />
              <Text style={styles.statusText}>Finding your rider...</Text>
              <Pressable style={styles.cancelBtn} onPress={onCancel} hitSlop={8} accessibilityLabel="Cancel ride" accessibilityRole="button">
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            {(fare || destinationAddress) ? (
              <View style={styles.detailsRow}>
                {destinationAddress ? (
                  <View style={styles.destRow}>
                    <View style={styles.destDot} />
                    <Text style={styles.destText} numberOfLines={1}>
                      {destinationAddress}
                    </Text>
                  </View>
                ) : null}
                {fare ? (
                  <View style={styles.farePill}>
                    <Text style={styles.fareText}>{fare}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        )}
      </View>
    </View>
  );
}
