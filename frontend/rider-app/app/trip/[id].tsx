import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Navigation, Phone, Star } from "lucide-react-native";
import { AppMap } from "@/components/AppMap";
import { TripTimeline, stepIndexForStatus, RIDE_STEPS, DELIVERY_STEPS } from "@/components/TripTimeline";
import { Badge, statusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { api, nextDeliveryStatus, nextRideStatus, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useLiveRoutePreview } from "@/hooks/useLiveRoutePreview";
import { useTripRefresh } from "@/hooks/useTripRefresh";
import { useUserLocation } from "@/hooks/useUserLocation";
import { openGoogleMapsNavigation, openWazeNavigation } from "@/lib/navigation";
import { riderWs } from "@/lib/websocket";
import { markersForDelivery, markersForRide } from "@/lib/tripMap";
import { spacing } from "@/theme/tokens";

const ACTION_LABELS: Record<string, string> = {
  arriving: "Head to pickup",
  arrived: "Arrived at pickup",
  started: "Start trip",
  completed: "Complete trip",
  picked_up: "Package picked up",
  in_transit: "Start delivery",
  delivered: "Mark delivered",
};

const ACTIVE_STATUSES = ["assigned", "arriving", "arrived", "started", "picked_up", "in_transit"];

export default function TripScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session, rides, deliveries, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { latitude, longitude } = useUserLocation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        navRow: { flexDirection: "row", gap: spacing.sm },
        navBtn: { flex: 1 },
        stars: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
        starBtn: { padding: spacing.xs },
        wsStatus: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
      }),
    [colors, typography],
  );
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const isRide = kind !== "delivery";
  const trip = isRide ? rides.find((r) => r.id === id) : deliveries.find((d) => d.id === id);

  useTripRefresh(refresh, riderWs, 10000);

  useEffect(() => {
    if (!trip || !session?.token || !session.user.riderProfileId) return;
    if (!ACTIVE_STATUSES.includes((trip.status ?? "").toLowerCase())) return;

    const postLocation = () => {
      if (!isRide) return;
      api(`/rides/${trip.id}/location`, {
        method: "POST",
        token: session.token,
        body: {
          riderProfileId: session.user.riderProfileId,
          latitude,
          longitude,
          source: "rider_app",
        },
      }).catch(() => undefined);
    };

    postLocation();
    const timer = setInterval(postLocation, 5000);
    return () => clearInterval(timer);
  }, [trip?.id, trip?.status, session?.token, session?.user.riderProfileId, latitude, longitude, isRide]);

  const markers = useMemo(() => {
    if (!trip) return [];
    return isRide ? markersForRide(trip as (typeof rides)[0]) : markersForDelivery(trip as (typeof deliveries)[0]);
  }, [trip, isRide]);

  const status = trip?.status ?? "assigned";
  const navLat = Number(
    ["started", "picked_up", "in_transit"].includes(status.toLowerCase())
      ? isRide
        ? (trip as typeof rides[0] | undefined)?.destinationLatitude
        : (trip as typeof deliveries[0] | undefined)?.dropoffLatitude
      : isRide
        ? (trip as typeof rides[0] | undefined)?.pickupLatitude
        : (trip as typeof deliveries[0] | undefined)?.pickupLatitude,
  );
  const navLon = Number(
    ["started", "picked_up", "in_transit"].includes(status.toLowerCase())
      ? isRide
        ? (trip as typeof rides[0] | undefined)?.destinationLongitude
        : (trip as typeof deliveries[0] | undefined)?.dropoffLongitude
      : isRide
        ? (trip as typeof rides[0] | undefined)?.pickupLongitude
        : (trip as typeof deliveries[0] | undefined)?.pickupLongitude,
  );
  const isActiveTrip = ACTIVE_STATUSES.includes(status.toLowerCase());
  const livePreview = useLiveRoutePreview(
    session?.token,
    latitude && longitude ? { latitude, longitude } : null,
    navLat && navLon ? { latitude: navLat, longitude: navLon } : null,
    Boolean(trip) && isActiveTrip,
  );

  if (!trip) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.notFound}>Trip not found</Text>
      </SafeAreaView>
    );
  }

  const nextStatus = isRide ? nextRideStatus(status) : nextDeliveryStatus(status);
  const steps = isRide ? RIDE_STEPS : DELIVERY_STEPS;
  const currentIndex = stepIndexForStatus(status, isRide ? "ride" : "delivery");
  const passengerPhone = trip.passenger?.user?.phoneE164;
  const canRatePassenger = isRide && status.toLowerCase() === "completed";
  const navLabel = ["started", "picked_up", "in_transit"].includes(status.toLowerCase())
    ? isRide
      ? (trip as typeof rides[0]).destinationAddress
      : (trip as typeof deliveries[0]).dropoffAddress
    : isRide
      ? (trip as typeof rides[0]).pickupAddress
      : (trip as typeof deliveries[0]).pickupAddress;

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
      if (!isRide && (nextStatus === "completed" || nextStatus === "delivered")) router.back();
    } finally {
      setLoading(false);
    }
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
      Alert.alert("Thanks!", "Your passenger rating was submitted.");
      router.back();
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
          title: "Active trip",
          ...stackHeaderOptions,
        }}
      />
      <View style={styles.screen}>
        <AppMap style={styles.map} markers={markers} fitToMarkers />

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.wsStatus}>
            {riderWs.isConnected() ? "Live updates connected" : "Polling for updates"}
            {livePreview ? ` · ETA ~${Math.round(livePreview.durationMinutes)} min (${livePreview.distanceKm.toFixed(1)} km)` : ""}
          </Text>

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

          <Card>
            <Text style={styles.section}>Navigate</Text>
            <View style={styles.navRow}>
              <Button
                label="Google Maps"
                variant="outline"
                icon={<MapPin size={16} color={colors.primary} />}
                style={styles.navBtn}
                onPress={() => openGoogleMapsNavigation(navLat, navLon, navLabel)}
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

          <Card>
            <Text style={styles.section}>Progress</Text>
            <TripTimeline steps={steps} currentIndex={currentIndex} />
          </Card>

          {canRatePassenger ? (
            <Card>
              <Text style={styles.section}>Rate passenger</Text>
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
              <Input label="Review (optional)" value={review} onChangeText={setReview} placeholder="How was this passenger?" />
              <Button label="Submit rating" loading={ratingLoading} onPress={submitPassengerRating} fullWidth />
              <Button label="Skip for now" variant="outline" onPress={() => router.back()} fullWidth />
            </Card>
          ) : null}

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
