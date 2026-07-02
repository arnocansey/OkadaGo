import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const applyPosition = useCallback((coords: Location.LocationObjectCoords) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionGranted(false);
        applyPosition({ latitude: ACCRA_REGION.latitude, longitude: ACCRA_REGION.longitude } as Location.LocationObjectCoords);
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
      applyPosition(position.coords);

      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 15,
          timeInterval: 5000,
        },
        (update) => applyPosition(update.coords),
      );
    } catch (err) {
      applyPosition({ latitude: ACCRA_REGION.latitude, longitude: ACCRA_REGION.longitude } as Location.LocationObjectCoords);
      setError(err instanceof Error ? err.message : "Could not get location");
    } finally {
      setLoading(false);
    }
  }, [applyPosition]);

  useEffect(() => {
    refresh();
    return () => {
      watchRef.current?.remove();
    };
  }, [refresh]);

  return {
    latitude,
    longitude,
    loading,
    error,
    permissionGranted,
    hasFix: permissionGranted && !isAccraDefault(latitude, longitude),
    refresh,
  };
}
