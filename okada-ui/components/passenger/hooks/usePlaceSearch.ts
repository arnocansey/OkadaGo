"use client";

import { useEffect, useState } from "react";
import {
  createPlaceSearchSession,
  retrievePlace,
  suggestPlaces,
  type PlaceSuggestion
} from "@/lib/place-search";
import { fetchJson } from "@/lib/api";

export type ForwardGeocodeResponse = {
  label: string;
  displayName: string | null;
  latitude: number;
  longitude: number;
};

export type FormState = {
  serviceZoneId: string;
  pickupAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  destinationAddress: string;
  destinationLatitude: string;
  destinationLongitude: string;
  estimatedDistanceKm: string;
  estimatedDurationMinutes: string;
};

function tryParseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function queryMatchesResolved(
  query: string,
  place: ForwardGeocodeResponse | null
) {
  if (!place) {
    return false;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const candidateValues = [
    place.label,
    place.displayName ?? ""
  ].map((value) => value.trim().toLowerCase());

  return candidateValues.includes(normalizedQuery);
}

export function usePlaceSearch({
  pickupAddress,
  pickupLatitude,
  pickupLongitude,
  destinationAddress,
  destinationLatitude,
  destinationLongitude,
  setForm
}: {
  pickupAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  destinationAddress: string;
  destinationLatitude: string;
  destinationLongitude: string;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const [pickupSessionToken] = useState(() => createPlaceSearchSession());
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupSuggestionsPending, setPickupSuggestionsPending] = useState(false);
  const [pickupSuggestionsError, setPickupSuggestionsError] = useState<string | null>(null);
  const [resolvedPickup, setResolvedPickup] = useState<ForwardGeocodeResponse | null>(null);

  const [destinationSessionToken] = useState(() => createPlaceSearchSession());
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestionsPending, setDestinationSuggestionsPending] = useState(false);
  const [destinationSuggestionsError, setDestinationSuggestionsError] = useState<string | null>(null);
  const [resolvedDestination, setResolvedDestination] = useState<ForwardGeocodeResponse | null>(null);

  useEffect(() => {
    const addr = pickupAddress.trim();
    const lat = tryParseCoordinate(pickupLatitude);
    const lng = tryParseCoordinate(pickupLongitude);

    if (!addr) {
      setResolvedPickup(null);
      return;
    }

    if (lat != null && lng != null) {
      setResolvedPickup({
        label: addr,
        displayName: addr,
        latitude: lat,
        longitude: lng
      });
      return;
    }

    setResolvedPickup(null);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchJson<ForwardGeocodeResponse>(
        `/bootstrap/forward-geocode?q=${encodeURIComponent(addr)}`
      )
        .then((result) => {
          if (!cancelled) {
            setResolvedPickup(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedPickup(null);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pickupAddress, pickupLatitude, pickupLongitude]);

  useEffect(() => {
    const addr = pickupAddress.trim();

    if (addr.length < 3 || queryMatchesResolved(addr, resolvedPickup)) {
      setPickupSuggestions([]);
      setPickupSuggestionsError(null);
      setPickupSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPickupSuggestionsPending(true);
      setPickupSuggestionsError(null);

      suggestPlaces({
        query: addr,
        sessionToken: pickupSessionToken
      })
        .then((suggestions) => {
          if (!cancelled) {
            setPickupSuggestions(suggestions);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setPickupSuggestions([]);
            setPickupSuggestionsError(
              error instanceof Error ? error.message : "Could not load place suggestions."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setPickupSuggestionsPending(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pickupAddress, pickupSessionToken, resolvedPickup]);

  useEffect(() => {
    const addr = destinationAddress.trim();
    const lat = tryParseCoordinate(destinationLatitude);
    const lng = tryParseCoordinate(destinationLongitude);

    if (!addr) {
      setResolvedDestination(null);
      return;
    }

    if (lat != null && lng != null) {
      setResolvedDestination({
        label: addr,
        displayName: addr,
        latitude: lat,
        longitude: lng
      });
      return;
    }

    setResolvedDestination(null);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchJson<ForwardGeocodeResponse>(
        `/bootstrap/forward-geocode?q=${encodeURIComponent(addr)}`
      )
        .then((result) => {
          if (!cancelled) {
            setResolvedDestination(result);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedDestination(null);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destinationAddress, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    const addr = destinationAddress.trim();

    if (
      addr.length < 3 ||
      queryMatchesResolved(addr, resolvedDestination)
    ) {
      setDestinationSuggestions([]);
      setDestinationSuggestionsError(null);
      setDestinationSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setDestinationSuggestionsPending(true);
      setDestinationSuggestionsError(null);

      suggestPlaces({
        query: addr,
        sessionToken: destinationSessionToken
      })
        .then((suggestions) => {
          if (!cancelled) {
            setDestinationSuggestions(suggestions);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setDestinationSuggestions([]);
            setDestinationSuggestionsError(
              error instanceof Error ? error.message : "Could not load place suggestions."
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setDestinationSuggestionsPending(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destinationSessionToken, destinationAddress, resolvedDestination]);

  async function choosePickupSuggestion(suggestion: PlaceSuggestion) {
    setPickupSuggestionsPending(true);
    setPickupSuggestionsError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: pickupSessionToken,
        suggestion
      });

      setForm((current) => ({
        ...current,
        pickupAddress: resolved.fullAddress,
        pickupLatitude: resolved.lat.toFixed(6),
        pickupLongitude: resolved.lng.toFixed(6)
      }));
      setResolvedPickup({
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      });
      setPickupSuggestions([]);
    } catch (error) {
      setPickupSuggestionsError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the selected pickup."
      );
    } finally {
      setPickupSuggestionsPending(false);
    }
  }

  async function chooseDestinationSuggestion(suggestion: PlaceSuggestion) {
    setDestinationSuggestionsPending(true);
    setDestinationSuggestionsError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: destinationSessionToken,
        suggestion
      });

      setForm((current) => ({
        ...current,
        destinationAddress: resolved.fullAddress,
        destinationLatitude: resolved.lat.toFixed(6),
        destinationLongitude: resolved.lng.toFixed(6)
      }));
      setResolvedDestination({
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      });
      setDestinationSuggestions([]);
    } catch (error) {
      setDestinationSuggestionsError(
        error instanceof Error
          ? error.message
          : "Could not retrieve the selected destination."
      );
    } finally {
      setDestinationSuggestionsPending(false);
    }
  }

  return {
    pickupSuggestions,
    pickupSuggestionsPending,
    pickupSuggestionsError,
    choosePickupSuggestion,
    resolvedPickup,
    destinationSuggestions,
    destinationSuggestionsPending,
    destinationSuggestionsError,
    chooseDestinationSuggestion,
    resolvedDestination
  };
}
