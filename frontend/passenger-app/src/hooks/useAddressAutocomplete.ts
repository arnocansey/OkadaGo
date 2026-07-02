import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { PlaceDetails, PlaceSuggestion } from "@/types";

type ResolvedPlace = {
  address: string;
  latitude: number;
  longitude: number;
};

type Options = {
  token?: string;
  query: string;
  proximity?: { latitude: number; longitude: number };
  enabled?: boolean;
  debounceMs?: number;
};

export function useAddressAutocomplete({
  token,
  query,
  proximity,
  enabled = true,
  debounceMs = 350,
}: Options) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || !token || trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: trimmed });
      if (proximity) {
        params.set("lat", `${proximity.latitude}`);
        params.set("lng", `${proximity.longitude}`);
      }

      api<{ suggestions: PlaceSuggestion[] }>(`/bootstrap/places/autocomplete?${params.toString()}`, {
        token,
      })
        .then((result) => {
          if (requestId !== requestIdRef.current) return;
          setSuggestions(result.suggestions ?? []);
        })
        .catch((e) => {
          if (requestId !== requestIdRef.current) return;
          setSuggestions([]);
          setError(e instanceof Error ? e.message : "Could not load address suggestions.");
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false);
        });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, token, proximity?.latitude, proximity?.longitude, enabled, debounceMs]);

  const resolveSuggestion = useCallback(
    async (suggestion: PlaceSuggestion): Promise<ResolvedPlace> => {
      if (
        typeof suggestion.latitude === "number" &&
        typeof suggestion.longitude === "number"
      ) {
        return {
          address: suggestion.fullAddress,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
        };
      }

      if (!token) {
        throw new Error("Sign in to select a place.");
      }

      const details = await api<PlaceDetails>(
        `/bootstrap/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`,
        { token },
      );

      return {
        address: details.address || suggestion.fullAddress,
        latitude: details.latitude,
        longitude: details.longitude,
      };
    },
    [token],
  );

  const clearSuggestions = useCallback(() => {
    requestIdRef.current += 1;
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    resolveSuggestion,
    clearSuggestions,
  };
}
