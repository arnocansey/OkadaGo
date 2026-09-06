import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  Shield,
  Star,
  User,
  X,
  Zap,
  Zap as ZapIcon,
} from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { api, money } from "@/lib/api";
import { requestAlarm } from "@/lib/alarm";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  haversineDistance,
  estimateTravelTimeMinutes,
  formatDistance,
  formatDuration,
} from "@/lib/geo";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancellationReasonModal } from "@/components/ui/CancellationReasonModal";
import { brand } from "@/theme/design-system";

export default function RequestScreen() {
  const { id, kind, offerId, expiresIn } = useLocalSearchParams<{
    id: string;
    kind?: string;
    offerId?: string;
    expiresIn?: string;
  }>();
  const { session, rides, deliveries, refresh, dismissRequest } = useApp();
  const { colors, isDark } = useTheme();
  const { latitude: riderLat, longitude: riderLng } = useUserLocation();
  const [acting, setActing] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const isRide = kind === "ride";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);

  // 10–15 second countdown timer
  const initialSeconds = Math.max(5, Math.min(20, Number(expiresIn) || 12));
  const [countdown, setCountdown] = useState(initialSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestAlarm.start();
    const animation = Animated.timing(progressAnim, {
      toValue: 0,
      duration: initialSeconds * 1000,
      useNativeDriver: false,
    });
    animation.start();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          requestAlarm.stop();
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      animation.stop();
      requestAlarm.stop();
    };
  }, [initialSeconds, progressAnim]);

  useEffect(() => {
    if (trip && (trip.status ?? "").toLowerCase() === "cancelled") {
      requestAlarm.stop();
      if (trip.id) dismissRequest(trip.id);
      Alert.alert("Request cancelled", "The passenger has cancelled this request.");
      router.back();
    }
  }, [trip?.status, trip?.id, dismissRequest]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide
      ? markersForRide(trip as (typeof rides)[0], colors)
      : markersForDelivery(trip as (typeof deliveries)[0], colors);
  }, [trip, isRide, colors, rides, deliveries]);

  // Calculate distance and ETA from rider to pickup
  const pickupDistance = useMemo(() => {
    if (!trip || !riderLat || !riderLng) return null;
    const pickupLat = isRide
      ? (trip as (typeof rides)[0]).pickupLatitude
      : (trip as (typeof deliveries)[0]).pickupLatitude;
    const pickupLng = isRide
      ? (trip as (typeof rides)[0]).pickupLongitude
      : (trip as (typeof deliveries)[0]).pickupLongitude;
    if (!pickupLat || !pickupLng) return null;

    const dist = haversineDistance(
      { latitude: riderLat, longitude: riderLng },
      { latitude: Number(pickupLat), longitude: Number(pickupLng) },
    );
    return {
      km: dist,
      eta: estimateTravelTimeMinutes(dist),
    };
  }, [trip, riderLat, riderLng, isRide]);

  async function accept() {
    if (!trip || !session || acting) return;
    requestAlarm.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActing(true);
    try {
      if (isRide && offerId) {
        await api(`/rides/offers/${offerId}/accept`, {
          method: "POST",
          token: session.token,
          body: { riderProfileId: session.user.riderProfileId },
        });
      } else if (isRide) {
        const nextStatus = "arriving";
        await api(`/rides/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: { nextStatus, actorRole: "rider", actorUserId: session.user.id },
        });
      } else {
        const nextStatus = "assigned";
        await api(`/deliveries/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: { nextStatus, actorRole: "rider", actorUserId: session.user.id },
        });
      }
      await refresh();
      router.replace({ pathname: "/trip/[id]", params: { id: trip.id, kind: isRide ? "ride" : "delivery" } });
    } catch (e) {
      Alert.alert("Accept failed", e instanceof Error ? e.message : "Could not accept request.");
      router.back();
    } finally {
      setActing(false);
    }
  }

  async function decline(reason?: string) {
    requestAlarm.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!trip || !session) return router.back();
    if (acting) return;
    setActing(true);
    try {
      dismissRequest(trip.id);
      if (isRide && offerId) {
        await api(`/rides/offers/${offerId}/reject`, {
          method: "POST",
          token: session.token,
          body: {
            riderProfileId: session.user.riderProfileId,
            reason: reason ?? "DECLINED_BY_RIDER",
          },
        });
      } else {
        const endpoint = isRide ? `/rides/${trip.id}/status` : `/deliveries/${trip.id}/status`;
        await api(endpoint, {
          method: "PATCH",
          token: session.token,
          body: {
            nextStatus: "cancelled",
            actorRole: "rider",
            actorUserId: session.user.id,
            cancellationReason: reason,
          },
        });
      }
      await refresh();
    } finally {
      setShowDeclineModal(false);
      router.back();
    }
  }

  if (!trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState title="Request expired" message="This request is no longer available." />
      </SafeAreaView>
    );
  }

  const pickup = isRide ? (trip as typeof rides[0]).pickupAddress : (trip as typeof deliveries[0]).pickupAddress;
  const dropoff = isRide ? (trip as typeof rides[0]).destinationAddress : (trip as typeof deliveries[0]).dropoffAddress;
  const fare = isRide
    ? (trip as typeof rides[0]).estimatedFare
    : (trip as typeof deliveries[0]).estimatedFee;

  const estMins = trip.estimatedDurationMinutes ? Math.round(Number(trip.estimatedDurationMinutes)) : 6;
  const estKm = trip.estimatedDistanceKm ? Number(trip.estimatedDistanceKm).toFixed(1) : "2.4";
  const currency = trip.currency ?? "GH₵";

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? "#0A0D14" : "#F3F4F6",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? "#111827" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB",
    },
    declineBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
    },
    declineText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#EF4444",
    },
    timerCapsule: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: countdown <= 5 ? "#EF4444" : brand.primary,
    },
    timerText: {
      fontSize: 13,
      fontWeight: "900",
      color: "#000000",
    },
    progressTrack: {
      height: 5,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB",
    },
    progressBar: {
      height: 5,
      backgroundColor: countdown <= 5 ? "#EF4444" : brand.primary,
    },
    contentScroll: {
      padding: 16,
      gap: 12,
    },

    /* ─── New Ride Request Header ────────────────────────────── */
    requestHeader: {
      backgroundColor: isDark ? "#1A1200" : "#FFF8E1",
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1.5,
      borderColor: brand.primary,
    },
    requestHeaderPulse: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: brand.accent,
    },
    requestHeaderText: {
      flex: 1,
    },
    requestHeaderTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: brand.accent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    requestHeaderSub: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 2,
    },

    /* ─── Hero Earnings Card (Uber Driver Style) ─────────────── */
    earningsHero: {
      backgroundColor: isDark ? "#161D2F" : "#FFFFFF",
      borderRadius: 24,
      padding: 20,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: brand.primary,
      shadowColor: brand.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
      gap: 4,
    },
    earningsLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#6B7280",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    earningsAmount: {
      fontSize: 38,
      fontWeight: "900",
      color: brand.primary,
      letterSpacing: -0.5,
    },
    earningsSub: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#E5E7EB" : "#374151",
    },

    /* ─── Trip Meta Row ──────────────────────────────────────── */
    metaRow: {
      flexDirection: "row",
      gap: 8,
    },
    metaChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      backgroundColor: isDark ? "#161D2F" : "#FFFFFF",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB",
    },
    metaChipText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },

    /* ─── Pickup Distance Card ─────────────────────────────── */
    pickupDistCard: {
      backgroundColor: isDark ? "#161D2F" : "#FFFFFF",
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: brand.accent + "40",
    },
    pickupDistIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: brand.accent + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    pickupDistInfo: {
      flex: 1,
    },
    pickupDistLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#6B7280",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    pickupDistValue: {
      fontSize: 16,
      fontWeight: "800",
      color: brand.accent,
      marginTop: 1,
    },

    /* ─── Route Card ─────────────────────────────────────────── */
    routeCard: {
      backgroundColor: isDark ? "#161D2F" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB",
      gap: 14,
    },
    routeStep: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    dotPickup: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: brand.primary,
      marginTop: 4,
    },
    dotDropoff: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#EF4444",
      marginTop: 4,
    },
    routeStepContent: {
      flex: 1,
      gap: 2,
    },
    routeStepLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#6B7280",
      textTransform: "uppercase",
    },
    routeStepAddress: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 18,
    },
    routeDivider: {
      height: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB",
      marginLeft: 24,
    },

    /* ─── Bottom Accept Action (Huge Touch Surface) ──────────── */
    acceptBtn: {
      height: 64,
      borderRadius: 20,
      backgroundColor: brand.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      shadowColor: brand.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
      marginTop: 6,
    },
    acceptBtnDisabled: {
      opacity: 0.6,
    },
    acceptBtnText: {
      fontSize: 18,
      fontWeight: "900",
      color: "#000000",
      letterSpacing: 0.3,
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
        {/* ─── Top Bar with Countdown & Decline ──────────────── */}
        <View style={s.topBar}>
          <Pressable
            style={s.declineBtn}
            onPress={() => setShowDeclineModal(true)}
            accessibilityRole="button"
          >
            <X size={16} color="#EF4444" />
            <Text style={s.declineText}>Decline</Text>
          </Pressable>

          <View style={s.timerCapsule}>
            <Clock size={14} color="#000000" />
            <Text style={s.timerText}>{countdown}s left</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressTrack}>
          <Animated.View
            style={[
              s.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* ─── Route Map Preview ─────────────────────────────── */}
        <AppMap style={{ height: 160 }} markers={markers} fitToMarkers />

        <ScrollView contentContainerStyle={s.contentScroll} showsVerticalScrollIndicator={false}>
          {/* ─── New Ride Request Header ────────────────────── */}
          <View style={s.requestHeader}>
            <View style={s.requestHeaderPulse} />
            <View style={s.requestHeaderText}>
              <Text style={s.requestHeaderTitle}>New Ride Request</Text>
              <Text style={s.requestHeaderSub}>
                {isRide ? "Passenger needs a ride" : "Package delivery request"} — Tap to accept
              </Text>
            </View>
            <View style={s.timerCapsule}>
              <Clock size={12} color="#000000" />
              <Text style={[s.timerText, { fontSize: 12 }]}>{countdown}s</Text>
            </View>
          </View>

          {/* ─── Pickup Distance Card ──────────────────────── */}
          {pickupDistance && (
            <View style={s.pickupDistCard}>
              <View style={s.pickupDistIcon}>
                <Navigation size={18} color={brand.accent} />
              </View>
              <View style={s.pickupDistInfo}>
                <Text style={s.pickupDistLabel}>Distance to Pickup</Text>
                <Text style={s.pickupDistValue}>
                  {formatDistance(pickupDistance.km)} away · ~{formatDuration(pickupDistance.eta)} ride
                </Text>
              </View>
            </View>
          )}

          {/* ─── Hero Guaranteed Net Earnings ───────────────── */}
          <View style={s.earningsHero}>
            <Text style={s.earningsLabel}>Guaranteed Net Earnings</Text>
            <Text style={s.earningsAmount}>
              {fare ? money(fare, currency) : `${currency} 15.00`}
            </Text>
            <Text style={s.earningsSub}>
              {isRide ? "🏍️ OkadaGo Passenger Trip" : "📦 Express Package Delivery"}
            </Text>
          </View>

          {/* ─── Trip Meta Pills ────────────────────────────── */}
          <View style={s.metaRow}>
            <View style={s.metaChip}>
              <Navigation size={14} color={brand.primary} />
              <Text style={s.metaChipText}>{estKm} km total</Text>
            </View>
            <View style={s.metaChip}>
              <Clock size={14} color={brand.primary} />
              <Text style={s.metaChipText}>~{estMins} min trip</Text>
            </View>
            <View style={s.metaChip}>
              <Star size={14} color="#FBBF24" />
              <Text style={s.metaChipText}>4.9 ★</Text>
            </View>
          </View>

          {/* ─── Route Details ──────────────────────────────── */}
          <View style={s.routeCard}>
            <View style={s.routeStep}>
              <View style={s.dotPickup} />
              <View style={s.routeStepContent}>
                <Text style={s.routeStepLabel}>Pickup Location</Text>
                <Text style={s.routeStepAddress} numberOfLines={2}>
                  {pickup || "Accra Central"}
                </Text>
              </View>
            </View>

            <View style={s.routeDivider} />

            <View style={s.routeStep}>
              <View style={s.dotDropoff} />
              <View style={s.routeStepContent}>
                <Text style={s.routeStepLabel}>Drop-off Location</Text>
                <Text style={s.routeStepAddress} numberOfLines={2}>
                  {dropoff || "Destination"}
                </Text>
              </View>
            </View>
          </View>

          {/* ─── Giant Glove-Friendly Accept Button ─────────── */}
          <Pressable
            style={[s.acceptBtn, acting && s.acceptBtnDisabled]}
            onPress={accept}
            disabled={acting}
            accessibilityRole="button"
          >
            {acting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Text style={s.acceptBtnText}>
                  TAP TO ACCEPT • {fare ? money(fare, currency) : `${currency} 15.00`}
                </Text>
                <ArrowRight size={22} color="#000000" />
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <CancellationReasonModal
        visible={showDeclineModal}
        tripType={isRide ? "ride" : "delivery"}
        loading={acting}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={async (reason) => {
          await decline(reason);
        }}
      />
    </>
  );
}
