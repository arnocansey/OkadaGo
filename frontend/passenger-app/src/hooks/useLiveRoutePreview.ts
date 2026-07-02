import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RoutePreview } from "@/types";

type Coord = { latitude: number; longitude: number };

export function useLiveRoutePreview(
  token: string | undefined,
  from: Coord | null,
  to: Coord | null,
  enabled: boolean,
  intervalMs = 30000,
) {
  const [preview, setPreview] = useState<RoutePreview | null>(null);

  useEffect(() => {
    if (!enabled || !token || !from || !to) {
      setPreview(null);
      return;
    }

    const load = () => {
      const params = new URLSearchParams({
        startLat: `${from.latitude}`,
        startLon: `${from.longitude}`,
        endLat: `${to.latitude}`,
        endLon: `${to.longitude}`,
      });
      api<RoutePreview>(`/bootstrap/route-preview?${params.toString()}`, { token })
        .then(setPreview)
        .catch(() => undefined);
    };

    load();
    const timer = setInterval(load, intervalMs);
    return () => clearInterval(timer);
  }, [token, from?.latitude, from?.longitude, to?.latitude, to?.longitude, enabled, intervalMs]);

  return preview;
}
