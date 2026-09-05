import { haversineKm } from "./geo";

export interface VehicleLocation {
  latitude: number;
  longitude: number;
  heading: number; // 0 - 360 degrees
  speed?: number; // km/h
  timestamp?: number; // ms
}

export interface InterpolatedVehicleState {
  latitude: number;
  longitude: number;
  heading: number;
  isMoving: boolean;
  isIdle: boolean;
  speed: number;
}

/**
 * Calculates the shortest angular delta (-180 to +180) to avoid full spins
 * when rotating across North (e.g. 355° -> 5°).
 */
export function shortestAngularArc(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

/**
 * Smooth cubic easing for natural vehicular acceleration and deceleration.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VehicleInterpolator {
  private from: VehicleLocation;
  private to: VehicleLocation;
  private current: VehicleLocation;
  private startTime: number;
  private duration: number;
  private lastHeading: number;

  constructor(initialLocation: VehicleLocation) {
    this.from = { ...initialLocation };
    this.to = { ...initialLocation };
    this.current = { ...initialLocation };
    this.startTime = performance.now();
    this.duration = 2000;
    this.lastHeading = initialLocation.heading || 0;
  }

  /**
   * Pushes a new GPS target coordinate.
   */
  public pushTarget(target: VehicleLocation): void {
    const now = performance.now();

    // Check distance jump
    const distKm = haversineKm(
      this.current.latitude,
      this.current.longitude,
      target.latitude,
      target.longitude
    );

    // If jump > 400 meters, GPS jumped or tunnel recovery -> snap immediately
    if (distKm > 0.4) {
      this.current = { ...target };
      this.from = { ...target };
      this.to = { ...target };
      this.startTime = now;
      this.duration = 1000;
      this.lastHeading = target.heading || 0;
      return;
    }

    // Normal interpolation
    this.from = {
      latitude: this.current.latitude,
      longitude: this.current.longitude,
      heading: this.lastHeading,
      speed: this.current.speed ?? target.speed ?? 0,
      timestamp: now,
    };

    this.to = {
      latitude: target.latitude,
      longitude: target.longitude,
      heading: target.heading,
      speed: target.speed ?? 0,
      timestamp: target.timestamp || now,
    };

    // Calculate expected duration based on update interval, clamped between 800ms and 3500ms
    if (target.timestamp && this.from.timestamp && target.timestamp > this.from.timestamp) {
      this.duration = Math.max(800, Math.min(3500, target.timestamp - this.from.timestamp));
    } else {
      this.duration = 2000;
    }

    this.startTime = now;
  }

  /**
   * Evaluates the vehicle position and heading at the current animation timestamp.
   */
  public step(now = performance.now()): InterpolatedVehicleState {
    const elapsed = now - this.startTime;
    const t = this.duration > 0 ? elapsed / this.duration : 1;

    // Movement distance check
    const totalDistKm = haversineKm(
      this.from.latitude,
      this.from.longitude,
      this.to.latitude,
      this.to.longitude
    );

    const isNegligibleMove = totalDistKm < 0.001; // < 1 meter
    const speed = this.to.speed ?? 0;
    const isStationary = speed < 1.0 && isNegligibleMove;

    if (isStationary) {
      this.current.latitude = this.to.latitude;
      this.current.longitude = this.to.longitude;
      this.current.heading = this.to.heading || this.lastHeading;
      this.lastHeading = this.current.heading;
      return {
        latitude: this.current.latitude,
        longitude: this.current.longitude,
        heading: this.current.heading,
        isMoving: false,
        isIdle: true,
        speed: 0,
      };
    }

    let lat: number;
    let lon: number;

    if (t <= 1.0) {
      // Standard smooth cubic interpolation
      const easedT = easeInOutCubic(Math.max(0, Math.min(1, t)));
      lat = this.from.latitude + (this.to.latitude - this.from.latitude) * easedT;
      lon = this.from.longitude + (this.to.longitude - this.from.longitude) * easedT;
    } else {
      // Dead reckoning: GPS update is delayed, extrapolate forward along current vector for up to 3 seconds
      const overrunSeconds = (now - (this.startTime + this.duration)) / 1000;
      if (overrunSeconds < 3.0 && speed > 2.0) {
        const decay = Math.max(0, 1 - overrunSeconds / 3.0);
        const headingRad = (this.to.heading * Math.PI) / 180;
        const distTravelledKm = ((speed * decay) / 3600) * (overrunSeconds * 0.4);

        const deltaLat = (distTravelledKm / 111.0) * Math.cos(headingRad);
        const deltaLon =
          (distTravelledKm / (111.0 * Math.max(0.1, Math.cos((this.to.latitude * Math.PI) / 180)))) *
          Math.sin(headingRad);

        lat = this.to.latitude + deltaLat;
        lon = this.to.longitude + deltaLon;
      } else {
        lat = this.to.latitude;
        lon = this.to.longitude;
      }
    }

    // Shortest angular arc rotation
    const headingDelta = shortestAngularArc(this.from.heading, this.to.heading);
    const headingT = easeInOutCubic(Math.max(0, Math.min(1, t)));
    const currentHeading = (this.from.heading + headingDelta * headingT + 360) % 360;

    this.current.latitude = lat;
    this.current.longitude = lon;
    this.current.heading = currentHeading;
    this.lastHeading = currentHeading;

    return {
      latitude: lat,
      longitude: lon,
      heading: currentHeading,
      isMoving: !isStationary,
      isIdle: isStationary,
      speed,
    };
  }

  public getCurrentState(): VehicleLocation {
    return { ...this.current };
  }
}
