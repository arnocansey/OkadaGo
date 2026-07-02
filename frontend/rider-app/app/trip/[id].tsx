import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone } from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { TripTimeline, stepIndexForStatus, RIDE_STEPS, DELIVERY_STEPS } from "@/components/TripTimeline";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api, nextDeliveryStatus, nextRideStatus, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { colors, radius, spacing, typography, stackHeaderOptions } from "@/theme/tokens";

const ACTION_LABELS: Record<string, string> = {
  arriving: "Head to pickup",
  arrived: "Arrived at pickup",
  started: "Start trip",
  completed: "Complete trip",
  picked_up: "Package picked up",
  in_transit: "Start delivery",
  delivered: "Mark delivered",
};

export default function TripScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const [loading, setLoading] = useState(false);
  const isRide = kind !== "delivery";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live refresh every 10s
  useEffect(() => {
    intervalRef.current = setInterval(() => refresh(), 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide ? markersForRide(trip as (typeof rides)[0]) : markersForDelivery(trip as (typeof deliveries)[0]);
  }, [trip, isRide]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.notFound}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  const status = trip.status ?? "assigned";
  const nextStatus = isRide ? nextRideStatus(status) : nextDeliveryStatus(status);
  const steps = isRide ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIndex = stepIndexForStatus(status, isRide ? "ride" : "delivery");
  const passengerPhone = trip.passenger?.user?.phoneE164;

  async function advance() {
    if (!trip || !nextStatus || !session) return;
    setLoading(true);
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
      if (nextStatus === "completed" || nextStatus === "delivered") router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Active trip",
          ...stackHeaderOptions,
        }}
      />
      <View style={styles.screen}>
        {/* Proportional 35% map */}
        <AppMap style={styles.map} markers={markers} fitToMarkers />

        <ScrollView contentContainerStyle={styles.body}>
          {/* Status + earnings */}
          <View style={styles.header}>
            <Badge label={status.replace(/_/g, " ")} tone={statusTone(status)} />
            <Text style={styles.fare}>
              {money(
                isRide
                  ? (trip as typeof rides[0]).riderEarnings ?? (trip as typeof rides[0]).estimatedFare
                  : (trip as typeof deliveries[0]).riderEarnings ?? (trip as typeof deliveries[0]).estimatedFee,
                trip.currency,
              )}
            </Text>
          </View>

          {/* Passenger card with call button */}
          <Card>
            <View style={styles.passengerRow}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.passengerInitial}>
                  {(trip.passenger?.user?.fullName ?? "P")[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passengerLabel}>Passenger</Text>
                <Text style={styles.passengerName}>{trip.passenger?.user?.fullName ?? "Passenger"}</Text>
                {trip.passenger?.user?.phoneE164 ? (
                  <Text style={styles.passengerPhone}>{trip.passenger.user.phoneE164}</Text>
                ) : null}
              </View>
              {passengerPhone ? (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${passengerPhone}`)}
                >
                  <Phone size={18} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          </Card>

          {/* Timeline */}
          <Card>
            <Text style={styles.section}>Progress</Text>
            <TripTimeline steps={steps} currentIndex={currentIndex} />
          </Card>

          {nextStatus ? (
            <Button
              label={ACTION_LABELS[nextStatus] ?? `Update to ${nextStatus}`}
              variant="accent"
              loading={loading}
              onPress={advance}
              fullWidth
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
  notFound: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fare: { ...typography.h3, color: colors.text },

  passengerRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  passengerInitial: { ...typography.bodySemibold, color: colors.primary },
  passengerLabel: { ...typography.caption, color: colors.textMuted },
  passengerName: { ...typography.bodySemibold, marginTop: 2, color: colors.text },
  passengerPhone: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  section: { ...typography.h3, marginBottom: spacing.lg, color: colors.text },
});
