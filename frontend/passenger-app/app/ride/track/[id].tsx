import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Phone, ShieldAlert, Share2, Star } from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import {
  TripTimeline,
  stepIndexForStatus,
  RIDE_STEPS,
  DELIVERY_STEPS,
  type StepDetail,
} from "@/components/TripTimeline";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useTripRefresh } from "@/hooks/useTripRefresh";
import { api, money } from "@/lib/api";
import { passengerWs } from "@/lib/websocket";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { spacing } from "@/theme/tokens";

const ACTIVE_STATUSES = ["searching", "arriving", "arrived", "started", "assigned", "picked_up", "in_transit"];

type SafetyOverview = {
  contacts?: Array<{ id: string; name: string; phoneE164: string; isPrimary?: boolean }>;
};

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const RIDE_SUB_LABELS: Record<string, { searching: string; assigned: string; arriving: string; started: string; completed: string }> = {
  searching: { searching: "Looking for nearby riders...", assigned: "", arriving: "", started: "", completed: "" },
  assigned: { searching: "Rider found!", assigned: "Rider is preparing to head your way", arriving: "", started: "", completed: "" },
  arriving: { searching: "", assigned: "", arriving: "Head to your pickup point", started: "", completed: "" },
  started: { searching: "", assigned: "", arriving: "", started: "Enjoy the ride!", completed: "" },
  completed: { searching: "", assigned: "", arriving: "", started: "Trip finished", completed: "Thank you for riding with OkadaGo" },
};

const DELIVERY_SUB_LABELS: Record<string, Record<string, string>> = {
  searching: { searching: "Looking for a courier nearby...", assigned: "", picked_up: "", in_transit: "", delivered: "" },
  assigned: { searching: "Courier found!", assigned: "Courier is heading to pickup", picked_up: "", in_transit: "", delivered: "" },
  picked_up: { searching: "", assigned: "", picked_up: "Package collected, heading your way", in_transit: "", delivered: "" },
  in_transit: { searching: "", assigned: "", picked_up: "", in_transit: "Courier is on the way", delivered: "" },
  delivered: { searching: "", assigned: "", picked_up: "", in_transit: "", delivered: "Package delivered successfully" },
};

export default function TrackScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const prevIndexRef = useRef<number>(-1);
  const [stepTimestamps, setStepTimestamps] = useState<Record<number, string>>({});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        map: { height: "35%" as unknown as number },
        body: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        fare: { ...typography.h3, color: colors.text },
        label: { ...typography.caption, color: colors.textMuted },
        address: { ...typography.bodySemibold, marginTop: 4, color: colors.text },
        section: { ...typography.h3, color: colors.text },
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
        safetyRow: { flexDirection: "row", gap: spacing.sm },
        safetyBtn: { flex: 1 },
        stars: { flexDirection: "row", gap: spacing.sm },
        starBtn: { padding: spacing.xs },
        wsStatus: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
        expandRiderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
        expandRiderAvatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.primary,
        },
        expandRiderInitial: { ...typography.bodyMedium, color: colors.primary },
        expandRiderName: { ...typography.bodyMedium, color: colors.text },
        expandRiderPlate: { ...typography.caption, color: colors.textSecondary },
      }),
    [colors, typography],
  );

  const isRide = kind !== "delivery";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyContacts, setSafetyContacts] = useState<SafetyOverview["contacts"]>([]);

  useTripRefresh(refresh, passengerWs, 8000);

  useEffect(() => {
    if (!session?.token) return;
    api<SafetyOverview>("/safety/overview", { token: session.token })
      .then((overview) => setSafetyContacts(overview.contacts ?? []))
      .catch(() => setSafetyContacts([]));
  }, [session?.token]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide ? markersForRide(trip as (typeof rides)[0]) : markersForDelivery(trip as (typeof deliveries)[0]);
  }, [trip, isRide]);

  const status = trip?.status ?? "searching";
  const isActiveTrip = ACTIVE_STATUSES.includes(status.toLowerCase());
  const rideTrip = isRide && trip ? (trip as (typeof rides)[0]) : null;
  const riderLat = Number(trip?.rider?.currentLatitude ?? rideTrip?.pickupLatitude ?? 0);
  const riderLon = Number(trip?.rider?.currentLongitude ?? rideTrip?.pickupLongitude ?? 0);
  const destLat = Number(
    rideTrip?.destinationLatitude ?? (trip && !isRide ? (trip as (typeof deliveries)[0]).dropoffLatitude : 0) ?? 0,
  );
  const destLon = Number(
    rideTrip?.destinationLongitude ?? (trip && !isRide ? (trip as (typeof deliveries)[0]).dropoffLongitude : 0) ?? 0,
  );
  const livePreview = useLiveRoutePreview(
    session?.token,
    riderLat && riderLon ? { latitude: riderLat, longitude: riderLon } : null,
    destLat && destLon ? { latitude: destLat, longitude: destLon } : null,
    Boolean(trip) && isActiveTrip && Boolean(trip?.rider),
  );

  const steps = isRide ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIndex = stepIndexForStatus(status, isRide ? "ride" : "delivery");

  useEffect(() => {
    if (prevIndexRef.current === -1) {
      prevIndexRef.current = currentIndex;
      return;
    }
    if (currentIndex > prevIndexRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStepTimestamps((prev) => ({
        ...prev,
        [currentIndex]: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }));
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  const subLabels = isRide ? RIDE_SUB_LABELS : DELIVERY_SUB_LABELS;
  const currentStatusKey = status.toLowerCase();

  const stepDetails: StepDetail[] = useMemo(() => {
    const riderName = trip?.rider?.user?.fullName;
    const plateNumber = isRide
      ? (trip as (typeof rides)[0])?.rider?.vehicle?.plateNumber
      : (trip as (typeof deliveries)[0])?.rider?.vehicle?.plateNumber;
    const createdAt = trip?.createdAt;
    const completedAt = isRide
      ? (trip as (typeof rides)[0])?.completedAt
      : (trip as (typeof deliveries)[0])?.completedAt;

    return steps.map((step, index) => {
      const done = index < currentIndex;
      const active = index === currentIndex;
      const statusMap = subLabels[currentStatusKey] ?? subLabels.searching ?? {};
      const sub = (statusMap as Record<string, string>)[step.key] ?? "";

      let etaText: string | undefined;
      if (active && livePreview && (step.key === "arriving" || step.key === "started" || step.key === "in_transit")) {
        etaText = `~${Math.round(livePreview.durationMinutes)} min · ${livePreview.distanceKm.toFixed(1)} km`;
      }

      let timestamp: string | undefined;
      if (done) {
        if (index === 0 && createdAt) {
          timestamp = formatTime(createdAt);
        } else if (index === steps.length - 1 && completedAt) {
          timestamp = formatTime(completedAt);
        } else if (stepTimestamps[index]) {
          timestamp = stepTimestamps[index];
        }
      }

      let expandContent: React.ReactNode | undefined;
      if (done || active) {
        if (step.key === "assigned" || step.key === "arriving" || step.key === "started") {
          if (riderName) {
            expandContent = (
              <View>
                <View style={styles.expandRiderRow}>
                  <View style={styles.expandRiderAvatar}>
                    <Text style={styles.expandRiderInitial}>{riderName[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expandRiderName}>{riderName}</Text>
                    {plateNumber ? <Text style={styles.expandRiderPlate}>{plateNumber}</Text> : null}
                  </View>
                  {riderPhone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${riderPhone}`)}>
                      <Phone size={18} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }
        }
        if (step.key === "completed" || step.key === "delivered") {
          expandContent = (
            <View>
              <Text style={[styles.label, { marginBottom: 4 }]}>
                {isRide ? "Trip completed" : "Delivery completed"}
              </Text>
              <Text style={styles.address}>
                {money(
                  isRide
                    ? (trip as (typeof rides)[0])?.finalFare ?? (trip as (typeof rides)[0])?.estimatedFare
                    : (trip as (typeof deliveries)[0])?.finalFee ?? (trip as (typeof deliveries)[0])?.estimatedFee,
                  trip?.currency,
                )}
              </Text>
            </View>
          );
        }
      }

      return { subLabel: sub || undefined, etaText, timestamp, expandContent };
    });
  }, [currentIndex, steps, subLabels, currentStatusKey, livePreview, stepTimestamps, trip, isRide, colors]);

  if (!trip) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Trip not found" message="This trip may have been completed or cancelled." />
      </View>
    );
  }

  const canCancel = ACTIVE_STATUSES.slice(0, 2).includes(status.toLowerCase());
  const canRate = isRide && status.toLowerCase() === "completed";
  const showReceipt = isRide ? status.toLowerCase() === "completed" : status.toLowerCase() === "delivered";
  const riderPhone = (trip.rider?.user as { phoneE164?: string } | undefined)?.phoneE164;
  const pickupAddress = isRide ? (trip as (typeof rides)[0]).pickupAddress : (trip as (typeof deliveries)[0]).pickupAddress;
  const dropoffAddress = isRide ? (trip as (typeof rides)[0]).destinationAddress : (trip as (typeof deliveries)[0]).dropoffAddress;

  async function reportSos() {
    if (!session) return;
    setSafetyLoading(true);
    try {
      await api("/safety/incidents", {
        method: "POST",
        token: session.token,
        body: {
          rideId: isRide ? trip!.id : undefined,
          severity: "CRITICAL",
          category: "SOS",
          description: `Passenger SOS during ${isRide ? "ride" : "delivery"} ${trip!.id}`,
        },
      });
      Alert.alert("SOS sent", "Our safety team has been notified.");
    } catch (e) {
      Alert.alert("SOS failed", e instanceof Error ? e.message : "Could not send SOS.");
    } finally {
      setSafetyLoading(false);
    }
  }

  async function shareTrip() {
    if (!session || !isRide) return;
    setSafetyLoading(true);
    try {
      const result = await api<{ shareUrl?: string; message?: string }>("/safety/share-trip", {
        method: "POST",
        token: session.token,
        body: {
          rideId: trip!.id,
          mode: "START",
          channel: "LINK",
          note: `Track my OkadaGo trip from ${pickupAddress} to ${dropoffAddress}`,
        },
      });
      const message = result.message ?? result.shareUrl ?? `Track my trip: ${pickupAddress} → ${dropoffAddress}`;
      await Share.share({ message });
    } catch (e) {
      Alert.alert("Share failed", e instanceof Error ? e.message : "Could not share trip.");
    } finally {
      setSafetyLoading(false);
    }
  }

  async function callEmergencyContact() {
    const primary = safetyContacts?.find((contact) => contact.isPrimary) ?? safetyContacts?.[0];
    if (!primary) {
      Alert.alert("No emergency contact", "Add a safety contact in your profile settings on the web app.");
      return;
    }
    await Linking.openURL(`tel:${primary.phoneE164}`);
  }

  async function submitRating() {
    if (!session || !isRide) return;
    setRatingLoading(true);
    try {
      await api(`/ratings/rides/${trip!.id}`, {
        method: "POST",
        token: session.token,
        body: { score: rating, review: review.trim() || undefined },
      });
      Alert.alert("Thanks!", "Your rating was submitted.");
      await refresh();
    } catch (e) {
      Alert.alert("Rating failed", e instanceof Error ? e.message : "Could not submit rating.");
    } finally {
      setRatingLoading(false);
    }
  }

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
        <AppMap style={styles.map} markers={markers} fitToMarkers />

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.wsStatus}>
            {passengerWs.isConnected() ? "Live updates connected" : "Polling for updates"}
            {livePreview ? ` · ETA ~${Math.round(livePreview.durationMinutes)} min (${livePreview.distanceKm.toFixed(1)} km)` : ""}
          </Text>

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

          <Card>
            <Text style={styles.label}>From</Text>
            <Text style={styles.address}>{pickupAddress}</Text>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>To</Text>
            <Text style={styles.address}>{dropoffAddress}</Text>
          </Card>

          <Card>
            <Text style={styles.section}>Timeline</Text>
            <TripTimeline steps={steps} currentIndex={currentIndex} stepDetails={stepDetails} />
          </Card>

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
                  <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${riderPhone}`)}>
                    <Phone size={18} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : null}

          <Card stacked>
            <Text style={styles.section}>Safety</Text>
            <View style={styles.safetyRow}>
              <Button
                label="SOS"
                variant="danger"
                loading={safetyLoading}
                icon={<ShieldAlert size={16} color={colors.textOnPrimary} />}
                style={styles.safetyBtn}
                onPress={reportSos}
              />
              {isRide ? (
                <Button
                  label="Share trip"
                  variant="outline"
                  loading={safetyLoading}
                  icon={<Share2 size={16} color={colors.primary} />}
                  style={styles.safetyBtn}
                  onPress={shareTrip}
                />
              ) : null}
            </View>
            <Button
              label="Call emergency contact"
              variant="secondary"
              fullWidth
              onPress={callEmergencyContact}
            />
          </Card>

          {showReceipt ? (
            <Card stacked>
              <Text style={styles.section}>Receipt</Text>
              <Text style={styles.label}>Trip ID</Text>
              <Text style={styles.address}>{trip.id}</Text>
              <Text style={[styles.label, { marginTop: spacing.lg }]}>Total paid</Text>
              <Text style={styles.fare}>
                {money(
                  isRide
                    ? (trip as (typeof rides)[0]).finalFare ?? (trip as (typeof rides)[0]).estimatedFare
                    : (trip as (typeof deliveries)[0]).finalFee ?? (trip as (typeof deliveries)[0]).estimatedFee,
                  trip.currency,
                )}
              </Text>
            </Card>
          ) : null}

          {canRate ? (
            <Card stacked>
              <Text style={styles.section}>Rate your ride</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable key={value} style={styles.starBtn} onPress={() => setRating(value)}>
                    <Star
                      size={28}
                      color={value <= rating ? colors.primary : colors.border}
                      fill={value <= rating ? colors.primary : "transparent"}
                    />
                  </Pressable>
                ))}
              </View>
              <Input label="Review (optional)" value={review} onChangeText={setReview} placeholder="How was your trip?" />
              <Button label="Submit rating" loading={ratingLoading} onPress={submitRating} fullWidth />
            </Card>
          ) : null}

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
