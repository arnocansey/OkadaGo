"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, MapPin, Search, User, Wallet, Bike } from "lucide-react";
import { fetchJson, postJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { currencySymbol, formatMoney } from "@/lib/currency";
import {
  createPlaceSearchSession,
  retrievePlace,
  suggestPlaces,
  type PlaceSuggestion
} from "@/lib/place-search";
import { PassengerRouteMap } from "@/components/maps/passenger-route-map";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";

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

type ReverseGeocodeResponse = {
  label: string;
  displayName: string | null;
  latitude: number;
  longitude: number;
};

type ForwardGeocodeResponse = {
  label: string;
  displayName: string | null;
  latitude: number;
  longitude: number;
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

function haversineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const earthRadiusKm = 6371;
  const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = degreesToRadians(toLatitude - fromLatitude);
  const deltaLongitude = degreesToRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(degreesToRadians(fromLatitude)) *
      Math.cos(degreesToRadians(toLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDurationMinutes(distanceKm: number) {
  return Math.max(4, Math.round((distanceKm / 22) * 60));
}

function isWithinGhanaBounds(latitude: number, longitude: number) {
  return latitude >= 4.4 && latitude <= 11.3 && longitude >= -3.4 && longitude <= 1.4;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRideTypeLabel(rideType: string) {
  return rideType === "express_bike" ? "Express Bike" : "Standard Bike";
}

const ghanaCityCenters: Record<string, [number, number]> = {
  accra: [5.6037, -0.187],
  kumasi: [6.6885, -1.6244],
  takoradi: [4.8845, -1.7554],
  tamale: [9.4034, -0.8424],
  "cape coast": [5.1053, -1.2466],
  tema: [5.6698, -0.0166]
};

function queryMatchesResolved(
  query: string,
  place: ForwardGeocodeResponse | null
) {
  if (!place) {
    return false;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const candidateValues = [
    place.label,
    place.displayName ?? ""
  ].map((value) => value.trim().toLowerCase());

  return candidateValues.includes(normalizedQuery);
}

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
  const [rideType, setRideType] = useState<"standard_bike" | "express_bike">("standard_bike");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash" | "card" | "mobile_money">("wallet");
  const [pickupLocationPending, setPickupLocationPending] = useState(false);
  const [pickupLocationError, setPickupLocationError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{
    accuracy: number;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pickupSessionToken] = useState(() => createPlaceSearchSession());
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupSuggestionsPending, setPickupSuggestionsPending] = useState(false);
  const [pickupSuggestionsError, setPickupSuggestionsError] = useState<string | null>(null);
  const [resolvedPickup, setResolvedPickup] = useState<ForwardGeocodeResponse | null>(null);
  const [destinationSessionToken] = useState(() => createPlaceSearchSession());
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestionsPending, setDestinationSuggestionsPending] = useState(false);
  const [destinationSuggestionsError, setDestinationSuggestionsError] = useState<string | null>(null);
  const [resolvedDestination, setResolvedDestination] = useState<ForwardGeocodeResponse | null>(null);
  const [form, setForm] = useState({
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

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        setLiveLocation(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const pickupAddress = form.pickupAddress.trim();
    const pickupLatitude = tryParseCoordinate(form.pickupLatitude);
    const pickupLongitude = tryParseCoordinate(form.pickupLongitude);

    if (!pickupAddress) {
      setResolvedPickup(null);
      return;
    }

    if (pickupLatitude != null && pickupLongitude != null) {
      setResolvedPickup({
        label: pickupAddress,
        displayName: pickupAddress,
        latitude: pickupLatitude,
        longitude: pickupLongitude
      });
      return;
    }

    setResolvedPickup(null);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchJson<ForwardGeocodeResponse>(
        `/bootstrap/forward-geocode?q=${encodeURIComponent(pickupAddress)}`
      )
        .then((result) => {
          if (!cancelled) {
            setResolvedPickup(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedPickup(null);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.pickupAddress, form.pickupLatitude, form.pickupLongitude]);

  useEffect(() => {
    const pickupAddress = form.pickupAddress.trim();

    if (pickupAddress.length < 3 || queryMatchesResolved(pickupAddress, resolvedPickup)) {
      setPickupSuggestions([]);
      setPickupSuggestionsError(null);
      setPickupSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPickupSuggestionsPending(true);
      setPickupSuggestionsError(null);

      suggestPlaces({
        query: pickupAddress,
        sessionToken: pickupSessionToken
      })
        .then((suggestions) => {
          if (!cancelled) {
            setPickupSuggestions(suggestions);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setPickupSuggestions([]);
            setPickupSuggestionsError(
              error instanceof Error ? error.message : "Could not load place suggestions."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPickupSuggestionsPending(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.pickupAddress, pickupSessionToken, resolvedPickup]);

  useEffect(() => {
    const destinationAddress = form.destinationAddress.trim();
    const destinationLatitude = tryParseCoordinate(form.destinationLatitude);
    const destinationLongitude = tryParseCoordinate(form.destinationLongitude);

    if (!destinationAddress) {
      setResolvedDestination(null);
      return;
    }

    if (destinationLatitude != null && destinationLongitude != null) {
      setResolvedDestination({
        label: destinationAddress,
        displayName: destinationAddress,
        latitude: destinationLatitude,
        longitude: destinationLongitude
      });
      return;
    }

    setResolvedDestination(null);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchJson<ForwardGeocodeResponse>(
        `/bootstrap/forward-geocode?q=${encodeURIComponent(destinationAddress)}`
      )
        .then((result) => {
          if (!cancelled) {
            setResolvedDestination(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedDestination(null);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.destinationAddress, form.destinationLatitude, form.destinationLongitude]);

  useEffect(() => {
    const destinationAddress = form.destinationAddress.trim();

    if (
      destinationAddress.length < 3 ||
      queryMatchesResolved(destinationAddress, resolvedDestination)
    ) {
      setDestinationSuggestions([]);
      setDestinationSuggestionsError(null);
      setDestinationSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setDestinationSuggestionsPending(true);
      setDestinationSuggestionsError(null);

      suggestPlaces({
        query: destinationAddress,
        sessionToken: destinationSessionToken
      })
        .then((suggestions) => {
          if (!cancelled) {
            setDestinationSuggestions(suggestions);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setDestinationSuggestions([]);
            setDestinationSuggestionsError(
              error instanceof Error ? error.message : "Could not load place suggestions."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setDestinationSuggestionsPending(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destinationSessionToken, form.destinationAddress, resolvedDestination]);

  async function chooseDestinationSuggestion(suggestion: PlaceSuggestion) {
    setDestinationSuggestionsPending(true);
    setDestinationSuggestionsError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: destinationSessionToken,
        suggestion
      });

      setForm((current) => ({
        ...current,
        destinationAddress: resolved.fullAddress,
        destinationLatitude: resolved.lat.toFixed(6),
        destinationLongitude: resolved.lng.toFixed(6)
      }));
      setResolvedDestination({
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      });
      setDestinationSuggestions([]);
    } catch (error) {
      setDestinationSuggestionsError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the selected destination."
      );
    } finally {
      setDestinationSuggestionsPending(false);
    }
  }

  async function choosePickupSuggestion(suggestion: PlaceSuggestion) {
    setPickupSuggestionsPending(true);
    setPickupSuggestionsError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: pickupSessionToken,
        suggestion
      });

      setForm((current) => ({
        ...current,
        pickupAddress: resolved.fullAddress,
        pickupLatitude: resolved.lat.toFixed(6),
        pickupLongitude: resolved.lng.toFixed(6)
      }));
      setResolvedPickup({
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      });
      setPickupSuggestions([]);
    } catch (error) {
      setPickupSuggestionsError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the selected pickup."
      );
    } finally {
      setPickupSuggestionsPending(false);
    }
  }

  async function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPickupLocationError("Your browser does not support location access.");
      return;
    }

    setPickupLocationPending(true);
    setPickupLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        let pickupAddress = "Current location";

        if (
          !isWithinGhanaBounds(latitude, longitude) ||
          !Number.isFinite(accuracy) ||
          accuracy <= 0 ||
          accuracy > 1500
        ) {
          setPickupLocationError(
            "We could not verify a precise Ghana pickup from your device yet. Move to an open area or enter the pickup manually."
          );
          setPickupLocationPending(false);
          return;
        }

        try {
          const lookup = await fetchJson<ReverseGeocodeResponse>(
            `/bootstrap/reverse-geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          );
          if (!lookup.displayName || lookup.label.trim().toLowerCase() === "current location") {
            throw new Error("Current location could not be resolved to a real place yet.");
          }
          pickupAddress = lookup.label || pickupAddress;
        } catch {
          setPickupLocationError(
            "We could not resolve your current location to a reliable place name yet. Please try again or enter the pickup manually."
          );
          setPickupLocationPending(false);
          return;
        }

        setForm((current) => {
          const destinationLatitude = tryParseCoordinate(current.destinationLatitude);
          const destinationLongitude = tryParseCoordinate(current.destinationLongitude);
          const nextDistance =
            destinationLatitude != null && destinationLongitude != null
              ? haversineDistanceKm(latitude, longitude, destinationLatitude, destinationLongitude)
              : null;

          return {
            ...current,
            pickupAddress,
            pickupLatitude: latitude.toFixed(6),
            pickupLongitude: longitude.toFixed(6),
            estimatedDistanceKm:
              nextDistance != null ? nextDistance.toFixed(1) : current.estimatedDistanceKm,
            estimatedDurationMinutes:
              nextDistance != null
                ? `${estimateDurationMinutes(nextDistance)}`
                : current.estimatedDurationMinutes
          };
        });
        setResolvedPickup({
          displayName: pickupAddress,
          label: pickupAddress,
          latitude,
          longitude
        });
        setPickupLocationPending(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Unable to read your current location right now.";
        setPickupLocationError(message);
        setPickupLocationPending(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

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
  const liveLocationReady =
    liveLocation != null &&
    isWithinGhanaBounds(liveLocation.latitude, liveLocation.longitude) &&
    Number.isFinite(liveLocation.accuracy) &&
    liveLocation.accuracy > 0 &&
    liveLocation.accuracy <= 1500;

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
  const liveRideHeading = activeRide
    ? `${formatStatus(activeRide.status)} - ${activeRide.destinationAddress}`
    : routePreviewQuery.data
      ? "Route ready to request"
      : "Start with a pickup and destination";
  const liveRideDescription = activeRide
    ? `Rider: ${activeRide.rider?.user.fullName ?? "Matching in progress"}`
    : routePreviewQuery.data
      ? `Previewing a ${routeDistanceLabel} route in ${routeDurationLabel}.`
      : "Choose a pickup and destination to preview the live route before you book.";

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
        <aside className="exact-passenger-sidebar">
          <div className="exact-sidebar-scroll">
            <section className="exact-sidebar-block">
              <h2>Book a live ride</h2>

                <div className="exact-zone-card" style={{ marginTop: 18 }}>
                  <span className="exact-zone-label">Operating zone</span>
                  <strong>
                    {selectedZone ? `${selectedZone.name} - ${selectedZone.city}` : "Loading zone"}
                  </strong>
                  <p>
                    {selectedZone
                      ? `Ride pricing and nearby rider matching are currently using ${selectedZone.city}.`
                      : "Waiting for the live service zone feed from the backend."}
                  </p>
                </div>

                <div className="exact-location-stack" style={{ marginTop: 18 }}>
                  <label className="exact-location-field pickup">
                    <span className="exact-location-marker" />
                    <input
                      value={form.pickupAddress}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          pickupAddress: event.target.value,
                          pickupLatitude: "",
                          pickupLongitude: ""
                        }))
                      }
                      placeholder="Pickup address"
                    />
                  </label>
                  {pickupSuggestionsPending ||
                  pickupSuggestionsError ||
                  pickupSuggestions.length > 0 ? (
                    <div className="exact-place-suggestion-panel">
                      {pickupSuggestionsPending ? (
                        <div className="exact-place-suggestion-status">
                          Looking up Ghana pickup points...
                        </div>
                      ) : null}
                      {pickupSuggestionsError ? (
                        <div className="exact-place-suggestion-status error">
                          {pickupSuggestionsError}
                        </div>
                      ) : null}
                      {pickupSuggestions.length > 0 ? (
                        <div
                          className="exact-place-suggestion-list"
                          role="listbox"
                          aria-label="Pickup suggestions"
                        >
                          {pickupSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              className="exact-place-suggestion-item"
                              type="button"
                              onClick={() => void choosePickupSuggestion(suggestion)}
                            >
                              <strong>{suggestion.name}</strong>
                              <span>{suggestion.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="exact-location-helper-row">
                    <button
                      className="exact-location-helper-button"
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={pickupLocationPending}
                    >
                      <MapPin size={16} />
                      {pickupLocationPending ? "Locating..." : "Use current location"}
                    </button>
                  </div>
                  {pickupLocationError ? (
                    <p className="body-muted" style={{ color: "#b91c1c", marginTop: 8 }}>
                      {pickupLocationError}
                    </p>
                  ) : null}
                  <label className="exact-location-field destination">
                    <span className="exact-location-marker square" />
                    <input
                      value={form.destinationAddress}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          destinationAddress: event.target.value,
                          destinationLatitude: "",
                          destinationLongitude: ""
                        }))
                      }
                      placeholder="Destination address"
                    />
                    <Search size={16} />
                  </label>
                  {destinationSuggestionsPending ||
                  destinationSuggestionsError ||
                  destinationSuggestions.length > 0 ? (
                    <div className="exact-place-suggestion-panel">
                      {destinationSuggestionsPending ? (
                        <div className="exact-place-suggestion-status">
                          Looking up Ghana destinations...
                        </div>
                      ) : null}
                      {destinationSuggestionsError ? (
                        <div className="exact-place-suggestion-status error">
                          {destinationSuggestionsError}
                        </div>
                      ) : null}
                      {destinationSuggestions.length > 0 ? (
                        <div
                          className="exact-place-suggestion-list"
                          role="listbox"
                          aria-label="Destination suggestions"
                        >
                          {destinationSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              className="exact-place-suggestion-item"
                              type="button"
                              onClick={() => void chooseDestinationSuggestion(suggestion)}
                            >
                              <strong>{suggestion.name}</strong>
                              <span>{suggestion.fullAddress}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <details className="exact-dev-disclosure">
                  <summary>Advanced route inputs</summary>
                  <p className="body-muted">
                    The service zone selector and raw route fields are only for manual testing while
                    map search and route calculation are still being wired up.
                  </p>
                  <div className="field-group" style={{ marginTop: 18 }}>
                    <label className="field-label">Service zone</label>
                    <select
                      className="select"
                      value={form.serviceZoneId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          serviceZoneId: event.target.value
                        }))
                      }
                    >
                      <option value="">Select a zone</option>
                      {(zonesQuery.data ?? []).map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {zone.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="four-up" style={{ marginTop: 18 }}>
                    {[
                      ["pickupLatitude", "Pickup lat"],
                      ["pickupLongitude", "Pickup lng"],
                      ["destinationLatitude", "Destination lat"],
                      ["destinationLongitude", "Destination lng"],
                      ["estimatedDistanceKm", "Distance km"],
                      ["estimatedDurationMinutes", "Duration min"]
                    ].map(([name, label]) => (
                      <div className="field-group" key={name}>
                        <label className="field-label">{label}</label>
                        <input
                          className="input"
                          value={form[name as keyof typeof form]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [name]: event.target.value
                            }))
                          }
                          placeholder={label}
                        />
                      </div>
                    ))}
                  </div>
                </details>

                {recentDestinations.length > 0 ? (
                  <div className="exact-saved-places">
                    {recentDestinations.map((destination) => (
                      <button
                        key={destination}
                        className="exact-saved-place"
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            destinationAddress: destination
                          }))
                        }
                      >
                        <div className="exact-saved-icon">
                          <Clock size={18} />
                        </div>
                        <div>
                          <strong>Recent destination</strong>
                          <span>{destination}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="exact-ride-options">
                  <h3>Choose a ride</h3>
                  {(["standard_bike", "express_bike"] as const).map((option) => {
                    const active = rideType === option;
                    const fare = estimateMutation.data
                      ? formatMoney(selectedZone?.currency ?? session.user.preferredCurrency, estimateMutation.data.pricing.totalFare)
                      : "Estimate fare";

                    return (
                      <article
                        key={option}
                        className={`exact-ride-option${active ? " active" : ""}`}
                        onClick={() => setRideType(option)}
                        role="button"
                        tabIndex={0}
                      >
                        {option === "express_bike" ? (
                          <div className="exact-option-badge">Priority</div>
                        ) : null}
                        <div className="exact-ride-icon">
                          <Bike size={24} />
                        </div>
                        <div className="exact-ride-copy">
                          <div className="exact-ride-title-row">
                            <strong>{getRideTypeLabel(option)}</strong>
                            <User size={14} />
                          </div>
                          <span>
                            {selectedZone
                              ? `${selectedZone.city} live pricing`
                              : "Select a zone first"}
                          </span>
                        </div>
                        <div className="exact-ride-fare">{fare}</div>
                      </article>
                    );
                  })}
              </div>

                <div className="button-row" style={{ marginTop: 18 }}>
                  <select
                    className="select"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as "wallet" | "cash" | "card" | "mobile_money"
                      )
                    }
                  >
                    <option value="wallet">Wallet</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile_money">Mobile money</option>
                  </select>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => estimateMutation.mutate()}
                    disabled={estimateMutation.isPending}
                  >
                    {estimateMutation.isPending ? "Calculating..." : "Estimate fare"}
                  </button>
                </div>

                {estimateMutation.isError ? (
                  <div className="empty-state" style={{ marginTop: 18 }}>
                    <strong>Fare estimate failed.</strong>
                    <p>{estimateMutation.error.message}</p>
                  </div>
                ) : null}

                {createRideMutation.isError ? (
                  <div className="empty-state" style={{ marginTop: 18 }}>
                    <strong>Ride request failed.</strong>
                    <p>{createRideMutation.error.message}</p>
                  </div>
                ) : null}
            </section>
          </div>

          <footer className="exact-passenger-footer">
            <div className="exact-payment-row">
              <div className="exact-cash-badge">{paymentMethod.toUpperCase()}</div>
              <span>
                {selectedZone
                  ? `${selectedZone.city} - ${currencySymbol(selectedZone.currency)}`
                  : "Select a service zone"}
              </span>
            </div>
            <button
              className="exact-primary-cta"
              type="button"
              onClick={() => createRideMutation.mutate()}
              disabled={createRideMutation.isPending}
            >
              {createRideMutation.isPending
                ? "Requesting ride..."
                : `Book ${getRideTypeLabel(rideType)}`}
            </button>
          </footer>
        </aside>

        <section className="exact-passenger-map">
          <div className="map-shell exact-passenger-map-stage">
            <PassengerRouteMap
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              route={routePreviewQuery.data?.route ?? []}
              currentPosition={
                liveLocationReady
                  ? {
                      position: [liveLocation!.latitude, liveLocation!.longitude] as [number, number],
                      label: "You"
                    }
                  : null
              }
            />
            {mapMarkers.length === 0 &&
            (routePreviewQuery.data?.route?.length ?? 0) <= 1 &&
            !liveLocationReady ? (
              <div className="map-empty-note" aria-live="polite">
                <div className="map-empty-note-card">
                  <strong>Start with pickup and destination</strong>
                  <p>Choose a pickup and destination to preview the route on the live passenger map.</p>
                </div>
              </div>
            ) : null}

            <div className="exact-passenger-map-topbar">
              <div className="exact-passenger-map-chip">
                <span>Operating city</span>
                <strong>{selectedZone?.city ?? "Accra"}</strong>
              </div>
              <div className="exact-passenger-map-chip">
                <span>Availability</span>
                <strong>
                  {onlineRiderCount > 0 ? `${onlineRiderCount} riders online` : "Matching live"}
                </strong>
              </div>
            </div>

            <div className="exact-passenger-map-floating exact-passenger-map-floating-left">
              <div className="exact-passenger-map-card route">
                <span className="exact-passenger-map-card-label">Live route preview</span>
                <strong>{pickupAddress || "Choose pickup"} to {destinationAddress || "Choose destination"}</strong>
                <p>
                  {routePreviewQuery.data
                    ? `${routeDistanceLabel} · ${routeDurationLabel} via ${routePreviewQuery.data.provider.toUpperCase()}`
                    : "Search both ends of the trip to draw the route on the live map."}
                </p>
                <div className="exact-passenger-map-metrics">
                  <div>
                    <span>Distance</span>
                    <strong>{routeDistanceLabel}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{routeDurationLabel}</strong>
                  </div>
                  <div>
                    <span>Fare</span>
                    <strong>{farePreviewLabel}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="exact-passenger-map-floating exact-passenger-map-floating-right">
              <div className="exact-passenger-map-card status">
                <span className="exact-passenger-map-card-label">Ride status</span>
                <strong>{liveRideHeading}</strong>
                <p>{liveRideDescription}</p>
                <div className="exact-passenger-map-status-grid">
                  <div>
                    <span>Pickup</span>
                    <strong>{pickupAddress || "Not set"}</strong>
                  </div>
                  <div>
                    <span>Destination</span>
                    <strong>{destinationAddress || "Not set"}</strong>
                  </div>
                  <div>
                    <span>GPS</span>
                    <strong>{liveLocationReady ? "Ready" : "Waiting"}</strong>
                  </div>
                  <div>
                    <span>Payment</span>
                    <strong>{paymentMethod.replace("_", " ")}</strong>
                  </div>
                </div>
                <div className="button-row exact-passenger-map-actions">
                  <a href="/passenger/history" className="button-secondary">
                    History
                  </a>
                  <a href="/passenger/wallet" className="button-secondary">
                    Wallet
                  </a>
                  <a href="/passenger/service" className="button-secondary">
                    Service
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PassengerShell>
  );
}
