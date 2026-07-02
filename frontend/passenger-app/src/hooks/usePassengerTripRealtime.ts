import { useEffect, useRef } from "react";
import { passengerWs } from "@/lib/websocket";

type TripPatchHandler = (data: unknown) => void;

export function usePassengerTripRealtime(options: {
  enabled: boolean;
  tripId?: string;
  onTripUpdate?: TripPatchHandler;
  onLocationUpdate?: TripPatchHandler;
  poll: () => void;
  pollIntervalMs?: number;
}) {
  const {
    enabled,
    tripId,
    onTripUpdate,
    onLocationUpdate,
    poll,
    pollIntervalMs = 8000,
  } = options;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    pollRef.current = setInterval(() => poll(), pollIntervalMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [enabled, poll, pollIntervalMs]);

  useEffect(() => {
    if (!enabled || !tripId) return;

    const handleStatus = (data: unknown) => {
      const patch = data as { id?: string };
      if (patch.id === tripId) {
        onTripUpdate?.(data);
        poll();
      }
    };

    const handleLocation = (data: unknown) => {
      const patch = data as { rideId?: string; deliveryId?: string };
      if (patch.rideId === tripId || patch.deliveryId === tripId) {
        onLocationUpdate?.(data);
      }
    };

    passengerWs.on("ride:status-update", handleStatus);
    passengerWs.on("delivery:status-update", handleStatus);
    passengerWs.on("rider:location-update", handleLocation);
    passengerWs.on("ride:assigned", () => poll());

    return () => {
      passengerWs.off("ride:status-update", handleStatus);
      passengerWs.off("delivery:status-update", handleStatus);
      passengerWs.off("rider:location-update", handleLocation);
    };
  }, [enabled, tripId, onTripUpdate, onLocationUpdate, poll]);
}
