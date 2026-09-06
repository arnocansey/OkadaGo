export interface LocationValidationResult {
  isValid: boolean;
  reason: string | null;
  accuracyM: number | null;
  speedKph: number | null;
  isMocked: boolean;
}

const MAX_ACCURACY_METERS = 100;
const MAX_SPEED_KPH = 200;
const MAX_JUMP_DISTANCE_KM = 50;
const MAX_JUMP_TIME_SECONDS = 60;

export class GpsValidationService {
  private lastLocations: Map<string, { lat: number; lon: number; timestamp: number }> = new Map();

  /**
   * Validate a GPS location update for realism.
   */
  validate(
    riderId: string,
    latitude: number,
    longitude: number,
    accuracy: number | null,
    speed: number | null,
    heading: number | null,
    isMocked: boolean,
    timestamp: number,
  ): LocationValidationResult {
    if (isMocked) {
      return {
        isValid: false,
        reason: "MOCKED_GPS_DETECTED",
        accuracyM: accuracy,
        speedKph: speed,
        isMocked: true,
      };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        isValid: false,
        reason: "INVALID_COORDINATES",
        accuracyM: accuracy,
        speedKph: speed,
        isMocked: false,
      };
    }

    if (accuracy != null && accuracy > MAX_ACCURACY_METERS) {
      return {
        isValid: false,
        reason: "LOW_ACCURACY",
        accuracyM: accuracy,
        speedKph: speed,
        isMocked: false,
      };
    }

    if (speed != null && speed > MAX_SPEED_KPH) {
      return {
        isValid: false,
        reason: "IMPOSSIBLE_SPEED",
        accuracyM: accuracy,
        speedKph: speed,
        isMocked: false,
      };
    }

    const last = this.lastLocations.get(riderId);
    if (last) {
      const timeDiffSeconds = (timestamp - last.timestamp) / 1000;
      if (timeDiffSeconds > 0 && timeDiffSeconds < MAX_JUMP_TIME_SECONDS) {
        const distanceKm = this.haversineDistance(last.lat, last.lon, latitude, longitude);
        const impliedSpeedKph = (distanceKm / timeDiffSeconds) * 3600;

        if (distanceKm > MAX_JUMP_DISTANCE_KM) {
          return {
            isValid: false,
            reason: "IMPOSSIBLE_LOCATION_JUMP",
            accuracyM: accuracy,
            speedKph: speed,
            isMocked: false,
          };
        }

        if (impliedSpeedKph > MAX_SPEED_KPH * 1.5) {
          return {
            isValid: false,
            reason: "SPEED_FROM_POSITIONS_EXCEEDS_LIMIT",
            accuracyM: accuracy,
            speedKph: impliedSpeedKph,
            isMocked: false,
          };
        }
      }
    }

    this.lastLocations.set(riderId, { lat: latitude, lon: longitude, timestamp });

    return {
      isValid: true,
      reason: null,
      accuracyM: accuracy,
      speedKph: speed,
      isMocked: false,
    };
  }

  /**
   * Get the last known location for a rider.
   */
  getLastLocation(riderId: string): { lat: number; lon: number; timestamp: number } | null {
    return this.lastLocations.get(riderId) ?? null;
  }

  /**
   * Clear last location for a rider (e.g., when they go offline).
   */
  clearLastLocation(riderId: string) {
    this.lastLocations.delete(riderId);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const gpsValidationService = new GpsValidationService();
