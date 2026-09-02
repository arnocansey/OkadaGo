import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { api, money } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useResolvedLocationAddress } from "@/hooks/useResolvedLocationAddress";
import { useTheme } from "@/context/ThemeContext";
import { AppMap } from "@/components/AppMap";
import { DestinationSearchSheet } from "@/components/DestinationSearchSheet";
import { RideBookingSheet, type RideTier, type RideTierId } from "@/components/RideBookingSheet";
import type { PaymentMethod, RoutePreview, SavedPlace, ServiceZone } from "@/types";

const FALLBACK_DEST = { latitude: 5.556, longitude: -0.182 };

function toSurgeMultiplier(rideType: RideTierId) {
  return rideType === "express" ? 1.25 : 1;
}

function estimateZoneFare(
  zone: ServiceZone | undefined,
  distanceKm: number,
  durationMinutes: number,
  surgeMultiplier = 1,
) {
  if (!zone) return Math.max(8, distanceKm * 2.5 * surgeMultiplier);
  const base = Number(zone.baseFare ?? 5);
  const perKm = Number(zone.perKmFee ?? 2);
  const perMin = Number(zone.perMinuteFee ?? 0.3);
  const minimum = Number(zone.minimumFare ?? 8);
  return Math.max(minimum, base + perKm * distanceKm + perMin * durationMinutes) * surgeMultiplier;
}

export default function BookRideScreen() {
  const { t } = useTranslation();
  const { mode, placeId, destination: destParam, destLat, destLng } = useLocalSearchParams<{
    mode?: string;
    placeId?: string;
    destination?: string;
    destLat?: string;
    destLng?: string;
  }>();

  const isInitialDelivery = mode === "delivery";
  const { session, zones, refresh } = useApp();
  const { colors, stackHeaderOptions } = useTheme();
  const { latitude: userLat, longitude: userLng, hasFix } = useUserLocation();

  const [rideType, setRideType] = useState<RideTierId>(isInitialDelivery ? "cargo" : "standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [destination, setDestination] = useState(destParam ?? "");
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: destLat ? Number(destLat) : FALLBACK_DEST.latitude,
    longitude: destLng ? Number(destLng) : FALLBACK_DEST.longitude,
  });
  const [destResolved, setDestResolved] = useState(Boolean(destParam && destLat && destLng));
  const [pickupLandmark, setPickupLandmark] = useState("");
  const [destLandmark, setDestLandmark] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageType, setPackageType] = useState("parcel");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<RoutePreview | null>(null);
  const [searchOpen, setSearchOpen] = useState(!destParam);
  const [searchTarget, setSearchTarget] = useState<"destination" | "pickup">("destination");
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<
    Array<{ address: string; latitude: number; longitude: number; label?: string }>
  >([]);

  const isDelivery = rideType === "cargo" || isInitialDelivery;

  /* ─── Pickup Address Resolution ───────────────────────────── */
  const {
    address: resolvedPickupAddress,
    coords: resolvedCoords,
    hasPickupCoords,
  } = useResolvedLocationAddress();

  const pickupCoords = useMemo(
    () => ({
      latitude: userLat ?? resolvedCoords.latitude ?? 5.6037,
      longitude: userLng ?? resolvedCoords.longitude ?? -0.187,
    }),
    [userLat, userLng, resolvedCoords],
  );

  const pickupDisplay = resolvedPickupAddress || (hasFix ? "Current GPS Location" : "Accra, Ghana");

  /* ─── Fetch Saved Places ──────────────────────────────────── */
  useEffect(() => {
    if (!session?.token) return;
    api<SavedPlace[]>("/places/saved", { token: session.token })
      .then(setSavedPlaces)
      .catch(() => setSavedPlaces([]));
  }, [session?.token]);

  /* ─── Fetch Route Estimate ────────────────────────────────── */
  useEffect(() => {
    if (!destination.trim() || !destResolved || !session?.token) return;

    const params = new URLSearchParams({
      startLat: `${pickupCoords.latitude}`,
      startLon: `${pickupCoords.longitude}`,
      endLat: `${destCoords.latitude}`,
      endLon: `${destCoords.longitude}`,
    });

    api<RoutePreview>(`/bootstrap/route-preview?${params.toString()}`, {
      token: session.token,
    })
      .then((data) => {
        if (data && data.distanceKm) {
          setEstimate(data);
        }
      })
      .catch(() => {
        // Fallback Haversine estimate if network completely offline
        const lat1 = pickupCoords.latitude;
        const lon1 = pickupCoords.longitude;
        const lat2 = destCoords.latitude;
        const lon2 = destCoords.longitude;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distKm = Math.max(1.5, 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3);
        const durationMin = Math.max(4, Math.round((distKm / 22) * 60));

        setEstimate({
          distanceKm: Math.round(distKm * 10) / 10,
          durationMinutes: durationMin,
          route: [
            [pickupCoords.latitude, pickupCoords.longitude],
            [destCoords.latitude, destCoords.longitude],
          ],
        } as RoutePreview);
      });
  }, [destination, destResolved, pickupCoords.latitude, pickupCoords.longitude, destCoords.latitude, destCoords.longitude, session?.token]);

  /* ─── Calculate Vehicle Tiers ─────────────────────────────── */
  const currency = zones[0]?.currency ?? session?.user?.preferredCurrency ?? "GH₵";

  const tiers: RideTier[] = useMemo(() => {
    const distKm = estimate?.distanceKm ?? 3;
    const durMin = estimate?.durationMinutes ?? 8;

    const stdFare = estimateZoneFare(zones[0], distKm, durMin, 1);
    const expFare = estimateZoneFare(zones[0], distKm, durMin, toSurgeMultiplier("express"));
    const delFare = Math.max(8, stdFare * 0.9);

    return [
      {
        id: "standard",
        label: "OkadaGo",
        subtitle: "Everyday quick ride",
        fare: Math.round(stdFare * 100) / 100,
        etaMinutes: Math.max(2, Math.round(durMin * 0.8)),
        capacity: "1 rider",
        recommended: true,
      },
      {
        id: "express",
        label: "OkadaX",
        subtitle: "Priority pickup • Top rider",
        fare: Math.round(expFare * 100) / 100,
        etaMinutes: Math.max(1, Math.round(durMin * 0.6)),
        capacity: "1 rider",
      },
      {
        id: "cargo",
        label: "Okada Send",
        subtitle: "Package delivery courier",
        fare: Math.round(delFare * 100) / 100,
        etaMinutes: Math.max(3, Math.round(durMin)),
        capacity: "Parcel",
      },
    ];
  }, [estimate, zones]);

  /* ─── Promo Code Validation ───────────────────────────────── */
  useEffect(() => {
    if (!promoCode.trim() || !estimate || !session?.token) {
      setPromoDiscount(0);
      setPromoMessage("");
      return;
    }

    const activeFare = tiers.find((t) => t.id === rideType)?.fare ?? 15;
    const timer = setTimeout(() => {
      api<{ discountAmount: number; name: string }>("/promotions/apply", {
        method: "POST",
        token: session.token,
        body: {
          code: promoCode.trim(),
          estimatedFare: activeFare,
          currency: zones[0]?.currency ?? "GHS",
          city: zones[0]?.city,
        },
      })
        .then((result) => {
          setPromoDiscount(result.discountAmount ?? 0);
          setPromoMessage(`${result.name} applied (-${currency} ${result.discountAmount})`);
        })
        .catch(() => {
          setPromoDiscount(0);
          setPromoMessage("");
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [promoCode, estimate, rideType, tiers, session?.token, zones, currency]);

  /* ─── Map Coordinates & Markers ───────────────────────────── */
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
    const pts = [
      {
        id: "pickup",
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
        title: "Pickup",
        pinColor: colors.primary,
      },
    ];
    if (destination && destResolved) {
      pts.push({
        id: "dest",
        latitude: destCoords.latitude,
        longitude: destCoords.longitude,
        title: "Destination",
        pinColor: colors.danger,
      });
    }
    return pts;
  }, [pickupCoords, destCoords, destination, destResolved, colors]);

  /* ─── Search Handlers ─────────────────────────────────────── */
  const handleSelectDestination = useCallback(
    (dest: { address: string; latitude: number; longitude: number }) => {
      setSearchOpen(false);
      if (searchTarget === "destination") {
        setDestination(dest.address);
        setDestCoords({ latitude: dest.latitude, longitude: dest.longitude });
        setDestResolved(true);
        setRecentDestinations((prev) => [dest, ...prev.filter((r) => r.address !== dest.address)].slice(0, 8));
      }
    },
    [searchTarget],
  );

  /* ─── Booking Submission (3-Tap Confirm) ───────────────────── */
  async function handleConfirmBooking() {
    if (!session?.token) {
      Alert.alert("Sign In Required", "Please sign in to book your ride.");
      return;
    }
    if (!destination.trim() || !destResolved) {
      setSearchTarget("destination");
      setSearchOpen(true);
      return;
    }

    if (isDelivery && (!recipientName.trim() || !recipientPhone.trim())) {
      Alert.alert("Recipient Information", "Please provide a recipient name and phone number for delivery.");
      return;
    }

    setLoading(true);
    try {
      const passengerProfileId = session.user.passengerProfileId;
      const serviceZoneId = zones[0]?.id;
      const estimatedDistanceKm = estimate?.distanceKm ?? 2.5;
      const estimatedDurationMinutes = Math.max(2, Math.round(estimate?.durationMinutes ?? 6));

      if (isDelivery) {
        const response = await api<{ delivery: { id: string } }>("/deliveries/request", {
          method: "POST",
          token: session.token,
          body: {
            passengerProfileId,
            serviceZoneId,
            paymentMethod,
            pickup: {
              address: pickupDisplay,
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
              landmark: pickupLandmark.trim() || undefined,
            },
            dropoff: {
              address: destination,
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
              landmark: destLandmark.trim() || undefined,
            },
            recipientName: recipientName.trim(),
            recipientPhoneE164: recipientPhone.startsWith("+")
              ? recipientPhone
              : `+233${recipientPhone.replace(/\D/g, "")}`,
            packageType,
            packageDescription: "Express Package Delivery",
            estimatedDistanceKm,
            estimatedDurationMinutes,
            promoDiscount,
            promoCode: promoCode.trim() || undefined,
          },
        });
        await refresh();
        router.replace({
          pathname: "/ride/track/[id]",
          params: { id: response.delivery.id, kind: "delivery" },
        });
      } else {
        const response = await api<{ ride: { id: string } }>("/rides/request", {
          method: "POST",
          token: session.token,
          body: {
            passengerProfileId,
            serviceZoneId,
            paymentMethod,
            pickup: {
              address: pickupDisplay,
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
              landmark: pickupLandmark.trim() || undefined,
            },
            destination: {
              address: destination,
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
              landmark: destLandmark.trim() || undefined,
            },
            rideType: rideType === "express" ? "express_bike" : "standard_bike",
            estimatedDistanceKm,
            estimatedDurationMinutes,
            promoDiscount,
            promoCode: promoCode.trim() || undefined,
          },
        });
        await refresh();
        router.replace({
          pathname: "/ride/track/[id]",
          params: { id: response.ride.id, kind: "ride" },
        });
      }
    } catch (e) {
      Alert.alert("Booking Failed", e instanceof Error ? e.message : "Could not request ride.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: false,
          ...stackHeaderOptions,
        }}
      />

      {/* ─── Map Taking Top & Route ──────────────────────────── */}
      <AppMap
        region={{
          ...pickupCoords,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        markers={markers}
        routeCoordinates={routeCoordinates}
        autoCenterOnLocation={hasFix}
        fitToMarkers={markers.length >= 2 || Boolean(routeCoordinates?.length)}
        showCenterButton
        centerButtonInset={{ bottom: 260, right: 16 }}
      />

      {/* ─── Uber/Bolt/Yango Ride Selection Bottom Sheet ────── */}
      <RideBookingSheet
        pickupAddress={pickupDisplay}
        destinationAddress={destination}
        onEditPickup={() => {
          setSearchTarget("pickup");
          setSearchOpen(true);
        }}
        onEditDestination={() => {
          setSearchTarget("destination");
          setSearchOpen(true);
        }}
        tiers={tiers}
        selectedTier={rideType}
        onSelectTier={setRideType}
        isDelivery={isDelivery}
        currency={currency}
        paymentMethod={paymentMethod}
        onSelectPaymentMethod={setPaymentMethod}
        promoCode={promoCode}
        onPromoCodeChange={setPromoCode}
        promoDiscount={promoDiscount}
        promoMessage={promoMessage}
        pickupLandmark={pickupLandmark}
        onPickupLandmarkChange={setPickupLandmark}
        recipientName={recipientName}
        onRecipientNameChange={setRecipientName}
        recipientPhone={recipientPhone}
        onRecipientPhoneChange={setRecipientPhone}
        packageType={packageType}
        onPackageTypeChange={setPackageType}
        onConfirm={handleConfirmBooking}
        loading={loading}
        confirmDisabled={!destination.trim()}
      />

      {/* ─── Destination / Pickup Search Sheet ─────────────────── */}
      <DestinationSearchSheet
        visible={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          if (!destination.trim()) {
            router.back();
          }
        }}
        onSelectDestination={handleSelectDestination}
        savedPlaces={savedPlaces}
        onSelectSavedPlace={(place) => {
          handleSelectDestination({
            address: place.address,
            latitude: Number(place.latitude),
            longitude: Number(place.longitude),
          });
        }}
        sessionToken={session?.token}
        userLocation={hasFix ? pickupCoords : undefined}
        recentDestinations={recentDestinations}
      />
    </View>
  );
}
