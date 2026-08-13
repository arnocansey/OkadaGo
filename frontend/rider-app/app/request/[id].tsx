import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppMap } from "@/components/AppMap";
import { api, money } from "@/lib/api";
import { requestAlarm } from "@/lib/alarm";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SlideToAccept } from "@/components/ui/SlideToAccept";
import { EmptyState } from "@/components/ui/EmptyState";
import { CancellationReasonModal } from "@/components/ui/CancellationReasonModal";
import { radius, spacing } from "@/theme/tokens";

export default function RequestScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh, dismissRequest } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const [acting, setActing] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        body: { padding: spacing.xl, gap: spacing.lg },
        progressTrack: { height: 4, backgroundColor: colors.surface },
        progressBar: { height: 4, backgroundColor: colors.accent },
        headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
        kicker: { ...typography.label, color: colors.textMuted },
        title: { ...typography.h1, marginTop: spacing.xs, color: colors.text },
        farePill: {
          backgroundColor: colors.primary,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          alignSelf: "flex-start",
          marginTop: spacing.xs,
        },
        fareText: { ...typography.bodySemibold, color: colors.textOnPrimary },
        timerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
        timerLabel: { ...typography.caption, color: colors.textMuted },
        routeCard: {
          flexDirection: "row",
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        routeLine: { alignItems: "center", paddingTop: spacing.xs, gap: 0 },
        dot: { width: 12, height: 12, borderRadius: 6 },
        dotStart: { backgroundColor: colors.primary },
        dotEnd: { backgroundColor: colors.danger },
        connector: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 32, marginVertical: spacing.xs },
        routeLabels: { flex: 1, justifyContent: "space-between", gap: spacing.lg },
        routeItem: {},
        routeItemEnd: {},
        routeLabel: { ...typography.caption, color: colors.textMuted },
        routeAddress: { ...typography.bodySemibold, marginTop: spacing.xs, color: colors.text },
        actions: { gap: spacing.md },
      }),
    [colors, typography],
  );
  const isRide = kind === "ride";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);

  // Countdown timer — 20 seconds to decide
  const [countdown, setCountdown] = useState(20);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestAlarm.start();
    const animation = Animated.timing(progressAnim, {
      toValue: 0,
      duration: 20000,
      useNativeDriver: false,
    });
    requestAlarm.start();
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
  }, []);

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

  async function accept() {
    if (!trip || !session || acting) return;
    requestAlarm.stop();
    const nextStatus = isRide ? "arriving" : "assigned";
    setActing(true);
    try {
      if (isRide) {
        await api(`/rides/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: { nextStatus, actorRole: "rider", actorUserId: session.user.id },
        });
      } else {
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
    if (!trip || !session) return router.back();
    if (acting) return;
    setActing(true);
    try {
      dismissRequest(trip.id);
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
      await refresh();
    } finally {
      setShowDeclineModal(false);
      router.back();
    }
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState title="Request expired" message="This request is no longer available." />
      </SafeAreaView>
    );
  }

  const pickup = isRide ? (trip as typeof rides[0]).pickupAddress : (trip as typeof deliveries[0]).pickupAddress;
  const dropoff = isRide ? (trip as typeof rides[0]).destinationAddress : (trip as typeof deliveries[0]).dropoffAddress;
  const fare = isRide
    ? (trip as typeof rides[0]).estimatedFare
    : (trip as typeof deliveries[0]).estimatedFee;

  const estMins = trip.estimatedDurationMinutes ? Math.round(Number(trip.estimatedDurationMinutes)) : 5;
  const estKm = trip.estimatedDistanceKm ? Number(trip.estimatedDistanceKm).toFixed(1) : null;
  const rawRideType = isRide ? (trip as typeof rides[0]).rideType : (trip as typeof deliveries[0]).packageType;
  const rideTypeLabel = rawRideType
    ? rawRideType.toUpperCase() === "STANDARD"
      ? "Standard Okada"
      : rawRideType.toUpperCase() === "EXPRESS"
        ? "Express Okada"
        : rawRideType.toUpperCase() === "COMFORT" || rawRideType.toUpperCase() === "VIP"
          ? "Okada Comfort"
          : rawRideType
    : isRide
      ? "Standard Okada"
      : "Parcel Delivery";

  return (
    <>
      <Stack.Screen options={{ presentation: "modal", title: "New request", headerShown: true, ...stackHeaderOptions }} />
      <View style={styles.screen}>
        <AppMap style={{ height: 200 }} markers={markers} fitToMarkers />

        {/* Countdown progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.body}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>{isRide ? "Ride request" : "Delivery request"}</Text>
              <Text style={styles.title}>Accept this trip?</Text>
            </View>
            {fare ? (
              <View style={styles.farePill}>
                <Text style={styles.fareText}>{money(fare, trip.currency ?? "GHS")}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.timerRow}>
            <Badge label={`${countdown}s`} tone={countdown <= 5 ? "danger" : "warning"} />
            <Badge label={rideTypeLabel} tone="info" />
            <Badge label={`⏱ ~${estMins} mins${estKm ? ` (${estKm} km)` : ""}`} tone="default" />
          </View>

          {/* Route visualization */}
          <View style={styles.routeCard}>
            <View style={styles.routeLine}>
              <View style={[styles.dot, styles.dotStart]} />
              <View style={styles.connector} />
              <View style={[styles.dot, styles.dotEnd]} />
            </View>
            <View style={styles.routeLabels}>
              <View style={styles.routeItem}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{pickup}</Text>
              </View>
              <View style={[styles.routeItem, styles.routeItemEnd]}>
                <Text style={styles.routeLabel}>Drop-off</Text>
                <Text style={styles.routeAddress}>{dropoff}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <SlideToAccept
              onAccept={accept}
              loading={acting}
              disabled={acting}
              label={isRide ? "SLIDE TO ACCEPT RIDE" : "SLIDE TO ACCEPT DELIVERY"}
            />
            <Button label="Decline Request" variant="ghost" disabled={acting} onPress={() => setShowDeclineModal(true)} fullWidth />
          </View>
        </SafeAreaView>
      </View>

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
