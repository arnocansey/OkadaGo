"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Clock, Home as HomeIcon, Package, Search } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { parseCoord, type Ride, type SavedPlace } from "@/components/passenger/types";

type HomePanelProps = {
  recentTrips: Ride[];
  savedPlaces?: SavedPlace[];
};

function findSavedPlace(places: SavedPlace[], pattern: RegExp) {
  return places.find((place) => pattern.test(place.label));
}

function bookHref(place: SavedPlace) {
  const lat = parseCoord(place.latitude);
  const lng = parseCoord(place.longitude);
  const params = new URLSearchParams({
    dropoffLat: String(lat),
    dropoffLng: String(lng),
    dropoffLabel: place.address || place.label
  });
  return `/passenger/book?${params.toString()}`;
}

export function HomeBookingPanel({ recentTrips, savedPlaces = [] }: HomePanelProps) {
  const router = useRouter();
  const homePlace = findSavedPlace(savedPlaces, /\bhome\b/i);
  const workPlace = findSavedPlace(savedPlaces, /\bwork\b/i);

  return (
    <>
      <Link href="/passenger/book" className="pax-search-box mb-4">
        <Search size={20} />
        <span>Where to?</span>
      </Link>

      <div className="mb-5 flex gap-3">
        {homePlace ? (
          <button
            type="button"
            className="pax-chip pax-chip--active"
            onClick={() => router.push(bookHref(homePlace))}
          >
            <HomeIcon size={16} /> Home
          </button>
        ) : (
          <Link href="/passenger/places" className="pax-chip pax-chip--active">
            <HomeIcon size={16} /> Home
          </Link>
        )}
        {workPlace ? (
          <button type="button" className="pax-chip" onClick={() => router.push(bookHref(workPlace))}>
            <Briefcase size={16} /> Work
          </button>
        ) : (
          <Link href="/passenger/places" className="pax-chip">
            <Briefcase size={16} /> Work
          </Link>
        )}
        <Link href="/passenger/delivery" className="pax-chip">
          <Package size={16} /> Send package
        </Link>
      </div>

      {recentTrips.length > 0 ? (
        <>
          <h3 className="pax-section-title">Recent</h3>
          <div className="pax-recent-list">
            {recentTrips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                className="pax-recent-item w-full text-left"
                onClick={() => {
                  const params = new URLSearchParams({
                    dropoffLat: String(parseCoord(trip.destinationLatitude)),
                    dropoffLng: String(parseCoord(trip.destinationLongitude)),
                    dropoffLabel: trip.destinationAddress
                  });
                  router.push(`/passenger/book?${params.toString()}`);
                }}
              >
                <div className="pax-recent-icon">
                  <Clock size={16} />
                </div>
                <div className="flex-1 min-w-0 border-b border-[var(--pax-border)] pb-3">
                  <div className="truncate text-[15px] font-medium">{trip.destinationAddress.split(",")[0]}</div>
                  <div className="truncate text-xs pax-text-secondary">{trip.pickupAddress.split(",")[0]}</div>
                </div>
                <div className="shrink-0 text-sm font-semibold pax-text-primary">
                  {formatMoney(trip.currency, trip.finalFare ?? trip.estimatedFare)}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

type ActiveRidePanelProps = {
  ride: Ride;
  riderName: string;
  statusLabel: string;
  initialsLabel: string;
};

export function ActiveRidePanel({ ride, riderName, statusLabel, initialsLabel }: ActiveRidePanelProps) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <span className="pax-status-pulse" />
        <span className="text-sm font-bold pax-text-primary">{statusLabel}</span>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <div className="pax-avatar">{initialsLabel}</div>
        <div className="flex-1 min-w-0">
          <div className="truncate font-bold">{riderName}</div>
          <div className="truncate text-sm pax-text-secondary">{ride.destinationAddress}</div>
        </div>
        <div className="shrink-0 text-sm font-bold">
          {formatMoney(ride.currency, ride.estimatedFare ?? ride.finalFare)}
        </div>
      </div>
      <Link href={`/passenger/book?ride=${ride.id}`} className="pax-btn-primary">
        View trip details
      </Link>
    </>
  );
}
