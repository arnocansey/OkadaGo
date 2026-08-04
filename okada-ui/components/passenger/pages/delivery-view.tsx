"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Package, Phone } from "lucide-react";
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
  ACTIVE_DELIVERY_STATUSES,
  initials,
  parseCoord,
  type Delivery,
  type FareEstimate,
  type LocationPoint,
  type RoutePreview,
  type ServiceZone
} from "@/components/passenger/types";

const PACKAGE_TYPES = [
  { id: "parcel", label: "Parcel" },
  { id: "documents", label: "Documents" },
  { id: "food", label: "Food" },
  { id: "other", label: "Other" }
];

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function TrackingPanel({
  riderName,
  statusLabel,
  dropoffAddress
}: {
  riderName: string;
  statusLabel: string;
  dropoffAddress: string;
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
            <Package size={14} /> OkadaGo Delivery
          </p>
        </div>
      </div>

      <div className="pax-alert-box mb-5">
        <div className="pax-alert-box-title">{statusLabel}</div>
        <div className="pax-alert-box-sub">{dropoffAddress}</div>
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
          Cancel delivery
        </button>
      </div>
    </>
  );
}

function DeliveryForm({
  pickupText,
  dropoffText,
  pickup,
  dropoff,
  center,
  packageType,
  setPackageType,
  recipientName,
  setRecipientName,
  recipientPhone,
  setRecipientPhone,
  packageDescription,
  setPackageDescription,
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
  packageType: string;
  setPackageType: (v: string) => void;
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientPhone: string;
  setRecipientPhone: (v: string) => void;
  packageDescription: string;
  setPackageDescription: (v: string) => void;
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
  const canBook = Boolean(
    pickup && dropoff && fare && recipientName.trim() && recipientPhone.trim() && packageDescription.trim()
  );

  return (
    <div className="pax-book-form-body">
      <h2 className="pax-desktop-only pax-greeting mb-1">Send a package</h2>
      <p className="pax-desktop-only pax-greeting-sub mb-5">Set pickup and drop-off to see your delivery fee</p>

      <div className="relative mb-4 flex flex-col gap-4">
        <div className="absolute bottom-8 left-[9px] top-6 w-0.5 bg-[var(--pax-border)]" />
        <AddressField
          label="Pickup"
          value={pickupText}
          placeholder="Where should the rider pick up?"
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
          label="Drop-off"
          value={dropoffText}
          placeholder="Where is it going?"
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

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium pax-text-secondary">Package type</label>
        <div className="pax-book-ride-options">
          {PACKAGE_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`pax-ride-option${packageType === type.id ? " pax-ride-option--selected" : ""}`}
              onClick={() => setPackageType(type.id)}
            >
              <Package className="mb-2" size={24} />
              <div className="text-sm font-bold">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <input
          className="pax-input"
          placeholder="Recipient name"
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
        />
        <input
          className="pax-input"
          placeholder="Recipient phone (e.g. +233241234567)"
          value={recipientPhone}
          onChange={(event) => setRecipientPhone(event.target.value)}
        />
        <textarea
          className="pax-input"
          placeholder="What are you sending? (e.g. Documents in a brown envelope)"
          rows={2}
          value={packageDescription}
          onChange={(event) => setPackageDescription(event.target.value)}
        />
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
        disabled={!canBook || bookMutation.isPending}
        onClick={onBook}
      >
        <span>{bookMutation.isPending ? "Booking…" : "Book delivery"}</span>
        <span>
          {fare ? formatMoney(currency, fare) : fareLoading ? "…" : "—"}
        </span>
      </button>
    </div>
  );
}

export function DeliveryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackingDeliveryId = searchParams.get("delivery");
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
  const [packageType, setPackageType] = useState("parcel");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [paymentMethod] = useState<"cash" | "wallet" | "mobile_money">("mobile_money");

  const passengerProfileId = session?.user.passengerProfileId;

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZone[]>("/bootstrap/service-zones?limit=100")
  });

  const deliveriesQuery = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => fetchJson<Delivery[]>("/deliveries"),
    refetchInterval: trackingDeliveryId ? 5_000 : false
  });

  const trackingDelivery = useMemo(() => {
    if (!trackingDeliveryId) return null;
    return (deliveriesQuery.data ?? []).find((d) => d.id === trackingDeliveryId) ?? null;
  }, [trackingDeliveryId, deliveriesQuery.data]);

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
    queryKey: ["delivery-fare-estimate", selectedZone?.id, routeQuery.data?.distanceKm, routeQuery.data?.durationMinutes],
    queryFn: () =>
      postJson<FareEstimate, unknown>("/deliveries/estimate", {
        serviceZoneId: selectedZone!.id,
        estimatedDistanceKm: routeQuery.data!.distanceKm,
        estimatedDurationMinutes: routeQuery.data!.durationMinutes
      }),
    enabled: Boolean(pickup && dropoff && selectedZone && routeQuery.data)
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!passengerProfileId || !selectedZone || !pickup || !dropoff) {
        throw new Error("Complete pickup and drop-off before booking.");
      }
      if (!recipientName.trim() || !recipientPhone.trim() || !packageDescription.trim()) {
        throw new Error("Add recipient details and a package description.");
      }
      return postJson<{ delivery: Delivery }, unknown>("/deliveries/request", {
        passengerProfileId,
        serviceZoneId: selectedZone.id,
        paymentMethod,
        pickup: { address: pickup.label, latitude: pickup.lat, longitude: pickup.lng },
        dropoff: { address: dropoff.label, latitude: dropoff.lat, longitude: dropoff.lng },
        recipientName: recipientName.trim(),
        recipientPhoneE164: recipientPhone.trim(),
        packageType,
        packageDescription: packageDescription.trim(),
        estimatedDistanceKm: routeQuery.data?.distanceKm ?? 0,
        estimatedDurationMinutes: routeQuery.data?.durationMinutes ?? 0
      });
    },
    onSuccess: async (data) => {
      paxToast.success("Delivery requested!", "Finding a rider near you…");
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      router.replace(`/passenger/delivery?delivery=${data.delivery.id}`);
    },
    onError: (error) => {
      paxToast.error("Could not book delivery", (error as Error).message);
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

  const currency = selectedZone?.currency ?? session?.user.preferredCurrency ?? "GHS";
  const fare = fareQuery.data?.pricing.totalFare ?? null;

  const mapCenter: [number, number] = useMemo(() => {
    if (trackingDelivery) {
      const lat = parseCoord(trackingDelivery.rider?.currentLatitude ?? trackingDelivery.pickupLatitude);
      const lng = parseCoord(trackingDelivery.rider?.currentLongitude ?? trackingDelivery.pickupLongitude);
      return [lat, lng];
    }
    if (pickup && dropoff) return [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2];
    if (pickup) return [pickup.lat, pickup.lng];
    return center;
  }, [trackingDelivery, pickup, dropoff, center]);

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    const delivery = trackingDelivery ?? null;

    if (delivery) {
      list.push({
        id: "pickup",
        lat: parseCoord(delivery.pickupLatitude),
        lng: parseCoord(delivery.pickupLongitude),
        kind: "pickup"
      });
      list.push({
        id: "dropoff",
        lat: parseCoord(delivery.dropoffLatitude),
        lng: parseCoord(delivery.dropoffLongitude),
        kind: "dropoff"
      });
      if (delivery.rider?.currentLatitude != null) {
        list.push({
          id: "rider",
          lat: parseCoord(delivery.rider.currentLatitude),
          lng: parseCoord(delivery.rider.currentLongitude),
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
  }, [trackingDelivery, pickup, dropoff, userLocation]);

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
    packageType,
    setPackageType,
    recipientName,
    setRecipientName,
    recipientPhone,
    setRecipientPhone,
    packageDescription,
    setPackageDescription,
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

  if (trackingDelivery && ACTIVE_DELIVERY_STATUSES.has(trackingDelivery.status)) {
    const riderName = trackingDelivery.rider?.user.fullName ?? "Finding rider…";
    const statusLabel =
      trackingDelivery.status === "IN_TRANSIT"
        ? "On the way"
        : trackingDelivery.status === "SEARCHING"
          ? "Finding a rider"
          : trackingDelivery.status === "PICKED_UP"
            ? "Package picked up"
            : "Rider assigned";

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
            <MapLegend items={[MAP_LEGEND.you, MAP_LEGEND.pickup, MAP_LEGEND.dropoff, MAP_LEGEND.rider]} />
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
                dropoffAddress={trackingDelivery.dropoffAddress}
              />
            </div>
          </div>

          <div className="pax-bottom-sheet pax-tracking-panel">
            <div className="pax-sheet-handle" />
            <TrackingPanel
              riderName={riderName}
              statusLabel={statusLabel}
              dropoffAddress={trackingDelivery.dropoffAddress}
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
            <h1>Send a package</h1>
          </div>
          <div className="pax-split-panel-inner pax-book-form">
            {zonesQuery.isLoading ? <BookFormSkeleton /> : <DeliveryForm {...formProps} />}
          </div>
        </div>

        <div className="pax-book-mobile-shell pax-mobile-only">
          <div className="pax-book-header">
            <Link href="/passenger" aria-label="Back to home">
              <ArrowLeft size={22} />
            </Link>
            <h1>Send a package</h1>
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
            {zonesQuery.isLoading ? <BookFormSkeleton /> : <DeliveryForm {...formProps} />}
          </div>
        </div>
      </div>
    </PassengerAppFrame>
  );
}
