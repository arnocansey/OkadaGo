import type { MenuItem } from "@/data/foodCatalog";
import { api } from "@/lib/api";
import { estimateDeliveryEtaMin, haversineKm } from "@/lib/geo";
import {
  fetchPlaceDetails,
  formatPlaceCuisine,
  mapPlaceCategoryIds,
  nearbySearch,
  type GooglePlaceResult,
} from "@/services/googlePlaces";
import type { RoutePreview } from "@/types";

export type NearbyRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  etaMin: number;
  deliveryFee: number;
  color: string;
  address: string;
  latitude: number;
  longitude: number;
  categoryIds: string[];
  menu: MenuItem[];
  distanceKm: number;
  etaSource?: "route" | "estimate";
  source: "google";
  photoReference?: string;
  phone?: string;
  openNow?: boolean;
};

export type NearbyPlacesQuery = {
  latitude: number;
  longitude: number;
  categoryId?: string | null;
  limit?: number;
  token?: string;
};

const THUMB_COLORS = ["#FFC107", "#F59E0B", "#3B82F6", "#FF3B30", "#10B981", "#8B5CF6"];

export const GENERIC_ORDER_MENU: MenuItem[] = [
  {
    id: "custom-order",
    name: "Custom order",
    description: "Describe what you want — a rider will pick it up from this place",
    price: 0,
    popular: true,
  },
  {
    id: "groceries-run",
    name: "Groceries run",
    description: "Essentials and groceries from this store",
    price: 0,
  },
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THUMB_COLORS[Math.abs(hash) % THUMB_COLORS.length];
}

function estimateDeliveryFee(distanceKm: number): number {
  return Math.max(7, Math.round(5 + distanceKm * 2));
}

function googlePlaceToNearby(
  place: GooglePlaceResult,
  userLat: number,
  userLng: number,
): NearbyRestaurant {
  const latitude = place.geometry.location.lat;
  const longitude = place.geometry.location.lng;
  const distanceKm = haversineKm(userLat, userLng, latitude, longitude);
  const types = place.types ?? [];

  return {
    id: place.place_id,
    name: place.name,
    cuisine: formatPlaceCuisine(types),
    rating: place.rating ?? 0,
    etaMin: estimateDeliveryEtaMin(distanceKm),
    deliveryFee: estimateDeliveryFee(distanceKm),
    color: colorFromName(place.name),
    address: place.vicinity ?? place.formatted_address ?? "",
    latitude,
    longitude,
    categoryIds: mapPlaceCategoryIds(types),
    menu: GENERIC_ORDER_MENU,
    distanceKm,
    etaSource: "estimate",
    source: "google",
    photoReference: place.photos?.[0]?.photo_reference,
    openNow: place.opening_hours?.open_now,
  };
}

/**
 * Nearby food & grocery places from Google Places, sorted by distance.
 * Uses `/bootstrap/route-preview` for ETA when a session token is available.
 */
export async function fetchNearbyPlaces(query: NearbyPlacesQuery): Promise<NearbyRestaurant[]> {
  const { latitude, longitude, categoryId, limit, token } = query;

  const googlePlaces = await nearbySearch(latitude, longitude, categoryId);
  let places = googlePlaces.map((place) => googlePlaceToNearby(place, latitude, longitude));

  if (categoryId) {
    places = places.filter((place) => place.categoryIds.includes(categoryId));
  }

  places.sort((a, b) => a.distanceKm - b.distanceKm);

  if (token) {
    places = await Promise.all(
      places.map(async (place) => {
        const routeEta = await fetchRouteEta(token, latitude, longitude, place);
        if (routeEta != null) {
          return { ...place, etaMin: routeEta, etaSource: "route" as const };
        }
        return place;
      }),
    );
    places.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  if (limit != null && limit > 0) {
    places = places.slice(0, limit);
  }

  return places;
}

export async function fetchNearbyPlaceById(
  id: string,
  latitude: number,
  longitude: number,
  token?: string,
): Promise<NearbyRestaurant | undefined> {
  const cached = (await fetchNearbyPlaces({ latitude, longitude, token })).find(
    (place) => place.id === id,
  );
  if (cached) return cached;

  try {
    const details = await fetchPlaceDetails(id);
    const base = googlePlaceToNearby(
      {
        place_id: details.placeId,
        name: details.name,
        vicinity: details.address,
        formatted_address: details.address,
        geometry: { location: { lat: details.latitude, lng: details.longitude } },
        rating: details.rating,
        types: details.types,
        photos: details.photoReference ? [{ photo_reference: details.photoReference }] : undefined,
      },
      latitude,
      longitude,
    );
    return {
      ...base,
      address: details.address,
      phone: details.phone,
      openNow: details.openNow,
    };
  } catch {
    return undefined;
  }
}

export function isGroceriesCategory(categoryId: string | null | undefined): boolean {
  return categoryId === "groceries";
}

export function isFoodCategory(categoryId: string | null | undefined): boolean {
  return categoryId != null && categoryId !== "groceries";
}

async function fetchRouteEta(
  token: string,
  userLat: number,
  userLng: number,
  restaurant: Pick<NearbyRestaurant, "latitude" | "longitude" | "etaMin">,
): Promise<number | null> {
  const params = new URLSearchParams({
    startLat: `${restaurant.latitude}`,
    startLon: `${restaurant.longitude}`,
    endLat: `${userLat}`,
    endLon: `${userLng}`,
  });

  try {
    const preview = await api<RoutePreview>(`/bootstrap/route-preview?${params.toString()}`, { token });
    return preview.durationMinutes;
  } catch {
    return null;
  }
}
