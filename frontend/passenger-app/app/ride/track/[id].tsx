import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone } from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { TripTimeline, stepIndexForStatus, RIDE_STEPS, DELIVERY_STEPS } from "@/components/TripTimeline";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/context/AppContext";
import { api, money } from "@/lib/api";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { colors, spacing, typography, stackHeaderOptions } from "@/theme/tokens";

const ACTIVE_STATUSES = ["searching", "arriving", "arrived", "started", "assigned", "picked_up", "in_transit"];

export default function TrackScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const isRide = kind !== "delivery";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live polling — refresh every 8 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => refresh(), 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide ? markersForRide(trip as (typeof rides)[0]) : markersForDelivery(trip as (typeof deliveries)[0]);
  }, [trip, isRide]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState title="Trip not found" message="This trip may have been completed or cancelled." />
      </SafeAreaView>
    );
  }

  const status = trip.status ?? "searching";
  const steps = isRide ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIndex = stepIndexForStatus(status, isRide ? "ride" : "delivery");
  const canCancel = ACTIVE_STATUSES.slice(0, 2).includes(status.toLowerCase()); // searching, arriving
  const riderPhone = (trip.rider?.user as { phoneE164?: string } | undefined)?.phoneE164;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Track trip",
          ...stackHeaderOptions,
        }}
      />
      <View style={styles.screen}>
        {/* Proportional map — 35% of screen */}
        <AppMap style={styles.map} markers={markers} fitToMarkers />

        <ScrollView contentContainerStyle={styles.body}>
          {/* Status + fare row */}
          <View style={styles.header}>
            <Badge label={status.replace(/_/g, " ")} tone={statusTone(status)} />
            <Text style={styles.fare}>
              {money(
                isRide
                  ? (trip as (typeof rides)[0]).finalFare ?? (trip as (typeof rides)[0]).estimatedFare
                  : (trip as (typeof deliveries)[0]).finalFee ?? (trip as (typeof deliveries)[0]).estimatedFee,
                trip.currency,
              )}
            </Text>
          </View>

          {/* Addresses */}
          <Card>
            <Text style={styles.label}>From</Text>
            <Text style={styles.address}>
              {isRide ? (trip as (typeof rides)[0]).pickupAddress : (trip as (typeof deliveries)[0]).pickupAddress}
            </Text>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>To</Text>
            <Text style={styles.address}>
              {isRide ? (trip as (typeof rides)[0]).destinationAddress : (trip as (typeof deliveries)[0]).dropoffAddress}
            </Text>
          </Card>

          {/* Timeline */}
          <Card>
            <Text style={styles.section}>Timeline</Text>
            <TripTimeline steps={steps} currentIndex={currentIndex} />
          </Card>

          {/* Rider card with call button */}
          {trip.rider?.user?.fullName ? (
            <Card>
              <View style={styles.riderRow}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderInitial}>{trip.rider.user.fullName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Your rider</Text>
                  <Text style={styles.riderName}>{trip.rider.user.fullName}</Text>
                  {trip.rider.vehicle?.plateNumber ? (
                    <Text style={styles.plate}>{trip.rider.vehicle.plateNumber}</Text>
                  ) : null}
                </View>
                {riderPhone ? (
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${riderPhone}`)}
                  >
                    <Phone size={18} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : null}

          {/* Cancel button for early-stage rides */}
          {canCancel ? (
            <Button
              label="Cancel ride"
              variant="danger"
              loading={cancelling}
              fullWidth
              onPress={async () => {
                if (!session) return;
                setCancelling(true);
                try {
                  const endpoint = isRide ? `/rides/${trip.id}/status` : `/deliveries/${trip.id}/status`;
                  await api(endpoint, {
                    method: "PATCH",
                    token: session.token,
                    body: { nextStatus: "cancelled", actorRole: "passenger", actorUserId: session.user.id },
                  });
                  await refresh();
                } catch {
                  // silently fail
                } finally {
                  setCancelling(false);
                }
              }}
            />
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  map: { height: "35%" as unknown as number },
  body: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fare: { ...typography.h3, color: colors.text },
  label: { ...typography.caption, color: colors.textMuted },
  address: { ...typography.bodySemibold, marginTop: 4, color: colors.text },
  section: { ...typography.h3, marginBottom: spacing.lg, color: colors.text },
  riderRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  riderInitial: { ...typography.bodySemibold, color: colors.primary },
  riderName: { ...typography.bodySemibold, marginTop: 2, color: colors.text },
  plate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
