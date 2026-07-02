"use client";

import { useCallback, useRef, useState } from "react";
import { fetchJson } from "@/lib/api";
import {
  createPlaceSearchSession,
  retrievePlace,
  suggestPlaces,
  type PlaceSuggestion,
  type ResolvedPlace
} from "@/lib/place-search";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

type BackendSuggestion = {
  placeId: string;
  name: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
};

async function suggestPlacesBackend(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
}): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q: input.query });
  if (input.proximity) {
    params.set("lat", String(input.proximity.lat));
    params.set("lng", String(input.proximity.lng));
  }

  const payload = await fetchJson<{ suggestions: BackendSuggestion[] }>(
    `/bootstrap/places/autocomplete?${params.toString()}`
  );

  return (payload.suggestions ?? []).slice(0, 5).map((item) => ({
    id: item.placeId,
    name: item.name,
    fullAddress: item.fullAddress,
    lat: item.latitude,
    lng: item.longitude
  }));
}

async function retrievePlaceBackend(suggestion: PlaceSuggestion): Promise<ResolvedPlace> {
  if (typeof suggestion.lat === "number" && typeof suggestion.lng === "number") {
    return {
      id: suggestion.id,
      name: suggestion.name,
      fullAddress: suggestion.fullAddress,
      lat: suggestion.lat,
      lng: suggestion.lng
    };
  }

  const details = await fetchJson<{
    placeId: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }>(`/bootstrap/places/details?placeId=${encodeURIComponent(suggestion.id)}`);

  return {
    id: details.placeId,
    name: details.name,
    fullAddress: details.address,
    lat: details.latitude,
    lng: details.longitude
  };
}

export function useAddressSearch(proximity?: { lat: number; lng: number } | null) {
  const sessionRef = useRef(createPlaceSearchSession());
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const results = googleMapsKey
          ? await suggestPlaces({
              query,
              sessionToken: sessionRef.current,
              proximity: proximity ?? null
            })
          : await suggestPlacesBackend({ query, proximity: proximity ?? null });
        setSuggestions(results);
      } catch {
        try {
          const fallback = await suggestPlacesBackend({ query, proximity: proximity ?? null });
          setSuggestions(fallback);
        } catch {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [proximity]
  );

  const pick = useCallback(async (suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> => {
    try {
      const resolved = googleMapsKey
        ? await retrievePlace({
            suggestion,
            sessionToken: sessionRef.current
          })
        : await retrievePlaceBackend(suggestion);
      sessionRef.current = createPlaceSearchSession();
      setSuggestions([]);
      return resolved;
    } catch {
      try {
        const resolved = await retrievePlaceBackend(suggestion);
        sessionRef.current = createPlaceSearchSession();
        setSuggestions([]);
        return resolved;
      } catch {
        return null;
      }
    }
  }, []);

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, search, pick, clear };
}
