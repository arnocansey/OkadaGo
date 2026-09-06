import { useCallback, useEffect, useRef, useState } from "react";

export interface DemoRider {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  name: string;
  rating: number;
  vehicleType: string;
  isDemo: boolean;
}

// Realistic road names around Accra for demo riders
const ROAD_NAMES = [
  "Oxford Street, Osu",
  "Independence Ave, Accra",
  "Ring Road Central",
  "Cantonments Road",
  "Airport Road",
  "Osu Badu Street",
  "14th Lane, Osu",
  "Kanda Highway",
  "Pig Farm Highway",
  "Danquah Circle",
];

const RIDER_NAMES = [
  "Kwame A.",
  "Kofi M.",
  "Yaw S.",
  "Kojo B.",
  "Fiifi T.",
  "Nana K.",
  "Kwesi D.",
  "Ama R.",
  "Akua P.",
  "Esi N.",
  "Nii L.",
  "Adwoa F.",
];

// Street names near user for routing simulation
const ACCRA_STREETS: Array<{ lat: number; lng: number; name: string }> = [
  { lat: 5.6037, lng: -0.187, name: "Independence Ave" },
  { lat: 5.6050, lng: -0.185, name: "High Street" },
  { lat: 5.6020, lng: -0.189, name: "Kinbu Road" },
  { lat: 5.6060, lng: -0.183, name: "Liberation Road" },
  { lat: 5.6010, lng: -0.191, name: "Nkrumah Avenue" },
  { lat: 5.6045, lng: -0.186, name: "Ring Road" },
  { lat: 5.6070, lng: -0.184, name: "Castle Road" },
  { lat: 5.6030, lng: -0.188, name: "John Atta Mills St" },
];

function generateSpeed(): number {
  // Realistic motorcycle speeds in Accra: 15-45 km/h (with traffic)
  return 15 + Math.random() * 30;
}

function generateHeading(): number {
  return Math.random() * 360;
}

function generateRating(): number {
  // Most riders have high ratings
  return 4.2 + Math.random() * 0.8;
}

function generateName(): string {
  return RIDER_NAMES[Math.floor(Math.random() * RIDER_NAMES.length)];
}

function moveAlongRoad(
  lat: number,
  lng: number,
  heading: number,
  speed: number,
  dt: number
): { latitude: number; longitude: number; heading: number; speed: number } {
  // Convert km/h to degrees per second (~111km per degree latitude)
  const metersPerSec = (speed * 1000) / 3600;
  const degreesPerSec = metersPerSec / 111000;

  // Add slight random variation to simulate traffic/road curves
  const headingDrift = (Math.random() - 0.5) * 20; // ±10° drift
  const newHeading = (heading + headingDrift + 360) % 360;
  const rad = (newHeading * Math.PI) / 180;

  const newLat = lat + Math.cos(rad) * degreesPerSec * dt;
  const newLng = lng + Math.sin(rad) * degreesPerSec * dt;

  // Occasional stops (simulating traffic lights, passenger pickups)
  const shouldStop = Math.random() < 0.003; // 0.3% chance per update
  const newSpeed = shouldStop ? 0 : speed + (Math.random() - 0.5) * 8;

  return {
    latitude: newLat,
    longitude: newLng,
    heading: newHeading,
    speed: Math.max(0, Math.min(50, newSpeed)),
  };
}

interface UseDemoRidersOptions {
  latitude?: number;
  longitude?: number;
  enabled?: boolean;
  count?: number;
}

/**
 * Generates realistic demo motorcycle riders that move along simulated roads
 * around the passenger's location. Only active in development mode or when
 * no real riders are available.
 *
 * In production, this should never be enabled — real rider positions come
 * from authenticated rider devices sending GPS coordinates to the backend.
 */
export function useDemoRiders({
  latitude,
  longitude,
  enabled = true,
  count = 6,
}: UseDemoRidersOptions): DemoRider[] {
  const [riders, setRiders] = useState<DemoRider[]>([]);
  const ridersRef = useRef<DemoRider[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize demo riders around the user's location
  const initializeRiders = useCallback(() => {
    if (!latitude || !longitude || !enabled) {
      setRiders([]);
      return;
    }

    const newRiders: DemoRider[] = Array.from({ length: count }, (_, i) => {
      // Spread riders in a realistic radius (200m - 2km)
      const radiusDeg = 0.002 + Math.random() * 0.016; // ~200m to 1.8km
      const angle = Math.random() * 2 * Math.PI;
      const lat = latitude + Math.cos(angle) * radiusDeg;
      const lng = longitude + Math.sin(angle) * radiusDeg;

      return {
        id: `demo-rider-${i}`,
        latitude: lat,
        longitude: lng,
        speed: generateSpeed(),
        heading: generateHeading(),
        name: generateName(),
        rating: Math.round(generateRating() * 10) / 10,
        vehicleType: "motorcycle",
        isDemo: true,
      };
    });

    ridersRef.current = newRiders;
    setRiders(newRiders);
  }, [latitude, longitude, enabled, count]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    initializeRiders();
  }, [initializeRiders]);

  // Animate riders moving every 2 seconds
  useEffect(() => {
    if (!enabled || ridersRef.current.length === 0) return;

    intervalRef.current = setInterval(() => {
      const updated = ridersRef.current.map((rider) => {
        const dt = 2; // seconds between updates
        const moved = moveAlongRoad(
          rider.latitude,
          rider.longitude,
          rider.heading,
          rider.speed,
          dt
        );

        return {
          ...rider,
          latitude: moved.latitude,
          longitude: moved.longitude,
          heading: moved.heading,
          speed: moved.speed,
        };
      });

      ridersRef.current = updated;
      setRiders([...updated]);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, riders.length > 0]);

  return riders;
}
