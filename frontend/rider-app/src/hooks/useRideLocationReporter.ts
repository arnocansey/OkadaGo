import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { api } from "@/lib/api";

export function useRideLocationReporter(options: {
  enabled: boolean;
  rideId?: string;
  token?: string;
  riderProfileId?: string | null;
  intervalMs?: number;
}) {
  const { enabled, rideId, token, riderProfileId, intervalMs = 10000 } = options;
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled || !rideId || !token || !riderProfileId) return;

    let cancelled = false;

    async function sendLocation(coords: Location.LocationObjectCoords) {
      const now = Date.now();
      if (now - lastSentRef.current < intervalMs - 500) return;
      lastSentRef.current = now;

      try {
        await api(`/rides/${rideId}/location`, {
          method: "POST",
          token,
          body: {
            riderProfileId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speedKph: coords.speed != null && coords.speed >= 0 ? coords.speed * 3.6 : undefined,
            heading: coords.heading ?? undefined,
            accuracyM: coords.accuracy ?? undefined,
            source: "rider_app",
          },
        });
      } catch {
        // Location reporting is best-effort during active trips.
      }
    }

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!cancelled) await sendLocation(current.coords);

      const watch = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 20,
          timeInterval: intervalMs,
        },
        (update) => {
          void sendLocation(update.coords);
        },
      );

      if (cancelled) {
        try {
          watch.remove();
        } catch {}
      } else {
        return () => {
          try {
            watch.remove();
          } catch {}
        };
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, rideId, token, riderProfileId, intervalMs]);
}
