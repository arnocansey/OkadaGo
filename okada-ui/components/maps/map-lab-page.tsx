"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import { fetchJson } from "@/lib/api";
import {
  createPlaceSearchSession,
  retrievePlace,
  suggestPlaces,
  type PlaceSuggestion
} from "@/lib/place-search";

const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const mapboxStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE_ID?.trim() || "mapbox/streets-v12";
const defaultMapboxStyle = "mapbox/streets-v12";
const allowCustomMapboxStyle =
  (process.env.NEXT_PUBLIC_MAPBOX_USE_CUSTOM_STYLE ?? "").trim().toLowerCase() === "true";

type TileMode = "custom" | "defaultMapbox" | "osm";

type TileConfig = {
  attribution: string;
  isMapbox: boolean;
  label: string;
  tileSize: number;
  url: string;
  zoomOffset: number;
};

type TileStats = {
  errored: number;
  lastError: string | null;
  loaded: number;
  requested: number;
};

type GeoFix = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

type ForwardGeocodeResponse = {
  displayName: string | null;
  label: string;
  latitude: number;
  longitude: number;
};

type RoutePreviewResponse = {
  distanceKm: number;
  durationMinutes: number;
  provider: "mapbox" | "osrm";
  route: Array<[number, number]>;
};

const accraCenter: [number, number] = [5.6037, -0.187];
const sampleRoute: Array<[number, number]> = [
  [5.6037, -0.187],
  [5.6011, -0.1798],
  [5.5962, -0.1752],
  [5.5928, -0.1711]
];

const pickupIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker pickup"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const destinationIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker destination"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const passengerIcon = L.divIcon({
  className: "leaflet-custom-icon",
  html: '<div class="leaflet-marker passenger"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function getTileConfig(styleId?: string | null): TileConfig {
  if (mapboxPublicToken && styleId) {
    return {
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> ' +
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      isMapbox: true,
      label: styleId === defaultMapboxStyle ? "Mapbox Streets" : "Mapbox Custom",
      tileSize: 512,
      url: `https://api.mapbox.com/styles/v1/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxPublicToken}`,
      zoomOffset: -1
    };
  }

  return {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    isMapbox: false,
    label: "OpenStreetMap",
    tileSize: 256,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    zoomOffset: 0
  };
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
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

async function resolveDestinationWithFallback(
  query: string
): Promise<ForwardGeocodeResponse> {
  try {
    return await fetchJson<ForwardGeocodeResponse>(
      `/bootstrap/forward-geocode?q=${encodeURIComponent(query)}`
    );
  } catch (backendError) {
    if (!mapboxPublicToken) {
      throw backendError;
    }

    const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("access_token", mapboxPublicToken);
    endpoint.searchParams.set("country", "gh");
    endpoint.searchParams.set("language", "en");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set(
      "types",
      "address,street,neighborhood,locality,place,district,region"
    );
    endpoint.searchParams.set("proximity", "-0.187,5.6037");

    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      const fallbackMessage = await response.text();
      throw new Error(
        `Backend geocoding failed, and the Mapbox fallback returned ${response.status}: ${fallbackMessage || "Unknown response"}`
      );
    }

    const payload = (await response.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: {
          full_address?: string;
          name?: string;
          place_formatted?: string;
        };
      }>;
    };

    const feature = payload.features?.[0];
    const coordinates = feature?.geometry?.coordinates;
    if (!coordinates) {
      throw backendError;
    }

    return {
      displayName:
        feature.properties?.full_address?.trim() ||
        feature.properties?.place_formatted?.trim() ||
        feature.properties?.name?.trim() ||
        query,
      label:
        feature.properties?.name?.trim() ||
        feature.properties?.place_formatted?.trim() ||
        feature.properties?.full_address?.trim() ||
        query,
      latitude: coordinates[1],
      longitude: coordinates[0]
    };
  }
}

async function previewRouteWithFallback(input: {
  endLatitude: number;
  endLongitude: number;
  startLatitude: number;
  startLongitude: number;
}): Promise<RoutePreviewResponse> {
  try {
    return await fetchJson<RoutePreviewResponse>(
      `/bootstrap/route-preview?startLat=${encodeURIComponent(input.startLatitude)}&startLon=${encodeURIComponent(
        input.startLongitude
      )}&endLat=${encodeURIComponent(input.endLatitude)}&endLon=${encodeURIComponent(input.endLongitude)}`
    );
  } catch (backendError) {
    if (!mapboxPublicToken) {
      throw backendError;
    }

    const endpoint = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${input.startLongitude},${input.startLatitude};${input.endLongitude},${input.endLatitude}`
    );
    endpoint.searchParams.set("access_token", mapboxPublicToken);
    endpoint.searchParams.set("overview", "full");
    endpoint.searchParams.set("geometries", "geojson");
    endpoint.searchParams.set("alternatives", "false");
    endpoint.searchParams.set("steps", "false");

    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      const fallbackMessage = await response.text();
      throw new Error(
        `Backend routing failed, and the Mapbox fallback returned ${response.status}: ${fallbackMessage || "Unknown response"}`
      );
    }

    const payload = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };

    const route = payload.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      throw backendError;
    }

    return {
      distanceKm: Number((route.distance / 1000).toFixed(1)),
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      provider: "mapbox",
      route: route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
    };
  }
}

export function MapLabPage() {
  const [tileMode, setTileMode] = useState<TileMode>(
    mapboxPublicToken ? (allowCustomMapboxStyle ? "custom" : "defaultMapbox") : "osm"
  );
  const [tileWarning, setTileWarning] = useState<string | null>(null);
  const [tileStats, setTileStats] = useState<TileStats>({
    errored: 0,
    lastError: null,
    loaded: 0,
    requested: 0
  });
  const [currentFix, setCurrentFix] = useState<GeoFix | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPending, setGeoPending] = useState(false);
  const [showSampleRoute, setShowSampleRoute] = useState(true);
  const [mapSeed, setMapSeed] = useState(0);
  const [pickupQuery, setPickupQuery] = useState("Accra sample pickup");
  const [pickupSessionToken] = useState(() => createPlaceSearchSession());
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupSuggestionsPending, setPickupSuggestionsPending] = useState(false);
  const [pickupSuggestionsError, setPickupSuggestionsError] = useState<string | null>(null);
  const [resolvedPickup, setResolvedPickup] = useState<ForwardGeocodeResponse | null>({
    displayName: "Accra sample pickup",
    label: "Accra sample pickup",
    latitude: sampleRoute[0][0],
    longitude: sampleRoute[0][1]
  });
  const [pickupPending, setPickupPending] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupUsesCurrentLocation, setPickupUsesCurrentLocation] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState("Airport Residential Area, Accra");
  const [destinationSessionToken] = useState(() => createPlaceSearchSession());
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestionsPending, setDestinationSuggestionsPending] = useState(false);
  const [destinationSuggestionsError, setDestinationSuggestionsError] = useState<string | null>(null);
  const [resolvedDestination, setResolvedDestination] = useState<ForwardGeocodeResponse | null>(null);
  const [destinationPending, setDestinationPending] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [routePreview, setRoutePreview] = useState<RoutePreviewResponse | null>(null);
  const [routePending, setRoutePending] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [requestedView, setRequestedView] = useState({
    center: accraCenter,
    zoom: 13
  });

  const tileStyleId =
    tileMode === "custom"
      ? mapboxStyle
      : tileMode === "defaultMapbox"
        ? defaultMapboxStyle
        : null;
  const tileConfig = useMemo(() => getTileConfig(tileStyleId), [tileStyleId]);

  useEffect(() => {
    setTileStats({
      errored: 0,
      lastError: null,
      loaded: 0,
      requested: 0
    });
  }, [tileMode]);

  const pickupPoint =
    resolvedPickup ??
    ({
      label: "Accra sample pickup",
      displayName: "Accra sample pickup",
      latitude: sampleRoute[0][0],
      longitude: sampleRoute[0][1]
    } satisfies ForwardGeocodeResponse);

  const activeCenter = requestedView.center;
  const activeRoute = resolvedDestination && routePreview ? routePreview.route : showSampleRoute ? sampleRoute : [];

  function applyResolvedDestination(destination: ForwardGeocodeResponse) {
    setResolvedDestination(destination);
    setDestinationSuggestions([]);
    setDestinationSuggestionsError(null);
    setRequestedView({
      center: [
        (pickupPoint.latitude + destination.latitude) / 2,
        (pickupPoint.longitude + destination.longitude) / 2
      ],
      zoom: 13
    });
    setMapSeed((current) => current + 1);
  }

  function applyResolvedPickup(pickup: ForwardGeocodeResponse) {
    setResolvedPickup(pickup);
    setPickupSuggestions([]);
    setPickupSuggestionsError(null);
    setRequestedView({
      center: [pickup.latitude, pickup.longitude],
      zoom: 14
    });
    setMapSeed((current) => current + 1);
  }

  const markers = [
    {
      icon: pickupUsesCurrentLocation ? passengerIcon : pickupIcon,
      key: "pickup-point",
      label:
        pickupUsesCurrentLocation && currentFix
          ? `${pickupPoint.label} (${Math.round(currentFix.accuracy)}m)`
          : pickupPoint.label,
      position: [pickupPoint.latitude, pickupPoint.longitude] as [number, number]
    },
    ...(resolvedDestination
      ? [
          {
            icon: destinationIcon,
            key: "resolved-destination",
            label: resolvedDestination.label,
            position: [resolvedDestination.latitude, resolvedDestination.longitude] as [number, number]
          }
        ]
      : currentFix || !showSampleRoute
        ? []
        : [
            {
              icon: destinationIcon,
              key: "accra-dropoff",
              label: "Accra sample destination",
              position: sampleRoute[sampleRoute.length - 1]
            }
          ])
  ];

  function fallbackTileMode(current: TileMode) {
    if (current === "custom") {
      setTileMode("defaultMapbox");
      setTileWarning(
        "Custom Mapbox style failed in Map Lab, so the sandbox fell back to default Mapbox Streets."
      );
      return;
    }

    if (current === "defaultMapbox") {
      setTileMode("osm");
      setTileWarning(
        "Mapbox tiles failed in Map Lab, so the sandbox fell back to OpenStreetMap."
      );
      return;
    }

    setTileWarning("OpenStreetMap tiles also failed in Map Lab.");
  }

  function requestCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("This browser does not support geolocation.");
      return;
    }

    setGeoPending(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentFix({
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setPickupUsesCurrentLocation(true);
        setPickupQuery("Current location");
        applyResolvedPickup({
          displayName: "Current location",
          label: "Current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setRequestedView({
          center: [position.coords.latitude, position.coords.longitude],
          zoom: 15
        });
        setMapSeed((current) => current + 1);
        setGeoPending(false);
      },
      (error) => {
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Could not read the current device location."
        );
        setGeoPending(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
      }
    );
  }

  async function choosePickupSuggestion(suggestion: PlaceSuggestion) {
    setPickupPending(true);
    setPickupError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: pickupSessionToken,
        suggestion
      });

      const pickup = {
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      } satisfies ForwardGeocodeResponse;

      setPickupUsesCurrentLocation(false);
      setPickupQuery(resolved.fullAddress);
      applyResolvedPickup(pickup);
    } catch (error) {
      setPickupError(
        error instanceof Error
          ? error.message
          : "Could not retrieve this pickup from the suggestion provider."
      );
    } finally {
      setPickupPending(false);
    }
  }

  async function resolvePickup() {
    const trimmedQuery = pickupQuery.trim();

    if (!trimmedQuery) {
      setPickupError("Enter a pickup before resolving it.");
      return;
    }

    setPickupPending(true);
    setPickupError(null);
    setPickupSuggestionsError(null);

    try {
      const pickup = await resolveDestinationWithFallback(trimmedQuery);
      setPickupUsesCurrentLocation(false);
      applyResolvedPickup(pickup);
    } catch (error) {
      setPickupError(
        error instanceof Error
          ? error.message
          : "Could not resolve that pickup from the backend or fallback provider."
      );
    } finally {
      setPickupPending(false);
    }
  }

  async function chooseDestinationSuggestion(suggestion: PlaceSuggestion) {
    setDestinationPending(true);
    setDestinationError(null);

    try {
      const resolved = await retrievePlace({
        sessionToken: destinationSessionToken,
        suggestion
      });

      const destination = {
        displayName: resolved.fullAddress,
        label: resolved.name,
        latitude: resolved.lat,
        longitude: resolved.lng
      } satisfies ForwardGeocodeResponse;

      setDestinationQuery(resolved.fullAddress);
      applyResolvedDestination(destination);
    } catch (error) {
      setResolvedDestination(null);
      setRoutePreview(null);
      setDestinationError(
        error instanceof Error
          ? error.message
          : "Could not retrieve this destination from the suggestion provider."
      );
    } finally {
      setDestinationPending(false);
    }
  }

  async function resolveDestination() {
    const trimmedQuery = destinationQuery.trim();

    if (!trimmedQuery) {
      setDestinationError("Enter a destination before resolving it.");
      setResolvedDestination(null);
      setRoutePreview(null);
      return;
    }

    setDestinationPending(true);
    setDestinationError(null);
    setDestinationSuggestionsError(null);

    try {
      const destination = await resolveDestinationWithFallback(trimmedQuery);
      applyResolvedDestination(destination);
    } catch (error) {
      setResolvedDestination(null);
      setRoutePreview(null);
      setDestinationError(
        error instanceof Error
          ? error.message
          : "Could not resolve that destination from the backend or fallback provider."
      );
    } finally {
      setDestinationPending(false);
    }
  }

  useEffect(() => {
    const trimmedQuery = pickupQuery.trim();

    if (trimmedQuery.length < 3 || queryMatchesResolved(trimmedQuery, resolvedPickup)) {
      setPickupSuggestions([]);
      setPickupSuggestionsError(null);
      setPickupSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setPickupSuggestionsPending(true);
      setPickupSuggestionsError(null);

      suggestPlaces({
        query: trimmedQuery,
        sessionToken: pickupSessionToken,
        proximity: currentFix
          ? { lat: currentFix.latitude, lng: currentFix.longitude }
          : { lat: accraCenter[0], lng: accraCenter[1] }
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
              error instanceof Error ? error.message : "Could not load pickup suggestions."
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
      window.clearTimeout(timeoutId);
    };
  }, [currentFix, pickupQuery, pickupSessionToken, resolvedPickup]);

  useEffect(() => {
    const trimmedQuery = destinationQuery.trim();

    if (trimmedQuery.length < 3 || queryMatchesResolved(trimmedQuery, resolvedDestination)) {
      setDestinationSuggestions([]);
      setDestinationSuggestionsError(null);
      setDestinationSuggestionsPending(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setDestinationSuggestionsPending(true);
      setDestinationSuggestionsError(null);

      suggestPlaces({
        query: trimmedQuery,
        sessionToken: destinationSessionToken,
        proximity: currentFix
          ? { lat: currentFix.latitude, lng: currentFix.longitude }
          : { lat: accraCenter[0], lng: accraCenter[1] }
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
              error instanceof Error
                ? error.message
                : "Could not load place suggestions."
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
      window.clearTimeout(timeoutId);
    };
  }, [currentFix, destinationQuery, destinationSessionToken, resolvedDestination]);

  useEffect(() => {
    if (!resolvedDestination) {
      setRoutePreview(null);
      setRouteError(null);
      return;
    }

    let cancelled = false;
    setRoutePending(true);
    setRouteError(null);

    previewRouteWithFallback({
      endLatitude: resolvedDestination.latitude,
      endLongitude: resolvedDestination.longitude,
      startLatitude: pickupPoint.latitude,
      startLongitude: pickupPoint.longitude
    })
      .then((result) => {
        if (!cancelled) {
          setRoutePreview(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRoutePreview(null);
          setRouteError(
            error instanceof Error
              ? error.message
              : "Could not preview this route from the backend or fallback provider."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRoutePending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pickupPoint.latitude, pickupPoint.longitude, resolvedDestination]);

  return (
    <main className="workspace-page">
      <div className="container stack">
        <section className="workspace-intro">
          <div>
            <p className="workspace-tag">Map Sandbox</p>
            <h1>Map lab</h1>
            <p>
              This page isolates the web map stack so we can verify tiles, markers,
              routes, and browser geolocation before wiring maps back into the
              passenger flow.
            </p>
          </div>
          <div className="button-row">
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setRequestedView({ center: accraCenter, zoom: 13 });
                setMapSeed((current) => current + 1);
              }}
            >
              Reset to Accra
            </button>
            <button className="button" type="button" onClick={requestCurrentLocation} disabled={geoPending}>
              {geoPending ? "Locating..." : "Use current location"}
            </button>
          </div>
        </section>

        <section className="overview-grid">
          <div className="content-card">
            <h3>Provider and tile status</h3>
            <div className="four-up" style={{ marginTop: 18 }}>
              <div className="metric-tile">
                <strong>{tileConfig.label}</strong>
                <span>Active provider</span>
              </div>
              <div className="metric-tile">
                <strong>{tileStats.requested}</strong>
                <span>Tiles requested</span>
              </div>
              <div className="metric-tile">
                <strong>{tileStats.loaded}</strong>
                <span>Tiles loaded</span>
              </div>
              <div className="metric-tile">
                <strong>{tileStats.errored}</strong>
                <span>Tile errors</span>
              </div>
            </div>
            {tileWarning ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Tile fallback triggered</strong>
                <p>{tileWarning}</p>
              </div>
            ) : null}
            {tileStats.lastError ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Last tile error</strong>
                <p>{tileStats.lastError}</p>
              </div>
            ) : null}
          </div>

          <div className="content-card">
            <h3>Pickup, destination, and route preview</h3>
            <div className="field-group" style={{ marginTop: 18 }}>
              <label className="field-label">Pickup query</label>
              <input
                className="input map-lab-input"
                value={pickupQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setPickupQuery(nextValue);
                  setPickupError(null);
                  setPickupUsesCurrentLocation(false);

                  if (!queryMatchesResolved(nextValue, resolvedPickup)) {
                    setResolvedPickup(null);
                    setRoutePreview(null);
                    setRouteError(null);
                  }
                }}
                placeholder="Search a pickup in Ghana"
              />
            </div>
            {pickupSuggestionsPending || pickupSuggestionsError || pickupSuggestions.length > 0 ? (
              <div className="map-lab-suggestion-panel">
                {pickupSuggestionsPending ? (
                  <div className="map-lab-suggestion-status">Looking up Ghana pickup points...</div>
                ) : null}
                {pickupSuggestionsError ? (
                  <div className="map-lab-suggestion-status error">{pickupSuggestionsError}</div>
                ) : null}
                {pickupSuggestions.length > 0 ? (
                  <div className="map-lab-suggestion-list" role="listbox" aria-label="Pickup suggestions">
                    {pickupSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        className="map-lab-suggestion-item"
                        type="button"
                        onClick={() => void choosePickupSuggestion(suggestion)}
                      >
                        <strong>{suggestion.name}</strong>
                        <span>{suggestion.fullAddress}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                className="button-secondary"
                type="button"
                onClick={resolvePickup}
                disabled={pickupPending}
              >
                {pickupPending ? "Resolving pickup..." : "Resolve pickup"}
              </button>
            </div>
            {pickupError ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Pickup error</strong>
                <p>{pickupError}</p>
              </div>
            ) : null}
            <div className="field-group" style={{ marginTop: 18 }}>
              <label className="field-label">Destination query</label>
              <input
                className="input map-lab-input"
                value={destinationQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDestinationQuery(nextValue);
                  setDestinationError(null);

                  if (!queryMatchesResolved(nextValue, resolvedDestination)) {
                    setResolvedDestination(null);
                    setRoutePreview(null);
                    setRouteError(null);
                  }
                }}
                placeholder="Search a destination in Ghana"
              />
            </div>
            {destinationSuggestionsPending ||
            destinationSuggestionsError ||
            destinationSuggestions.length > 0 ? (
              <div className="map-lab-suggestion-panel">
                {destinationSuggestionsPending ? (
                  <div className="map-lab-suggestion-status">Looking up Ghana places...</div>
                ) : null}
                {destinationSuggestionsError ? (
                  <div className="map-lab-suggestion-status error">{destinationSuggestionsError}</div>
                ) : null}
                {destinationSuggestions.length > 0 ? (
                  <div className="map-lab-suggestion-list" role="listbox" aria-label="Destination suggestions">
                    {destinationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        className="map-lab-suggestion-item"
                        type="button"
                        onClick={() => void chooseDestinationSuggestion(suggestion)}
                      >
                        <strong>{suggestion.name}</strong>
                        <span>{suggestion.fullAddress}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                className="button"
                type="button"
                onClick={resolveDestination}
                disabled={destinationPending}
              >
                {destinationPending ? "Resolving..." : "Resolve destination"}
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => {
                  setResolvedDestination(null);
                  setRoutePreview(null);
                  setRouteError(null);
                }}
              >
                Clear live route
              </button>
            </div>
            {destinationError ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Destination error</strong>
                <p>{destinationError}</p>
              </div>
            ) : null}
            {routeError ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Route preview error</strong>
                <p>{routeError}</p>
              </div>
            ) : null}
            <div className="table-wrapper" style={{ marginTop: 18 }}>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Pickup</th>
                    <td>
                      {pickupPoint.label} ({formatCoordinate(pickupPoint.latitude)}, {formatCoordinate(pickupPoint.longitude)})
                    </td>
                  </tr>
                  <tr>
                    <th>Destination</th>
                    <td>
                      {resolvedDestination
                        ? `${resolvedDestination.label} (${formatCoordinate(resolvedDestination.latitude)}, ${formatCoordinate(resolvedDestination.longitude)})`
                        : "No resolved destination yet"}
                    </td>
                  </tr>
                  <tr>
                    <th>Provider</th>
                    <td>
                      {routePreview ? routePreview.provider : showSampleRoute ? "sample" : "--"}
                    </td>
                  </tr>
                  <tr>
                    <th>Distance</th>
                    <td>{routePreview ? `${routePreview.distanceKm.toFixed(1)} km` : "--"}</td>
                  </tr>
                  <tr>
                    <th>Duration</th>
                    <td>{routePreview ? `${routePreview.durationMinutes} min` : "--"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {routePending ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <strong>Route preview in progress</strong>
                <p>Fetching a live route from the backend preview service.</p>
              </div>
            ) : null}
            <div className="button-row" style={{ marginTop: 18 }}>
              <button
                className="button-secondary"
                type="button"
                onClick={() => setShowSampleRoute((current) => !current)}
              >
                {showSampleRoute ? "Hide sample route" : "Show sample route"}
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => setTileMode("osm")}
              >
                Force OSM
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() =>
                  setTileMode(
                    mapboxPublicToken
                      ? allowCustomMapboxStyle
                        ? "custom"
                        : "defaultMapbox"
                      : "osm"
                  )
                }
              >
                Restore default provider
              </button>
            </div>
          </div>
        </section>

        <section className="content-card">
          <h3>Viewport and geolocation</h3>
          <div className="table-wrapper" style={{ marginTop: 18 }}>
            <table className="table">
              <tbody>
                <tr>
                  <th>Center</th>
                  <td>
                    {formatCoordinate(requestedView.center[0])}, {formatCoordinate(requestedView.center[1])}
                  </td>
                </tr>
                <tr>
                  <th>Zoom</th>
                  <td>{requestedView.zoom}</td>
                </tr>
                <tr>
                  <th>Current fix</th>
                  <td>
                    {currentFix
                      ? `${formatCoordinate(currentFix.latitude)}, ${formatCoordinate(currentFix.longitude)}`
                      : "No browser location fix yet"}
                  </td>
                </tr>
                <tr>
                  <th>Pickup source</th>
                  <td>
                    {pickupUsesCurrentLocation
                      ? "Current location"
                      : resolvedPickup
                        ? "Manual pickup selection"
                        : "Sample pickup"}
                  </td>
                </tr>
                <tr>
                  <th>Accuracy</th>
                  <td>{currentFix ? `${Math.round(currentFix.accuracy)} m` : "--"}</td>
                </tr>
                <tr>
                  <th>Sample route</th>
                  <td>{showSampleRoute ? "Visible" : "Hidden"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {geoError ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <strong>Geolocation issue</strong>
              <p>{geoError}</p>
            </div>
          ) : null}
        </section>

        <section className="content-card">
          <h3>Isolated map surface</h3>
          <div className="map-shell" style={{ marginTop: 18, minHeight: "72vh" }}>
            <MapContainer
              key={mapSeed}
              center={activeCenter}
              zoom={requestedView.zoom}
              scrollWheelZoom
              dragging
              doubleClickZoom
              touchZoom
              boxZoom
              keyboard
              className="leaflet-map-surface"
              style={{ width: "100%", height: "100%", minHeight: "72vh" }}
            >
              <TileLayer
                attribution={tileConfig.attribution}
                url={tileConfig.url}
                tileSize={tileConfig.tileSize}
                zoomOffset={tileConfig.zoomOffset}
                eventHandlers={{
                  tileerror: (event) => {
                    setTileStats((current) => ({
                      ...current,
                      errored: current.errored + 1,
                      lastError: `Tile failed for ${String(event.coords?.x ?? "?")},${String(event.coords?.y ?? "?")} at z${String(event.coords?.z ?? "?")}`
                    }));
                    fallbackTileMode(tileMode);
                  },
                  tileload: () => {
                    setTileStats((current) => ({
                      ...current,
                      loaded: current.loaded + 1
                    }));
                  },
                  tileloadstart: () => {
                    setTileStats((current) => ({
                      ...current,
                      requested: current.requested + 1
                    }));
                  }
                }}
              />
              {activeRoute.length > 1 ? (
                <Polyline
                  positions={activeRoute}
                  pathOptions={{ color: "#111315", opacity: 0.8, weight: 5 }}
                />
              ) : null}
              {markers.map((marker) => (
                <Marker key={marker.key} position={marker.position} icon={marker.icon}>
                  <Tooltip direction="top" offset={[0, -10]} permanent>
                    {marker.label}
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>
      </div>
    </main>
  );
}
