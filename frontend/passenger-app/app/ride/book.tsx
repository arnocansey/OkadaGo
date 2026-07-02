import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, LocateFixed, Navigation } from "lucide-react-native";
import { api, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { useTheme } from "@/context/ThemeContext";
import { AddressAutocompleteField } from "@/components/AddressAutocompleteField";
import { AppMap } from "@/components/AppMap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/theme/tokens";
import type { LocationResult, PaymentMethod, PlaceSuggestion, RoutePreview, SavedPlace, ServiceZone } from "@/types";

const FALLBACK_DEST = { latitude: 5.556, longitude: -0.182 };
const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "wallet", label: "Wallet" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "mobile_money", label: "Mobile money" },
];

type PromoApplyResult = {
  promoCodeId: string;
  code: string;
  name: string;
  discountAmount: number;
};

function estimateZoneFare(zone: ServiceZone | undefined, distanceKm: number, durationMinutes: number) {
  if (!zone) return distanceKm * 2.5;
  const base = Number(zone.baseFare ?? 0);
  const perKm = Number(zone.perKmFee ?? 0);
  const perMin = Number(zone.perMinuteFee ?? 0);
  const minimum = Number(zone.minimumFare ?? 0);
  return Math.max(minimum, base + perKm * distanceKm + perMin * durationMinutes);
}

export default function BookRideScreen() {
  const { mode, placeId } = useLocalSearchParams<{ mode?: string; placeId?: string }>();
  const isDelivery = mode === "delivery";
  const { session, zones, refresh } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = Math.max(300, Math.round(windowHeight * 0.44));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        mapSection: { height: mapHeight, minHeight: 300 },
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
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        chipText: { ...typography.captionMedium, color: colors.textSecondary },
        chipTextActive: { color: colors.primary },
        promoHint: { ...typography.caption, color: colors.success },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography, mapHeight],
  );
  const {
    address: pickup,
    submitAddress: pickupSubmitAddress,
    setAddress: setPickup,
    selectAddress: selectPickupAddress,
    coords: pickupCoords,
    hint: pickupHint,
    locationLoading: pickupLocationLoading,
    resolving: pickupResolving,
    useCurrentLocation,
  } = useResolvedLocationAddress();
  const [destination, setDestination] = useState("");
  const [pickupFocused, setPickupFocused] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);
  const [destSelected, setDestSelected] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [destCoords, setDestCoords] = useState(FALLBACK_DEST);
  const [estimate, setEstimate] = useState<RoutePreview | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    return estimateZoneFare(zones[0], estimate.distanceKm, estimate.durationMinutes);
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
    if (destination && destResolved) {
      pts.push({ id: "dest", latitude: destCoords.latitude, longitude: destCoords.longitude, title: "Destination", pinColor: colors.mapMarkerDestination });
    }
    return pts;
  }, [pickupCoords, destCoords, destination, destResolved, colors]);

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
            pickupAddress,
            pickupLatitude: pickupCoords.latitude,
            pickupLongitude: pickupCoords.longitude,
            dropoffAddress: destination,
            dropoffLatitude: destCoords.latitude,
            dropoffLongitude: destCoords.longitude,
            recipientName,
            recipientPhoneE164: recipientPhone.startsWith("+") ? recipientPhone : `+233${recipientPhone.replace(/\D/g, "")}`,
            packageType: "parcel",
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
            },
            destination: {
              address: destination,
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
            },
            estimatedDistanceKm,
            estimatedDurationMinutes,
            rideType: "standard_bike",
            promoDiscount,
            promoCode: appliedPromoCode ?? (promoCode.trim() || undefined),
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
      <SafeAreaView style={styles.screen} edges={["bottom"]}>
        <View style={styles.mapSection}>
          <AppMap
            style={StyleSheet.absoluteFillObject}
            region={{ ...pickupCoords, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
            markers={markers}
            routeCoordinates={routeCoordinates}
            fitToMarkers={markers.length >= 2}
          />
        </View>

        <ScrollView
          style={styles.formSection}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pickupRow}>
            <View style={[styles.pickupInput, { zIndex: 2 }]}>
              <AddressAutocompleteField
                label="Pickup"
                value={pickup}
                onChangeText={setPickup}
                onFocus={() => setPickupFocused(true)}
                onBlur={() => setTimeout(() => setPickupFocused(false), 150)}
                placeholder="Enter pickup address"
                hint={pickupHint ?? undefined}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={styles.addressInput}
                suggestions={pickupAutocomplete.suggestions}
                suggestionsLoading={pickupAutocomplete.loading}
                suggestionsError={pickupAutocomplete.error}
                showSuggestions={pickupFocused}
                onSelectSuggestion={(suggestion) => void choosePickupSuggestion(suggestion)}
              />
            </View>
            <Pressable
              style={styles.locateBtn}
              onPress={() => void useCurrentLocation()}
              accessibilityLabel="Use current location"
            >
              <LocateFixed size={20} color={colors.primary} />
            </Pressable>
          </View>

          <AddressAutocompleteField
            label={isDelivery ? "Drop-off address" : "Destination"}
            value={destination}
            onChangeText={(value) => {
              setDestination(value);
              setDestSelected(false);
            }}
            onFocus={() => setDestinationFocused(true)}
            onBlur={() => setTimeout(() => setDestinationFocused(false), 150)}
            placeholder="Type an address in Accra…"
            suggestions={destinationAutocomplete.suggestions}
            suggestionsLoading={destinationAutocomplete.loading}
            suggestionsError={destinationAutocomplete.error}
            showSuggestions={destinationFocused}
            onSelectSuggestion={(suggestion) => void chooseDestinationSuggestion(suggestion)}
          />

          {isDelivery ? (
            <View style={styles.fieldStack}>
              <Input label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
              <Input label="Recipient phone" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
              <Input label="Package details" value={packageDesc} onChangeText={setPackageDesc} placeholder="What's inside?" />
            </View>
          ) : estimate ? (
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
                {PAYMENT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[styles.chip, paymentMethod === option.id && styles.chipActive]}
                    onPress={() => setPaymentMethod(option.id)}
                  >
                    <Text style={[styles.chipText, paymentMethod === option.id && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input
              label="Promo code"
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Optional"
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
              label={isDelivery ? "Request delivery" : "Request ride"}
              loading={loading}
              onPress={submit}
              fullWidth
              disabled={!destination.trim() || pickupLocationLoading || pickupResolving}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
