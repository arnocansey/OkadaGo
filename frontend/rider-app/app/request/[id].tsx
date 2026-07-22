import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppMap } from "@/components/AppMap";
import { api, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, spacing } from "@/theme/tokens";

export default function RequestScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
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
    const animation = Animated.timing(progressAnim, {
      toValue: 0,
      duration: 20000,
      useNativeDriver: false,
    });
    animation.start();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      animation.stop();
    };
  }, []);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide ? markersForRide(trip as (typeof rides)[0]) : markersForDelivery(trip as (typeof deliveries)[0]);
  }, [trip, isRide]);

  async function accept() {
    if (!trip || !session) return;
    const nextStatus = isRide ? "arriving" : "assigned";
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
    }
  }

  async function decline() {
    if (!trip || !session) return router.back();
    try {
      if (isRide) {
        await api(`/rides/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: { nextStatus: "cancelled", actorRole: "rider", actorUserId: session.user.id },
        });
      } else {
        await api(`/deliveries/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: { nextStatus: "cancelled", actorRole: "rider", actorUserId: session.user.id },
        });
      }
      await refresh();
    } finally {
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
            <Text style={styles.timerLabel}>Auto-declines in {countdown} seconds</Text>
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
            <Button label="Decline" variant="outline" onPress={decline} fullWidth />
            <Button label="Accept" variant="accent" onPress={accept} fullWidth />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
