"use client";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

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

export async function suggestPlaces(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
  sessionToken: string;
}) {
  const query = input.query.trim();

  if (query.length < 3) {
    return [] as PlaceSuggestion[];
  }

  if (!googleMapsKey) {
    return [] as PlaceSuggestion[];
  }

  try {
    const endpoint = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    endpoint.searchParams.set("input", query);
    endpoint.searchParams.set("key", googleMapsKey);
    endpoint.searchParams.set("sessiontoken", input.sessionToken);
    endpoint.searchParams.set("language", "en");
    endpoint.searchParams.set("components", "country:gh");

    if (input.proximity) {
      endpoint.searchParams.set(
        "location",
        `${input.proximity.lat},${input.proximity.lng}`
      );
      endpoint.searchParams.set("radius", "50000");
    }

    const response = await fetch(endpoint.toString());

    if (!response.ok) {
      throw new Error(`Place suggestions failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      predictions?: Array<{
        place_id?: string;
        structured_formatting?: {
          main_text?: string;
          secondary_text?: string;
        };
        description?: string;
      }>;
      status?: string;
    };

    if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${payload.status}`);
    }

    return (payload.predictions ?? [])
      .filter((prediction) => Boolean(prediction.place_id))
      .slice(0, 5)
      .map((prediction) => ({
        id: prediction.place_id!,
        name:
          prediction.structured_formatting?.main_text?.trim() ||
          prediction.description?.trim() ||
          query,
        fullAddress:
          prediction.description?.trim() ||
          prediction.structured_formatting?.secondary_text?.trim() ||
          prediction.structured_formatting?.main_text?.trim() ||
          query
      }));
  } catch {
    return [] as PlaceSuggestion[];
  }
}

export async function retrievePlace(input: {
  sessionToken: string;
  suggestion: PlaceSuggestion;
}) {
  if (typeof input.suggestion.lat === "number" && typeof input.suggestion.lng === "number") {
    return {
      id: input.suggestion.id,
      name: input.suggestion.name,
      fullAddress: input.suggestion.fullAddress,
      lat: input.suggestion.lat,
      lng: input.suggestion.lng
    } satisfies ResolvedPlace;
  }

  if (!googleMapsKey) {
    throw new Error("No place search provider is configured");
  }

  const endpoint = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  endpoint.searchParams.set("place_id", input.suggestion.id);
  endpoint.searchParams.set("key", googleMapsKey);
  endpoint.searchParams.set("sessiontoken", input.sessionToken);
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("fields", "geometry/location,name,formatted_address");

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new Error(`Place lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    result?: {
      geometry?: { location?: { lat?: number; lng?: number } };
      name?: string;
      formatted_address?: string;
    };
    status?: string;
  };

  if (payload.status !== "OK") {
    throw new Error(`Google Places API error: ${payload.status}`);
  }

  const location = payload.result?.geometry?.location;
  if (!location?.lat || !location?.lng) {
    throw new Error("Selected place has no coordinates");
  }

  return {
    id: input.suggestion.id,
    name: payload.result?.name?.trim() || input.suggestion.name,
    fullAddress:
      payload.result?.formatted_address?.trim() || input.suggestion.fullAddress,
    lat: location.lat,
    lng: location.lng
  } satisfies ResolvedPlace;
}
