import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike, Clock, LocateFixed, MapPinned, Navigation, Plus, Trash2, Truck, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { api, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { useTheme } from "@/context/ThemeContext";
import { formatReverseGeocodeAddress } from "@/lib/geocode";
import { AddressAutocompleteField } from "@/components/AddressAutocompleteField";
import { AppMap } from "@/components/AppMap";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/theme/tokens";
import type { LocationResult, PaymentMethod, PlaceSuggestion, RoutePreview, SavedPlace, ServiceZone } from "@/types";

const FALLBACK_DEST = { latitude: 5.556, longitude: -0.182 };

type RideType = "standard" | "express" | "cargo";

function toApiRideType(rideType: RideType): "standard_bike" | "express_bike" | "cargo_tricycle" {
  if (rideType === "express") return "express_bike";
  if (rideType === "cargo") return "cargo_tricycle";
  return "standard_bike";
}

function toSurgeMultiplier(rideType: RideType) {
  return rideType === "express" ? 1.2 : 1;
}

type ExtraStop = {
  id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  landmark: string;
};

type PinDropTarget = "pickup" | "destination" | { stopId: string } | null;
const MAX_EXTRA_STOPS = 2;

type ScheduleOptionId = "now" | "30m" | "1h" | "2h" | "tomorrow_morning";

function computeScheduledFor(option: ScheduleOptionId): Date | null {
  if (option === "now") return null;
  const now = new Date();
  if (option === "30m") return new Date(now.getTime() + 30 * 60 * 1000);
  if (option === "1h") return new Date(now.getTime() + 60 * 60 * 1000);
  if (option === "2h") return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  return tomorrow;
}

function formatScheduledFor(date: Date): string {
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PACKAGE_TYPE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "parcel", label: "Parcel" },
  { id: "food", label: "Food" },
  { id: "document", label: "Document" },
  { id: "fragile", label: "Fragile" },
];

type PromoApplyResult = {
  promoCodeId: string;
  code: string;
  name: string;
  discountAmount: number;
};

function estimateZoneFare(zone: ServiceZone | undefined, distanceKm: number, durationMinutes: number, surgeMultiplier = 1) {
  if (!zone) return distanceKm * 2.5 * surgeMultiplier;
  const base = Number(zone.baseFare ?? 0);
  const perKm = Number(zone.perKmFee ?? 0);
  const perMin = Number(zone.perMinuteFee ?? 0);
  const minimum = Number(zone.minimumFare ?? 0);
  return Math.max(minimum, base + perKm * distanceKm + perMin * durationMinutes) * surgeMultiplier;
}

export default function BookRideScreen() {
  const { t } = useTranslation();
  const { mode, placeId } = useLocalSearchParams<{ mode?: string; placeId?: string }>();
  const isDelivery = mode === "delivery";
  const { session, zones, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = Math.max(300, Math.round(windowHeight * 0.44));

  const paymentOptions: Array<{ id: PaymentMethod; label: string }> = useMemo(
    () => [
      { id: "mobile_money", label: t("book.paymentMobileMoney") },
      { id: "cash", label: t("book.paymentCash") },
      { id: "wallet", label: t("book.paymentWallet") },
      { id: "card", label: t("book.paymentCard") },
    ],
    [t],
  );

  const rideTypeOptions: Array<{ id: RideType; label: string; sub: string; icon: typeof Bike }> = useMemo(
    () => [
      { id: "standard", label: "OkadaGo", sub: t("book.rideTypeStandard"), icon: Bike },
      { id: "express", label: "OkadaX", sub: t("book.rideTypeExpress"), icon: Zap },
      { id: "cargo", label: "Cargo", sub: t("book.rideTypeCargo"), icon: Truck },
    ],
    [t],
  );

  const scheduleOptions: Array<{ id: ScheduleOptionId; label: string }> = useMemo(
    () => [
      { id: "now", label: t("book.now") },
      { id: "30m", label: "In 30 min" },
      { id: "1h", label: "In 1 hour" },
      { id: "2h", label: "In 2 hours" },
      { id: "tomorrow_morning", label: "Tomorrow, 8:00 AM" },
    ],
    [t],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        mapSection: { overflow: "hidden" },
        searchBanner: {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          backgroundColor: colors.primaryLight,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        searchBannerText: { ...typography.captionMedium, color: colors.primary },
        formSection: { flex: 1 },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        fieldStack: { gap: spacing.md },
        pickupRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
        pickupInput: { flex: 1 },
        addressInput: { minHeight: 64, paddingTop: spacing.md },
        locateBtn: {
          width: 52,
          height: 52,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        locateBtnActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
        },
        extraStopsSection: { gap: spacing.md },
        extraStopCard: {
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        extraStopHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        extraStopLabel: { ...typography.captionMedium, color: colors.textSecondary },
        addStopBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: colors.primary,
        },
        addStopBtnText: { ...typography.bodySemibold, color: colors.primary },
        estimate: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.primaryLight,
          borderRadius: radius.md,
          padding: spacing.lg,
          gap: spacing.lg,
        },
        estimateStat: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
        estimateText: { ...typography.bodySemibold, color: colors.primary },
        estimateDivider: { width: 1, height: 20, backgroundColor: colors.primary, opacity: 0.3 },
        sectionLabel: { ...typography.captionMedium, color: colors.textMuted },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
        promoHint: { ...typography.caption, color: colors.success },
        error: { ...typography.caption, color: colors.danger },
        rideTypeRow: { flexDirection: "row", gap: spacing.sm },
        rideTypeOption: {
          flex: 1,
          alignItems: "center",
          gap: 2,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xs,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        rideTypeOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
        rideTypeLabel: { ...typography.captionMedium, color: colors.text, marginTop: spacing.xs },
        rideTypeLabelActive: { color: colors.primary },
        rideTypeSub: { ...typography.caption, color: colors.textMuted },
        rideTypeFare: { ...typography.captionMedium, color: colors.primary, marginTop: 2 },
      }),
    [colors, typography],
  );
  const {
    address: pickup,
    submitAddress: pickupSubmitAddress,
    setAddress: setPickup,
    selectAddress: selectPickupAddress,
    coords: pickupCoords,
    isMocked: pickupIsMocked,
    hint: pickupHint,
    locationLoading: pickupLocationLoading,
    resolving: pickupResolving,
    useCurrentLocation,
    pinDropLocation,
  } = useResolvedLocationAddress();
  const [pinDropTarget, setPinDropTarget] = useState<PinDropTarget>(null);
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [destLandmark, setDestLandmark] = useState("");
  const [additionalStops, setAdditionalStops] = useState<ExtraStop[]>([]);
  const [destination, setDestination] = useState("");
  const [pickupFocused, setPickupFocused] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);
  const [destSelected, setDestSelected] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [packageType, setPackageType] = useState("parcel");
  const [rideType, setRideType] = useState<RideType>("standard");
  const [destCoords, setDestCoords] = useState(FALLBACK_DEST);
  const [estimate, setEstimate] = useState<RoutePreview | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scheduleOption, setScheduleOption] = useState<ScheduleOptionId>("now");
  const scheduledForDate = useMemo(() => computeScheduledFor(scheduleOption), [scheduleOption]);
  const isSearching = pickupFocused || destinationFocused;
  const activeMapHeight = pinDropTarget
    ? Math.max(220, Math.round(windowHeight * 0.36))
    : isSearching
      ? 0
      : mapHeight;

  const pickupAutocomplete = useAddressAutocomplete({
    token: session?.token,
    query: pickup,
    proximity: pickupCoords,
    enabled: pickupFocused && !pickupLocationLoading && !pickupResolving,
  });

  const destinationAutocomplete = useAddressAutocomplete({
    token: session?.token,
    query: destination,
    proximity: pickupCoords,
    enabled: destinationFocused,
  });

  async function choosePickupSuggestion(suggestion: PlaceSuggestion) {
    try {
      const resolved = await pickupAutocomplete.resolveSuggestion(suggestion);
      selectPickupAddress(resolved.address, resolved.latitude, resolved.longitude);
      pickupAutocomplete.clearSuggestions();
      setPickupFocused(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not select pickup location.");
    }
  }

  async function chooseDestinationSuggestion(suggestion: PlaceSuggestion) {
    try {
      const resolved = await destinationAutocomplete.resolveSuggestion(suggestion);
      setDestination(resolved.address);
      setDestCoords({ latitude: resolved.latitude, longitude: resolved.longitude });
      setDestSelected(true);
      destinationAutocomplete.clearSuggestions();
      setDestinationFocused(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not select destination.");
    }
  }

  async function dropDestinationPin(coordinate: { latitude: number; longitude: number }) {
    setDestCoords(coordinate);
    setDestSelected(true);
    setDestination("Resolving address…");
    if (!session?.token) return;
    try {
      const result = await api<LocationResult>(
        `/bootstrap/reverse-geocode?lat=${coordinate.latitude}&lon=${coordinate.longitude}`,
        { token: session.token },
      );
      setDestination(formatReverseGeocodeAddress(result));
    } catch {
      setDestination("Dropped pin location");
    }
  }

  async function dropExtraStopPin(stopId: string, coordinate: { latitude: number; longitude: number }) {
    setAdditionalStops((current) =>
      current.map((stop) =>
        stop.id === stopId
          ? { ...stop, latitude: coordinate.latitude, longitude: coordinate.longitude, address: "Resolving address…" }
          : stop,
      ),
    );
    if (!session?.token) return;
    try {
      const result = await api<LocationResult>(
        `/bootstrap/reverse-geocode?lat=${coordinate.latitude}&lon=${coordinate.longitude}`,
        { token: session.token },
      );
      const address = formatReverseGeocodeAddress(result);
      setAdditionalStops((current) => current.map((stop) => (stop.id === stopId ? { ...stop, address } : stop)));
    } catch {
      setAdditionalStops((current) =>
        current.map((stop) => (stop.id === stopId ? { ...stop, address: "Dropped pin location" } : stop)),
      );
    }
  }

  function addExtraStop() {
    if (additionalStops.length >= MAX_EXTRA_STOPS) return;
    setAdditionalStops((current) => [
      ...current,
      { id: `stop-${Date.now()}`, address: "", latitude: null, longitude: null, landmark: "" },
    ]);
  }

  function removeExtraStop(stopId: string) {
    setAdditionalStops((current) => current.filter((stop) => stop.id !== stopId));
    setPinDropTarget((current) =>
      typeof current === "object" && current?.stopId === stopId ? null : current,
    );
  }

  function handleMapPress(coordinate: { latitude: number; longitude: number }) {
    if (pinDropTarget === "pickup") {
      void pinDropLocation(coordinate.latitude, coordinate.longitude);
      setPinDropTarget(null);
    } else if (pinDropTarget === "destination") {
      void dropDestinationPin(coordinate);
      setPinDropTarget(null);
    } else if (typeof pinDropTarget === "object" && pinDropTarget !== null) {
      void dropExtraStopPin(pinDropTarget.stopId, coordinate);
      setPinDropTarget(null);
    }
  }

  useEffect(() => {
    if (session?.user.isPhoneVerified === false) {
      router.replace("/(auth)/verify-phone");
    }
  }, [session?.user.isPhoneVerified]);

  useEffect(() => {
    if (!session?.token || !placeId) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then((places) => {
        const place = places.find((item) => item.id === placeId);
        if (!place) return;
        setDestination(place.address);
        setDestCoords({
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
        });
        setDestSelected(true);
      })
      .catch(() => undefined);
  }, [session?.token, placeId]);

  useEffect(() => {
    if (!destination.trim() || !session || destSelected) return;
    const timer = setTimeout(() => {
      api<LocationResult>(`/bootstrap/forward-geocode?q=${encodeURIComponent(destination.trim())}`, {
        token: session.token,
      })
        .then((result) => setDestCoords({ latitude: result.latitude, longitude: result.longitude }))
        .catch(() => setDestCoords(FALLBACK_DEST));
    }, 600);
    return () => clearTimeout(timer);
  }, [destination, session, destSelected]);

  const destResolved = destCoords !== FALLBACK_DEST;

  useEffect(() => {
    if (!destination.trim() || !destResolved || !session) return;
    const params = new URLSearchParams({
      startLat: `${pickupCoords.latitude}`,
      startLon: `${pickupCoords.longitude}`,
      endLat: `${destCoords.latitude}`,
      endLon: `${destCoords.longitude}`,
    });
    api<RoutePreview>(`/bootstrap/route-preview?${params.toString()}`, { token: session.token })
      .then(setEstimate)
      .catch(() => setEstimate(null));
  }, [destination, destResolved, session, pickupCoords, destCoords]);

  const estimatedFare = useMemo(() => {
    if (!estimate) return 0;
    return estimateZoneFare(zones[0], estimate.distanceKm, estimate.durationMinutes, toSurgeMultiplier(rideType));
  }, [estimate, zones, rideType]);

  const fareByType = useMemo(() => {
    if (!estimate) return {} as Record<RideType, number>;
    return rideTypeOptions.reduce((acc, option) => {
      acc[option.id] = estimateZoneFare(zones[0], estimate.distanceKm, estimate.durationMinutes, toSurgeMultiplier(option.id));
      return acc;
    }, {} as Record<RideType, number>);
  }, [estimate, zones]);

  useEffect(() => {
    if (!promoCode.trim() || !estimate || isDelivery || !session?.token) {
      setPromoDiscount(0);
      setPromoMessage("");
      setAppliedPromoCode(undefined);
      return;
    }

    const timer = setTimeout(() => {
      api<PromoApplyResult>("/promotions/apply", {
        method: "POST",
        token: session.token,
        body: {
          code: promoCode.trim(),
          estimatedFare,
          currency: zones[0]?.currency ?? session.user.preferredCurrency ?? "GHS",
          city: zones[0]?.city,
        },
      })
        .then((result) => {
          setPromoDiscount(result.discountAmount ?? 0);
          setAppliedPromoCode(result.code);
          setPromoMessage(`${result.name} applied`);
        })
        .catch(() => {
          setPromoDiscount(0);
          setAppliedPromoCode(undefined);
          setPromoMessage("");
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [promoCode, estimate, isDelivery, zones, session?.token, session?.user.preferredCurrency, estimatedFare]);

  const routeCoordinates = useMemo(() => {
    if (estimate?.route?.length) {
      return estimate.route.map(([latitude, longitude]) => ({ latitude, longitude }));
    }
    if (destination.trim() && destResolved) {
      return [
        { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
        { latitude: destCoords.latitude, longitude: destCoords.longitude },
      ];
    }
    return undefined;
  }, [estimate?.route, destination, destResolved, pickupCoords, destCoords]);

  const markers = useMemo(() => {
    const pts = [];
    pts.push({ id: "pickup", latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, title: "Pickup", pinColor: colors.primary });
    additionalStops.forEach((stop, index) => {
      if (stop.latitude != null && stop.longitude != null) {
        pts.push({
          id: stop.id,
          latitude: stop.latitude,
          longitude: stop.longitude,
          title: `Stop ${index + 1}`,
          pinColor: colors.mapMarkerDestination,
        });
      }
    });
    if (destination && destResolved) {
      pts.push({ id: "dest", latitude: destCoords.latitude, longitude: destCoords.longitude, title: "Destination", pinColor: colors.mapMarkerDestination });
    }
    return pts;
  }, [pickupCoords, destCoords, destination, destResolved, additionalStops, colors]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const passengerProfileId = session!.user.passengerProfileId;
      const serviceZoneId = zones[0]?.id;
      if (!passengerProfileId) {
        throw new Error("Passenger profile missing. Sign out and sign back in.");
      }
      if (!serviceZoneId) {
        throw new Error("No service zone configured yet.");
      }
      if (!destination.trim() || !destResolved) {
        throw new Error("Set a valid destination first.");
      }

      const pickupAddress = pickupSubmitAddress.trim() || pickup.trim();
      const estimatedDistanceKm = estimate?.distanceKm ?? 1;
      const estimatedDurationMinutes = Math.max(1, Math.round(estimate?.durationMinutes ?? 5));

      if (isDelivery) {
        await api("/deliveries/request", {
          method: "POST",
          token: session!.token,
          body: {
            passengerProfileId,
            serviceZoneId,
            paymentMethod,
            pickup: {
              address: pickupAddress,
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
              landmark: pickupLandmark.trim() || undefined,
              isMocked: pickupIsMocked,
            },
            dropoff: {
              address: destination,
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
              landmark: destLandmark.trim() || undefined,
            },
            additionalStops: additionalStops
              .filter((stop) => stop.address.trim() && stop.latitude != null && stop.longitude != null)
              .map((stop) => ({
                address: stop.address.trim(),
                latitude: stop.latitude,
                longitude: stop.longitude,
                landmark: stop.landmark.trim() || undefined,
              })),
            recipientName,
            recipientPhoneE164: recipientPhone.startsWith("+") ? recipientPhone : `+233${recipientPhone.replace(/\D/g, "")}`,
            packageType,
            packageDescription: packageDesc || "Package delivery",
            estimatedDistanceKm,
            estimatedDurationMinutes,
            promoDiscount,
            promoCode: promoCode.trim() || undefined,
          },
        });
      } else {
        const response = await api<{ ride: { id: string } }>("/rides/request", {
          method: "POST",
          token: session!.token,
          body: {
            passengerProfileId,
            serviceZoneId,
            paymentMethod,
            pickup: {
              address: pickupAddress,
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
              landmark: pickupLandmark.trim() || undefined,
              isMocked: pickupIsMocked,
            },
            destination: {
              address: destination,
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
              landmark: destLandmark.trim() || undefined,
            },
            estimatedDistanceKm,
            estimatedDurationMinutes,
            rideType: toApiRideType(rideType),
            surgeMultiplier: toSurgeMultiplier(rideType),
            promoDiscount,
            promoCode: appliedPromoCode ?? (promoCode.trim() || undefined),
            scheduledFor: scheduledForDate ? scheduledForDate.toISOString() : undefined,
          },
        });
        await refresh();
        router.replace(`/ride/track/${response.ride.id}`);
        return;
      }
      await refresh();
      router.replace("/(main)/trips");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isDelivery ? "Send package" : "Book ride",
          ...stackHeaderOptions,
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <SafeAreaView style={styles.screen} edges={["bottom"]}>
          {activeMapHeight > 0 ? (
            <View style={[styles.mapSection, { height: activeMapHeight }]}>
              <AppMap
                style={StyleSheet.absoluteFillObject}
                region={{ ...pickupCoords, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
                markers={markers}
                routeCoordinates={routeCoordinates}
                fitToMarkers={markers.length >= 2}
                onMapPress={pinDropTarget ? handleMapPress : undefined}
                pinDropHint={
                  pinDropTarget === "pickup"
                    ? "Tap the map to drop your pickup pin"
                    : pinDropTarget === "destination"
                      ? `Tap the map to drop your ${isDelivery ? "drop-off" : "destination"} pin`
                      : typeof pinDropTarget === "object" && pinDropTarget !== null
                        ? "Tap the map to drop this stop's pin"
                        : undefined
                }
              />
            </View>
          ) : (
            <View style={styles.searchBanner}>
              <Text style={styles.searchBannerText}>Searching addresses — map hidden</Text>
            </View>
          )}

          <ScrollView
            style={styles.formSection}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.pickupRow}>
            <View style={[styles.pickupInput, { zIndex: 2 }]}>
              <AddressAutocompleteField
                label={t("book.pickup")}
                value={pickup}
                onChangeText={setPickup}
                onFocus={() => setPickupFocused(true)}
                onBlur={() => setTimeout(() => setPickupFocused(false), 150)}
                placeholder={t("book.pickupPlaceholder")}
                hint={pickupHint ?? undefined}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={styles.addressInput}
                suggestions={pickupAutocomplete.suggestions}
                suggestionsLoading={pickupAutocomplete.loading}
                suggestionsError={pickupAutocomplete.error}
                showSuggestions={pickupFocused}
                expanded={isSearching && pickupFocused}
                onSelectSuggestion={(suggestion) => void choosePickupSuggestion(suggestion)}
              />
            </View>
            <Pressable
              style={styles.locateBtn}
              onPress={() => void useCurrentLocation()}
              accessibilityLabel={t("book.useCurrentLocation")}
            >
              <LocateFixed size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              style={[styles.locateBtn, pinDropTarget === "pickup" && styles.locateBtnActive]}
              onPress={() => setPinDropTarget((current) => (current === "pickup" ? null : "pickup"))}
              accessibilityLabel={t("book.dropPin")}
            >
              <MapPinned size={20} color={pinDropTarget === "pickup" ? colors.textOnPrimary : colors.primary} />
            </Pressable>
          </View>
          <Input
            label={t("book.pickupLandmark")}
            value={pickupLandmark}
            onChangeText={setPickupLandmark}
            placeholder={t("book.landmarkPlaceholder")}
          />

          {isDelivery ? (
            <View style={styles.extraStopsSection}>
              {additionalStops.map((stop, index) => (
                <View key={stop.id} style={styles.extraStopCard}>
                  <View style={styles.extraStopHeader}>
                    <Text style={styles.extraStopLabel}>Stop {index + 1}</Text>
                    <Pressable onPress={() => removeExtraStop(stop.id)} accessibilityLabel="Remove stop">
                      <Trash2 size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                  <View style={styles.pickupRow}>
                    <Input
                      style={styles.pickupInput}
                      value={stop.address}
                      onChangeText={(value) =>
                        setAdditionalStops((current) =>
                          current.map((s) => (s.id === stop.id ? { ...s, address: value } : s)),
                        )
                      }
                      placeholder="Address for this stop"
                    />
                    <Pressable
                      style={[
                        styles.locateBtn,
                        typeof pinDropTarget === "object" &&
                          pinDropTarget?.stopId === stop.id &&
                          styles.locateBtnActive,
                      ]}
                      onPress={() =>
                        setPinDropTarget((current) =>
                          typeof current === "object" && current?.stopId === stop.id
                            ? null
                            : { stopId: stop.id },
                        )
                      }
                      accessibilityLabel="Drop stop pin on map"
                    >
                      <MapPinned
                        size={20}
                        color={
                          typeof pinDropTarget === "object" && pinDropTarget?.stopId === stop.id
                            ? colors.textOnPrimary
                            : colors.primary
                        }
                      />
                    </Pressable>
                  </View>
                  <Input
                    label="Landmark (optional)"
                    value={stop.landmark}
                    onChangeText={(value) =>
                      setAdditionalStops((current) =>
                        current.map((s) => (s.id === stop.id ? { ...s, landmark: value } : s)),
                      )
                    }
                    placeholder="e.g. Near the taxi rank"
                  />
                </View>
              ))}
              {additionalStops.length < MAX_EXTRA_STOPS ? (
                <Pressable style={styles.addStopBtn} onPress={addExtraStop}>
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addStopBtnText}>Add another stop</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.pickupRow}>
            <View style={[styles.pickupInput, { zIndex: 2 }]}>
              <AddressAutocompleteField
                label={
                  isDelivery
                    ? additionalStops.length > 0
                      ? "Final drop-off address"
                      : t("book.dropoff")
                    : t("book.destination")
                }
                value={destination}
                onChangeText={(value) => {
                  setDestination(value);
                  setDestSelected(false);
                }}
                onFocus={() => setDestinationFocused(true)}
                onBlur={() => setTimeout(() => setDestinationFocused(false), 150)}
                placeholder={t("book.destinationPlaceholder")}
                suggestions={destinationAutocomplete.suggestions}
                suggestionsLoading={destinationAutocomplete.loading}
                suggestionsError={destinationAutocomplete.error}
                showSuggestions={destinationFocused}
                expanded={isSearching && destinationFocused}
                onSelectSuggestion={(suggestion) => void chooseDestinationSuggestion(suggestion)}
              />
            </View>
            <Pressable
              style={[styles.locateBtn, pinDropTarget === "destination" && styles.locateBtnActive]}
              onPress={() => setPinDropTarget((current) => (current === "destination" ? null : "destination"))}
              accessibilityLabel="Drop destination pin on map"
            >
              <MapPinned size={20} color={pinDropTarget === "destination" ? colors.textOnPrimary : colors.primary} />
            </Pressable>
          </View>
          <Input
            label={t("book.destinationLandmark", {
              kind: isDelivery ? t("book.dropoff") : t("book.destination"),
            })}
            value={destLandmark}
            onChangeText={setDestLandmark}
            placeholder={t("book.landmarkPlaceholder")}
          />

          {isDelivery ? (
            <View style={styles.fieldStack}>
              <View>
                <Text style={styles.sectionLabel}>Package type</Text>
                <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                  {PACKAGE_TYPE_OPTIONS.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      selected={packageType === option.id}
                      onPress={() => setPackageType(option.id)}
                    />
                  ))}
                </View>
              </View>
              <Input label={t("book.recipientName")} value={recipientName} onChangeText={setRecipientName} />
              <Input label={t("book.recipientPhone")} value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
              <Input label={t("book.packageDetails")} value={packageDesc} onChangeText={setPackageDesc} placeholder={t("book.packagePlaceholder")} />
            </View>
          ) : (
            <View>
              <Text style={styles.sectionLabel}>Ride type</Text>
              <View style={[styles.rideTypeRow, { marginTop: spacing.sm }]}>
                {rideTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const active = rideType === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[styles.rideTypeOption, active && styles.rideTypeOptionActive]}
                      onPress={() => setRideType(option.id)}
                    >
                      <Icon size={24} color={active ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.rideTypeLabel, active && styles.rideTypeLabelActive]}>{option.label}</Text>
                      <Text style={styles.rideTypeSub}>{option.sub}</Text>
                      {fareByType[option.id] ? (
                        <Text style={styles.rideTypeFare}>{money(fareByType[option.id], zones[0]?.currency)}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {!isDelivery ? (
            <View>
              <Text style={styles.sectionLabel}>When</Text>
              <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                {scheduleOptions.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={scheduleOption === option.id}
                    onPress={() => setScheduleOption(option.id)}
                  />
                ))}
              </View>
              {scheduledForDate ? (
                <Text style={styles.promoHint}>
                  Scheduled for {formatScheduledFor(scheduledForDate)}. We&apos;ll match you with a rider closer to
                  your pickup time.
                </Text>
              ) : null}
            </View>
          ) : null}

          {!isDelivery && estimate ? (
            <View style={styles.estimate}>
              <View style={styles.estimateStat}>
                <Navigation size={16} color={colors.primary} />
                <Text style={styles.estimateText}>{estimate.distanceKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.estimateDivider} />
              <View style={styles.estimateStat}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.estimateText}>~{Math.round(estimate.durationMinutes)} min</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.fieldStack}>
            <View>
              <Text style={styles.sectionLabel}>Payment method</Text>
              <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
                {paymentOptions.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.label}
                    selected={paymentMethod === option.id}
                    onPress={() => setPaymentMethod(option.id)}
                  />
                ))}
              </View>
            </View>

            <Input
              label={t("book.promoCode")}
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder={t("book.optional")}
              autoCapitalize="characters"
            />
            {promoMessage ? <Text style={styles.promoHint}>{promoMessage}</Text> : null}

            {!isDelivery && estimate ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sectionLabel}>Estimated fare</Text>
                <Text style={styles.estimateText}>
                  {money(Math.max(0, estimatedFare - promoDiscount), zones[0]?.currency)}
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={isDelivery ? t("book.requestDelivery") : scheduledForDate ? t("book.scheduleRide") : t("book.requestRide")}
              loading={loading}
              onPress={submit}
              fullWidth
              disabled={!destination.trim() || pickupLocationLoading || pickupResolving}
            />
          </View>
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
