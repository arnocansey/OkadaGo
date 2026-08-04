"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MapPin, Navigation } from "lucide-react";
import { fetchJson, fetchListJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { useGeoLocation } from "@/components/passenger/hooks/use-geo-location";
import { useLocationLabel } from "@/components/passenger/hooks/use-location-label";
import { RideMap, type MapMarker } from "@/components/passenger/map/ride-map";
import { MAP_LEGEND, MapLegend, type MapLegendItem } from "@/components/passenger/map/map-legend";
import { ActiveRidePanel, HomeBookingPanel } from "@/components/passenger/ui/home-panel";
import { HomePanelSkeleton } from "@/components/passenger/ui/skeletons";
import {
  ACTIVE_RIDE_STATUSES,
  initials,
  parseCoord,
  type Ride,
  type RiderPin,
  type SavedPlace
} from "@/components/passenger/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const { session } = useAuth();
  const { center, coords, refresh, hasFix } = useGeoLocation();
  const userLocation = useMemo(
    () => (hasFix && coords ? { lat: coords[0], lng: coords[1] } : null),
    [hasFix, coords]
  );
  const { label: locationLabel } = useLocationLabel(center[0], center[1], hasFix);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const firstName = session?.user.fullName.split(" ")[0] ?? "there";

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<Ride[]>("/rides"),
    refetchInterval: 8_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders-pins"],
    queryFn: () => fetchListJson<RiderPin>("/bootstrap/riders?limit=50"),
    refetchInterval: 15_000
  });

  const savedPlacesQuery = useQuery({
    queryKey: ["saved-places"],
    queryFn: () => fetchJson<SavedPlace[]>("/places/saved")
  });

  const activeRide = useMemo(
    () => (ridesQuery.data ?? []).find((r) => ACTIVE_RIDE_STATUSES.has(r.status)),
    [ridesQuery.data]
  );

  const recentTrips = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((r) => !ACTIVE_RIDE_STATUSES.has(r.status))
        .slice(0, 3),
    [ridesQuery.data]
  );

  const markers = useMemo(() => {
    const list: MapMarker[] = [];

    if (activeRide) {
      list.push({
        id: "pickup",
        lat: parseCoord(activeRide.pickupLatitude),
        lng: parseCoord(activeRide.pickupLongitude),
        kind: "pickup"
      });
      list.push({
        id: "dropoff",
        lat: parseCoord(activeRide.destinationLatitude),
        lng: parseCoord(activeRide.destinationLongitude),
        kind: "dropoff"
      });
      if (activeRide.rider?.currentLatitude != null && activeRide.rider.currentLongitude != null) {
        list.push({
          id: "rider",
          lat: parseCoord(activeRide.rider.currentLatitude),
          lng: parseCoord(activeRide.rider.currentLongitude),
          kind: "rider"
        });
      }
    } else {
      for (const rider of ridersQuery.data ?? []) {
        if (rider.onlineStatus && rider.currentLatitude != null && rider.currentLongitude != null) {
          list.push({
            id: rider.id,
            lat: parseCoord(rider.currentLatitude),
            lng: parseCoord(rider.currentLongitude),
            kind: "rider"
          });
        }
      }
    }

    return list;
  }, [activeRide, ridersQuery.data]);

  const activeStatusLabel = activeRide
    ? activeRide.status === "IN_PROGRESS"
      ? "On trip"
      : activeRide.status === "ACCEPTED" || activeRide.status === "RIDER_EN_ROUTE"
        ? "Rider on the way"
        : activeRide.status === "ARRIVED"
          ? "Rider arrived"
          : "Finding a rider"
    : "";

  const legendItems = useMemo(() => {
    const items: MapLegendItem[] = [];
    if (userLocation) items.push(MAP_LEGEND.you);
    if (activeRide) {
      items.push(MAP_LEGEND.pickup, MAP_LEGEND.dropoff, MAP_LEGEND.rider);
    } else {
      items.push(MAP_LEGEND.rider);
    }
    return items;
  }, [userLocation, activeRide]);

  return (
    <PassengerAppFrame fullBleed>
      <div className="pax-split">
        <div className="pax-split-map">
          <RideMap
            center={center}
            zoom={14}
            markers={markers}
            userLocation={userLocation}
            recenterSignal={recenterSignal}
          />

          <MapLegend items={legendItems} />

          <div className="pax-header-overlay">
            <div className="pax-glass-bar flex flex-1 items-center gap-3">
              <div className="pax-avatar">{initials(session?.user.fullName ?? "OG")}</div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-base font-semibold leading-tight">
                  {greeting()}, {firstName}
                </div>
                <div className="pax-greeting-sub mt-0.5">
                  <MapPin size={10} />
                  <span>{locationLabel}</span>
                </div>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="pax-fab pax-fab--mobile"
            aria-label="Recenter map"
            onClick={() => {
              refresh();
              if (hasFix) setRecenterSignal((value) => value + 1);
            }}
          >
            <Navigation size={22} className="fill-current" />
          </button>
        </div>

        <div className="pax-split-panel">
          <div className="pax-split-panel-inner">
            <h2 className="pax-greeting">{greeting()}, {firstName}</h2>
            <div className="pax-greeting-sub">
              <MapPin size={12} />
              <span>{locationLabel}</span>
            </div>
            {activeRide ? (
              <ActiveRidePanel
                ride={activeRide}
                riderName={activeRide.rider?.user.fullName ?? "Your rider"}
                statusLabel={activeStatusLabel}
                initialsLabel={initials(activeRide.rider?.user.fullName ?? "R")}
              />
            ) : ridesQuery.isLoading ? (
              <HomePanelSkeleton />
            ) : (
              <HomeBookingPanel
                recentTrips={recentTrips}
                savedPlaces={savedPlacesQuery.data ?? []}
              />
            )}
          </div>
        </div>

        {activeRide ? (
          <div className="pax-bottom-sheet px-5 pt-0">
            <div className="pax-sheet-handle" />
            <ActiveRidePanel
              ride={activeRide}
              riderName={activeRide.rider?.user.fullName ?? "Your rider"}
              statusLabel={activeStatusLabel}
              initialsLabel={initials(activeRide.rider?.user.fullName ?? "R")}
            />
          </div>
        ) : ridesQuery.isLoading ? (
          <div className="pax-bottom-sheet px-5 pt-0">
            <div className="pax-sheet-handle" />
            <HomePanelSkeleton />
          </div>
        ) : (
          <div className="pax-bottom-sheet px-5 pt-0">
            <div className="pax-sheet-handle" />
            <HomeBookingPanel
              recentTrips={recentTrips}
              savedPlaces={savedPlacesQuery.data ?? []}
            />
          </div>
        )}
      </div>
    </PassengerAppFrame>
  );
}
