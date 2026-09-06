/**
 * Geo utilities for distance and bearing calculations.
 * Mirrors the Haversine formula from backend dispatch.service.ts
 */

type Coord = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate straight-line (Haversine) distance between two coordinates in km.
 */
export function haversineDistance(from: Coord, to: Coord): number {
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate bearing (compass direction) from one coordinate to another in degrees.
 * Returns 0–360 where 0 = North, 90 = East, etc.
 */
export function calculateBearing(from: Coord, to: Coord): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI + 360 % 360;
}

/**
 * Estimate travel time in minutes based on distance.
 * Uses average motorcycle speed of 22 km/h for city riding.
 */
export function estimateTravelTimeMinutes(distanceKm: number, averageSpeedKmh = 22): number {
  return Math.max(1, Math.round((distanceKm / averageSpeedKmh) * 60));
}

/**
 * Check if a point is within a given radius of a route polyline.
 * Returns true if the point is off-route.
 */
export function isOffRoute(
  current: Coord,
  route: Coord[],
  thresholdMeters = 50,
): boolean {
  if (route.length < 2) return false;

  const thresholdKm = thresholdMeters / 1000;
  let minDistance = Infinity;

  for (let i = 0; i < route.length - 1; i++) {
    const dist = pointToSegmentDistance(current, route[i], route[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance > thresholdKm;
}

/**
 * Approximate perpendicular distance from a point to a line segment.
 */
function pointToSegmentDistance(point: Coord, segStart: Coord, segEnd: Coord): number {
  const d1 = haversineDistance(segStart, point);
  const d2 = haversineDistance(point, segEnd);
  const segLen = haversineDistance(segStart, segEnd);

  if (segLen === 0) return d1;

  // Approximate projection
  const t = Math.max(0, Math.min(1, ((d1 * d1 - d2 * d2 + segLen * segLen) / (2 * segLen * segLen))));

  const projLat = segStart.latitude + t * (segEnd.latitude - segStart.latitude);
  const projLng = segStart.longitude + t * (segEnd.longitude - segStart.longitude);

  return haversineDistance(point, { latitude: projLat, longitude: projLng });
}

/**
 * Format distance for display (e.g., "1.2 km" or "350 m")
 */
export function formatDistance(km: number): string {
  if (km >= 1) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km * 1000)} m`;
}

/**
 * Format duration for display (e.g., "5 min" or "1 hr 20 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}
