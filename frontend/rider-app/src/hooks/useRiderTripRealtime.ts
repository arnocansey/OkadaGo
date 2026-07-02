import { useEffect, useRef } from "react";
import { riderWs } from "@/lib/websocket";

type TripPatchHandler = (data: unknown) => void;

export function useRiderTripRealtime(options: {
  enabled: boolean;
  tripId?: string;
  onTripUpdate?: TripPatchHandler;
  poll: () => void;
  pollIntervalMs?: number;
}) {
  const { enabled, tripId, onTripUpdate, poll, pollIntervalMs = 10000 } = options;
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

    riderWs.on("ride:status-update", handleStatus);
    riderWs.on("delivery:status-update", handleStatus);
    riderWs.on("ride:assigned", () => poll());

    return () => {
      riderWs.off("ride:status-update", handleStatus);
      riderWs.off("delivery:status-update", handleStatus);
    };
  }, [enabled, tripId, onTripUpdate, poll]);
}
