import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

type ActiveTrip = { id: string } | null | undefined;

export function useRiderLocation(params: {
  token?: string;
  riderProfileId?: string | null;
  activeTrip?: ActiveTrip;
  online?: boolean;
}) {
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!params.token || !params.riderProfileId) return;
    if (!params.online && !params.activeTrip) return;

    let cancelled = false;

    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted" || cancelled) return;

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: params.activeTrip ? 5 : 20,
          timeInterval: params.activeTrip ? 3000 : 8000,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          const isMocked = position.mocked ?? undefined;

          void api(`/riders/${params.riderProfileId}/availability`, {
            method: "PATCH",
            token: params.token,
            body: { onlineStatus: Boolean(params.online), latitude, longitude, isMocked },
          }).catch(() => undefined);

          if (params.activeTrip) {
            void api(`/rides/${params.activeTrip.id}/location`, {
              method: "POST",
              token: params.token,
              body: {
                riderProfileId: params.riderProfileId,
                source: "rider_app",
                latitude,
                longitude,
                speedKph:
                  position.coords.speed != null && position.coords.speed >= 0
                    ? position.coords.speed * 3.6
                    : undefined,
                heading:
                  position.coords.heading != null && position.coords.heading >= 0
                    ? position.coords.heading
                    : undefined,
                accuracyM: position.coords.accuracy ?? undefined,
                isMocked,
              },
            }).catch(() => undefined);
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      try {
        watchRef.current?.remove();
      } catch {}
      watchRef.current = null;
    };
  }, [params.token, params.riderProfileId, params.activeTrip?.id, params.online]);
}
