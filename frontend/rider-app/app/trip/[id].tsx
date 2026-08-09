import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShieldAlert,
  Star,
} from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { TripNavigationSheet } from "@/components/TripNavigationSheet";
import { DeliveryNavigationSheet } from "@/components/DeliveryNavigationSheet";
import { CancellationReasonModal } from "@/components/ui/CancellationReasonModal";
import {
  TripTimeline,
  stepIndexForStatus,
  RIDE_STEPS,
  DELIVERY_STEPS,
} from "@/components/TripTimeline";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { RideStatusBadge } from "@/components/ui/RideStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  api,
  nextDeliveryStatus,
  nextRideStatus,
  money,
} from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useTripRefresh } from "@/hooks/useTripRefresh";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  openGoogleMapsNavigation,
  openWazeNavigation,
} from "@/lib/navigation";
import { riderWs } from "@/lib/websocket";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { spacing } from "@/theme/tokens";
import { brand, layers, radii, type as dsType } from "@/theme/design-system";
import type { DeliveryStop } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  arriving: "Head to pickup",
  arrived: "Arrived at pickup",
  started: "Start trip",
  completed: "Complete trip",
  picked_up: "Package picked up",
  in_transit: "Start delivery",
  delivered: "Take photo & mark delivered",
};

const ACTIVE_STATUSES = [
  "assigned",
  "arriving",
  "arrived",
  "started",
  "picked_up",
  "in_transit",
];

type SafetyOverview = {
  contacts?: Array<{
    id: string;
    name: string;
    phoneE164: string;
    isPrimary?: boolean;
  }>;
};

/**
 * TripScreen — Navigation-focused for rides, legacy scroll for deliveries.
 *
 * Ride flow: 70/30 map/sheet split via TripNavigationSheet
 * Delivery flow: Original scrollable card layout (multi-stop support)
 */
export default function TripScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const { colors, typography, stackHeaderOptions, isDark } = useTheme();
  const { showToast } = useToast();
  const { latitude, longitude, isMocked, hasFix } = useUserLocation();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyContacts, setSafetyContacts] = useState<
    SafetyOverview["contacts"]
  >([]);
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [completingStopId, setCompletingStopId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const isRide = kind !== "delivery";
  const trip = isRide
    ? rides.find((r) => r.id === id)
    : deliveries.find((d) => d.id === id);

  useTripRefresh(refresh, riderWs, 10000);

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
    api<DeliveryStop[]>(`/deliveries/${trip.id}/stops`, {
      token: session.token,
    })
      .then(setStops)
      .catch(() => setStops([]));
  }, [isRide, trip?.id, trip?.status, session?.token]);

  useEffect(() => {
    if (!trip || !session?.token || !session.user.riderProfileId) return;
    if (!ACTIVE_STATUSES.includes((trip.status ?? "").toLowerCase())) return;

    const postLocation = () => {
      if (!isRide || !hasFix) return;
      api(`/rides/${trip.id}/location`, {
        method: "POST",
        token: session.token,
        body: {
          riderProfileId: session.user.riderProfileId,
          latitude,
          longitude,
          source: "rider_app",
          isMocked,
        },
      }).catch(() => undefined);
    };

    postLocation();
    const timer = setInterval(postLocation, 5000);
    return () => clearInterval(timer);
  }, [
    trip?.id,
    trip?.status,
    session?.token,
    session?.user.riderProfileId,
    latitude,
    longitude,
    isMocked,
    isRide,
    hasFix,
  ]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide
      ? markersForRide(trip as (typeof rides)[0], colors)
      : markersForDelivery(trip as (typeof deliveries)[0], colors);
  }, [trip, isRide, colors, rides, deliveries]);

  const status = trip?.status ?? "assigned";
  const navLat = Number(
    ["started", "picked_up", "in_transit"].includes(status.toLowerCase())
      ? isRide
        ? (trip as (typeof rides)[0] | undefined)?.destinationLatitude
        : (trip as (typeof deliveries)[0] | undefined)?.dropoffLatitude
      : isRide
        ? (trip as (typeof rides)[0] | undefined)?.pickupLatitude
        : (trip as (typeof deliveries)[0] | undefined)?.pickupLatitude,
  );
  const navLon = Number(
    ["started", "picked_up", "in_transit"].includes(status.toLowerCase())
      ? isRide
        ? (trip as (typeof rides)[0] | undefined)?.destinationLongitude
        : (trip as (typeof deliveries)[0] | undefined)?.dropoffLongitude
      : isRide
        ? (trip as (typeof rides)[0] | undefined)?.pickupLongitude
        : (trip as (typeof deliveries)[0] | undefined)?.pickupLongitude,
  );
  const isActiveTrip = ACTIVE_STATUSES.includes(status.toLowerCase());
  const livePreview = useLiveRoutePreview(
    session?.token,
    latitude && longitude ? { latitude, longitude } : null,
    navLat && navLon ? { latitude: navLat, longitude: navLon } : null,
    Boolean(trip) && isActiveTrip,
  );

  /* ─── Ride: Navigation-focused layout ────────────────────────────── */
  if (isRide && trip) {
    const ride = trip as (typeof rides)[0];
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            ...stackHeaderOptions,
          }}
        />
        <TripNavigationSheet
          trip={{
            id: ride.id,
            kind: "ride",
            status: ride.status ?? "assigned",
            passengerName: ride.passenger?.user?.fullName,
            passengerPhone: ride.passenger?.user?.phoneE164,
            pickupAddress: ride.pickupAddress,
            pickupLandmark: ride.pickupLandmark ?? undefined,
            pickupLatitude: ride.pickupLatitude
              ? Number(ride.pickupLatitude)
              : undefined,
            pickupLongitude: ride.pickupLongitude
              ? Number(ride.pickupLongitude)
              : undefined,
            destinationAddress: ride.destinationAddress,
            destinationLandmark: ride.destinationLandmark ?? undefined,
            destinationLatitude: ride.destinationLatitude
              ? Number(ride.destinationLatitude)
              : undefined,
            destinationLongitude: ride.destinationLongitude
              ? Number(ride.destinationLongitude)
              : undefined,
            estimatedFare: ride.estimatedFare
              ? Number(ride.estimatedFare)
              : undefined,
            riderEarnings: ride.riderEarnings
              ? Number(ride.riderEarnings)
              : undefined,
            currency: ride.currency,
            rideType: ride.rideType ?? undefined,
            tripPin: (ride as any).tripPin ?? undefined,
          }}
          onAdvance={advance}
          onVerifyPin={async (pin: string) => {
            if (!session?.token) return false;
            try {
              const result = await api<{ valid: boolean }>(
                `/rides/${ride.id}/verify-pin`,
                {
                  method: "POST",
                  token: session.token,
                  body: { pin },
                },
              );
              return result.valid;
            } catch {
              return false;
            }
          }}
          loading={loading}
        />
      </>
    );
  }

  /* ─── Delivery: Navigation-focused layout ────────────────────────── */
  if (!isRide && trip) {
    const delivery = trip as (typeof deliveries)[0];
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            ...stackHeaderOptions,
          }}
        />
        <DeliveryNavigationSheet
          delivery={{
            id: delivery.id,
            status: delivery.status ?? "assigned",
            pickupAddress: delivery.pickupAddress,
            pickupLandmark: delivery.pickupLandmark ?? undefined,
            pickupLatitude: delivery.pickupLatitude
              ? Number(delivery.pickupLatitude)
              : undefined,
            pickupLongitude: delivery.pickupLongitude
              ? Number(delivery.pickupLongitude)
              : undefined,
            dropoffAddress: delivery.dropoffAddress,
            dropoffLandmark: delivery.dropoffLandmark ?? undefined,
            dropoffLatitude: delivery.dropoffLatitude
              ? Number(delivery.dropoffLatitude)
              : undefined,
            dropoffLongitude: delivery.dropoffLongitude
              ? Number(delivery.dropoffLongitude)
              : undefined,
            estimatedFee: delivery.estimatedFee
              ? Number(delivery.estimatedFee)
              : undefined,
            riderEarnings: delivery.riderEarnings
              ? Number(delivery.riderEarnings)
              : undefined,
            currency: delivery.currency,
            package: (delivery as any).package ?? undefined,
            senderName: (delivery as any).senderName ?? undefined,
            senderPhone: (delivery as any).senderPhone ?? undefined,
            recipient: (delivery as any).recipient ?? undefined,
            stops: stops.length > 0
              ? stops.map((stop) => ({
                  id: stop.id,
                  type: stop.type,
                  address: stop.address,
                  landmark: stop.landmark ?? undefined,
                  latitude: stop.latitude ? Number(stop.latitude) : undefined,
                  longitude: stop.longitude ? Number(stop.longitude) : undefined,
                  recipientName: stop.recipientName ?? undefined,
                  recipientPhone: stop.recipientPhoneE164 ?? undefined,
                  instructions: stop.instructions ?? undefined,
                  status: stop.status,
                }))
              : undefined,
          }}
          onAdvance={advance}
          onCompleteStop={async (stopId: string) => {
            if (!session?.token) return;
            await api(`/deliveries/${delivery.id}/stops/${stopId}/complete`, {
              method: "PATCH",
              token: session.token,
              body: { actorRole: "rider" },
            });
            await refresh();
            const updatedStops = await api<DeliveryStop[]>(
              `/deliveries/${delivery.id}/stops`,
              { token: session.token },
            );
            setStops(updatedStops);
          }}
          loading={loading}
        />
      </>
    );
  }

  /* ─── Delivery: Legacy scrollable card layout ─────────────────────── */
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        map: { height: "35%" as unknown as number },
        body: {
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: spacing.xxxl,
        },
        notFound: {
          ...typography.body,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: spacing.xxxl,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        fare: { ...typography.h3, color: colors.text },
        passengerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
        },
        passengerLabel: { ...typography.caption, color: colors.textMuted },
        passengerName: {
          ...typography.bodySemibold,
          marginTop: spacing.xs,
          color: colors.text,
        },
        passengerPhone: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        },
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
        section: { ...typography.h3, color: colors.text },
        navDestination: {
          ...typography.body,
          color: colors.text,
          marginTop: spacing.xs,
        },
        navLandmark: {
          ...typography.caption,
          color: colors.textMuted,
          marginTop: spacing.xs,
          marginBottom: spacing.sm,
        },
        navRow: { flexDirection: "row", gap: spacing.sm },
        navBtn: { flex: 1 },
        safetyRow: { flexDirection: "row", gap: spacing.sm },
        safetyBtn: { flex: 1 },
        stars: { flexDirection: "row", gap: spacing.sm },
        starBtn: { padding: spacing.sm },
        wsStatus: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: "center",
        },
        stopRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingVertical: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        stopLabel: { ...typography.captionMedium, color: colors.textSecondary },
        stopAddress: {
          ...typography.body,
          color: colors.text,
          marginTop: 2,
        },
      }),
    [colors, typography],
  );

  if (!trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.notFound}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  const nextStatus = isRide
    ? nextRideStatus(status)
    : nextDeliveryStatus(status);
  const steps = isRide ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIndex = stepIndexForStatus(
    status,
    isRide ? "ride" : "delivery",
  );
  const passengerPhone = trip.passenger?.user?.phoneE164;
  const canRatePassenger = isRide && status.toLowerCase() === "completed";
  const navLabel = [
    "started",
    "picked_up",
    "in_transit",
  ].includes(status.toLowerCase())
    ? isRide
      ? (trip as (typeof deliveries)[0]).dropoffAddress
      : (trip as (typeof deliveries)[0]).dropoffAddress
    : isRide
      ? (trip as (typeof deliveries)[0]).pickupAddress
      : (trip as (typeof deliveries)[0]).pickupAddress;
  const navLandmark = [
    "started",
    "picked_up",
    "in_transit",
  ].includes(status.toLowerCase())
    ? isRide
      ? (trip as (typeof rides)[0]).destinationLandmark
      : (trip as (typeof deliveries)[0]).dropoffLandmark
    : isRide
      ? (trip as (typeof rides)[0]).pickupLandmark
      : (trip as (typeof deliveries)[0]).pickupLandmark;

  const dropoffStops = stops.filter((stop) => stop.type === "DROPOFF");
  const isMultiStopDelivery = !isRide && dropoffStops.length > 1;
  const nextPendingStop = dropoffStops.find(
    (stop) => stop.status !== "COMPLETED",
  );

  async function captureProofOfDeliveryPhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow camera access to capture proof of delivery.",
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async function advance() {
    if (!trip || !nextStatus || !session) return;

    let proofPhotoBase64: string | undefined;
    if (!isRide && nextStatus === "delivered") {
      const photo = await captureProofOfDeliveryPhoto();
      if (!photo) return;
      proofPhotoBase64 = photo;
    }

    setLoading(true);
    try {
      if (isRide) {
        await api(`/rides/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: {
            nextStatus,
            actorRole: "rider",
            actorUserId: session.user.id,
          },
        });
      } else {
        await api(`/deliveries/${trip.id}/status`, {
          method: "PATCH",
          token: session.token,
          body: {
            nextStatus,
            actorRole: "rider",
            actorUserId: session.user.id,
            proofPhotoBase64,
          },
        });
      }
      await refresh();
      if (
        !isRide &&
        (nextStatus === "completed" || nextStatus === "delivered")
      )
        router.back();
    } catch (e) {
      Alert.alert(
        "Update failed",
        e instanceof Error ? e.message : "Could not update delivery status.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeStop(stop: DeliveryStop, isFinal: boolean) {
    if (!trip || !session) return;

    let proofPhotoBase64: string | undefined;
    if (isFinal) {
      const photo = await captureProofOfDeliveryPhoto();
      if (!photo) return;
      proofPhotoBase64 = photo;
    }

    setCompletingStopId(stop.id);
    try {
      await api(`/deliveries/${trip.id}/stops/${stop.id}/complete`, {
        method: "PATCH",
        token: session.token,
        body: { actorRole: "rider", proofPhotoBase64 },
      });
      await refresh();
      const updatedStops = await api<DeliveryStop[]>(
        `/deliveries/${trip.id}/stops`,
        { token: session.token },
      );
      setStops(updatedStops);
      if (isFinal) router.back();
    } catch (e) {
      Alert.alert(
        "Update failed",
        e instanceof Error
          ? e.message
          : "Could not complete this stop.",
      );
    } finally {
      setCompletingStopId(null);
    }
  }

  async function reportSos() {
    if (!session || !trip) return;
    setSafetyLoading(true);
    try {
      await api("/safety/incidents", {
        method: "POST",
        token: session.token,
        body: {
          rideId: isRide ? trip.id : undefined,
          severity: "CRITICAL",
          category: "SOS",
          description: `Rider SOS during ${isRide ? "ride" : "delivery"} ${trip.id}`,
        },
      });
      showToast("SOS sent. Our safety team has been notified.", "error");
    } catch (e) {
      Alert.alert(
        "SOS failed",
        e instanceof Error ? e.message : "Could not send SOS.",
      );
    } finally {
      setSafetyLoading(false);
    }
  }

  async function cancelTrip(reason: string) {
    if (!session || !trip) return;
    setCancelLoading(true);
    try {
      const endpoint = isRide
        ? `/rides/${trip.id}/status`
        : `/deliveries/${trip.id}/status`;
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
      setShowCancelModal(false);
      showToast("Trip cancelled.", "info");
      router.back();
    } catch (e) {
      Alert.alert(
        "Cancel failed",
        e instanceof Error ? e.message : "Could not cancel trip.",
      );
    } finally {
      setCancelLoading(false);
    }
  }

  async function shareTrip() {
    if (!session || !isRide || !trip) return;
    setSafetyLoading(true);
    try {
      const result = await api<{ shareUrl?: string; message?: string }>(
        "/safety/share-trip",
        {
          method: "POST",
          token: session.token,
          body: {
            rideId: trip.id,
            mode: "START",
            channel: "LINK",
            note: `Track my OkadaGo trip to ${navLabel}`,
          },
        },
      );
      const message =
        result.message ?? result.shareUrl ?? `Track my trip: heading to ${navLabel}`;
      await Share.share({ message });
    } catch (e) {
      Alert.alert(
        "Share failed",
        e instanceof Error ? e.message : "Could not share trip.",
      );
    } finally {
      setSafetyLoading(false);
    }
  }

  async function callEmergencyContact() {
    const primary =
      safetyContacts?.find((contact) => contact.isPrimary) ??
      safetyContacts?.[0];
    if (!primary) {
      Alert.alert(
        "No emergency contact",
        "Add a safety contact in your profile first.",
      );
      return;
    }
    await Linking.openURL(`tel:${primary.phoneE164}`);
  }

  async function submitPassengerRating() {
    if (!session || !isRide) return;
    setRatingLoading(true);
    try {
      await api(`/ratings/rides/${trip!.id}/passenger`, {
        method: "POST",
        token: session.token,
        body: { score: rating, review: review.trim() || undefined },
      });
      showToast("Your passenger rating was submitted.", "success");
      router.back();
    } catch (e) {
      Alert.alert(
        "Rating failed",
        e instanceof Error ? e.message : "Could not submit rating.",
      );
    } finally {
      setRatingLoading(false);
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
        <AppMap style={styles.map} markers={markers} fitToMarkers />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.wsStatus}>
              {riderWs.isConnected()
                ? "Live updates connected"
                : "Polling for updates"}
              {livePreview
                ? ` · ETA ~${Math.round(livePreview.durationMinutes)} min (${livePreview.distanceKm.toFixed(1)} km)`
                : ""}
            </Text>

            <View style={styles.header}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  flexWrap: "wrap",
                  flex: 1,
                }}
              >
                <RideStatusBadge status={status} />
                {isRide && (trip as (typeof rides)[0]).rideType ? (
                  <Badge
                    label={
                      String((trip as (typeof rides)[0]).rideType).toUpperCase() ===
                      "EXPRESS"
                        ? "Express Okada"
                        : String((trip as (typeof rides)[0]).rideType).toUpperCase() ===
                            "COMFORT"
                          ? "Okada Comfort"
                          : "Standard Okada"
                    }
                    tone="info"
                  />
                ) : !isRide ? (
                  <Badge label="Package Delivery" tone="info" />
                ) : null}
                {livePreview ? (
                  <Badge
                    label={`⏱ ~${Math.round(livePreview.durationMinutes)} min arrival`}
                    tone="warning"
                  />
                ) : trip.estimatedDurationMinutes ? (
                  <Badge
                    label={`⏱ ~${Math.round(Number(trip.estimatedDurationMinutes))} min arrival`}
                    tone="default"
                  />
                ) : null}
              </View>
              <Text style={styles.fare}>
                {money(
                  isRide
                    ? (trip as (typeof rides)[0]).riderEarnings ??
                        (trip as (typeof rides)[0]).estimatedFare
                    : (trip as (typeof deliveries)[0]).riderEarnings ??
                        (trip as (typeof deliveries)[0]).estimatedFee,
                  trip.currency,
                )}
              </Text>
            </View>

            <Card>
              <View style={styles.passengerRow}>
                <Avatar
                  name={trip.passenger?.user?.fullName ?? "Passenger"}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.passengerLabel}>Passenger</Text>
                  <Text style={styles.passengerName}>
                    {trip.passenger?.user?.fullName ?? "Passenger"}
                  </Text>
                  {trip.passenger?.user?.phoneE164 ? (
                    <Text style={styles.passengerPhone}>
                      {trip.passenger.user.phoneE164}
                    </Text>
                  ) : null}
                </View>
                {passengerPhone ? (
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${passengerPhone}`)}
                    accessibilityLabel="Call passenger"
                    accessibilityRole="button"
                  >
                    <Phone size={18} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            </Card>

            <Card stacked>
              <Text style={styles.section}>Navigate</Text>
              <Text style={styles.navDestination}>{navLabel}</Text>
              {navLandmark ? (
                <Text style={styles.navLandmark}>
                  Landmark: {navLandmark}
                </Text>
              ) : null}
              <View style={styles.navRow}>
                <Button
                  label="Google Maps"
                  variant="outline"
                  icon={<MapPin size={16} color={colors.primary} />}
                  style={styles.navBtn}
                  onPress={() =>
                    openGoogleMapsNavigation(navLat, navLon, navLabel)
                  }
                />
                <Button
                  label="Waze"
                  variant="outline"
                  icon={<Navigation size={16} color={colors.primary} />}
                  style={styles.navBtn}
                  onPress={() => openWazeNavigation(navLat, navLon)}
                />
              </View>
            </Card>

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
              {isActiveTrip && (
                <Button
                  label="Cancel trip"
                  variant="outline"
                  fullWidth
                  onPress={() => setShowCancelModal(true)}
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>

            <Card stacked>
              <Text style={styles.section}>Progress</Text>
              <TripTimeline steps={steps} currentIndex={currentIndex} />
            </Card>

            {isMultiStopDelivery &&
            status.toLowerCase() === "in_transit" ? (
              <Card stacked>
                <Text style={styles.section}>
                  Stops (
                  {dropoffStops.filter((s) => s.status === "COMPLETED").length}/
                  {dropoffStops.length})
                </Text>
                {dropoffStops.map((stop, index) => {
                  const isCompleted = stop.status === "COMPLETED";
                  const isFinal = index === dropoffStops.length - 1;
                  const isNext = nextPendingStop?.id === stop.id;
                  return (
                    <View key={stop.id} style={styles.stopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stopLabel}>
                          Stop {index + 1}
                          {isCompleted ? " · Delivered" : ""}
                        </Text>
                        <Text style={styles.stopAddress}>
                          {stop.address}
                        </Text>
                        {stop.landmark ? (
                          <Text style={styles.navLandmark}>
                            Landmark: {stop.landmark}
                          </Text>
                        ) : null}
                        {stop.recipientName ? (
                          <Text style={styles.navLandmark}>
                            Recipient: {stop.recipientName}
                          </Text>
                        ) : null}
                      </View>
                      {isCompleted ? (
                        <Badge label="Done" tone="success" />
                      ) : (
                        <Button
                          label={
                            isFinal
                              ? "Take photo & complete"
                              : "Complete stop"
                          }
                          variant={isNext ? "accent" : "outline"}
                          loading={completingStopId === stop.id}
                          disabled={!isNext}
                          icon={
                            isFinal ? (
                              <Camera
                                size={14}
                                color={colors.textOnPrimary}
                              />
                            ) : undefined
                          }
                          onPress={() => void completeStop(stop, isFinal)}
                        />
                      )}
                    </View>
                  );
                })}
              </Card>
            ) : null}

            {canRatePassenger ? (
              <Card stacked>
                <Text style={styles.section}>Rate passenger</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                      key={value}
                      style={styles.starBtn}
                      onPress={() => setRating(value)}
                    >
                      <Star
                        size={28}
                        color={
                          value <= rating ? colors.primary : colors.border
                        }
                        fill={
                          value <= rating ? colors.primary : "transparent"
                        }
                      />
                    </Pressable>
                  ))}
                </View>
                <Input
                  label="Review (optional)"
                  value={review}
                  onChangeText={setReview}
                  placeholder="How was this passenger?"
                />
                <Button
                  label="Submit rating"
                  loading={ratingLoading}
                  onPress={submitPassengerRating}
                  fullWidth
                />
                <Button
                  label="Skip for now"
                  variant="outline"
                  onPress={() => router.back()}
                  fullWidth
                />
              </Card>
            ) : null}

            {nextStatus &&
            !(isMultiStopDelivery && nextStatus === "delivered") ? (
              <Button
                label={ACTION_LABELS[nextStatus] ?? `Update to ${nextStatus}`}
                variant="accent"
                loading={loading}
                icon={
                  !isRide && nextStatus === "delivered" ? (
                    <Camera size={16} color={colors.textOnPrimary} />
                  ) : undefined
                }
                onPress={advance}
                fullWidth
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <CancellationReasonModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={cancelTrip}
        loading={cancelLoading}
        tripType={isRide ? "ride" : "delivery"}
      />
    </>
  );
}
