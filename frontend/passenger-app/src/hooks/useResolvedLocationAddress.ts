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
    isMocked: liveLocationMocked,
    refresh: refreshLocation,
  } = useUserLocation();

  const [address, setAddressState] = useState("");
  const [manualCoords, setManualCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const userEditedRef = useRef(false);
  const requestIdRef = useRef(0);

  const coords = manualCoords ?? {
    latitude: permissionGranted ? latitude : ACCRA_REGION.latitude,
    longitude: permissionGranted ? longitude : ACCRA_REGION.longitude,
  };
  // A manually-selected address (autocomplete/pin drop) isn't sourced from the live GPS
  // fix, so the mock-location signal only applies when using the current-location coords.
  const isMocked = manualCoords ? false : liveLocationMocked;

  const setAddress = useCallback((value: string) => {
    userEditedRef.current = true;
    setAddressState(value);
    setManualCoords(null);
    setHint(null);
  }, []);

  const selectAddress = useCallback((value: string, lat: number, lon: number) => {
    userEditedRef.current = true;
    setAddressState(value);
    setManualCoords({ latitude: lat, longitude: lon });
    setHint(null);
    setResolving(false);
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
    setManualCoords(null);
    setAddressState(LOADING_TEXT);
    setHint(null);
    await refreshLocation();
  }, [refreshLocation]);

  const pinDropLocation = useCallback(
    async (lat: number, lon: number) => {
      userEditedRef.current = true;
      requestIdRef.current += 1;
      setManualCoords({ latitude: lat, longitude: lon });
      setAddressState(LOADING_TEXT);
      setHint(null);

      if (!session?.token) return;
      setResolving(true);
      try {
        const result = await api<LocationResult>(
          `/bootstrap/reverse-geocode?lat=${lat}&lon=${lon}`,
          { token: session.token },
        );
        setAddressState(formatReverseGeocodeAddress(result));
      } catch {
        setAddressState("");
        setHint(GEOCODE_FAILED_HINT);
      } finally {
        setResolving(false);
      }
    },
    [session?.token],
  );

  const inputValue =
    locationLoading || resolving
      ? LOADING_TEXT
      : address;

  return {
    address: inputValue,
    submitAddress: address,
    setAddress,
    selectAddress,
    coords,
    isMocked,
    locationLoading,
    resolving,
    hint,
    permissionGranted,
    locationError,
    useCurrentLocation,
    pinDropLocation,
  };
}
