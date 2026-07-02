import type { Delivery, Ride } from "@/types";
import { colors } from "@/theme/tokens";

export type TripMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
};

function coord(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function markersForRide(ride: Ride): TripMarker[] {
  const markers: TripMarker[] = [];
  const pickupLat = coord(ride.pickupLatitude);
  const pickupLon = coord(ride.pickupLongitude);
  const destLat = coord(ride.destinationLatitude);
  const destLon = coord(ride.destinationLongitude);
  const riderLat = coord(ride.rider?.currentLatitude);
  const riderLon = coord(ride.rider?.currentLongitude);

  if (pickupLat != null && pickupLon != null) {
    markers.push({ id: "pickup", latitude: pickupLat, longitude: pickupLon, title: "Pickup", pinColor: colors.mapMarkerPickup });
  }
  if (destLat != null && destLon != null) {
    markers.push({ id: "destination", latitude: destLat, longitude: destLon, title: "Destination", pinColor: colors.mapMarkerDestination });
  }
  if (riderLat != null && riderLon != null) {
    markers.push({ id: "rider", latitude: riderLat, longitude: riderLon, title: "You", pinColor: colors.mapMarkerRider });
  }

  return markers;
}

export function markersForDelivery(delivery: Delivery): TripMarker[] {
  const markers: TripMarker[] = [];
  const pickupLat = coord(delivery.pickupLatitude);
  const pickupLon = coord(delivery.pickupLongitude);
  const dropLat = coord(delivery.dropoffLatitude);
  const dropLon = coord(delivery.dropoffLongitude);
  const riderLat = coord(delivery.rider?.currentLatitude);
  const riderLon = coord(delivery.rider?.currentLongitude);

  if (pickupLat != null && pickupLon != null) {
    markers.push({ id: "pickup", latitude: pickupLat, longitude: pickupLon, title: "Pickup", pinColor: colors.mapMarkerPickup });
  }
  if (dropLat != null && dropLon != null) {
    markers.push({ id: "dropoff", latitude: dropLat, longitude: dropLon, title: "Drop-off", pinColor: colors.mapMarkerDestination });
  }
  if (riderLat != null && riderLon != null) {
    markers.push({ id: "rider", latitude: riderLat, longitude: riderLon, title: "You", pinColor: colors.mapMarkerRider });
  }

  return markers;
}
