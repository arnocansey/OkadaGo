"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GHANA_BOUNDS = { minLat: 4.5, maxLat: 11.5, minLng: -3.5, maxLng: 1.5 };
export const DEFAULT_CENTER: [number, number] = [5.6037, -0.187];

function isAccraDefault(coords: [number, number]) {
  return (
    Math.abs(coords[0] - DEFAULT_CENTER[0]) < 0.001 &&
    Math.abs(coords[1] - DEFAULT_CENTER[1]) < 0.001
  );
}

function inGhana(lat: number, lng: number) {
  return (
    lat >= GHANA_BOUNDS.minLat &&
    lat <= GHANA_BOUNDS.maxLat &&
    lng >= GHANA_BOUNDS.minLng &&
    lng <= GHANA_BOUNDS.maxLng
  );
}

export function useGeoLocation() {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchRef = useRef<number | null>(null);

  const applyPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;

    if (inGhana(lat, lng)) {
      setCoords([lat, lng]);
      setAccuracy(acc);
      setError(null);
      setPermissionGranted(true);
    } else {
      setCoords(DEFAULT_CENTER);
      setAccuracy(null);
      setError("Outside service area — showing Accra");
      setPermissionGranted(true);
    }
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setCoords(DEFAULT_CENTER);
    setAccuracy(null);
    setPermissionGranted(err.code !== err.PERMISSION_DENIED);
    setError(
      err.code === err.PERMISSION_DENIED
        ? "Location permission denied — showing Accra"
        : "Could not get location — showing Accra"
    );
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setCoords(DEFAULT_CENTER);
      setError("Geolocation is not supported");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(applyPosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15_000
    });

    watchRef.current = navigator.geolocation.watchPosition(applyPosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 15_000
    });
  }, [applyPosition, handleError]);

  useEffect(() => {
    void (async () => {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({ name: "geolocation" });
          setPermissionGranted(status.state === "granted");
          status.onchange = () => setPermissionGranted(status.state === "granted");
        } catch {
          // Permissions API unavailable in some browsers.
        }
      }
    })();

    refresh();

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [refresh]);

  const center = coords ?? DEFAULT_CENTER;
  const hasFix = permissionGranted && coords !== null && !isAccraDefault(coords);

  return {
    coords,
    center,
    error,
    loading,
    accuracy,
    permissionGranted,
    hasFix,
    refresh
  };
}
