"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson, postJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";
import { useGeolocation } from "@/components/passenger/hooks/useGeolocation";
import { usePlaceSearch, type FormState } from "@/components/passenger/hooks/usePlaceSearch";
import { BookingSidebar } from "@/components/passenger/booking-sidebar";
import { PassengerMapPanel } from "@/components/passenger/passenger-map-panel";

type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

type WalletRecord = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance: string | number;
};

type RideRecord = {
  id: string;
  status: string;
  passengerId: string;
  riderId: string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: string | number;
  pickupLongitude: string | number;
  destinationLatitude: string | number;
  destinationLongitude: string | number;
  estimatedDistanceKm: string | number | null;
  estimatedDurationMinutes: number | null;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  currency: string;
  createdAt: string;
  locations?: Array<{
    latitude: string | number;
    longitude: string | number;
    recordedAt: string;
  }>;
  rider: {
    currentLatitude: string | number | null;
    currentLongitude: string | number | null;
    user: {
      fullName: string;
      phoneE164: string;
    };
  } | null;
};

type RiderRecord = {
  id: string;
  serviceZoneId: string | null;
  onlineStatus: boolean;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  user: {
    fullName: string;
  };
};

type FareEstimateResponse = {
  pricing: {
    totalFare: number;
    riderEarnings: number;
    platformCommission: number;
  };
};

type RideCreationResponse = {
  ride: RideRecord;
};

type DeliveryCreationResponse = {
  delivery: {
    id: string;
    status: string;
  };
};

type RoutePreviewResponse = {
  provider: "mapbox" | "osrm";
  distanceKm: number;
  durationMinutes: number;
  route: Array<[number, number]>;
};

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function tryParseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const ghanaCityCenters: Record<string, [number, number]> = {
  accra: [5.6037, -0.187],
  kumasi: [6.6885, -1.6244],
  takoradi: [4.8845, -1.7554],
  tamale: [9.4034, -0.8424],
  "cape coast": [5.1053, -1.2466],
  tema: [5.6698, -0.0166]
};

function getZoneCenter(zone: ServiceZoneRecord | null) {
  if (!zone) {
    return ghanaCityCenters.accra;
  }

  const normalizedCity = zone.city.trim().toLowerCase();
  return ghanaCityCenters[normalizedCity] ?? ghanaCityCenters.accra;
}

export function PassengerPortalPage() {
  const { session, status, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [bookingMode, setBookingMode] = useState<"ride" | "delivery">("ride");
  const [rideType, setRideType] = useState<"standard_bike" | "express_bike">("standard_bike");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash" | "card" | "mobile_money">("wallet");
  const [deliveryForm, setDeliveryForm] = useState({
    recipientName: "",
    recipientPhoneE164: "",
    packageType: "parcel",
    packageDescription: ""
  });
  const [form, setForm] = useState<FormState>({
    serviceZoneId: "",
    pickupAddress: "",
    pickupLatitude: "",
    pickupLongitude: "",
    destinationAddress: "",
    destinationLatitude: "",
    destinationLongitude: "",
    estimatedDistanceKm: "",
    estimatedDurationMinutes: ""
  });

  const isPassenger = session?.user.role === "passenger";
  const userId = session?.user.id;
  const passengerProfileId = session?.user.passengerProfileId;

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZoneRecord[]>("/bootstrap/service-zones?limit=100"),
    enabled: status === "authenticated"
  });

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: status === "authenticated" && Boolean(passengerProfileId),
    refetchInterval: 10_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: status === "authenticated",
    refetchInterval: 10_000
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  useEffect(() => {
    if (!form.serviceZoneId && (zonesQuery.data?.length ?? 0) > 0) {
      setForm((current) => ({
        ...current,
        serviceZoneId: zonesQuery.data![0].id
      }));
    }
  }, [form.serviceZoneId, zonesQuery.data]);

  const { liveLocation, liveLocationReady } = useGeolocation();

  const {
    pickupSuggestions,
    pickupSuggestionsPending,
    pickupSuggestionsError,
    choosePickupSuggestion,
    resolvedPickup,
    destinationSuggestions,
    destinationSuggestionsPending,
    destinationSuggestionsError,
    chooseDestinationSuggestion,
    resolvedDestination
  } = usePlaceSearch({
    pickupAddress: form.pickupAddress,
    pickupLatitude: form.pickupLatitude,
    pickupLongitude: form.pickupLongitude,
    destinationAddress: form.destinationAddress,
    destinationLatitude: form.destinationLatitude,
    destinationLongitude: form.destinationLongitude,
    setForm
  });

  const selectedZone = useMemo(
    () => (zonesQuery.data ?? []).find((zone) => zone.id === form.serviceZoneId) ?? null,
    [form.serviceZoneId, zonesQuery.data]
  );

  const pickupLatitude =
    tryParseCoordinate(form.pickupLatitude) ?? resolvedPickup?.latitude ?? null;
  const pickupLongitude =
    tryParseCoordinate(form.pickupLongitude) ?? resolvedPickup?.longitude ?? null;
  const destinationLatitude =
    tryParseCoordinate(form.destinationLatitude) ?? resolvedDestination?.latitude ?? null;
  const destinationLongitude =
    tryParseCoordinate(form.destinationLongitude) ?? resolvedDestination?.longitude ?? null;
  const pickupAddress = form.pickupAddress.trim() || resolvedPickup?.label || "";
  const destinationAddress = form.destinationAddress.trim() || resolvedDestination?.label || "";

  const passengerRides = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((ride) => ride.passengerId === passengerProfileId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [passengerProfileId, ridesQuery.data]
  );

  const activeRide = passengerRides.find((ride) =>
    ["searching", "assigned", "arriving", "arrived", "started"].includes(ride.status)
  );

  const completedRides = passengerRides.filter((ride) => ride.status === "completed");
  const recentDestinations = Array.from(
    new Set(
      completedRides
        .map((ride) => ride.destinationAddress)
        .filter((destination) => destination.trim().length > 0)
    )
  ).slice(0, 3);

  const preferredWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const onlineRiderCount = (ridersQuery.data ?? []).filter((rider) => rider.onlineStatus).length;
  const activeRideRiderLatitude = activeRide?.rider?.currentLatitude
    ? parseNumber(activeRide.rider.currentLatitude)
    : null;
  const activeRideRiderLongitude = activeRide?.rider?.currentLongitude
    ? parseNumber(activeRide.rider.currentLongitude)
    : null;

  const routePreviewQuery = useQuery({
    queryKey: [
      "route-preview",
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude
    ],
    queryFn: () =>
      fetchJson<RoutePreviewResponse>(
        `/bootstrap/route-preview?startLat=${encodeURIComponent(pickupLatitude!)}&startLon=${encodeURIComponent(
          pickupLongitude!
        )}&endLat=${encodeURIComponent(destinationLatitude!)}&endLon=${encodeURIComponent(destinationLongitude!)}`
      ),
    enabled:
      status === "authenticated" &&
      pickupLatitude != null &&
      pickupLongitude != null &&
      destinationLatitude != null &&
      destinationLongitude != null,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!routePreviewQuery.data) {
      return;
    }

    setForm((current) => ({
      ...current,
      estimatedDistanceKm: routePreviewQuery.data.distanceKm.toFixed(1),
      estimatedDurationMinutes: `${routePreviewQuery.data.durationMinutes}`
    }));
  }, [routePreviewQuery.data]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (
      pickupLatitude != null &&
      pickupLongitude != null &&
      destinationLatitude != null &&
      destinationLongitude != null
    ) {
      return [
        (pickupLatitude + destinationLatitude) / 2,
        (pickupLongitude + destinationLongitude) / 2
      ];
    }

    if (pickupLatitude != null && pickupLongitude != null) {
      return [pickupLatitude, pickupLongitude];
    }

    if (destinationLatitude != null && destinationLongitude != null) {
      return [destinationLatitude, destinationLongitude];
    }

    return getZoneCenter(selectedZone);
  }, [
    destinationLatitude,
    destinationLongitude,
    pickupLatitude,
    pickupLongitude,
    selectedZone
  ]);

  const mapZoom = pickupLatitude != null || destinationLatitude != null ? 13 : 12;

  const mapMarkers = useMemo(
    () => {
      const markers: Array<{
        id: string;
        label: string;
        permanentLabel?: boolean;
        position: [number, number];
        variant: "pickup" | "destination" | "driver";
      }> = [];

      if (pickupLatitude != null && pickupLongitude != null) {
        markers.push({
          id: "pickup",
          label: pickupAddress || "Pickup",
          permanentLabel: true,
          position: [pickupLatitude, pickupLongitude],
          variant: "pickup"
        });
      }

      if (destinationLatitude != null && destinationLongitude != null) {
        markers.push({
          id: "destination",
          label: destinationAddress || "Destination",
          permanentLabel: true,
          position: [destinationLatitude, destinationLongitude],
          variant: "destination"
        });
      }

      if (activeRideRiderLatitude != null && activeRideRiderLongitude != null) {
        markers.push({
          id: "active-rider",
          label: activeRide?.rider?.user.fullName ?? "Assigned rider",
          position: [activeRideRiderLatitude, activeRideRiderLongitude],
          variant: "driver"
        });
      }

      return markers;
    },
    [
      activeRide?.rider?.user.fullName,
      activeRideRiderLatitude,
      activeRideRiderLongitude,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      pickupAddress,
      pickupLatitude,
      pickupLongitude
    ]
  );

  const estimateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedZone) {
        throw new Error("Select a service zone first.");
      }

      if (
        pickupLatitude == null ||
        pickupLongitude == null ||
        destinationLatitude == null ||
        destinationLongitude == null ||
        !pickupAddress ||
        !destinationAddress
      ) {
        throw new Error("Set your pickup and destination so the route can be mapped first.");
      }

      return postJson<FareEstimateResponse, unknown>("/rides/estimate", {
        pickup: {
          address: pickupAddress,
          latitude: pickupLatitude,
          longitude: pickupLongitude
        },
        destination: {
          address: destinationAddress,
          latitude: destinationLatitude,
          longitude: destinationLongitude
        },
        pricing: {
          countryCode: selectedZone.countryCode,
          currency: selectedZone.currency,
          rideType,
          baseFare: parseNumber(selectedZone.baseFare),
          perKmFee: parseNumber(selectedZone.perKmFee),
          perMinuteFee: parseNumber(selectedZone.perMinuteFee),
          minimumFare: parseNumber(selectedZone.minimumFare),
          cancellationFee: parseNumber(selectedZone.cancellationFee),
          waitingFeePerMinute: parseNumber(selectedZone.waitingFeePerMin),
          commissionPercent: 12,
          surgeMultiplier: rideType === "express_bike" ? 1.2 : 1,
          zoneFee: 0,
          promoDiscount: 0,
          referralDiscount: 0,
          estimatedDistanceKm: Number(form.estimatedDistanceKm),
          estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
          waitingMinutes: 0
        }
      });
    }
  });

  const createRideMutation = useMutation({
    mutationFn: async () => {
      if (!passengerProfileId) {
        throw new Error("Your passenger profile is missing from the current session. Please sign out and sign back in.");
      }

      if (!selectedZone) {
        throw new Error("No active service zone is configured yet. Set up a Ghana service zone before requesting rides.");
      }

      if (
        pickupLatitude == null ||
        pickupLongitude == null ||
        destinationLatitude == null ||
        destinationLongitude == null ||
        !pickupAddress ||
        !destinationAddress
      ) {
        throw new Error("Set your pickup and destination so the route can be mapped first.");
      }

      return postJson<RideCreationResponse, unknown>("/rides/request", {
        passengerProfileId,
        serviceZoneId: selectedZone.id,
        paymentMethod,
        pickup: {
          address: pickupAddress,
          latitude: pickupLatitude,
          longitude: pickupLongitude
        },
        destination: {
          address: destinationAddress,
          latitude: destinationLatitude,
          longitude: destinationLongitude
        },
        estimatedDistanceKm:
          routePreviewQuery.data?.distanceKm ?? Number(form.estimatedDistanceKm),
        estimatedDurationMinutes:
          routePreviewQuery.data?.durationMinutes ?? Number(form.estimatedDurationMinutes),
        rideType,
        surgeMultiplier: rideType === "express_bike" ? 1.2 : 1
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
    }
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async () => {
      if (!passengerProfileId) {
        throw new Error("Your passenger profile is missing from the current session. Please sign out and sign back in.");
      }

      if (!selectedZone) {
        throw new Error("No active service zone is configured yet. Set up a Ghana service zone before requesting deliveries.");
      }

      if (
        pickupLatitude == null ||
        pickupLongitude == null ||
        destinationLatitude == null ||
        destinationLongitude == null ||
        !pickupAddress ||
        !destinationAddress
      ) {
        throw new Error("Set your pickup and dropoff so the delivery route can be mapped first.");
      }

      if (
        !deliveryForm.recipientName.trim() ||
        !deliveryForm.recipientPhoneE164.trim() ||
        !deliveryForm.packageDescription.trim()
      ) {
        throw new Error("Add recipient and package details before requesting delivery.");
      }

      return postJson<DeliveryCreationResponse, unknown>("/deliveries/request", {
        passengerProfileId,
        serviceZoneId: selectedZone.id,
        paymentMethod,
        pickup: {
          address: pickupAddress,
          latitude: pickupLatitude,
          longitude: pickupLongitude
        },
        dropoff: {
          address: destinationAddress,
          latitude: destinationLatitude,
          longitude: destinationLongitude
        },
        recipientName: deliveryForm.recipientName,
        recipientPhoneE164: deliveryForm.recipientPhoneE164,
        packageType: deliveryForm.packageType || "parcel",
        packageDescription: deliveryForm.packageDescription,
        estimatedDistanceKm:
          routePreviewQuery.data?.distanceKm ?? Number(form.estimatedDistanceKm),
        estimatedDurationMinutes:
          routePreviewQuery.data?.durationMinutes ?? Number(form.estimatedDurationMinutes)
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
    }
  });

  const preferredCurrency = session?.user.preferredCurrency ?? "GHS";
  const routeDistanceLabel = routePreviewQuery.data
    ? `${routePreviewQuery.data.distanceKm.toFixed(1)} km`
    : "--";
  const routeDurationLabel = routePreviewQuery.data
    ? `${routePreviewQuery.data.durationMinutes} min`
    : "--";
  const farePreviewLabel = estimateMutation.data
    ? formatMoney(
        selectedZone?.currency ?? preferredCurrency,
        estimateMutation.data.pricing.totalFare
      )
    : "Estimate fare";

  if (status === "loading") {
    return (
      <PassengerAccessState
        title="Loading your workspace"
        body="Checking your passenger session before opening the live booking portal."
        actionLabel="Go to login"
        actionHref="/login"
      />
    );
  }

  if (status !== "authenticated" || !isPassenger) {
    return (
      <PassengerAccessState
        title="Passenger sign in required"
        body="Use a passenger account to access the live booking workspace."
        actionLabel="Go to passenger login"
        actionHref="/login"
      />
    );
  }

  return (
    <PassengerShell
      session={session}
      preferredWallet={preferredWallet}
      activeTab="home"
      signOut={signOut}
    >
      <div className="exact-passenger-body">
        <BookingSidebar
          bookingMode={bookingMode}
          setBookingMode={setBookingMode}
          rideType={rideType}
          setRideType={setRideType}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          deliveryForm={deliveryForm}
          setDeliveryForm={setDeliveryForm}
          form={form}
          setForm={setForm}
          selectedZone={selectedZone}
          zones={zonesQuery.data ?? []}
          estimateMutation={estimateMutation}
          createRideMutation={createRideMutation}
          createDeliveryMutation={createDeliveryMutation}
          recentDestinations={recentDestinations}
          pickupSuggestions={pickupSuggestions}
          pickupSuggestionsPending={pickupSuggestionsPending}
          pickupSuggestionsError={pickupSuggestionsError}
          choosePickupSuggestion={choosePickupSuggestion}
          destinationSuggestions={destinationSuggestions}
          destinationSuggestionsPending={destinationSuggestionsPending}
          destinationSuggestionsError={destinationSuggestionsError}
          chooseDestinationSuggestion={chooseDestinationSuggestion}
          preferredCurrency={preferredCurrency}
        />

        <PassengerMapPanel
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          mapMarkers={mapMarkers}
          route={routePreviewQuery.data?.route ?? []}
          liveLocation={liveLocation}
          liveLocationReady={liveLocationReady}
          selectedZone={selectedZone}
          onlineRiderCount={onlineRiderCount}
          pickupAddress={pickupAddress}
          destinationAddress={destinationAddress}
          routePreviewData={routePreviewQuery.data ?? null}
          routeDistanceLabel={routeDistanceLabel}
          routeDurationLabel={routeDurationLabel}
          farePreviewLabel={farePreviewLabel}
          activeRide={activeRide ?? null}
          paymentMethod={paymentMethod}
        />
      </div>
    </PassengerShell>
  );
}
