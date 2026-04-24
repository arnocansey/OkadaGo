"use client";

const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

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

async function suggestWithForwardGeocode(input: {
  proximity?: { lat: number; lng: number } | null;
  query: string;
}) {
  if (!mapboxPublicToken) {
    return [] as PlaceSuggestion[];
  }

  const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  endpoint.searchParams.set("q", input.query);
  endpoint.searchParams.set("access_token", mapboxPublicToken);
  endpoint.searchParams.set("autocomplete", "true");
  endpoint.searchParams.set("country", "gh");
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set(
    "types",
    "address,street,neighborhood,locality,place,district,region"
  );

  if (input.proximity) {
    endpoint.searchParams.set("proximity", `${input.proximity.lng},${input.proximity.lat}`);
  } else {
    endpoint.searchParams.set("proximity", "-0.187,5.6037");
  }

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new Error(`Place suggestions failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        full_address?: string;
        mapbox_id?: string;
        name?: string;
        place_formatted?: string;
      };
    }>;
  };

  return (payload.features ?? [])
    .filter(
      (feature): feature is NonNullable<typeof feature> & {
        geometry: { coordinates: [number, number] };
        properties: { mapbox_id: string };
      } =>
        Boolean(feature?.properties?.mapbox_id) &&
        Array.isArray(feature?.geometry?.coordinates) &&
        feature.geometry.coordinates.length === 2
    )
    .map((feature) => ({
      id: feature.properties.mapbox_id,
      name:
        feature.properties.name?.trim() ||
        feature.properties.place_formatted?.trim() ||
        feature.properties.full_address?.trim() ||
        input.query,
      fullAddress:
        feature.properties.full_address?.trim() ||
        feature.properties.place_formatted?.trim() ||
        feature.properties.name?.trim() ||
        input.query,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0]
    }));
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

  if (!mapboxPublicToken) {
    return [] as PlaceSuggestion[];
  }

  try {
    const endpoint = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("access_token", mapboxPublicToken);
    endpoint.searchParams.set("session_token", input.sessionToken);
    endpoint.searchParams.set("language", "en");
    endpoint.searchParams.set("limit", "5");
    endpoint.searchParams.set("country", "gh");

    if (input.proximity) {
      endpoint.searchParams.set("proximity", `${input.proximity.lng},${input.proximity.lat}`);
    } else {
      endpoint.searchParams.set("proximity", "-0.187,5.6037");
    }

    const response = await fetch(endpoint.toString());

    if (!response.ok) {
      throw new Error(`Search suggestions failed with ${response.status}`);
    }

    const payload = (await response.json()) as {
      suggestions?: Array<{
        full_address?: string;
        mapbox_id?: string;
        name?: string;
        place_formatted?: string;
      }>;
    };

    const suggestions = (payload.suggestions ?? [])
      .filter(
        (item): item is Required<Pick<typeof item, "mapbox_id">> & typeof item =>
          Boolean(item.mapbox_id)
      )
      .map((item) => ({
        id: item.mapbox_id,
        name:
          item.name?.trim() ||
          item.place_formatted?.trim() ||
          item.full_address?.trim() ||
          query,
        fullAddress:
          item.full_address?.trim() ||
          item.place_formatted?.trim() ||
          item.name?.trim() ||
          query
      }));

    if (suggestions.length > 0) {
      return suggestions;
    }
  } catch {
    // Fall back to forward geocoding so suggestions still work when Searchbox is unavailable.
  }

  return suggestWithForwardGeocode({
    proximity: input.proximity,
    query
  });
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

  if (!mapboxPublicToken) {
    throw new Error("No place search provider is configured");
  }

  const endpoint = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(input.suggestion.id)}`
  );
  endpoint.searchParams.set("access_token", mapboxPublicToken);
  endpoint.searchParams.set("session_token", input.sessionToken);
  endpoint.searchParams.set("language", "en");

  const response = await fetch(endpoint.toString());

  if (!response.ok) {
    throw new Error(`Place lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        full_address?: string;
        name?: string;
      };
    }>;
  };

  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates) {
    throw new Error("Selected place has no coordinates");
  }

  return {
    id: input.suggestion.id,
    name: feature?.properties?.name?.trim() || input.suggestion.name,
    fullAddress:
      feature?.properties?.full_address?.trim() || input.suggestion.fullAddress,
    lat: coordinates[1],
    lng: coordinates[0]
  } satisfies ResolvedPlace;
}
