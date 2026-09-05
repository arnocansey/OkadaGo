import type { Delivery, Ride } from "@/types";
import type { ThemeColors } from "@/theme/tokens";
import { colors as defaultColors } from "@/theme/tokens";

export type TripMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
  type?: "rider" | "pickup" | "destination" | "dropoff" | "default";
};

function coord(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function markersForRide(ride: Ride, palette: ThemeColors = defaultColors): TripMarker[] {
  const markers: TripMarker[] = [];
  const pickupLat = coord(ride.pickupLatitude);
  const pickupLon = coord(ride.pickupLongitude);
  const destLat = coord(ride.destinationLatitude);
  const destLon = coord(ride.destinationLongitude);
  const riderLat = coord(ride.rider?.currentLatitude);
  const riderLon = coord(ride.rider?.currentLongitude);

  if (pickupLat != null && pickupLon != null) {
    markers.push({ id: "pickup", latitude: pickupLat, longitude: pickupLon, title: "Pickup", pinColor: palette.mapMarkerPickup, type: "pickup" });
  }
  if (destLat != null && destLon != null) {
    markers.push({ id: "destination", latitude: destLat, longitude: destLon, title: "Destination", pinColor: palette.mapMarkerDestination, type: "destination" });
  }
  if (riderLat != null && riderLon != null) {
    markers.push({ id: "rider", latitude: riderLat, longitude: riderLon, title: "Rider", pinColor: palette.mapMarkerRider, type: "rider" });
  }

  return markers;
}

export function markersForDelivery(delivery: Delivery, palette: ThemeColors = defaultColors): TripMarker[] {
  const markers: TripMarker[] = [];
  const pickupLat = coord(delivery.pickupLatitude);
  const pickupLon = coord(delivery.pickupLongitude);
  const dropLat = coord(delivery.dropoffLatitude);
  const dropLon = coord(delivery.dropoffLongitude);
  const riderLat = coord(delivery.rider?.currentLatitude);
  const riderLon = coord(delivery.rider?.currentLongitude);

  if (pickupLat != null && pickupLon != null) {
    markers.push({ id: "pickup", latitude: pickupLat, longitude: pickupLon, title: "Pickup", pinColor: palette.mapMarkerPickup });
  }
  if (dropLat != null && dropLon != null) {
    markers.push({ id: "dropoff", latitude: dropLat, longitude: dropLon, title: "Drop-off", pinColor: palette.mapMarkerDestination, type: "dropoff" });
  }
  if (riderLat != null && riderLon != null) {
    markers.push({ id: "rider", latitude: riderLat, longitude: riderLon, title: "Rider", pinColor: palette.mapMarkerRider, type: "rider" });
  }

  return markers;
}
