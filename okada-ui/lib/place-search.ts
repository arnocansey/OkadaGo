"use client";

import { getCached, setCache, buildCacheKey } from "./cache";
import { throttle } from "./timing";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

/** Places API (New) — requires "Places API (New)" enabled on the browser key. */
const PLACES_API_V1 = "https://places.googleapis.com/v1";
const LEGACY_PLACES_API = "https://maps.googleapis.com/maps/api/place";
const AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat";
const PLACE_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location";

export type PlaceSuggestion = {
  id: string;
  name: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
};

export type ResolvedPlace = {
  id: string;
  name: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

function createRandomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlaceSearchSession() {
  return createRandomToken();
}

function logPlacesFallback(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(
    `[places] ${operation}: Places API (New) failed (${message}), falling back to legacy Places API`
  );
}

async function suggestPlacesNew(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
  sessionToken: string;
}): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${PLACES_API_V1}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleMapsKey!,
      "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK
    },
    body: JSON.stringify({
      input: input.query,
      sessionToken: input.sessionToken,
      languageCode: "en",
      includedRegionCodes: ["gh"],
      ...(input.proximity
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: input.proximity.lat,
                  longitude: input.proximity.lng
                },
                radius: 50000
              }
            }
          }
        : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Place suggestions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
    error?: { status?: string; message?: string };
  };

  if (payload.error?.status) {
    throw new Error(`Google Places API error: ${payload.error.status}`);
  }

  return (payload.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction) => Boolean(prediction?.placeId))
    .slice(0, 5)
    .map((prediction) => ({
      id: prediction!.placeId!,
      name:
        prediction!.structuredFormat?.mainText?.text?.trim() ||
        prediction!.text?.text?.trim() ||
        input.query,
      fullAddress:
        prediction!.text?.text?.trim() ||
        [
          prediction!.structuredFormat?.mainText?.text?.trim(),
          prediction!.structuredFormat?.secondaryText?.text?.trim()
        ]
          .filter(Boolean)
          .join(", ") ||
        input.query
    }));
}

async function suggestPlacesLegacy(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
  sessionToken: string;
}): Promise<PlaceSuggestion[]> {
  const url = new URL(`${LEGACY_PLACES_API}/autocomplete/json`);
  url.searchParams.set("input", input.query);
  url.searchParams.set("sessiontoken", input.sessionToken);
  url.searchParams.set("components", "country:gh");
  url.searchParams.set("key", googleMapsKey!);

  if (input.proximity) {
    url.searchParams.set("location", `${input.proximity.lat},${input.proximity.lng}`);
    url.searchParams.set("radius", "50000");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Legacy place suggestions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    predictions?: Array<{
      place_id?: string;
      description?: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    throw new Error(
      payload.error_message ??
        `Legacy Google Places API error: ${payload.status ?? "UNKNOWN"}`
    );
  }

  return (payload.predictions ?? [])
    .filter((prediction) => Boolean(prediction.place_id))
    .slice(0, 5)
    .map((prediction) => ({
      id: prediction.place_id!,
      name:
        prediction.structured_formatting?.main_text?.trim() ||
        prediction.description?.trim() ||
        input.query,
      fullAddress:
        prediction.description?.trim() ||
        [
          prediction.structured_formatting?.main_text?.trim(),
          prediction.structured_formatting?.secondary_text?.trim()
        ]
          .filter(Boolean)
          .join(", ") ||
        input.query
    }));
}

async function suggestPlacesWithFallback(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
  sessionToken: string;
}): Promise<PlaceSuggestion[]> {
  try {
    return await suggestPlacesNew(input);
  } catch (error) {
    logPlacesFallback("suggestPlaces", error);
    return suggestPlacesLegacy(input);
  }
}

async function retrievePlaceNew(input: {
  sessionToken: string;
  suggestion: PlaceSuggestion;
}): Promise<ResolvedPlace> {
  const resourceId = input.suggestion.id.startsWith("places/")
    ? input.suggestion.id
    : `places/${input.suggestion.id}`;
  const endpoint = new URL(`${PLACES_API_V1}/${resourceId}`);
  endpoint.searchParams.set("sessionToken", input.sessionToken);

  const response = await fetch(endpoint.toString(), {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleMapsKey!,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK
    }
  });

  if (!response.ok) {
    throw new Error(`Place lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    location?: { latitude?: number; longitude?: number };
    displayName?: { text?: string };
    formattedAddress?: string;
    error?: { status?: string; message?: string };
  };

  if (payload.error?.status) {
    throw new Error(`Google Places API error: ${payload.error.status}`);
  }

  const location = payload.location;
  if (typeof location?.latitude !== "number" || typeof location?.longitude !== "number") {
    throw new Error("Selected place has no coordinates");
  }

  return {
    id: input.suggestion.id,
    name: payload.displayName?.text?.trim() || input.suggestion.name,
    fullAddress: payload.formattedAddress?.trim() || input.suggestion.fullAddress,
    lat: location.latitude,
    lng: location.longitude
  };
}

async function retrievePlaceLegacy(input: {
  sessionToken: string;
  suggestion: PlaceSuggestion;
}): Promise<ResolvedPlace> {
  const url = new URL(`${LEGACY_PLACES_API}/details/json`);
  url.searchParams.set("place_id", input.suggestion.id);
  url.searchParams.set("fields", "place_id,name,formatted_address,geometry");
  url.searchParams.set("sessiontoken", input.sessionToken);
  url.searchParams.set("key", googleMapsKey!);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Legacy place lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    result?: {
      place_id?: string;
      name?: string;
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    };
  };

  if (payload.status !== "OK" || !payload.result) {
    throw new Error(
      payload.error_message ??
        `Legacy Google Places API error: ${payload.status ?? "UNKNOWN"}`
    );
  }

  const location = payload.result.geometry?.location;
  if (typeof location?.lat !== "number" || typeof location?.lng !== "number") {
    throw new Error("Selected place has no coordinates");
  }

  return {
    id: payload.result.place_id ?? input.suggestion.id,
    name: payload.result.name?.trim() || input.suggestion.name,
    fullAddress: payload.result.formatted_address?.trim() || input.suggestion.fullAddress,
    lat: location.lat,
    lng: location.lng
  };
}

async function retrievePlaceWithFallback(input: {
  sessionToken: string;
  suggestion: PlaceSuggestion;
}): Promise<ResolvedPlace> {
  try {
    return await retrievePlaceNew(input);
  } catch (error) {
    logPlacesFallback("retrievePlace", error);
    return retrievePlaceLegacy(input);
  }
}

const throttledSuggest = throttle(
  async (input: {
    proximity?: { lat: number; lng: number } | null;
    query: string;
    sessionToken: string;
    resolve: (value: PlaceSuggestion[]) => void;
    reject: (reason: unknown) => void;
  }) => {
    const query = input.query.trim();

    if (query.length < 3 || !googleMapsKey) {
      input.resolve([]);
      return;
    }

    const cacheKey = buildCacheKey("suggest", query, input.proximity?.lat, input.proximity?.lng);
    const cached = getCached<PlaceSuggestion[]>(cacheKey);
    if (cached) {
      input.resolve(cached);
      return;
    }

    try {
      const results = await suggestPlacesWithFallback({
        proximity: input.proximity,
        query,
        sessionToken: input.sessionToken
      });
      setCache(cacheKey, results, 2 * 60 * 1000);
      input.resolve(results);
    } catch (error) {
      input.reject(error);
    }
  },
  300
);

export function suggestPlaces(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
  sessionToken: string;
}): Promise<PlaceSuggestion[]> {
  return new Promise((resolve, reject) => {
    throttledSuggest({ ...input, resolve, reject });
  });
}

export async function retrievePlace(input: {
  sessionToken: string;
  suggestion: PlaceSuggestion;
}): Promise<ResolvedPlace> {
  if (typeof input.suggestion.lat === "number" && typeof input.suggestion.lng === "number") {
    return {
      id: input.suggestion.id,
      name: input.suggestion.name,
      fullAddress: input.suggestion.fullAddress,
      lat: input.suggestion.lat,
      lng: input.suggestion.lng
    };
  }

  const cacheKey = buildCacheKey("place", input.suggestion.id);
  const cached = getCached<ResolvedPlace>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!googleMapsKey) {
    throw new Error("No place search provider is configured");
  }

  const result = await retrievePlaceWithFallback(input);
  setCache(cacheKey, result, 10 * 60 * 1000);
  return result;
}
