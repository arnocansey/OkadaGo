import { Stack, useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Phone, ShieldAlert, Share2, Star } from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { MatchingScreen } from "@/components/MatchingScreen";
import {
  TripTimeline,
  stepIndexForStatus,
  RIDE_STEPS,
  DELIVERY_STEPS,
  type StepDetail,
} from "@/components/TripTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { RideStatusBadge } from "@/components/ui/RideStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { CancellationReasonModal } from "@/components/ui/CancellationReasonModal";
import { RiderTransparencyCard } from "@/components/RiderTransparencyCard";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useTripRefresh } from "@/hooks/useTripRefresh";
import { api, money } from "@/lib/api";
import { passengerWs } from "@/lib/websocket";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { spacing } from "@/theme/tokens";
import type { DeliveryStop } from "@/types";

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

const FOOD_DELIVERY_SUB_LABELS: Record<string, Record<string, string>> = {
  searching: { searching: "Finding a courier for your store pickup...", assigned: "", picked_up: "", in_transit: "", delivered: "" },
  assigned: { searching: "Courier found!", assigned: "Courier is heading to the store", picked_up: "", in_transit: "", delivered: "" },
  picked_up: { searching: "", assigned: "", picked_up: "Order collected from the store — on the way to you", in_transit: "", delivered: "" },
  in_transit: { searching: "", assigned: "", picked_up: "", in_transit: "Courier is delivering your pickup", delivered: "" },
  delivered: { searching: "", assigned: "", picked_up: "", in_transit: "", delivered: "Store pickup delivered" },
};

export default function TrackScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh, loading, restoring } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { showToast } = useToast();
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
        address: { ...typography.bodySemibold, marginTop: spacing.xs, color: colors.text },
        section: { ...typography.h3, color: colors.text },
        riderRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
        riderName: { ...typography.bodySemibold, marginTop: spacing.xs, color: colors.text },
        plate: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
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
        starBtn: { padding: spacing.sm },
        wsStatus: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
        expandRiderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
        expandRiderName: { ...typography.bodyMedium, color: colors.text },
        expandRiderPlate: { ...typography.caption, color: colors.textSecondary },
        stopRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingVertical: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        stopAddress: { ...typography.body, color: colors.text },
      }),
    [colors, typography],
  );

  const isRide = kind !== "delivery";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyContacts, setSafetyContacts] = useState<SafetyOverview["contacts"]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);

  useTripRefresh(refresh, passengerWs, 8000);

  useEffect(() => {
    if (!session?.token) return;
    api<SafetyOverview>("/safety/overview", { token: session.token })
      .then((overview) => setSafetyContacts(overview.contacts ?? []))
      .catch(() => setSafetyContacts([]));
  }, [session?.token]);

  useEffect(() => {
    if (isRide || !trip?.id || !session?.token) {
      setStops([]);
      return;
    }
    api<DeliveryStop[]>(`/deliveries/${trip.id}/stops`, { token: session.token })
      .then(setStops)
      .catch(() => setStops([]));
  }, [isRide, trip?.id, trip?.status, session?.token]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide
      ? markersForRide(trip as (typeof rides)[0], colors)
      : markersForDelivery(trip as (typeof deliveries)[0], colors);
  }, [trip, isRide, colors, rides, deliveries]);

  const status = trip?.status ?? "searching";
  const isActiveTrip = ACTIVE_STATUSES.includes(status.toLowerCase());
  const isSearching = status.toLowerCase() === "searching";
  const [showMatching, setShowMatching] = useState(isSearching);
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

  const deliveryTrip = !isRide && trip ? (trip as (typeof deliveries)[0]) : null;
  const isFoodPickup = Boolean(
    deliveryTrip && (deliveryTrip.packageType ?? "").toLowerCase() === "food",
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

  const subLabels = isRide
    ? RIDE_SUB_LABELS
    : isFoodPickup
      ? FOOD_DELIVERY_SUB_LABELS
      : DELIVERY_SUB_LABELS;
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
                  <Avatar name={riderName} size={36} />
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

  const handleMatched = useCallback(() => {
    setShowMatching(false);
  }, []);

  const handleCancelMatching = useCallback(() => {
    Alert.alert("Cancel ride?", "You won't be charged if you cancel now.", [
      { text: "Keep searching", style: "cancel" },
      {
        text: "Cancel",
        style: "destructive",
        onPress: async () => {
          if (!session || !trip) return;
          try {
            const endpoint = isRide ? `/rides/${trip.id}/status` : `/deliveries/${trip.id}/status`;
            await api(endpoint, {
              method: "PATCH",
              token: session.token,
              body: {
                nextStatus: "cancelled",
                actorRole: "passenger",
                actorUserId: session.user.id,
              },
            });
            router.back();
          } catch {
            // ignore
          }
        },
      },
    ]);
  }, [session, trip, isRide]);

  if (!trip) {
    if (loading || restoring) {
      return (
        <View style={styles.screen}>
          <View style={{ padding: spacing.xl, marginTop: spacing.xxl }}>
            <SkeletonList count={4} />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.screen}>
        <EmptyState title="Trip not found" message="This trip may have been completed or cancelled." />
      </View>
    );
  }

  const canCancel = ["scheduled", ...ACTIVE_STATUSES.slice(0, 2)].includes(status.toLowerCase());
  const canRate = isRide ? status.toLowerCase() === "completed" : status.toLowerCase() === "delivered";
  const showReceipt = isRide ? status.toLowerCase() === "completed" : status.toLowerCase() === "delivered";
  const riderPhone = (trip.rider?.user as { phoneE164?: string } | undefined)?.phoneE164;
  const pickupAddress = isRide ? (trip as (typeof rides)[0]).pickupAddress : (trip as (typeof deliveries)[0]).pickupAddress;
  const dropoffAddress = isRide ? (trip as (typeof rides)[0]).destinationAddress : (trip as (typeof deliveries)[0]).dropoffAddress;

  async function reportSos() {
    if (!session) return;
    Alert.alert("Send SOS?", "We'll alert OkadaGo safety and keep this trip marked critical.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send SOS",
        style: "destructive",
        onPress: async () => {
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
            showToast("SOS sent. Our safety team has been notified.", "error");
          } catch (e) {
            Alert.alert("SOS failed", e instanceof Error ? e.message : "Could not send SOS.");
          } finally {
            setSafetyLoading(false);
          }
        },
      },
    ]);
  }

  async function shareTrip() {
    if (!session || !trip) return;
    setSafetyLoading(true);
    try {
      const result = await api<{ shareUrl?: string; message?: string }>("/safety/share-trip", {
        method: "POST",
        token: session.token,
        body: {
          rideId: isRide ? trip.id : undefined,
          deliveryId: isRide ? undefined : trip.id,
          mode: "START",
          channel: "LINK",
          note: isRide
            ? `I'm on an OkadaGo trip from ${pickupAddress} to ${dropoffAddress}`
            : isFoodPickup
              ? `OkadaGo is picking up my food order from ${pickupAddress}`
              : `OkadaGo is delivering from ${pickupAddress} to ${dropoffAddress}`,
        },
      });
      const fallback = [
        isRide
          ? "I'm on an OkadaGo trip right now."
          : isFoodPickup
            ? "OkadaGo is collecting my store pickup right now."
            : "I'm using OkadaGo for a delivery right now.",
        `${pickupAddress} → ${dropoffAddress}`,
        result.shareUrl ? `Live track: ${result.shareUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n");
      const message = result.message?.trim() || fallback;
      if (!message.includes("http") && !result.shareUrl) {
        throw new Error("Share link was unavailable. Try again in a moment.");
      }
      await Share.share({ message, title: isRide ? "OkadaGo trip" : "OkadaGo delivery" });
    } catch (e) {
      Alert.alert("Share failed", e instanceof Error ? e.message : "Could not share trip.");
    } finally {
      setSafetyLoading(false);
    }
  }

  async function callEmergencyContact() {
    const primary = safetyContacts?.find((contact) => contact.isPrimary) ?? safetyContacts?.[0];
    if (!primary) {
      Alert.alert(
        "No emergency contact",
        "Add a safety contact in Profile → Emergency contacts (app) or Safety settings on the web app.",
      );
      return;
    }
    await Linking.openURL(`tel:${primary.phoneE164}`);
  }

  async function submitRating() {
    if (!session || !trip) return;
    setRatingLoading(true);
    try {
      const endpoint = isRide ? `/ratings/rides/${trip.id}` : `/ratings/deliveries/${trip.id}`;
      await api(endpoint, {
        method: "POST",
        token: session.token,
        body: { score: rating, review: review.trim() || undefined },
      });
      showToast("Your rating was submitted.", "success");
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
          title: showMatching ? "Finding rider" : "Track trip",
          ...stackHeaderOptions,
        }}
      />

      {/* Matching Animation Overlay */}
      {showMatching && isRide ? (
        <MatchingScreen
          tripId={trip.id}
          onCancel={handleCancelMatching}
          onMatched={handleMatched}
        />
      ) : (
        <View style={styles.screen}>
          <AppMap style={styles.map} markers={markers} fitToMarkers />
          <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.wsStatus}>
            {passengerWs.isConnected() ? "Live updates connected" : "Polling for updates"}
            {livePreview ? ` · ETA ~${Math.round(livePreview.durationMinutes)} min (${livePreview.distanceKm.toFixed(1)} km)` : ""}
          </Text>

          <View style={styles.header}>
            <RideStatusBadge status={status} />
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

          {!isRide && stops.filter((s) => s.type === "DROPOFF").length > 1 ? (
            <Card>
              <Text style={styles.section}>Stops</Text>
              {stops
                .filter((s) => s.type === "DROPOFF")
                .map((stop, index) => (
                  <View key={stop.id} style={styles.stopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopAddress} numberOfLines={1}>
                        {index + 1}. {stop.address}
                      </Text>
                    </View>
                    <Badge
                      label={stop.status === "COMPLETED" ? "Delivered" : "Pending"}
                      tone={stop.status === "COMPLETED" ? "success" : "default"}
                    />
                  </View>
                ))}
            </Card>
          ) : null}

          {trip.rider?.user?.fullName ? (
            <RiderTransparencyCard
              rider={{
                name: trip.rider.user.fullName,
                avatarUrl: trip.rider.user.avatarUrl,
                rating: trip.rider.ratingAverage != null ? Number(trip.rider.ratingAverage) : null,
                completedTrips: trip.rider.completedTrips,
                joinedAt: trip.rider.createdAt,
                distanceKm: (() => {
                  if (
                    trip.rider.currentLatitude != null &&
                    trip.rider.currentLongitude != null &&
                    trip.pickupLatitude != null &&
                    trip.pickupLongitude != null
                  ) {
                    const R = 6371;
                    const dLat = ((Number(trip.pickupLatitude) - Number(trip.rider.currentLatitude)) * Math.PI) / 180;
                    const dLon = ((Number(trip.pickupLongitude) - Number(trip.rider.currentLongitude)) * Math.PI) / 180;
                    const a =
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos((Number(trip.rider.currentLatitude) * Math.PI) / 180) *
                        Math.cos((Number(trip.pickupLatitude) * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  }
                  return null;
                })(),
                vehicle: trip.rider.vehicle,
                isPhoneVerified: trip.rider.user.isPhoneVerified,
                isApproved: trip.rider.approvalStatus === "APPROVED",
                bio: trip.rider.bio,
              }}
              matchReason="Matched based on proximity and availability"
              onCall={riderPhone ? () => Linking.openURL(`tel:${riderPhone}`) : undefined}
            />
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
              <Button
                label={isRide ? "Share trip" : "Share delivery"}
                variant="outline"
                loading={safetyLoading}
                icon={<Share2 size={16} color={colors.primary} />}
                style={styles.safetyBtn}
                onPress={shareTrip}
              />
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
              <Text style={styles.section}>{isRide ? "Rate your ride" : "Rate your delivery"}</Text>
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
              <Input
                label="Review (optional)"
                value={review}
                onChangeText={setReview}
                placeholder={isRide ? "How was your trip?" : "How was your delivery?"}
              />
              <Button label="Submit rating" loading={ratingLoading} onPress={submitRating} fullWidth />
            </Card>
          ) : null}

          {canCancel ? (
            <Button
              label={isRide ? "Cancel ride" : "Cancel delivery"}
              variant="danger"
              loading={cancelling}
              fullWidth
              onPress={() => setShowCancelModal(true)}
            />
          ) : null}
        </ScrollView>
      </View>
      )}

      <CancellationReasonModal
        visible={showCancelModal}
        tripType={isRide ? "ride" : "delivery"}
        loading={cancelling}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async (reason) => {
          if (!session || !trip) return;
          setCancelling(true);
          try {
            const endpoint = isRide ? `/rides/${trip.id}/status` : `/deliveries/${trip.id}/status`;
            await api(endpoint, {
              method: "PATCH",
              token: session.token,
              body: {
                nextStatus: "cancelled",
                actorRole: "passenger",
                actorUserId: session.user.id,
                cancellationReason: reason,
              },
            });
            setShowCancelModal(false);
            showToast("Trip cancelled successfully.", "info");
            await refresh();
          } catch (e) {
            Alert.alert("Cancel failed", e instanceof Error ? e.message : "Could not cancel trip.");
          } finally {
            setCancelling(false);
          }
        }}
      />
    </>
  );
}
