"use client";

import { useEffect, useMemo, useState } from "react";

type LiveLocation = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

export function isWithinGhanaBounds(latitude: number, longitude: number) {
  return latitude >= 4.4 && latitude <= 11.3 && longitude >= -3.4 && longitude <= 1.4;
}

export function useGeolocation() {
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        setLiveLocation(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const liveLocationReady = useMemo(
    () =>
      liveLocation != null &&
      isWithinGhanaBounds(liveLocation.latitude, liveLocation.longitude) &&
      Number.isFinite(liveLocation.accuracy) &&
      liveLocation.accuracy > 0 &&
      liveLocation.accuracy <= 1500,
    [liveLocation]
  );

  return { liveLocation, liveLocationReady };
}
