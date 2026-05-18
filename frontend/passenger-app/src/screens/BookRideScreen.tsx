import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../api";
import { Card, Field, MapPanel, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { LocationResult, RoutePreview, ServiceZone, Session } from "../types";

export function BookRideScreen({ session, zones, onCreated }: { session: Session; zones: ServiceZone[]; onCreated: () => void }) {
  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [destination, setDestination] = useState<LocationResult | null>(null);
  const [route, setRoute] = useState<RoutePreview | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wallet" | "mobile_money">("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const zone = zones[0];

  async function resolveRoute() {
    if (!pickupText.trim() || !destinationText.trim()) {
      setError("Enter pickup and destination.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const [start, end] = await Promise.all([
        api<LocationResult>(`/bootstrap/forward-geocode?q=${encodeURIComponent(pickupText)}`),
        api<LocationResult>(`/bootstrap/forward-geocode?q=${encodeURIComponent(destinationText)}`),
      ]);
      const preview = await api<RoutePreview>(`/bootstrap/route-preview?startLat=${start.latitude}&startLon=${start.longitude}&endLat=${end.latitude}&endLon=${end.longitude}`);
      setPickup(start);
      setDestination(end);
      setRoute(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve this route.");
    } finally {
      setBusy(false);
    }
  }

  async function requestRide() {
    if (!session.user.passengerProfileId || !zone || !pickup || !destination || !route) {
      setError("Resolve your route before confirming the ride.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/rides/request", {
        method: "POST",
        body: {
          passengerProfileId: session.user.passengerProfileId,
          serviceZoneId: zone.id,
          paymentMethod,
          pickup: { address: pickup.displayName ?? pickup.label, latitude: pickup.latitude, longitude: pickup.longitude },
          destination: { address: destination.displayName ?? destination.label, latitude: destination.latitude, longitude: destination.longitude },
          estimatedDistanceKm: Math.max(route.distanceKm, 0.1),
          estimatedDurationMinutes: Math.max(route.durationMinutes, 1),
          rideType: "standard_bike",
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ride request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionTitle kicker="Book ride" title="Set your route" />
      <Card>
        <Field label="Pickup" value={pickupText} onChangeText={setPickupText} placeholder="Type pickup address" />
        <Field label="Destination" value={destinationText} onChangeText={setDestinationText} placeholder="Type destination address" />
        <PrimaryButton label={busy ? "Checking route..." : "Preview route"} onPress={resolveRoute} disabled={busy} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
      <MapPanel title={route ? `${route.distanceKm} km - ${route.durationMinutes} min` : "Route preview"} subtitle={pickup && destination ? `${pickup.label} to ${destination.label}` : "Resolve addresses to preview the trip."} />
      <Card>
        <SectionTitle kicker="Payment" title="Choose payment method" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {(["cash", "wallet", "mobile_money"] as const).map((method) => (
            <Pressable
              key={method}
              style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: paymentMethod === method ? "#F5B800" : "#111111", borderWidth: 1, borderColor: paymentMethod === method ? "#F5B800" : "#2C2C2C" }}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={{ color: paymentMethod === method ? "#111111" : "#DDE0E7", fontWeight: "900", textTransform: "capitalize" }}>{method.replace("_", " ")}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>{zone ? `${zone.name}, ${zone.city}` : "No service zone available yet."}</Text>
        <PrimaryButton label={busy ? "Requesting..." : "Confirm ride"} onPress={requestRide} disabled={busy || !zone} />
      </Card>
    </>
  );
}
