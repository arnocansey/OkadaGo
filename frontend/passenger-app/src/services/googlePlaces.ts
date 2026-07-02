import { haversineKm } from "@/lib/geo";
import { API_BASE_URL, api } from "@/lib/api";

export type PlaceCategory = "food" | "groceries" | "all";

export type GooglePlaceResult = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  types?: string[];
  opening_hours?: { open_now?: boolean };
  photos?: { photo_reference: string }[];
  business_status?: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  types: string[];
  phone?: string;
  openNow?: boolean;
  weekdayText?: string[];
  photoReference?: string;
};

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  meal_takeaway: "Takeaway",
  meal_delivery: "Delivery",
  cafe: "Café",
  bar: "Bar",
  supermarket: "Supermarket",
  grocery_or_supermarket: "Grocery",
  bakery: "Bakery",
  food: "Food",
  store: "Store",
};

export function placesApiErrorMessage(status: string, errorMessage?: string): string {
  if (status === "REQUEST_DENIED" || status === "PERMISSION_DENIED") {
    return (
      "Google Places API access denied. Ask your admin to enable Places API (New) on the backend " +
      "GOOGLE_PLACES_API_KEY (server key, not the mobile Maps key), ensure billing is enabled, and redeploy."
    );
  }
  if (status === "OVER_QUERY_LIMIT") {
    return "Google Places quota exceeded. Try again later or check billing in Google Cloud Console.";
  }
  if (status === "INVALID_REQUEST") {
    return errorMessage ?? "Invalid Places API request.";
  }
  if (status === "ZERO_RESULTS") {
    return "";
  }
  return errorMessage ?? `Places API error: ${status}`;
}

function logDebug(message: string, details?: unknown) {
  if (__DEV__) {
    console.log(`[googlePlaces] ${message}`, details ?? "");
  }
}

function logError(message: string, err: unknown) {
  if (__DEV__) {
    console.warn(`[googlePlaces] ${message}`, err);
  }
}

export async function nearbySearch(
  latitude: number,
  longitude: number,
  categoryId?: string | null,
): Promise<GooglePlaceResult[]> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Location is not ready yet. Enable location permission and try again.");
  }

  const params = new URLSearchParams({
    lat: `${latitude}`,
    lng: `${longitude}`,
  });
  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  logDebug("nearbySearch request", { latitude, longitude, categoryId });

  try {
    const data = await api<{ results: GooglePlaceResult[] }>(
      `/bootstrap/places/nearby?${params.toString()}`,
    );
    logDebug("nearbySearch success", { count: data.results.length });
    return data.results;
  } catch (err) {
    logError("nearbySearch failed", err);
    throw err instanceof Error ? err : new Error("Could not load nearby places.");
  }
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({ placeId });
  logDebug("fetchPlaceDetails request", { placeId });

  try {
    const details = await api<PlaceDetails>(`/bootstrap/places/details?${params.toString()}`);
    logDebug("fetchPlaceDetails success", { placeId: details.placeId });
    return details;
  } catch (err) {
    logError("fetchPlaceDetails failed", err);
    throw err instanceof Error ? err : new Error("Could not load place details.");
  }
}

export function formatPlaceCuisine(types: string[] = []): string {
  const meaningful = types.filter(
    (t) => !t.startsWith("point_of_interest") && !t.startsWith("establishment"),
  );
  const labels = meaningful.slice(0, 3).map((t) => TYPE_LABELS[t] ?? t.replace(/_/g, " "));
  return labels.length > 0 ? labels.join(" · ") : "Food & drink";
}

export function mapPlaceCategoryIds(types: string[] = []): string[] {
  const ids = new Set<string>();
  if (types.some((t) => ["supermarket", "grocery_or_supermarket"].includes(t))) {
    ids.add("groceries");
  }
  if (types.some((t) => ["meal_takeaway", "hamburger_restaurant", "fast_food_restaurant"].includes(t))) {
    ids.add("fast-food");
  }
  if (types.some((t) => ["cafe", "bar"].includes(t))) {
    ids.add("drinks");
  }
  if (types.some((t) => ["bakery"].includes(t))) {
    ids.add("desserts");
  }
  if (types.some((t) => ["health_food_store"].includes(t))) {
    ids.add("healthy");
  }
  if (types.some((t) => ["restaurant"].includes(t))) {
    ids.add("local");
  }
  if (ids.size === 0) ids.add("local");
  return Array.from(ids);
}

export function photoUrl(photoReference: string, maxWidth = 400): string {
  const params = new URLSearchParams({
    photoreference: photoReference,
    maxwidth: `${maxWidth}`,
  });
  return `${API_BASE_URL}/bootstrap/places/photo?${params.toString()}`;
}

/** @deprecated Places requests are proxied through the backend; client keys are not required. */
export function getGooglePlacesApiKey(): string | undefined {
  return undefined;
}

/** Sort helper kept for tests and callers that already have raw place results. */
export function sortPlacesByDistance(
  latitude: number,
  longitude: number,
  places: GooglePlaceResult[],
): GooglePlaceResult[] {
  return [...places].sort((a, b) => {
    const distA = haversineKm(
      latitude,
      longitude,
      a.geometry.location.lat,
      a.geometry.location.lng,
    );
    const distB = haversineKm(
      latitude,
      longitude,
      b.geometry.location.lat,
      b.geometry.location.lng,
    );
    return distA - distB;
  });
}
