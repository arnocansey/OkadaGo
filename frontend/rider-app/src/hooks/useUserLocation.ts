import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { ACCRA_REGION } from "@/theme/tokens";

function isAccraDefault(latitude: number, longitude: number) {
  return (
    Math.abs(latitude - ACCRA_REGION.latitude) < 0.001 &&
    Math.abs(longitude - ACCRA_REGION.longitude) < 0.001
  );
}

export function useUserLocation() {
  const [latitude, setLatitude] = useState(ACCRA_REGION.latitude);
  const [longitude, setLongitude] = useState(ACCRA_REGION.longitude);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0); // km/h
  const [accuracy, setAccuracy] = useState(10); // meters
  const [timestamp, setTimestamp] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isMocked, setIsMocked] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const applyPosition = useCallback(
    (
      coords: {
        latitude: number;
        longitude: number;
        heading?: number | null;
        speed?: number | null;
        accuracy?: number | null;
      },
      mocked?: boolean
    ) => {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      if (coords.heading != null && !isNaN(coords.heading) && coords.heading >= 0) {
        setHeading(coords.heading);
      }
      if (coords.speed != null && !isNaN(coords.speed) && coords.speed >= 0) {
        setSpeed(Math.round(coords.speed * 3.6)); // m/s to km/h
      }
      if (coords.accuracy != null && !isNaN(coords.accuracy)) {
        setAccuracy(coords.accuracy);
      }
      setTimestamp(Date.now());
      if (mocked !== undefined) setIsMocked(mocked);
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Web-specific implementation using standard navigator.geolocation to avoid EventEmitter removeSubscription bugs
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPermissionGranted(true);
          applyPosition(pos.coords);
          setLoading(false);
        },
        (err) => {
          setPermissionGranted(false);
          applyPosition({ latitude: ACCRA_REGION.latitude, longitude: ACCRA_REGION.longitude });
          setError(err.message || "Location access denied");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setPermissionGranted(true);
          applyPosition(pos.coords);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 },
      );
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionGranted(false);
        applyPosition({ latitude: ACCRA_REGION.latitude, longitude: ACCRA_REGION.longitude });
        setError("Location permission denied");
        return;
      }

      setPermissionGranted(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Location services are disabled");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      applyPosition(position.coords, position.mocked);

      try {
        watchSubRef.current?.remove();
      } catch {}
      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
          timeInterval: 2500,
        },
        (update) => applyPosition(update.coords, update.mocked),
      );
    } catch (err) {
      applyPosition({ latitude: ACCRA_REGION.latitude, longitude: ACCRA_REGION.longitude });
      setError(err instanceof Error ? err.message : "Could not get location");
    } finally {
      setLoading(false);
    }
  }, [applyPosition]);

  useEffect(() => {
    refresh();
    return () => {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      }
      try {
        watchSubRef.current?.remove();
        watchSubRef.current = null;
      } catch {}
    };
  }, [refresh]);

  return {
    latitude,
    longitude,
    heading,
    speed,
    accuracy,
    timestamp,
    loading,
    error,
    permissionGranted,
    isMocked,
    hasFix: permissionGranted && !isAccraDefault(latitude, longitude),
    refresh,
  };
}
