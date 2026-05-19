import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../api";
import { Card, Field, MapPanel, Pill, PrimaryButton, SectionTitle, ServiceTile, styles } from "../components/ui";
import type { LocationResult, RoutePreview, ServiceZone, Session } from "../types";

export function BookRideScreen({ session, zones, onCreated }: { session: Session; zones: ServiceZone[]; onCreated: () => void }) {
  const [bookingType, setBookingType] = useState<"ride" | "delivery">("ride");
  const [pickupText, setPickupText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageType, setPackageType] = useState("parcel");
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
      await api(bookingType === "delivery" ? "/deliveries/request" : "/rides/request", {
        method: "POST",
        body:
          bookingType === "delivery"
            ? {
                passengerProfileId: session.user.passengerProfileId,
                serviceZoneId: zone.id,
                paymentMethod,
                pickup: { address: pickup.displayName ?? pickup.label, latitude: pickup.latitude, longitude: pickup.longitude },
                dropoff: { address: destination.displayName ?? destination.label, latitude: destination.latitude, longitude: destination.longitude },
                recipientName,
                recipientPhoneE164: recipientPhone,
                packageType,
                packageDescription,
                estimatedDistanceKm: Math.max(route.distanceKm, 0.1),
                estimatedDurationMinutes: Math.max(route.durationMinutes, 1),
              }
            : {
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
      <SectionTitle kicker={bookingType === "delivery" ? "Book delivery" : "Book ride"} title="Set your route" />
      <MapPanel title={route ? `${route.distanceKm} km - ${route.durationMinutes} min` : "Live route map"} subtitle={pickup && destination ? `${pickup.label} to ${destination.label}` : "Enter pickup and destination to calculate the trip."} />
      <Card>
        <Pill label={bookingType === "delivery" ? "parcel mode" : "ride mode"} tone="warning" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          {(["ride", "delivery"] as const).map((type) => (
            <Pressable
              key={type}
              style={{ flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", backgroundColor: bookingType === type ? "#F5B800" : "#111111", borderWidth: 1, borderColor: bookingType === type ? "#F5B800" : "#2C2C2C" }}
              onPress={() => setBookingType(type)}
            >
              <Text style={{ color: bookingType === type ? "#111111" : "#DDE0E7", fontWeight: "900", textTransform: "capitalize" }}>{type}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Pickup" value={pickupText} onChangeText={setPickupText} placeholder="Type pickup address" />
        <Field label={bookingType === "delivery" ? "Dropoff" : "Destination"} value={destinationText} onChangeText={setDestinationText} placeholder={bookingType === "delivery" ? "Type dropoff address" : "Type destination address"} />
        {bookingType === "delivery" ? (
          <>
            <Field label="Recipient name" value={recipientName} onChangeText={setRecipientName} placeholder="Who receives the package?" />
            <Field label="Recipient phone" value={recipientPhone} onChangeText={setRecipientPhone} placeholder="+233..." keyboardType="phone-pad" />
            <Field label="Package type" value={packageType} onChangeText={setPackageType} placeholder="Parcel, food, documents" />
            <Field label="Package description" value={packageDescription} onChangeText={setPackageDescription} placeholder="Describe the item" />
          </>
        ) : null}
        <PrimaryButton label={busy ? "Checking route..." : "Preview route"} onPress={resolveRoute} disabled={busy} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Card>
      <Card>
        <SectionTitle kicker="Checkout" title={bookingType === "delivery" ? "Confirm parcel details" : "Choose payment method"} />
        <View style={styles.grid}>
          <ServiceTile icon={bookingType === "delivery" ? "SEND" : "BIKE"} title={bookingType === "delivery" ? "Delivery" : "Ride"} body={route ? `${route.distanceKm} km route` : "Route not calculated"} />
          <ServiceTile icon="PAY" title="Payment" body={paymentMethod.replace("_", " ")} />
        </View>
        {bookingType === "delivery" ? (
          <View style={{ backgroundColor: "#0D1117", borderRadius: 22, padding: 14, gap: 8, borderWidth: 1, borderColor: "#303846" }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{packageDescription || "Package not described yet"}</Text>
            <Text style={styles.muted}>{recipientName || "Recipient name"} - {recipientPhone || "Recipient phone"}</Text>
          </View>
        ) : null}
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
        <PrimaryButton
          label={busy ? "Requesting..." : bookingType === "delivery" ? "Confirm delivery" : "Confirm ride"}
          onPress={requestRide}
          disabled={
            busy ||
            !zone ||
            (bookingType === "delivery" && (!recipientName.trim() || !recipientPhone.trim() || !packageDescription.trim()))
          }
        />
      </Card>
    </>
  );
}
