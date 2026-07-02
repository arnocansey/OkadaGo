import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatReverseGeocodeAddress } from "@/lib/geocode";
import { useApp } from "@/context/AppContext";
import { useUserLocation } from "@/hooks/useUserLocation";
import { ACCRA_REGION } from "@/theme/tokens";
import type { LocationResult } from "@/types";

const LOADING_TEXT = "Getting your location...";
const PERMISSION_DENIED_HINT = "Location permission denied. Enter pickup manually.";
const GEOCODE_FAILED_HINT = "Could not resolve address. Enter it manually or tap Use current location.";

export function useResolvedLocationAddress() {
  const { session } = useApp();
  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
    permissionGranted,
    refresh: refreshLocation,
  } = useUserLocation();

  const [address, setAddressState] = useState("");
  const [resolving, setResolving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const userEditedRef = useRef(false);
  const requestIdRef = useRef(0);

  const coords = {
    latitude: permissionGranted ? latitude : ACCRA_REGION.latitude,
    longitude: permissionGranted ? longitude : ACCRA_REGION.longitude,
  };

  const setAddress = useCallback((value: string) => {
    userEditedRef.current = true;
    setAddressState(value);
    setHint(null);
  }, []);

  const resolveAddress = useCallback(
    async (lat: number, lon: number) => {
      if (!session?.token) return;

      const requestId = ++requestIdRef.current;
      setResolving(true);
      setHint(null);

      try {
        const result = await api<LocationResult>(
          `/bootstrap/reverse-geocode?lat=${lat}&lon=${lon}`,
          { token: session.token },
        );
        if (requestId !== requestIdRef.current || userEditedRef.current) return;

        const formatted = formatReverseGeocodeAddress(result);
        setAddressState(formatted);
      } catch {
        if (requestId !== requestIdRef.current || userEditedRef.current) return;
        setAddressState("");
        setHint(GEOCODE_FAILED_HINT);
      } finally {
        if (requestId === requestIdRef.current) setResolving(false);
      }
    },
    [session?.token],
  );

  useEffect(() => {
    if (!session?.token || locationLoading) return;
    if (userEditedRef.current) return;

    if (!permissionGranted || locationError === "Location permission denied") {
      setAddressState("");
      setHint(PERMISSION_DENIED_HINT);
      setResolving(false);
      return;
    }

    void resolveAddress(latitude, longitude);
  }, [
    session?.token,
    locationLoading,
    permissionGranted,
    locationError,
    latitude,
    longitude,
    resolveAddress,
  ]);

  const useCurrentLocation = useCallback(async () => {
    userEditedRef.current = false;
    setAddressState(LOADING_TEXT);
    setHint(null);
    await refreshLocation();
  }, [refreshLocation]);

  const inputValue =
    locationLoading || resolving
      ? LOADING_TEXT
      : address;

  return {
    address: inputValue,
    submitAddress: address,
    setAddress,
    coords,
    locationLoading,
    resolving,
    hint,
    permissionGranted,
    locationError,
    useCurrentLocation,
  };
}
