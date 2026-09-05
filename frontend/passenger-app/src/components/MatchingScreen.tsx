import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppMap } from "@/components/AppMap";
import { Phone, Star, X, Clock, Shield, AlertCircle, RefreshCw } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { api, money } from "@/lib/api";
import { passengerWs } from "@/lib/websocket";
import { useLiveNearbyRiders } from "@/hooks/useLiveNearbyRiders";
import { ACCRA_REGION, radius, shadows } from "@/theme/tokens";
import {
  getGoogleMapsApiKey,
  isGoogleMapsApiKeyConfigured,
} from "@/lib/googleMapsConfig";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PULSE_COUNT = 3;

/** Number of simulated nearby riders to show on map while searching */
const NEARBY_RIDER_COUNT = 6;

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type RiderData = {
  name: string;
  avatarUrl?: string | null;
  rating?: number | null;
  completedTrips?: number | null;
  currentLatitude?: number | string | null;
  currentLongitude?: number | string | null;
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

// â”€â”€â”€ Simulated Nearby Rider Positions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Generates simulated nearby rider positions offset from a center point.
 * These are shown while the app is searching.
 *
 * To replace with real-time data: subscribe to a WebSocket/Firebase feed
 * and update the `nearbyRiders` state in MatchingScreen with the same shape:
 *   { id, latitude, longitude, heading }
 */
function generateNearbyRiders(
  centerLat: number,
  centerLon: number,
): Array<{ id: string; latitude: number; longitude: number; heading: number }> {
  const offsets = [
    { dlat: 0.005, dlon: 0.008, heading: 220 },
    { dlat: -0.004, dlon: 0.012, heading: 150 },
    { dlat: 0.009, dlon: -0.006, heading: 45 },
    { dlat: -0.007, dlon: -0.009, heading: 310 },
    { dlat: 0.002, dlon: -0.014, heading: 90 },
    { dlat: -0.011, dlon: 0.003, heading: 180 },
  ];
  return offsets.slice(0, NEARBY_RIDER_COUNT).map((o, i) => ({
    id: `nearby-rider-${i}`,
    latitude: centerLat + o.dlat,
    longitude: centerLon + o.dlon,
    heading: o.heading,
  }));
}

// â”€â”€â”€ PulseRing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PulseRing({ index, delay }: { index: number; delay: number }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay + index * 500),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.35, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, index, scale, opacity]);

  const size = 60 + index * 45;

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: colors.primary,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// â”€â”€â”€ SearchingDots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Animated three-dot loading indicator synced to OkadaGo primary color */
function SearchingDots() {
  const { colors } = useTheme();
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dots = [dot0, dot1, dot2];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(400),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: colors.primary,
            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [
              { scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

// â”€â”€â”€ MatchingScreen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * MatchingScreen â€” Premium ride-hailing search + rider match interface.
 *
 * States:
 *  1. SEARCHING  â€” full-screen map with animated nearby motorcycle markers,
 *                  radar pulse rings, and a bottom sheet showing search status.
 *  2. MATCHED    â€” rider profile card slides up from bottom with "Rider Found!"
 *                  badge animation and haptic feedback.
 *
 * Real-time integration: Replace `nearbyRiders` (generated by generateNearbyRiders)
 * with live rider coordinates from Firebase/WebSocket. Same data shape:
 *   { id: string; latitude: number; longitude: number; heading: number }
 */
export function MatchingScreen({ tripId, isDelivery, onCancel, onMatched, fare, destinationAddress }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [trip, setTrip] = useState<TripData | null>(null);
  const [matched, setMatched] = useState(false);
  const [searchStatusMessage, setSearchStatusMessage] = useState("Contacting nearest Okada rider...");
  const [searchRound, setSearchRound] = useState(1);
  const [searchRadiusKm, setSearchRadiusKm] = useState(1.2);
  const [isExpired, setIsExpired] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Animation values
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const matchBadgeAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;

  const mapsApiKey = getGoogleMapsApiKey();
  const hasKey = isGoogleMapsApiKeyConfigured(mapsApiKey);

  const pickupLat = Number(trip?.pickupLatitude ?? 0);
  const pickupLon = Number(trip?.pickupLongitude ?? 0);
  const destLat = Number(trip?.destinationLatitude ?? 0);
  const destLon = Number(trip?.destinationLongitude ?? 0);

  // Live nearby riders from real-time spatial feed (falling back to realistic local markers)
  const { nearbyRiders: liveNearby } = useLiveNearbyRiders({
    latitude: pickupLat || ACCRA_REGION.latitude,
    longitude: pickupLon || ACCRA_REGION.longitude,
    radiusKm: searchRadiusKm,
    enabled: !matched,
  });

  const nearbyRiders = useMemo(() => {
    if (liveNearby.length > 0) {
      return liveNearby.map((r) => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        heading: r.heading,
        speed: r.speed,
      }));
    }
    if (!pickupLat || !pickupLon) return [];
    return generateNearbyRiders(pickupLat, pickupLon);
  }, [liveNearby, pickupLat, pickupLon]);

  const triggerMatch = useCallback(
    (data: TripData) => {
      if (matched) return;
      setMatched(true);
      setIsExpired(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          tension: 55,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(matchBadgeAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(() => onMatched(data), 900);
      });
    },
    [matched, cardSlide, cardOpacity, matchBadgeAnim, onMatched],
  );

  const handleRetry = async () => {
    if (!tripId) return;
    try {
      setIsRetrying(true);
      await api(`/rides/${tripId}/retry-dispatch`, { method: "POST" });
      setIsExpired(false);
      setSearchRound(1);
      setSearchRadiusKm(1.2);
      setSearchStatusMessage("Contacting nearest Okada rider...");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore network hiccup on retry
    } finally {
      setIsRetrying(false);
    }
  };

  // Listen to live WebSocket dispatch events
  useEffect(() => {
    if (!tripId) return;

    const onSearching = (payload: any) => {
      if (payload?.rideId === tripId) {
        if (payload.message) setSearchStatusMessage(payload.message);
        if (payload.round) setSearchRound(payload.round);
        if (payload.radiusKm) setSearchRadiusKm(payload.radiusKm);
      }
    };

    const onAccepted = (payload: any) => {
      const r = payload?.ride ?? payload;
      if (r?.id === tripId || payload?.rideId === tripId) {
        const enrichedTrip: TripData = {
          ...(trip ?? {}),
          ...r,
          rider: payload?.rider
            ? {
                name: payload.rider.fullName ?? payload.rider.name,
                avatarUrl: payload.rider.avatarUrl,
                rating: payload.rider.ratingAverage,
                vehicle: {
                  make: payload.rider.vehicleType ?? "Okada",
                  plateNumber: payload.rider.plateNumber,
                },
              }
            : r.rider,
          safetyPin: payload?.safetyPin ?? r.safetyPin,
        };
        setTrip(enrichedTrip);
        triggerMatch(enrichedTrip);
      }
    };

    const onExpired = (payload: any) => {
      if (payload?.rideId === tripId) {
        setIsExpired(true);
        if (payload.message) setSearchStatusMessage(payload.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    };

    passengerWs.on("ride.searching", onSearching);
    passengerWs.on("ride.accepted", onAccepted);
    passengerWs.on("ride.expired", onExpired);

    return () => {
      passengerWs.off("ride.searching", onSearching);
      passengerWs.off("ride.accepted", onAccepted);
      passengerWs.off("ride.expired", onExpired);
    };
  }, [tripId, triggerMatch, trip]);

  // Orbit animation (drives dot pulse in status bar)
  useEffect(() => {
    if (matched) return;
    const loop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [matched, orbitAnim]);

  // Poll for trip status every 3 seconds
  useEffect(() => {
    if (!tripId) return;
    let active = true;
    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const data = await api<TripData>(`/rides/${tripId}`, {});
        if (!active) return;
        setTrip(data);
        if ((data.status === "assigned" || data.status === "arriving") && !matched) {
          triggerMatch(data);
        }
      } catch {
        // Trip not ready yet — continue polling
      }
    }

    poll();
    timer = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tripId, triggerMatch, matched]);

  const rider = trip?.rider;

  // Build map markers
  const markers = useMemo(() => {
    const pts: Array<{
      id: string;
      latitude: number;
      longitude: number;
      title?: string;
      pinColor?: string;
      type?: "rider" | "pickup" | "destination" | "dropoff" | "default";
      heading?: number;
    }> = [];

    if (pickupLat && pickupLon) {
      pts.push({
        id: "pickup",
        latitude: pickupLat,
        longitude: pickupLon,
        title: "Pickup",
        pinColor: colors.mapMarkerPickup,
        type: "pickup",
      });
    }
    if (destLat && destLon) {
      pts.push({
        id: "dest",
        latitude: destLat,
        longitude: destLon,
        title: "Destination",
        pinColor: colors.mapMarkerDestination,
        type: "destination",
      });
    }

    if (!matched) {
      // Simulated nearby riders during search phase.
      // To use real data: replace nearbyRiders with live coordinates from
      // your WebSocket/Firebase feed (same shape: { id, latitude, longitude, heading })
      nearbyRiders.forEach((r) => {
        pts.push({
          id: r.id,
          latitude: r.latitude,
          longitude: r.longitude,
          title: "Okada Rider",
          pinColor: colors.primary,
          type: "rider",
          heading: r.heading,
        });
      });
    } else {
      const riderLat = Number(rider?.currentLatitude);
      const riderLon = Number(rider?.currentLongitude);
      if (Number.isFinite(riderLat) && riderLat !== 0 && Number.isFinite(riderLon) && riderLon !== 0) {
        pts.push({
          id: "rider",
          latitude: riderLat,
          longitude: riderLon,
          title: "Okada Rider",
          pinColor: colors.primary,
          type: "rider",
        });
      }
    }

    return pts;
  }, [pickupLat, pickupLon, destLat, destLon, matched, nearbyRiders, rider, colors]);

  // Fetch route preview between pickup and destination
  const [roadRoute, setRoadRoute] = useState<Array<{ latitude: number; longitude: number }> | undefined>();

  useEffect(() => {
    if (!pickupLat || !pickupLon || !destLat || !destLon) return;
    let active = true;
    const params = new URLSearchParams({
      startLat: `${pickupLat}`,
      startLon: `${pickupLon}`,
      endLat: `${destLat}`,
      endLon: `${destLon}`,
    });

    api<{ route?: Array<[number, number]> }>(`/bootstrap/route-preview?${params.toString()}`, {})
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res.route) && res.route.length > 1) {
          setRoadRoute(res.route.map(([lat, lon]) => ({ latitude: lat, longitude: lon })));
        }
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, [pickupLat, pickupLon, destLat, destLon]);

  const routeCoordinates = useMemo(() => {
    if (roadRoute && roadRoute.length > 1) return roadRoute;
    return undefined;
  }, [roadRoute]);

  const nearbyCount = nearbyRiders.length;

  // Placeholder ETA â€” replace with real ETA from API/booking response
  const etaMinutes = 3;

  // â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        mapWrap: { ...StyleSheet.absoluteFillObject },

        /* Radar anchor centered on screen (visual-only overlay) */
        radarAnchor: {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none" as any,
        },

        /* Top header pill */
        topHeaderPill: {
          position: "absolute",
          top: insets.top + 16,
          alignSelf: "center",
          backgroundColor: isDark ? "rgba(15,17,21,0.92)" : "rgba(255,255,255,0.96)",
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: radius.full,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        searchingLabel: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          letterSpacing: 0.2,
        },
        searchingSub: {
          fontSize: 11,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 2,
        },

        /* Bottom sheet */
        sheetWrap: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },

        /* â”€ Searching bottom sheet â”€ */
        searchSheet: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 16,
        },
        sheetHandle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginBottom: 16,
        },
        sheetTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        searchTitle: {
          flex: 1,
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.3,
        },
        cancelIconBtn: {
          padding: 10,
          borderRadius: 20,
          backgroundColor: colors.surfaceOverlay,
        },
        searchSubRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
        },
        searchSubText: {
          fontSize: 13,
          color: colors.textSecondary,
          flex: 1,
        },
        nearbyBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: colors.primaryLight,
        },
        nearbyBadgeText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.primary,
        },
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginVertical: 14,
        },
        destRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        destDot: {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: colors.danger,
        },
        destText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          flex: 1,
        },
        farePill: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: colors.primaryLight,
        },
        fareText: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.primary,
        },
        cancelFullBtn: {
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 13,
          borderRadius: radius.md,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
        cancelFullBtnText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        escalationBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: isDark ? "rgba(250, 204, 21, 0.15)" : "rgba(250, 204, 21, 0.12)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250, 204, 21, 0.3)" : "rgba(250, 204, 21, 0.25)",
        },
        escalationBadgeText: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.primary,
        },
        expiredSheet: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 16,
        },
        expiredIconWrap: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: isDark ? "rgba(234, 179, 8, 0.12)" : "rgba(234, 179, 8, 0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        },
        expiredTitle: {
          fontSize: 18,
          fontWeight: "800",
          color: colors.text,
          textAlign: "center",
          letterSpacing: -0.3,
        },
        expiredSub: {
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 6,
          lineHeight: 18,
          paddingHorizontal: 12,
        },
        retryBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
        },
        retryBtnText: {
          fontSize: 15,
          fontWeight: "700",
          color: "#000000",
        },

        /* â”€ Match success badge â”€ */
        matchBadge: {
          position: "absolute",
          top: insets.top + 16,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: radius.full,
          backgroundColor: colors.success,
          ...shadows.md,
        },
        matchBadgeText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#FFFFFF",
          letterSpacing: 0.2,
        },

        /* â”€ Rider Found card â”€ */
        riderSheet: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 16,
        },
        foundLabel: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.success,
          textAlign: "center",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 14,
        },
        riderHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
        },
        riderInfo: { flex: 1 },
        riderName: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          letterSpacing: -0.3,
        },
        riderMeta: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        riderFare: {
          fontSize: 20,
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
          gap: 8,
          marginBottom: 14,
        },
        statChip: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          paddingVertical: 10,
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
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          marginBottom: 14,
        },
        vehicleLabel: {
          flex: 1,
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        plateChip: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: colors.primaryLight,
        },
        plateText: {
          fontSize: 13,
          fontWeight: "800",
          color: colors.primary,
          letterSpacing: 1,
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
          paddingVertical: 13,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        callBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.primary,
        },
        continueBtn: {
          flex: 1.6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 13,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
        },
        continueBtnText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#000000",
        },
        riderCancelBtn: {
          marginTop: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 11,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
        riderCancelText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textMuted,
        },
      }),
    [colors, isDark, insets],
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <View style={styles.screen}>
      {/* â”€â”€ Map Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {hasKey ? (
        <View style={styles.mapWrap}>
          <AppMap
            style={StyleSheet.absoluteFill}
            region={{
              latitude: pickupLat || ACCRA_REGION.latitude,
              longitude: pickupLon || ACCRA_REGION.longitude,
              latitudeDelta: 0.018,
              longitudeDelta: 0.018,
            }}
            routeCoordinates={routeCoordinates}
            markers={markers}
            fitToMarkers={matched && markers.length >= 2}
          />
        </View>
      ) : (
        <View style={[styles.mapWrap, { backgroundColor: colors.surface }]} />
      )}

      {/* â”€â”€ Radar Pulse Rings overlay (anchored to map center during search) â”€â”€ */}
      {!matched ? (
        <View style={styles.radarAnchor} pointerEvents="none">
          {Array.from({ length: PULSE_COUNT }).map((_, i) => (
            <PulseRing key={`pulse-${i}`} index={i} delay={200} />
          ))}
        </View>
      ) : null}

      {/* ── Top Header (searching state) ─────────────────────────────────── */}
      {!matched ? (
        <View style={styles.topHeaderPill} pointerEvents="none">
          <Text style={styles.searchingLabel}>
            {isExpired ? "No Riders Nearby" : `Round ${searchRound} of 3 · ${searchRadiusKm.toFixed(1)} km`}
          </Text>
          <Text style={styles.searchingSub}>
            {isExpired ? "Search timed out" : searchStatusMessage}
          </Text>
        </View>
      ) : null}

      {/* ── Match Success Badge (rider found state) ────────────────────────── */}
      {matched ? (
        <Animated.View
          style={[
            styles.matchBadge,
            {
              opacity: matchBadgeAnim,
              transform: [
                {
                  scale: matchBadgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
                {
                  translateY: matchBadgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.matchBadgeText}>Rider Found!</Text>
        </Animated.View>
      ) : null}

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      <View style={styles.sheetWrap}>
        {matched && rider ? (
          /* ─── Rider Found Card ─── */
          <Animated.View
            style={[
              styles.riderSheet,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardSlide }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.foundLabel}>✓ Rider Found</Text>

            {/* Rider header — photo, name, fare */}
            <View style={styles.riderHeader}>
              <Avatar name={rider.name} size={56} imageUri={rider.avatarUrl ?? undefined} />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderMeta}>
                  {rider.completedTrips != null ? `${rider.completedTrips} trips` : "New rider"}
                  {rider.rating != null ? ` · ${(rider.rating as number).toFixed(1)} ★` : ""}
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

            {/* Stats chips — Rating, ETA, Verified */}
            <View style={styles.statsRow}>
              {rider.rating != null ? (
                <View style={styles.statChip}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.statText}>
                    {typeof rider.rating === "number" && Number.isFinite(rider.rating)
                      ? (rider.rating as number).toFixed(1)
                      : "5.0"}
                  </Text>
                </View>
              ) : null}
              <View style={styles.statChip}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.statText}>{etaMinutes} min away</Text>
              </View>
              <View style={styles.statChip}>
                <Shield size={12} color={colors.success} />
                <Text style={styles.statText}>Verified</Text>
              </View>
            </View>

            {/* Vehicle / plate row */}
            {rider.vehicle ? (
              <View style={styles.vehicleRow}>
                <Text style={styles.vehicleLabel}>
                  {[rider.vehicle.color, rider.vehicle.make, rider.vehicle.model]
                    .filter(Boolean)
                    .join(" ") || "Motorcycle"}
                </Text>
                {rider.vehicle.plateNumber ? (
                  <View style={styles.plateChip}>
                    <Text style={styles.plateText}>{rider.vehicle.plateNumber}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Actions — Call + Track Rider */}
            <View style={styles.actionRow}>
              {rider.phoneE164 ? (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${rider.phoneE164}`)}
                  accessibilityLabel="Call rider"
                  accessibilityRole="button"
                >
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.callBtnText}>Call</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={styles.continueBtn}
                onPress={() => onMatched(trip!)}
                accessibilityLabel="Track your rider"
                accessibilityRole="button"
              >
                <Text style={styles.continueBtnText}>Track Rider</Text>
              </Pressable>
            </View>

            {/* Cancel ride */}
            <Pressable
              style={styles.riderCancelBtn}
              onPress={onCancel}
              accessibilityLabel="Cancel ride"
              accessibilityRole="button"
            >
              <X size={14} color={colors.textMuted} />
              <Text style={styles.riderCancelText}>Cancel Ride</Text>
            </Pressable>
          </Animated.View>
        ) : isExpired ? (
          /* ─── Expired / No Riders Sheet ─── */
          <View style={styles.expiredSheet}>
            <View style={styles.sheetHandle} />
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={styles.expiredIconWrap}>
                <AlertCircle size={30} color={colors.warning ?? "#EAB308"} />
              </View>
              <Text style={styles.expiredTitle}>No Okada Available Nearby</Text>
              <Text style={styles.expiredSub}>
                All riders within {searchRadiusKm.toFixed(1)} km are currently busy or offline. Please wait a moment and try again.
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.retryBtn}
                onPress={handleRetry}
                disabled={isRetrying}
                accessibilityRole="button"
                accessibilityLabel="Try search again"
              >
                {isRetrying ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <RefreshCw size={16} color="#000000" />
                    <Text style={styles.retryBtnText}>Try Again</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={styles.cancelFullBtn}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel request"
              >
                <X size={14} color={colors.textSecondary} />
                <Text style={styles.cancelFullBtnText}>Cancel Request</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ─── Searching Sheet ─── */
          <View style={styles.searchSheet}>
            <View style={styles.sheetHandle} />

            {/* Title row with animated dots + escalation radius badge + cancel X */}
            <View style={styles.sheetTitleRow}>
              <SearchingDots />
              <Text style={styles.searchTitle}>Finding your rider…</Text>
              <View style={styles.escalationBadge}>
                <Text style={styles.escalationBadgeText}>
                  {searchRadiusKm.toFixed(1)} km
                </Text>
              </View>
              <Pressable
                style={styles.cancelIconBtn}
                onPress={onCancel}
                hitSlop={10}
                accessibilityLabel="Cancel ride request"
                accessibilityRole="button"
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Sub-info: searchStatusMessage + rider count badge */}
            <View style={styles.searchSubRow}>
              <Text style={styles.searchSubText} numberOfLines={1}>
                {searchStatusMessage}
              </Text>
              {nearbyCount > 0 ? (
                <View style={styles.nearbyBadge}>
                  <Text style={styles.nearbyBadgeText}>{nearbyCount} nearby</Text>
                </View>
              ) : (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>

            {/* Destination / fare */}
            {(fare || destinationAddress) ? (
              <>
                <View style={styles.divider} />
                <View style={styles.destRow}>
                  {destinationAddress ? (
                    <>
                      <View style={styles.destDot} />
                      <Text style={styles.destText} numberOfLines={1}>
                        {destinationAddress}
                      </Text>
                    </>
                  ) : null}
                  {fare ? (
                    <View style={styles.farePill}>
                      <Text style={styles.fareText}>{fare}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            {/* Cancel Request button */}
            <Pressable
              style={styles.cancelFullBtn}
              onPress={onCancel}
              accessibilityLabel="Cancel ride request"
              accessibilityRole="button"
            >
              <X size={14} color={colors.textSecondary} />
              <Text style={styles.cancelFullBtnText}>Cancel Request</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
