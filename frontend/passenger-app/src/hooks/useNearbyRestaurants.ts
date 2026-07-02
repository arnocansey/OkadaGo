import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useApp } from "@/context/AppContext";
import {
  fetchNearbyPlaceById,
  fetchNearbyPlaces,
  type NearbyRestaurant,
} from "@/services/nearbyPlaces";

export type { NearbyRestaurant };

type NearbyFoodSource = "google" | "none";

type UseNearbyRestaurantsOptions = {
  categoryId?: string | null;
};

let cachedRestaurants: NearbyRestaurant[] | null = null;
let cacheKey = "";

function buildCacheKey(
  latitude: number,
  longitude: number,
  categoryId: string | null | undefined,
  token?: string,
) {
  return `${latitude.toFixed(4)}:${longitude.toFixed(4)}:${categoryId ?? "all"}:${token ? "auth" : "guest"}`;
}

export function useNearbyRestaurants(options: UseNearbyRestaurantsOptions = {}) {
  const { categoryId = null } = options;
  const { session } = useApp();
  const { latitude, longitude, loading: locationLoading, error: locationError, refresh: refreshLocation } =
    useUserLocation();

  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>(cachedRestaurants ?? []);
  const [loading, setLoading] = useState(!cachedRestaurants);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<NearbyFoodSource>("none");

  const load = useCallback(async (force = false) => {
    if (locationLoading) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Waiting for your location…");
      setLoading(false);
      return;
    }

    const key = buildCacheKey(latitude, longitude, categoryId, session?.token);
    if (!force && cachedRestaurants && cacheKey === key) {
      setRestaurants(cachedRestaurants);
      setSource("google");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (__DEV__) {
      console.log("[useNearbyRestaurants] loading", { latitude, longitude, categoryId });
    }

    try {
      const nearby = await fetchNearbyPlaces({
        latitude,
        longitude,
        categoryId,
        token: session?.token,
      });
      cachedRestaurants = nearby;
      cacheKey = key;
      setRestaurants(nearby);
      setSource("google");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load nearby places.";
      if (__DEV__) {
        console.warn("[useNearbyRestaurants] failed", message, err);
      }
      setError(message);
      setRestaurants([]);
      setSource("none");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, categoryId, session?.token, locationLoading]);

  useEffect(() => {
    if (locationLoading) return;
    load();
  }, [load, locationLoading]);

  const filtered = useMemo(() => restaurants, [restaurants]);

  const getRestaurant = useCallback(
    (id: string) => restaurants.find((r) => r.id === id),
    [restaurants],
  );

  const loadRestaurant = useCallback(
    async (id: string) => {
      const existing = restaurants.find((r) => r.id === id);
      if (existing) return existing;
      return fetchNearbyPlaceById(id, latitude, longitude, session?.token);
    },
    [restaurants, latitude, longitude, session?.token],
  );

  const refresh = useCallback(async () => {
    cachedRestaurants = null;
    cacheKey = "";
    await refreshLocation();
    await load(true);
  }, [refreshLocation, load]);

  return {
    restaurants: filtered,
    allRestaurants: restaurants,
    getRestaurant,
    loadRestaurant,
    loading: loading || locationLoading,
    error: error ?? locationError,
    source,
    refresh,
    latitude,
    longitude,
  };
}
