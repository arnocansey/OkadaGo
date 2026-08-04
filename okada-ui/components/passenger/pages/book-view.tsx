"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bike, MessageCircle, Phone, Truck, Zap } from "lucide-react";
import { fetchJson, postJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { resolveAddressLabel } from "@/lib/location";
import { paxToast } from "@/components/passenger/lib/toast";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { useGeoLocation } from "@/components/passenger/hooks/use-geo-location";
import { AddressField } from "@/components/passenger/ui/address-field";
import { RideMap, type MapMarker } from "@/components/passenger/map/ride-map";
import { MAP_LEGEND, MapLegend, type MapLegendItem } from "@/components/passenger/map/map-legend";
import { BookFormSkeleton, PaxSkeleton } from "@/components/passenger/ui/skeletons";
import {
  ACTIVE_RIDE_STATUSES,
  initials,
  parseCoord,
  type FareEstimate,
  type LocationPoint,
  type Ride,
  type RideType,
  type RoutePreview,
  type ServiceZone
} from "@/components/passenger/types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function toApiRideType(rideType: RideType): "standard_bike" | "express_bike" | "cargo_tricycle" {
  if (rideType === "express") return "express_bike";
  if (rideType === "cargo") return "cargo_tricycle";
  return "standard_bike";
}

function toSurgeMultiplier(rideType: RideType) {
  return rideType === "express" ? 1.2 : 1;
}

function rideTypeLabel(rideType: RideType) {
  if (rideType === "express") return "OkadaX";
  if (rideType === "cargo") return "Cargo";
  return "OkadaGo";
}

function TrackingPanel({
  riderName,
  statusLabel,
  destinationAddress
}: {
  riderName: string;
  statusLabel: string;
  destinationAddress: string;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-4">
        <div className="pax-avatar-lg">
          {initials(riderName)}
          <span className="pax-rating-badge">4.8 ★</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">{riderName}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm pax-text-secondary">
            <Bike size={14} /> OkadaGo
          </p>
        </div>
      </div>

      <div className="pax-alert-box mb-5">
        <div className="pax-alert-box-title">{statusLabel}</div>
        <div className="pax-alert-box-sub">{destinationAddress}</div>
      </div>

      <div className="mb-5 flex gap-3">
        <button type="button" className="pax-btn-secondary flex-1">
          <Phone size={18} /> Call
        </button>
        <button type="button" className="pax-btn-secondary flex-1 pax-text-primary">
          <MessageCircle size={18} /> Chat
        </button>
      </div>

      <div className="text-center">
        <button type="button" className="rounded-full px-4 py-2 text-sm font-medium pax-text-danger">
          Cancel ride
        </button>
      </div>
    </>
  );
}

function BookingForm({
  pickupText,
  dropoffText,
  pickup,
  dropoff,
  center,
  rideType,
  setRideType,
  setPickup,
  setDropoff,
  setPickupText,
  setDropoffText,
  setPickupSource,
  routeQuery,
  fare,
  currency,
  bookMutation,
  onBook,
  hasFix,
  geoLoading,
  onUseCurrentLocation,
  fareLoading
}: {
  pickupText: string;
  dropoffText: string;
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  center: [number, number];
  rideType: RideType;
  setRideType: (v: RideType) => void;
  setPickup: (v: LocationPoint) => void;
  setDropoff: (v: LocationPoint) => void;
  setPickupText: (v: string) => void;
  setDropoffText: (v: string) => void;
  setPickupSource: (v: "gps" | "manual") => void;
  routeQuery: { data?: RoutePreview; isFetching?: boolean };
  fare: number | null;
  currency: string;
  bookMutation: { isPending: boolean; error: Error | null };
  onBook: () => void;
  hasFix: boolean;
  geoLoading: boolean;
  onUseCurrentLocation: () => void;
  fareLoading: boolean;
}) {
  const proximity = pickup ? { lat: pickup.lat, lng: pickup.lng } : { lat: center[0], lng: center[1] };

  return (
    <div className="pax-book-form-body">
      <h2 className="pax-desktop-only pax-greeting mb-1">Book a ride</h2>
      <p className="pax-desktop-only pax-greeting-sub mb-5">Set pickup and destination to see your fare</p>

      <div className="relative mb-4 flex flex-col gap-4">
        <div className="absolute bottom-8 left-[9px] top-6 w-0.5 bg-[var(--pax-border)]" />
        <AddressField
          label="Pickup"
          value={pickupText}
          placeholder="Where are you?"
          kind="pickup"
          proximity={proximity}
          showUseCurrentLocation
          useCurrentLocationLoading={geoLoading && !hasFix}
          onUseCurrentLocation={onUseCurrentLocation}
          onChange={(value) => {
            setPickupSource("manual");
            setPickupText(value);
          }}
          onSelect={(place) => {
            setPickupSource("manual");
            setPickup(place);
            setPickupText(place.label);
          }}
        />
        <AddressField
          label="Destination"
          value={dropoffText}
          placeholder="Where to?"
          kind="dropoff"
          proximity={proximity}
          onChange={setDropoffText}
          onSelect={(place) => setDropoff(place)}
        />
      </div>

      {routeQuery.data ? (
        <div className="mb-4 text-center text-sm pax-text-secondary lg:text-left">
          {routeQuery.data.distanceKm.toFixed(1)} km · ~{routeQuery.data.durationMinutes} min
        </div>
      ) : pickup && dropoff && routeQuery.isFetching ? (
        <PaxSkeleton className="mb-4 h-4 w-40" />
      ) : null}

      <div className="pax-book-ride-options">
        <button
          type="button"
          className={`pax-ride-option${rideType === "standard" ? " pax-ride-option--selected" : ""}`}
          onClick={() => setRideType("standard")}
        >
          <Bike className="mb-2" size={28} />
          <div className="text-sm font-bold">OkadaGo</div>
          <div className="text-xs pax-text-secondary">Standard</div>
          {fare && rideType === "standard" ? (
            <div className="mt-1 text-base font-bold pax-text-primary">{formatMoney(currency, fare)}</div>
          ) : fareLoading && rideType === "standard" ? (
            <PaxSkeleton className="mx-auto mt-2 h-5 w-16" />
          ) : null}
        </button>
        <button
          type="button"
          className={`pax-ride-option relative${rideType === "express" ? " pax-ride-option--selected" : ""}`}
          onClick={() => setRideType("express")}
        >
          <div className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-[var(--pax-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--pax-text-on-primary)]">
            <Zap size={10} /> Fast
          </div>
          <Bike className="mb-2" size={28} />
          <div className="text-sm font-bold">OkadaX</div>
          <div className="text-xs pax-text-secondary">Express</div>
          {fare && rideType === "express" ? (
            <div className="mt-1 text-base font-bold pax-text-primary">{formatMoney(currency, fare)}</div>
          ) : fareLoading && rideType === "express" ? (
            <PaxSkeleton className="mx-auto mt-2 h-5 w-16" />
          ) : null}
        </button>
        <button
          type="button"
          className={`pax-ride-option${rideType === "cargo" ? " pax-ride-option--selected" : ""}`}
          onClick={() => setRideType("cargo")}
        >
          <Truck className="mb-2" size={28} />
          <div className="text-sm font-bold">Cargo</div>
          <div className="text-xs pax-text-secondary">Tricycle</div>
          {fare && rideType === "cargo" ? (
            <div className="mt-1 text-base font-bold pax-text-primary">{formatMoney(currency, fare)}</div>
          ) : fareLoading && rideType === "cargo" ? (
            <PaxSkeleton className="mx-auto mt-2 h-5 w-16" />
          ) : null}
        </button>
      </div>

      <div className="pax-payment-row mb-5">
        <div className="flex items-center gap-2">
          <div className="pax-momo-badge">MoMo</div>
          <span className="text-sm font-medium">MTN MoMo</span>
        </div>
        <button type="button" className="text-sm font-medium pax-text-primary">
          Change
        </button>
      </div>

      {bookMutation.error ? (
        <p className="mb-3 text-sm pax-text-danger">{(bookMutation.error as Error).message}</p>
      ) : null}

      <button
        type="button"
        className="pax-btn-primary mt-auto justify-between px-6"
        disabled={!pickup || !dropoff || !fare || bookMutation.isPending}
        onClick={onBook}
      >
        <span>{bookMutation.isPending ? "Booking…" : `Book ${rideTypeLabel(rideType)}`}</span>
        <span>{fare ? formatMoney(currency, fare) : "—"}</span>
      </button>
    </div>
  );
}

export function BookView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackingRideId = searchParams.get("ride");
  const dropoffLatParam = searchParams.get("dropoffLat");
  const dropoffLngParam = searchParams.get("dropoffLng");
  const dropoffLabelParam = searchParams.get("dropoffLabel");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { center, coords, hasFix, loading: geoLoading, refresh: refreshGeo } = useGeoLocation();
  const userLocation = useMemo(
    () => (hasFix && coords ? { lat: coords[0], lng: coords[1] } : null),
    [hasFix, coords]
  );

  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null);
  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");
  const [pickupSource, setPickupSource] = useState<"gps" | "manual">("gps");
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [rideType, setRideType] = useState<RideType>("standard");
  const [paymentMethod] = useState<"cash" | "wallet" | "mobile_money">("mobile_money");

  const passengerProfileId = session?.user.passengerProfileId;

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZone[]>("/bootstrap/service-zones?limit=100")
  });

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<Ride[]>("/rides"),
    refetchInterval: trackingRideId ? 5_000 : false
  });

  const trackingRide = useMemo(() => {
    if (!trackingRideId) return null;
    return (ridesQuery.data ?? []).find((r) => r.id === trackingRideId) ?? null;
  }, [trackingRideId, ridesQuery.data]);

  const selectedZone = zonesQuery.data?.[0] ?? null;

  const routeQuery = useQuery({
    queryKey: ["route-preview", pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng],
    queryFn: () =>
      fetchJson<RoutePreview>(
        `/bootstrap/route-preview?startLat=${pickup!.lat}&startLon=${pickup!.lng}&endLat=${dropoff!.lat}&endLon=${dropoff!.lng}`
      ),
    enabled: Boolean(pickup && dropoff)
  });

  const fareQuery = useQuery({
    queryKey: ["fare-estimate", pickup, dropoff, rideType, routeQuery.data?.distanceKm],
    queryFn: () =>
      postJson<FareEstimate, unknown>("/rides/estimate", {
        pickup: {
          address: pickup!.label,
          latitude: pickup!.lat,
          longitude: pickup!.lng
        },
        destination: {
          address: dropoff!.label,
          latitude: dropoff!.lat,
          longitude: dropoff!.lng
        },
        pricing: {
          countryCode: selectedZone!.countryCode,
          currency: selectedZone!.currency,
          rideType: toApiRideType(rideType),
          baseFare: parseNumber(selectedZone!.baseFare),
          perKmFee: parseNumber(selectedZone!.perKmFee),
          perMinuteFee: parseNumber(selectedZone!.perMinuteFee),
          minimumFare: parseNumber(selectedZone!.minimumFare),
          cancellationFee: 0,
          waitingFeePerMinute: 0,
          commissionPercent: 12,
          surgeMultiplier: toSurgeMultiplier(rideType),
          zoneFee: 0,
          promoDiscount: 0,
          referralDiscount: 0,
          estimatedDistanceKm: routeQuery.data!.distanceKm,
          estimatedDurationMinutes: routeQuery.data!.durationMinutes,
          waitingMinutes: 0
        }
      }),
    enabled: Boolean(pickup && dropoff && selectedZone && routeQuery.data)
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!passengerProfileId || !selectedZone || !pickup || !dropoff) {
        throw new Error("Complete pickup and destination before booking.");
      }
      return postJson<{ ride: Ride }, unknown>("/rides/request", {
        passengerProfileId,
        serviceZoneId: selectedZone.id,
        paymentMethod,
        pickup: { address: pickup.label, latitude: pickup.lat, longitude: pickup.lng },
        destination: { address: dropoff.label, latitude: dropoff.lat, longitude: dropoff.lng },
        estimatedDistanceKm: routeQuery.data?.distanceKm ?? 0,
        estimatedDurationMinutes: routeQuery.data?.durationMinutes ?? 0,
        rideType: toApiRideType(rideType),
        surgeMultiplier: toSurgeMultiplier(rideType)
      });
    },
    onSuccess: async (data) => {
      paxToast.success("Ride requested!", "Finding a rider near you…");
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      router.replace(`/passenger/book?ride=${data.ride.id}`);
    },
    onError: (error) => {
      paxToast.error("Could not book ride", (error as Error).message);
    }
  });

  useEffect(() => {
    if (pickupSource !== "gps") return;
    if (!userLocation) {
      if (geoLoading) setPickupText("Getting your location…");
      return;
    }

    let cancelled = false;
    const { lat, lng } = userLocation;
    setPickupText((prev) => (prev === "" || prev.startsWith("Getting") ? "Getting your location…" : prev));

    void resolveAddressLabel(lat, lng).then((label) => {
      if (cancelled) return;
      setPickup({ lat, lng, label });
      setPickupText(label);
    });

    return () => {
      cancelled = true;
    };
  }, [pickupSource, userLocation, geoLoading]);

  const handleUseCurrentLocation = () => {
    setPickupSource("gps");
    refreshGeo();
    if (hasFix && userLocation) {
      setRecenterSignal((value) => value + 1);
      paxToast.info("Pickup set to your current location");
    } else if (!geoLoading) {
      paxToast.warning("Location unavailable", "Allow location access or enter pickup manually.");
    }
  };

  useEffect(() => {
    if (!dropoffLatParam || !dropoffLngParam || dropoff) return;

    const lat = Number(dropoffLatParam);
    const lng = Number(dropoffLngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const label = dropoffLabelParam?.trim() || "Destination";
    setDropoff({ lat, lng, label });
    setDropoffText(label);
  }, [dropoffLatParam, dropoffLngParam, dropoffLabelParam, dropoff]);

  const currency = selectedZone?.currency ?? session?.user.preferredCurrency ?? "GHS";
  const fare = fareQuery.data?.pricing.totalFare ?? null;

  const mapCenter: [number, number] = useMemo(() => {
    if (trackingRide) {
      const lat = parseCoord(trackingRide.rider?.currentLatitude ?? trackingRide.pickupLatitude);
      const lng = parseCoord(trackingRide.rider?.currentLongitude ?? trackingRide.pickupLongitude);
      return [lat, lng];
    }
    if (pickup && dropoff) return [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2];
    if (pickup) return [pickup.lat, pickup.lng];
    return center;
  }, [trackingRide, pickup, dropoff, center]);

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    const ride = trackingRide ?? null;

    if (ride) {
      list.push({
        id: "pickup",
        lat: parseCoord(ride.pickupLatitude),
        lng: parseCoord(ride.pickupLongitude),
        kind: "pickup"
      });
      list.push({
        id: "dropoff",
        lat: parseCoord(ride.destinationLatitude),
        lng: parseCoord(ride.destinationLongitude),
        kind: "dropoff"
      });
      if (ride.rider?.currentLatitude != null) {
        list.push({
          id: "rider",
          lat: parseCoord(ride.rider.currentLatitude),
          lng: parseCoord(ride.rider.currentLongitude),
          kind: "rider"
        });
      }
      return list;
    }

    if (pickup) {
      const atUser =
        userLocation &&
        Math.abs(pickup.lat - userLocation.lat) < 0.0003 &&
        Math.abs(pickup.lng - userLocation.lng) < 0.0003;
      if (!atUser) {
        list.push({ id: "pickup", lat: pickup.lat, lng: pickup.lng, kind: "pickup" });
      }
    }
    if (dropoff) list.push({ id: "dropoff", lat: dropoff.lat, lng: dropoff.lng, kind: "dropoff" });
    return list;
  }, [trackingRide, pickup, dropoff, userLocation]);

  const route = routeQuery.data?.route ?? [];

  const legendItems = useMemo(() => {
    const items: MapLegendItem[] = [MAP_LEGEND.you];
    if (pickup) items.push(MAP_LEGEND.pickup);
    if (dropoff) items.push(MAP_LEGEND.dropoff);
    return items;
  }, [pickup, dropoff]);

  const formProps = {
    pickupText,
    dropoffText,
    pickup,
    dropoff,
    center,
    rideType,
    setRideType,
    setPickup,
    setDropoff,
    setPickupText,
    setDropoffText,
    setPickupSource,
    routeQuery,
    fare,
    currency,
    bookMutation,
    onBook: () => bookMutation.mutate(),
    hasFix,
    geoLoading,
    onUseCurrentLocation: handleUseCurrentLocation,
    fareLoading: fareQuery.isFetching && Boolean(pickup && dropoff)
  };

  if (trackingRide && ACTIVE_RIDE_STATUSES.has(trackingRide.status)) {
    const riderName = trackingRide.rider?.user.fullName ?? "Finding rider…";
    const statusLabel =
      trackingRide.status === "IN_PROGRESS"
        ? "On trip"
        : trackingRide.status === "SEARCHING" || trackingRide.status === "REQUESTED"
          ? "Finding a rider"
          : "Rider on the way";

    return (
      <PassengerAppFrame hideNav fullBleed>
        <div className="pax-split">
          <div className="pax-split-map">
            <RideMap
              center={mapCenter}
              markers={markers}
              route={route}
              userLocation={userLocation}
              recenterSignal={recenterSignal}
            />
            <MapLegend
              items={[MAP_LEGEND.you, MAP_LEGEND.pickup, MAP_LEGEND.dropoff, MAP_LEGEND.rider]}
            />
            <Link href="/passenger" className="pax-tracking-back">
              <ArrowLeft size={22} />
            </Link>
            <div className="pax-tracking-status">
              <span className="pax-status-pulse" />
              {statusLabel}
            </div>
          </div>

          <div className="pax-split-panel">
            <div className="pax-split-panel-inner pax-tracking-panel">
              <TrackingPanel
                riderName={riderName}
                statusLabel={statusLabel}
                destinationAddress={trackingRide.destinationAddress}
              />
            </div>
          </div>

          <div className="pax-bottom-sheet pax-tracking-panel">
            <div className="pax-sheet-handle" />
            <TrackingPanel
              riderName={riderName}
              statusLabel={statusLabel}
              destinationAddress={trackingRide.destinationAddress}
            />
          </div>
        </div>
      </PassengerAppFrame>
    );
  }

  return (
    <PassengerAppFrame hideNav fullBleed>
      <div className="pax-split pax-book-split">
        <div className="pax-split-map pax-desktop-only">
          <RideMap
            center={mapCenter}
            zoom={13}
            markers={markers}
            route={route}
            userLocation={userLocation}
            recenterSignal={recenterSignal}
          />
          <MapLegend items={legendItems} />
        </div>

        <div className="pax-split-panel">
          <div className="pax-book-panel-head">
            <Link href="/passenger" aria-label="Back to home">
              <ArrowLeft size={22} />
            </Link>
            <h1>Book a ride</h1>
          </div>
          <div className="pax-split-panel-inner pax-book-form">
            {zonesQuery.isLoading ? <BookFormSkeleton /> : <BookingForm {...formProps} />}
          </div>
        </div>

        <div className="pax-book-mobile-shell pax-mobile-only">
          <div className="pax-book-header">
            <Link href="/passenger" aria-label="Back to home">
              <ArrowLeft size={22} />
            </Link>
            <h1>Book a ride</h1>
          </div>
          <div className="pax-book-map-mobile">
            <RideMap
              center={mapCenter}
              zoom={13}
              markers={markers}
              route={route}
              userLocation={userLocation}
              recenterSignal={recenterSignal}
            />
            <MapLegend items={legendItems} />
          </div>
          <div className="pax-book-form">
            {zonesQuery.isLoading ? <BookFormSkeleton /> : <BookingForm {...formProps} />}
          </div>
        </div>
      </div>
    </PassengerAppFrame>
  );
}
