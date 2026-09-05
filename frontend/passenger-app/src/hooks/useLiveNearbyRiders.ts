import { useEffect, useRef, useState } from "react";
import { passengerWs } from "@/lib/websocket";
import { api } from "@/lib/api";

export interface LiveMapRider {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy?: number;
  timestamp: number;
  status: "ONLINE" | "BUSY" | "ON_TRIP" | "OFFLINE";
  name: string;
  rating?: number;
  vehicleType?: string;
  distanceKm?: number;
  etaMinutes?: number;
}

interface UseLiveNearbyRidersOptions {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  enabled?: boolean;
}

export function useLiveNearbyRiders({
  latitude,
  longitude,
  radiusKm = 3.0,
  enabled = true,
}: UseLiveNearbyRidersOptions) {
  const [riders, setRiders] = useState<LiveMapRider[]>([]);
  const ridersMapRef = useRef<Map<string, LiveMapRider>>(new Map());
  const [isConnected, setIsConnected] = useState(passengerWs.isConnected());

  // Initial REST fetch to avoid any blank gap before socket stream
  useEffect(() => {
    if (!enabled || !latitude || !longitude) return;

    api<
      Array<{
        id: string;
        name?: string;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        distanceKm?: number;
        etaMinutes?: number;
        rating?: number;
        vehicleType?: string;
        status?: string;
      }>
    >(`/rides/nearby-riders?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`)
      .then((data) => {
        if (data && data.length > 0) {
          const map = ridersMapRef.current;
          data.forEach((r) => {
            map.set(r.id, {
              id: r.id,
              latitude: r.latitude,
              longitude: r.longitude,
              speed: r.speed ?? 0,
              heading: r.heading ?? 0,
              timestamp: Date.now(),
              status: (r.status as any) || "ONLINE",
              name: r.name || "Okada",
              rating: r.rating ?? 5.0,
              vehicleType: r.vehicleType || "motorcycle",
              distanceKm: r.distanceKm,
              etaMinutes: r.etaMinutes,
            });
          });
          setRiders(Array.from(map.values()));
        }
      })
      .catch(() => {});
  }, [latitude, longitude, radiusKm, enabled]);

  // Subscribe to real-time spatial geofence over WebSocket
  useEffect(() => {
    if (!enabled || !latitude || !longitude) return;

    const sendSubscription = () => {
      passengerWs.send("passenger:location:subscribe", {
        latitude,
        longitude,
        radiusKm,
      });
      setIsConnected(passengerWs.isConnected());
    };

    sendSubscription();

    // Snapshot event from server
    const handleSnapshot = (data: unknown) => {
      const list = data as Array<{
        riderId: string;
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        status: "ONLINE" | "BUSY" | "ON_TRIP" | "OFFLINE";
        displayName: string;
        rating: number;
        vehicleType: string;
        timestamp: number;
      }>;

      if (Array.isArray(list)) {
        const map = new Map<string, LiveMapRider>();
        list.forEach((r) => {
          map.set(r.riderId, {
            id: r.riderId,
            latitude: r.latitude,
            longitude: r.longitude,
            speed: r.speed,
            heading: r.heading,
            status: r.status,
            name: r.displayName,
            rating: r.rating,
            vehicleType: r.vehicleType,
            timestamp: r.timestamp || Date.now(),
          });
        });
        ridersMapRef.current = map;
        setRiders(Array.from(map.values()));
      }
    };

    // Live update event from any moving motorcycle in our spatial cells
    const handleLocationUpdate = (data: unknown) => {
      const update = data as {
        riderId: string;
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        status: "ONLINE" | "BUSY" | "ON_TRIP" | "OFFLINE";
        displayName: string;
        rating: number;
        vehicleType: string;
        timestamp: number;
      };

      if (!update?.riderId || !update.latitude || !update.longitude) return;

      const map = ridersMapRef.current;

      // If rider is OFFLINE or ON_TRIP (assigned to another trip), remove from public available layer
      if (update.status === "OFFLINE" || update.status === "ON_TRIP") {
        map.delete(update.riderId);
      } else {
        map.set(update.riderId, {
          id: update.riderId,
          latitude: update.latitude,
          longitude: update.longitude,
          speed: update.speed ?? 0,
          heading: update.heading ?? 0,
          status: update.status ?? "ONLINE",
          name: update.displayName || "Okada",
          rating: update.rating ?? 5.0,
          vehicleType: update.vehicleType || "motorcycle",
          timestamp: update.timestamp || Date.now(),
        });
      }

      setRiders(Array.from(map.values()));
    };

    // Rider disconnected/went offline
    const handleRiderOffline = (data: unknown) => {
      const item = data as { riderId: string };
      if (item?.riderId) {
        ridersMapRef.current.delete(item.riderId);
        setRiders(Array.from(ridersMapRef.current.values()));
      }
    };

    passengerWs.on("nearby:riders:snapshot", handleSnapshot);
    passengerWs.on("rider.location_updated", handleLocationUpdate);
    passengerWs.on("rider.offline", handleRiderOffline);

    // Re-subscribe if location moves noticeably
    const interval = setInterval(() => {
      if (passengerWs.isConnected()) {
        sendSubscription();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      passengerWs.off("nearby:riders:snapshot", handleSnapshot);
      passengerWs.off("rider.location_updated", handleLocationUpdate);
      passengerWs.off("rider.offline", handleRiderOffline);
      passengerWs.send("passenger:location:unsubscribe");
    };
  }, [latitude, longitude, radiusKm, enabled]);

  return { nearbyRiders: riders, isConnected };
}
