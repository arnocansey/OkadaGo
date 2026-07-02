import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, LocateFixed, Navigation } from "lucide-react-native";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { AppMap } from "@/components/AppMap";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { colors, radius, spacing, typography, stackHeaderOptions } from "@/theme/tokens";
import type { LocationResult, RoutePreview } from "@/types";

const FALLBACK_DEST = { latitude: 5.556, longitude: -0.182 };

export default function BookRideScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isDelivery = mode === "delivery";
  const { session, zones, refresh } = useApp();
  const {
    address: pickup,
    submitAddress: pickupSubmitAddress,
    setAddress: setPickup,
    coords: pickupCoords,
    hint: pickupHint,
    locationLoading: pickupLocationLoading,
    resolving: pickupResolving,
    useCurrentLocation,
  } = useResolvedLocationAddress();
  const [destination, setDestination] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDesc, setPackageDesc] = useState("");
  const [destCoords, setDestCoords] = useState(FALLBACK_DEST);
  const [estimate, setEstimate] = useState<RoutePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forward-geocode the destination
  useEffect(() => {
    if (!destination.trim() || !session) return;
    const timer = setTimeout(() => {
      api<LocationResult>(`/bootstrap/forward-geocode?q=${encodeURIComponent(destination.trim())}`, {
        token: session.token,
      })
        .then((result) => setDestCoords({ latitude: result.latitude, longitude: result.longitude }))
        .catch(() => setDestCoords(FALLBACK_DEST));
    }, 600);
    return () => clearTimeout(timer);
  }, [destination, session]);

  const destResolved = destCoords !== FALLBACK_DEST;

  // Route preview
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

  // Map markers
  const markers = useMemo(() => {
    const pts = [];
    pts.push({ id: "pickup", latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, title: "Pickup", pinColor: colors.primary });
    if (destination && destResolved) {
      pts.push({ id: "dest", latitude: destCoords.latitude, longitude: destCoords.longitude, title: "Destination", pinColor: colors.mapMarkerDestination });
    }
    return pts;
  }, [pickupCoords, destCoords, destination, destResolved]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      if (isDelivery) {
        await api("/deliveries/request", {
          method: "POST",
          token: session!.token,
          body: {
            serviceZoneId: zones[0]?.id,
            pickupAddress: pickupSubmitAddress.trim() || pickup.trim(),
            pickupLatitude: pickupCoords.latitude,
            pickupLongitude: pickupCoords.longitude,
            dropoffAddress: destination,
            dropoffLatitude: destCoords.latitude,
            dropoffLongitude: destCoords.longitude,
            recipientName,
            recipientPhoneE164: recipientPhone.startsWith("+") ? recipientPhone : `+233${recipientPhone.replace(/\D/g, "")}`,
            packageType: "parcel",
            packageDescription: packageDesc || "Package delivery",
          },
        });
      } else {
        await api("/rides/request", {
          method: "POST",
          token: session!.token,
          body: {
            serviceZoneId: zones[0]?.id,
            pickupAddress: pickupSubmitAddress.trim() || pickup.trim(),
            pickupLatitude: pickupCoords.latitude,
            pickupLongitude: pickupCoords.longitude,
            destinationAddress: destination,
            destinationLatitude: destCoords.latitude,
            destinationLongitude: destCoords.longitude,
          },
        });
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
        {/* Mini map preview */}
        <AppMap
          style={{ height: 180 }}
          region={{ ...pickupCoords, latitudeDelta: 0.025, longitudeDelta: 0.025 }}
          markers={markers}
          routeCoordinates={routeCoordinates}
          fitToMarkers={markers.length >= 2}
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.pickupRow}>
            <View style={styles.pickupInput}>
              <Input
                label="Pickup"
                value={pickup}
                onChangeText={setPickup}
                placeholder="Enter pickup address"
                hint={pickupHint ?? undefined}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                style={styles.addressInput}
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

          <Input
            label={isDelivery ? "Drop-off address" : "Destination"}
            value={destination}
            onChangeText={setDestination}
            placeholder="Type an address in Accra…"
          />

          {isDelivery ? (
            <>
              <Input label="Recipient name" value={recipientName} onChangeText={setRecipientName} />
              <Input label="Recipient phone" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
              <Input label="Package details" value={packageDesc} onChangeText={setPackageDesc} placeholder="What's inside?" />
            </>
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

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isDelivery ? "Request delivery" : "Request ride"}
            loading={loading}
            onPress={submit}
            fullWidth
            disabled={!destination.trim() || pickupLocationLoading || pickupResolving}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
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

  // Route estimate
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

  error: { ...typography.caption, color: colors.danger },
});
