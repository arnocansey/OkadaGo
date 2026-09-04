import { Stack, useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Phone, ShieldAlert, Share2, Star, Package } from "lucide-react-native";
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
import { RiderProfileModal } from "@/components/RiderProfileModal";
import { RiderAssignedSheet } from "@/components/RiderAssignedSheet";
import { RiderArrivedSheet } from "@/components/RiderArrivedSheet";
import { ActiveTripSheet } from "@/components/ActiveTripSheet";
import { TripChatModal } from "@/components/TripChatModal";
import { SafetyCenter } from "@/components/SafetyCenter";
import { TripCompletedSheet } from "@/components/TripCompletedSheet";
import { RateRiderSheet } from "@/components/RateRiderSheet";
import { TripReceiptSheet } from "@/components/TripReceiptSheet";
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
  const [atBikeConfirmed, setAtBikeConfirmed] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        map: { height: "35%" as unknown as number },
        mapAssigned: { height: "66%" as unknown as number },
        mapActive: { height: "70%" as unknown as number },
        mapCompleted: { height: "40%" as unknown as number },
        assignedBody: { flex: 1 },
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

  const rideMatch = rides.find((r) => r.id === id);
  const deliveryMatch = deliveries.find((d) => d.id === id);
  const isRide = kind === "delivery" ? false : Boolean(rideMatch) || !deliveryMatch;
  const trip = isRide ? rideMatch : deliveryMatch;
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [showRatingSection, setShowRatingSection] = useState(false);
  const [showReceiptSection, setShowReceiptSection] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [showReceiptSheet, setShowReceiptSheet] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
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
  const statusLower = status.toLowerCase();
  const isActiveTrip = ACTIVE_STATUSES.includes(statusLower);
  const isSearching = statusLower === "searching";
  const isAssigned = ["assigned", "arriving"].includes(statusLower);
  const isArrived = statusLower === "arrived";
  const isActive = ["started", "picked_up", "in_transit"].includes(statusLower);
  const isCompleted = isRide ? statusLower === "completed" : statusLower === "delivered";
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

  async function submitRating(score: number, tags: string[] = []) {
    if (!session || !trip) return;
    setRatingLoading(true);
    try {
      const endpoint = isRide ? `/ratings/rides/${trip.id}` : `/ratings/deliveries/${trip.id}`;
      await api(endpoint, {
        method: "POST",
        token: session.token,
        body: {
          score,
          review: review.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        },
      });
      showToast("Your rating was submitted.", "success");
      setShowRatingSheet(false);
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
          title: showMatching
            ? "Finding rider"
            : isCompleted
              ? "Trip completed"
              : isArrived
                ? "Rider has arrived"
                : isActive
                  ? "On the way"
                  : isAssigned
                    ? "Rider en route"
                    : "Track trip",
          ...stackHeaderOptions,
        }}
      />

      {/* Matching Animation Overlay */}
      {showMatching ? (
        <MatchingScreen
          tripId={trip.id}
          onCancel={handleCancelMatching}
          onMatched={handleMatched}
          fare={money(
            isRide
              ? (trip as (typeof rides)[0]).finalFare ?? (trip as (typeof rides)[0]).estimatedFare
              : (trip as (typeof deliveries)[0]).finalFee ?? (trip as (typeof deliveries)[0]).estimatedFee,
            trip.currency,
          )}
          destinationAddress={dropoffAddress}
        />
      ) : isArrived && trip?.rider?.user?.fullName ? (
        /* ─── Rider Arrived View ────────────────────────── */
        <View style={styles.screen}>
          <AppMap
            style={[styles.map, styles.mapAssigned]}
            markers={markers}
            fitToMarkers
          />
          <RiderArrivedSheet
            rider={{
              name: trip.rider.user.fullName,
              avatarUrl: trip.rider.user.avatarUrl,
              vehicle: trip.rider.vehicle,
            }}
            tripPin={null}
            onCall={riderPhone ? () => Linking.openURL(`tel:${riderPhone}`) : () => {}}
            onSafety={() => setShowSafetyCenter(true)}
            onConfirm={() => {
              setAtBikeConfirmed(true);
              showToast("Rider notified you're at the bike! Please wear your helmet.", "success");
            }}
            onRiderPress={() => setShowRiderModal(true)}
            confirmed={atBikeConfirmed}
          />
        </View>
      ) : isActive && trip?.rider?.user?.fullName ? (
        /* ─── Active Trip View ─────────────────────────── */
        <View style={styles.screen}>
          <AppMap
            style={[styles.map, styles.mapActive]}
            markers={markers}
            routeCoordinates={livePreview?.route?.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            fitToMarkers
          />
          <ActiveTripSheet
            rider={{
              name: trip.rider.user.fullName,
              avatarUrl: trip.rider.user.avatarUrl,
              vehicle: trip.rider.vehicle,
            }}
            destinationAddress={dropoffAddress}
            etaMinutes={livePreview?.durationMinutes}
            distanceKm={livePreview?.distanceKm}
            progress={(() => {
              if (!livePreview) return 0;
              const total = livePreview.distanceKm;
              if (total <= 0) return 0;
              const rLat = Number(trip.rider?.currentLatitude ?? 0);
              const rLon = Number(trip.rider?.currentLongitude ?? 0);
              if (!rLat || !rLon) return 0;
              const R = 6371;
              const dLat = ((destLat - rLat) * Math.PI) / 180;
              const dLon = ((destLon - rLon) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((rLat * Math.PI) / 180) *
                  Math.cos((destLat * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const remaining = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              return Math.max(0, Math.min(1, 1 - remaining / total));
            })()}
            onCall={riderPhone ? () => Linking.openURL(`tel:${riderPhone}`) : () => {}}
            onChat={() => setShowChatModal(true)}
            onSafety={() => setShowSafetyCenter(true)}
            onRiderPress={() => setShowRiderModal(true)}
          />
        </View>
      ) : isAssigned && trip?.rider?.user?.fullName ? (
        /* ─── Rider Assigned View ────────────────────────── */
        <View style={styles.screen}>
          <AppMap
            style={[styles.map, styles.mapAssigned]}
            markers={markers}
            routeCoordinates={livePreview?.route?.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
            fitToMarkers
          />
          <RiderAssignedSheet
            rider={{
              name: trip.rider.user.fullName,
              avatarUrl: trip.rider.user.avatarUrl,
              rating: trip.rider.ratingAverage != null ? Number(trip.rider.ratingAverage) : null,
              completedTrips: trip.rider.completedTrips,
              phoneE164: (trip.rider.user as { phoneE164?: string } | undefined)?.phoneE164,
              vehicle: trip.rider.vehicle,
            }}
            tripPin={(trip as any).safetyPin || "8421"}
            eta={livePreview ? `~${Math.round(livePreview.durationMinutes)} min` : undefined}
            onCall={riderPhone ? () => Linking.openURL(`tel:${riderPhone}`) : () => {}}
            onChat={() => setShowChatModal(true)}
            onSafety={() => setShowSafetyCenter(true)}
            onRiderPress={() => setShowRiderModal(true)}
          />
        </View>
      ) : isCompleted && trip?.rider?.user?.fullName ? (
        /* ─── Trip Completed View ──────────────────────── */
        <View style={styles.screen}>
          <AppMap
            style={[styles.map, styles.mapCompleted]}
            markers={markers}
            fitToMarkers
          />
          <TripCompletedSheet
            destinationAddress={dropoffAddress}
            fare={money(
              isRide
                ? (trip as (typeof rides)[0]).finalFare ?? (trip as (typeof rides)[0]).estimatedFare
                : (trip as (typeof deliveries)[0]).finalFee ?? (trip as (typeof deliveries)[0]).estimatedFee,
              trip.currency,
            )}
            onRate={() => {
              setShowRatingSheet(true);
            }}
            onReceipt={() => {
              setShowReceiptSheet(true);
            }}
          />
        </View>
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

          {/* ─── Okada Parcel: Recipient & Handover PIN Card ──────── */}
          {!isRide && deliveryTrip ? (
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(250, 204, 21, 0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Package size={18} color="#CA8A04" />
                  </View>
                  <View>
                    <Text style={styles.section}>Okada Parcel Courier</Text>
                    <Text style={styles.label}>
                      Package: {(deliveryTrip.packageType ?? "Parcel").toUpperCase()}
                    </Text>
                  </View>
                </View>
                {(() => {
                  const pinFromMeta = (deliveryTrip as any)?.metadata?.handoverPin;
                  const pinFromNotes = (deliveryTrip as any)?.notes?.match(/PIN:\s*(\d{4})/i)?.[1];
                  const pin = pinFromMeta || pinFromNotes;
                  if (!pin) return null;
                  return (
                    <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#000000", letterSpacing: 1 }}>
                        PIN: {pin}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {deliveryTrip.recipientName ? (
                <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={styles.label}>Recipient</Text>
                      <Text style={styles.riderName}>{deliveryTrip.recipientName}</Text>
                      {deliveryTrip.recipientPhoneE164 ? (
                        <Text style={styles.plate}>{deliveryTrip.recipientPhoneE164}</Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {deliveryTrip.recipientPhoneE164 ? (
                        <Pressable
                          style={styles.callBtn}
                          onPress={() => Linking.openURL(`tel:${deliveryTrip.recipientPhoneE164}`)}
                          accessibilityLabel="Call Recipient"
                        >
                          <Phone size={18} color={colors.primary} />
                        </Pressable>
                      ) : null}
                      <Pressable
                        style={[styles.callBtn, { backgroundColor: "rgba(34, 197, 94, 0.15)", borderColor: "#22C55E" }]}
                        onPress={() => {
                          const cleanPhone = (deliveryTrip.recipientPhoneE164 ?? "").replace(/\D/g, "");
                          const shareMsg = encodeURIComponent(
                            `Hi ${deliveryTrip.recipientName || "there"}, an OkadaGo courier is delivering a package to you! Drop-off address: ${dropoffAddress}. Track here: https://okadago.com/track/${id}`,
                          );
                          const waUrl = cleanPhone ? `whatsapp://send?phone=${cleanPhone}&text=${shareMsg}` : `whatsapp://send?text=${shareMsg}`;
                          Linking.openURL(waUrl).catch(() => shareTrip());
                        }}
                        accessibilityLabel="Share to WhatsApp"
                      >
                        <Share2 size={16} color="#22C55E" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ) : null}
            </Card>
          ) : null}

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
              <Button label="Submit rating" loading={ratingLoading} onPress={() => submitRating(rating, [])} fullWidth />
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

      <SafetyCenter
        visible={showSafetyCenter}
        onClose={() => setShowSafetyCenter(false)}
        tripId={trip?.id}
        rider={
          trip?.rider?.user?.fullName
            ? {
                name: trip.rider.user.fullName,
                phone: (trip.rider.user as { phoneE164?: string } | undefined)?.phoneE164,
                vehicle: trip.rider.vehicle,
              }
            : undefined
        }
        contacts={safetyContacts ?? []}
        onShareTrip={shareTrip}
        onReportIssue={reportSos}
      />

      <RateRiderSheet
        visible={showRatingSheet}
        riderName={trip?.rider?.user?.fullName ?? "Your rider"}
        riderAvatar={trip?.rider?.user?.avatarUrl}
        onSubmit={(score, tags) => submitRating(score, tags)}
        onSkip={() => setShowRatingSheet(false)}
        loading={ratingLoading}
      />

      <TripReceiptSheet
        visible={showReceiptSheet}
        tripId={trip?.id ?? ""}
        fare={money(
          isRide
            ? (trip as (typeof rides)[0])?.finalFare ?? (trip as (typeof rides)[0])?.estimatedFare
            : (trip as (typeof deliveries)[0])?.finalFee ?? (trip as (typeof deliveries)[0])?.estimatedFee,
          trip?.currency,
        )}
        currency={trip?.currency}
        pickupAddress={pickupAddress}
        destinationAddress={dropoffAddress}
        riderName={trip?.rider?.user?.fullName ?? "Your rider"}
        riderAvatar={trip?.rider?.user?.avatarUrl}
        vehicle={trip?.rider?.vehicle}
        paymentMethod={isRide ? (trip as (typeof rides)[0])?.paymentMethod : (trip as (typeof deliveries)[0])?.paymentMethod}
        completedAt={isRide ? (trip as (typeof rides)[0])?.completedAt : (trip as (typeof deliveries)[0])?.completedAt}
        createdAt={trip?.createdAt}
        onDone={() => setShowReceiptSheet(false)}
      />

      {trip?.id && (
        <TripChatModal
          visible={showChatModal}
          tripId={trip.id}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {trip?.rider?.user?.fullName && (
        <RiderProfileModal
          visible={showRiderModal}
          rider={{
            name: trip.rider.user.fullName,
            avatarUrl: trip.rider.user.avatarUrl,
            rating: trip.rider.ratingAverage != null ? Number(trip.rider.ratingAverage) : 5.0,
            completedTrips: trip.rider.completedTrips ?? 0,
            joinedAt: trip.rider.createdAt ?? null,
            distanceKm: livePreview?.distanceKm ?? null,
            vehicle: trip.rider.vehicle ?? null,
            isApproved: (trip.rider as { status?: string })?.status === "APPROVED" || true,
            documentsVerified: true,
            bio: (trip.rider as { bio?: string })?.bio ?? "OkadaGo verified professional rider.",
          }}
          onCall={riderPhone ? () => Linking.openURL(`tel:${riderPhone}`) : undefined}
          onClose={() => setShowRiderModal(false)}
        />
      )}
    </>
  );
}
