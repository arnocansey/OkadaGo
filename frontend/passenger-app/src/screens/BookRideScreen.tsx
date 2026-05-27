import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ArrowLeft, Bike, Package, WalletCards } from "lucide-react-native";
import { api } from "../api";
import { Field, MapPanel, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { LocationResult, RoutePreview, ServiceZone, Session } from "../types";

export function BookRideScreen({
  session,
  zones,
  initialBookingType = "ride",
  onBack,
  onCreated,
}: {
  session: Session;
  zones: ServiceZone[];
  initialBookingType?: "ride" | "delivery";
  onBack: () => void;
  onCreated: () => void;
}) {
  const [bookingType, setBookingType] = useState<"ride" | "delivery">(initialBookingType);
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

  useEffect(() => {
    setBookingType(initialBookingType);
  }, [initialBookingType]);

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
    <View style={styles.mapExperience}>
      <MapPanel
        title={route ? `${route.distanceKm} km - ${route.durationMinutes} min` : "Where are you going?"}
        subtitle={pickup && destination ? `${pickup.label} to ${destination.label}` : "Enter pickup and destination to calculate the trip."}
        start={pickup ? { latitude: pickup.latitude, longitude: pickup.longitude, label: pickup.label } : null}
        end={destination ? { latitude: destination.latitude, longitude: destination.longitude, label: destination.label } : null}
        style={styles.mapBackdrop}
        mode="backdrop"
      />
      <View style={styles.mapShade} />
      <View style={styles.mapTopOverlay}>
        <Pressable style={styles.mapBackCircle} onPress={onBack}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.routeInputCard}>
          <View style={styles.routeInputRow}>
            <View style={[styles.routeDot, { backgroundColor: "#FF6B00" }]} />
            <Text style={styles.routeInputText}>{pickupText || "Pickup location"}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeInputRow}>
            <View style={[styles.routeDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.routeInputText}>{destinationText || "Destination"}</Text>
          </View>
        </View>
        <View style={styles.mapStatusRow}>
          <View style={styles.mapStatusPill}>
            <Text style={styles.mapStatusText}>{bookingType === "delivery" ? "Delivery mode" : "Ride mode"}</Text>
          </View>
          <View style={styles.mapStatusPill}>
            <Text style={styles.mapStatusText}>{paymentMethod.replace("_", " ")}</Text>
          </View>
        </View>
      </View>
      <View style={styles.mapCenterPin}>
        <Text style={styles.mapCenterPinText}>{bookingType === "delivery" ? "D" : "O"}</Text>
      </View>
      <View style={styles.mapBottomSheet}>
        <View style={styles.mapSheetHandle} />
        <ScrollView style={styles.mapSheetScroll} contentContainerStyle={styles.mapSheetContent} showsVerticalScrollIndicator={false}>
          <SectionTitle kicker={bookingType === "delivery" ? "Book delivery" : "Book ride"} title="Choose a ride" />
          <View style={styles.segmentedRow}>
            {(["ride", "delivery"] as const).map((type) => (
              <Pressable
                key={type}
                style={[styles.segmentedButton, bookingType === type && styles.segmentedButtonActive]}
                onPress={() => setBookingType(type)}
              >
                <Text style={[styles.segmentedText, bookingType === type && styles.segmentedTextActive]}>{type === "ride" ? "OkadaGo" : "Delivery"}</Text>
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
          <View style={styles.grid}>
            <View style={styles.rideOptionCard}>
              {bookingType === "delivery" ? <Package size={24} color="#FF6B00" /> : <Bike size={24} color="#FF6B00" />}
              <View style={{ flex: 1 }}>
                <Text style={styles.rideOptionTitle}>{bookingType === "delivery" ? "Delivery" : "OkadaGo"}</Text>
                <Text style={styles.rideOptionMeta}>{route ? `${route.durationMinutes} min` : "Preview needed"}</Text>
              </View>
              <Text style={styles.rideOptionPrice}>{route ? `GHS ${Math.max(Number(route.distanceKm) * 3, 12).toFixed(0)}` : "--"}</Text>
            </View>
            <View style={styles.rideOptionCard}>
              <WalletCards size={24} color="#FF6B00" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rideOptionTitle}>Payment</Text>
                <Text style={styles.rideOptionMeta}>{paymentMethod.replace("_", " ")}</Text>
              </View>
            </View>
          </View>
          <View style={styles.paymentSegmentRow}>
            {(["cash", "wallet", "mobile_money"] as const).map((method) => (
              <Pressable
                key={method}
                style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.paymentChipText, paymentMethod === method && styles.paymentChipTextActive]}>{method.replace("_", " ")}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={styles.muted}>{zone ? `${zone.name}, ${zone.city}` : "No service zone available yet."}</Text>
          <PrimaryButton label={busy ? "Checking route..." : "Preview route"} onPress={resolveRoute} disabled={busy} />
          <PrimaryButton
            label={busy ? "Requesting..." : bookingType === "delivery" ? "Confirm delivery" : "Confirm ride"}
            onPress={requestRide}
            disabled={
              busy ||
              !zone ||
              !route ||
              (bookingType === "delivery" && (!recipientName.trim() || !recipientPhone.trim() || !packageDescription.trim()))
            }
            dark={!route}
          />
        </ScrollView>
      </View>
    </View>
  );
}
