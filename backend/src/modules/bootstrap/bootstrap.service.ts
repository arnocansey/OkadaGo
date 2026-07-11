import { prisma } from "../../common/prisma.js";
import { makeReferralCode, makeRiderCode } from "../../common/codes.js";
import { appConfig } from "../../common/config.js";
import { AppError } from "../../common/errors.js";
import {
  AccountStatus,
  PaymentMethod,
  RiderApprovalStatus,
  UserRole,
  VehicleStatus,
  WalletType
} from "../../generated/prisma/enums.js";
import type { z } from "zod";
import type {
  createPassengerSchema,
  createRiderSchema,
  createServiceZoneSchema
} from "./bootstrap.schemas.js";

type CreatePassengerInput = z.infer<typeof createPassengerSchema>;
type CreateRiderInput = z.infer<typeof createRiderSchema>;
type CreateServiceZoneInput = z.infer<typeof createServiceZoneSchema>;

type ReverseGeocodeAddress = Partial<{
  house_number: string;
  road: string;
  neighbourhood: string;
  suburb: string;
  city_district: string;
  city: string;
  town: string;
  village: string;
  county: string;
  state: string;
  country: string;
}>;

type ReverseGeocodeResponse = Partial<{
  display_name: string;
  name: string;
  address: ReverseGeocodeAddress;
}>;

type MapboxReverseFeature = {
  properties?: Partial<{
    name: string;
    full_address: string;
    place_formatted: string;
    feature_type: string;
  }>;
};

type MapboxReverseResponse = Partial<{
  features: MapboxReverseFeature[];
}>;

type ReverseGeocodeResult = {
  label: string;
  displayName: string | null;
  formattedAddress: string | null;
  shortLabel: string | null;
  latitude: number;
  longitude: number;
};

type ForwardGeocodeResult = ReverseGeocodeResult;

type NominatimSearchResponse = Array<
  Partial<{
    lat: string;
    lon: string;
    display_name: string;
    name: string;
  }>
>;

type MapboxForwardFeature = {
  geometry?: Partial<{
    coordinates: [number, number];
  }>;
  properties?: Partial<{
    name: string;
    full_address: string;
    place_formatted: string;
  }>;
};

type MapboxForwardResponse = Partial<{
  features: MapboxForwardFeature[];
}>;

type RoutePreviewResult = {
  provider: "mapbox" | "osrm";
  distanceKm: number;
  durationMinutes: number;
  route: Array<[number, number]>;
};

type RoutePreviewInput = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

type MapboxDirectionsResponse = Partial<{
  routes: Array<
    Partial<{
      distance: number;
      duration: number;
      geometry: Partial<{
        coordinates: Array<[number, number]>;
      }>;
    }>
  >;
}>;

type OsrmRouteResponse = Partial<{
  routes: Array<
    Partial<{
      distance: number;
      duration: number;
      geometry: Partial<{
        coordinates: Array<[number, number]>;
      }>;
    }>
  >;
}>;

const reverseGeocodeCache = new Map<
  string,
  {
    expiresAt: number;
    value: ReverseGeocodeResult;
  }
>();
const forwardGeocodeCache = new Map<
  string,
  {
    expiresAt: number;
    value: ForwardGeocodeResult;
  }
>();
const routePreviewCache = new Map<
  string,
  {
    expiresAt: number;
    value: RoutePreviewResult;
  }
>();
const reverseGeocodeCacheTtlMs = 24 * 60 * 60 * 1000;
const forwardGeocodeCacheTtlMs = 6 * 60 * 60 * 1000;
const routePreviewCacheTtlMs = 5 * 60 * 1000;
const reverseGeocodeMinimumIntervalMs = 1100;
let lastReverseGeocodeRequestAt = 0;
let reverseGeocodeQueue = Promise.resolve();

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function compactAddressPart(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function dedupeParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return parts.filter((part): part is string => {
    const normalized = compactAddressPart(part)?.toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

const MAPBOX_FEATURE_PRIORITY = [
  "address",
  "street",
  "neighborhood",
  "locality",
  "place",
  "district",
  "region"
] as const;

function pickMostSpecificMapboxFeature(features: MapboxReverseFeature[]) {
  for (const featureType of MAPBOX_FEATURE_PRIORITY) {
    const match = features.find(
      (feature) => feature.properties?.feature_type?.toLowerCase() === featureType
    );
    if (match) return match;
  }

  return features[0];
}

function buildShortLabelFromFormatted(formatted: string | null) {
  if (!formatted) return null;

  const parts = formatted
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(ghana|gh)$/i.test(part));

  if (parts.length >= 3) return parts.slice(1, 3).join(", ");
  if (parts.length === 2) return parts.join(", ");
  return parts[0] ?? null;
}

function buildMapboxFormattedAddress(payload: MapboxReverseResponse) {
  const feature = pickMostSpecificMapboxFeature(payload.features ?? []);
  if (!feature) return null;

  const fullAddress = compactAddressPart(feature.properties?.full_address);
  if (fullAddress) return fullAddress;

  const name = compactAddressPart(feature.properties?.name);
  const placeFormatted = compactAddressPart(feature.properties?.place_formatted);

  if (name && placeFormatted && name.toLowerCase() !== placeFormatted.toLowerCase()) {
    return `${name}, ${placeFormatted}`;
  }

  return name ?? placeFormatted ?? null;
}

function buildNominatimFormattedAddress(payload: ReverseGeocodeResponse) {
  const address = payload.address ?? {};
  const streetLine = dedupeParts([address.house_number, address.road]).join(" ");
  const parts = dedupeParts([
    streetLine || null,
    address.neighbourhood,
    address.suburb,
    address.city_district,
    address.city,
    address.town,
    address.village,
    address.state
  ]);

  if (parts.length > 0) return parts.join(", ");
  return compactAddressPart(payload.display_name);
}

function buildCurrentLocationLabel(parts: Array<string | null | undefined>) {
  const cleaned = dedupeParts(parts).slice(0, 2);
  return cleaned.length > 0 ? `Current location, ${cleaned.join(", ")}` : "Current location";
}

function buildNominatimLocationLabel(payload: ReverseGeocodeResponse) {
  const address = payload.address ?? {};
  return buildCurrentLocationLabel([
    address.neighbourhood,
    address.suburb,
    address.city_district,
    address.city,
    address.town,
    address.village,
    address.state,
    address.country
  ]);
}

function buildMapboxLocationLabel(payload: MapboxReverseResponse, formattedAddress?: string | null) {
  const shortLabel = buildShortLabelFromFormatted(formattedAddress ?? buildMapboxFormattedAddress(payload));
  if (shortLabel) {
    return buildCurrentLocationLabel(shortLabel.split(",").map((part) => part.trim()));
  }

  const features = payload.features ?? [];
  const areaFeature =
    features.find((feature) =>
      ["neighborhood", "locality", "place", "district", "region"].includes(
        feature.properties?.feature_type?.toLowerCase() ?? ""
      )
    ) ?? features[0];

  const areaName = compactAddressPart(areaFeature?.properties?.name);
  const placeFormatted = compactAddressPart(areaFeature?.properties?.place_formatted);

  if (areaName || placeFormatted) {
    return buildCurrentLocationLabel([areaName, placeFormatted]);
  }

  return "Current location";
}

function buildNominatimLocationLabelFromFormatted(formattedAddress?: string | null) {
  const shortLabel = buildShortLabelFromFormatted(formattedAddress ?? null);
  if (shortLabel) {
    return buildCurrentLocationLabel(shortLabel.split(",").map((part) => part.trim()));
  }

  return "Current location";
}

function buildDestinationLabel(parts: Array<string | null | undefined>, fallback: string) {
  const cleaned = dedupeParts(parts).slice(0, 2);
  return cleaned.length > 0 ? cleaned.join(", ") : fallback;
}

async function queueReverseGeocodeRequest<T>(task: () => Promise<T>) {
  const queuedTask = reverseGeocodeQueue.then(async () => {
    const remainingDelay = Math.max(
      0,
      reverseGeocodeMinimumIntervalMs - (Date.now() - lastReverseGeocodeRequestAt)
    );

    if (remainingDelay > 0) {
      await wait(remainingDelay);
    }

    const result = await task();
    lastReverseGeocodeRequestAt = Date.now();
    return result;
  });

  reverseGeocodeQueue = queuedTask.then(
    () => undefined,
    () => undefined
  );

  return queuedTask;
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function mapPaymentMethod(method?: CreatePassengerInput["preferredPayment"]) {
  if (!method) {
    return undefined;
  }

  return {
    cash: PaymentMethod.CASH,
    card: PaymentMethod.CARD,
    wallet: PaymentMethod.WALLET,
    mobile_money: PaymentMethod.MOBILE_MONEY
  }[method];
}

function mapApprovalStatus(status: CreateRiderInput["approvalStatus"]) {
  return {
    pending: RiderApprovalStatus.PENDING,
    approved: RiderApprovalStatus.APPROVED,
    rejected: RiderApprovalStatus.REJECTED,
    suspended: RiderApprovalStatus.SUSPENDED
  }[status];
}

const PLACES_API_V1 = "https://places.googleapis.com/v1";
const LEGACY_PLACES_API = "https://maps.googleapis.com/maps/api/place";
const NEARBY_RADIUS_M = 5000;

const PLACES_CATEGORY_SEARCH_TYPES: Record<string, string[]> = {
  "fast-food": ["meal_takeaway", "restaurant"],
  local: ["restaurant"],
  groceries: ["supermarket", "grocery_or_supermarket"],
  healthy: ["restaurant"],
  drinks: ["cafe", "bar"],
  desserts: ["bakery", "cafe"]
};

const PLACES_ALL_SEARCH_TYPES = [
  "restaurant",
  "supermarket",
  "cafe",
  "meal_takeaway",
  "bakery",
  "grocery_or_supermarket"
];

/** Legacy-only types mapped to Places API (New) Table A equivalents. */
const LEGACY_TO_NEW_PLACES_TYPES: Record<string, string[]> = {
  grocery_or_supermarket: ["supermarket", "grocery_store"]
};

type PlacesApiFailure = {
  api: "new" | "legacy";
  status: string;
  googleMessage?: string;
  httpStatus?: number;
};

/** Field mask for Nearby Search (New) — maps to legacy `GooglePlaceResult` shape. */
const PLACES_NEARBY_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.types",
  "places.currentOpeningHours",
  "places.photos",
  "places.businessStatus"
].join(",");

/** Field mask for Place Details (New) — maps to `PlaceDetailsResult`. */
const PLACES_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "types",
  "nationalPhoneNumber",
  "currentOpeningHours",
  "regularOpeningHours",
  "photos",
  "businessStatus"
].join(",");

type GooglePlaceResult = {
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

type PlacesApiNewPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  types?: string[];
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: Array<{ name?: string }>;
  businessStatus?: string;
  nationalPhoneNumber?: string;
};

type PlacesApiNewError = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type LegacyPlacesResponse = {
  status: string;
  error_message?: string;
  results?: GooglePlaceResult[];
  result?: GooglePlaceResult & {
    formatted_phone_number?: string;
    opening_hours?: { open_now?: boolean; weekday_text?: string[] };
  };
};

export type PlaceDetailsResult = {
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGooglePlacesApiKey() {
  const apiKey = appConfig.googlePlacesApiKey;
  if (!apiKey) {
    throw new AppError(
      "Google Places API key is not configured on the server. Set GOOGLE_PLACES_API_KEY in backend .env (or Render environment) and redeploy.",
      503,
      "PLACES_NOT_CONFIGURED",
      {
        suggestion:
          "Add GOOGLE_PLACES_API_KEY to your backend host (e.g. Render → Environment). Do not rely on mobile EXPO_PUBLIC_* keys — Places runs server-side."
      }
    );
  }
  return apiKey;
}

function toNewApiSearchTypes(types: string[]) {
  const mapped = types.flatMap((type) => LEGACY_TO_NEW_PLACES_TYPES[type] ?? [type]);
  return [...new Set(mapped)];
}

function placesApiErrorMessage(status: string, errorMessage?: string) {
  if (status === "REQUEST_DENIED" || status === "PERMISSION_DENIED") {
    return (
      "Google Places API access denied. Enable Places API (New) and/or legacy Places API " +
      "for your server API key (GOOGLE_PLACES_API_KEY) in Google Cloud Console, ensure billing is enabled, then restart the backend."
    );
  }
  if (status === "OVER_QUERY_LIMIT" || status === "RESOURCE_EXHAUSTED") {
    return "Google Places quota exceeded. Try again later or check billing in Google Cloud Console.";
  }
  if (status === "INVALID_REQUEST" || status === "INVALID_ARGUMENT") {
    return errorMessage ?? "Invalid Places API request.";
  }
  if (status === "ZERO_RESULTS") {
    return "";
  }
  return errorMessage ?? `Places API error: ${status}`;
}

function normalizePlacesApiStatus(status?: string) {
  if (!status) return "UNKNOWN";
  if (status === "PERMISSION_DENIED") return "REQUEST_DENIED";
  if (status === "RESOURCE_EXHAUSTED") return "OVER_QUERY_LIMIT";
  if (status === "INVALID_ARGUMENT") return "INVALID_REQUEST";
  return status;
}

function stripPlaceResourceId(id: string) {
  return id.startsWith("places/") ? id.slice("places/".length) : id;
}

function toPlaceResourceId(placeId: string) {
  return placeId.startsWith("places/") ? placeId : `places/${placeId}`;
}

function mapNewPlaceToGooglePlaceResult(place: PlacesApiNewPlace): GooglePlaceResult | null {
  if (!place.id || !place.displayName?.text || !place.location) {
    return null;
  }

  const latitude = place.location.latitude;
  const longitude = place.location.longitude;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    place_id: stripPlaceResourceId(place.id),
    name: place.displayName.text,
    vicinity: place.shortFormattedAddress,
    formatted_address: place.formattedAddress,
    geometry: { location: { lat: latitude, lng: longitude } },
    rating: place.rating,
    types: place.types,
    opening_hours:
      place.currentOpeningHours?.openNow == null
        ? undefined
        : { open_now: place.currentOpeningHours.openNow },
    photos: place.photos
      ?.filter((photo) => Boolean(photo.name))
      .map((photo) => ({ photo_reference: photo.name! })),
    business_status: place.businessStatus
  };
}

async function readPlacesApiError(response: Response): Promise<PlacesApiNewError> {
  try {
    return (await response.json()) as PlacesApiNewError;
  } catch {
    return {};
  }
}

function throwPlacesApiError(
  status: string,
  errorMessage?: string,
  extras?: { api?: "new" | "legacy"; httpStatus?: number }
) {
  const normalizedStatus = normalizePlacesApiStatus(status);
  const message = placesApiErrorMessage(normalizedStatus, errorMessage);
  if (message) {
    throw new AppError(message, 502, "PLACES_API_ERROR", {
      status: normalizedStatus,
      api: extras?.api ?? "legacy",
      googleMessage: errorMessage,
      httpStatus: extras?.httpStatus
    });
  }
}

function extractPlacesApiFailure(api: "new" | "legacy", error: unknown): PlacesApiFailure {
  if (error instanceof AppError) {
    const details = error.details as
      | { status?: string; googleMessage?: string; httpStatus?: number }
      | undefined;
    return {
      api,
      status: details?.status ?? "UNKNOWN",
      googleMessage: details?.googleMessage ?? error.message,
      httpStatus: details?.httpStatus
    };
  }

  return {
    api,
    status: "UNKNOWN",
    googleMessage: error instanceof Error ? error.message : String(error)
  };
}

function logPlacesApiFailure(operation: string, failure: PlacesApiFailure) {
  console.warn(`[places] ${operation}: ${failure.api} API failed`, {
    status: failure.status,
    httpStatus: failure.httpStatus,
    googleMessage: failure.googleMessage
  });
}

const PLACES_API_SETUP_SUGGESTION =
  "In Google Cloud Console: enable billing, enable Places API (New), optionally enable legacy Places API for fallback. " +
  "Create a server API key (Application restrictions = None; API restrictions = Places API (New) + Places API). " +
  "Set GOOGLE_PLACES_API_KEY on Render/backend .env and redeploy — not the mobile Maps SDK keys.";

function throwCombinedPlacesApiError(
  operation: string,
  primary: PlacesApiFailure,
  fallback: PlacesApiFailure
): never {
  logPlacesApiFailure(operation, primary);
  logPlacesApiFailure(operation, fallback);

  const formatAttempt = (attempt: PlacesApiFailure) => {
    const detail = attempt.googleMessage ? `: ${attempt.googleMessage}` : "";
    const http = attempt.httpStatus ? ` HTTP ${attempt.httpStatus}` : "";
    return `${attempt.api}=${attempt.status}${http}${detail}`;
  };

  throw new AppError(
    `Places search failed. ${formatAttempt(primary)}; ${formatAttempt(fallback)}.`,
    502,
    "PLACES_API_ERROR",
    {
      attempts: [primary, fallback],
      suggestion: PLACES_API_SETUP_SUGGESTION
    }
  );
}

function searchTypesForCategory(categoryId?: string | null, type?: string | null) {
  if (type) return [type];
  if (!categoryId) return PLACES_ALL_SEARCH_TYPES;
  return PLACES_CATEGORY_SEARCH_TYPES[categoryId] ?? ["restaurant"];
}

async function nearbySearchNew(
  latitude: number,
  longitude: number,
  includedTypes: string[],
  apiKey: string
): Promise<GooglePlaceResult[]> {
  const response = await fetch(`${PLACES_API_V1}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_NEARBY_FIELD_MASK
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      languageCode: "en",
      regionCode: "GH",
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: NEARBY_RADIUS_M
        }
      }
    })
  });

  if (!response.ok) {
    const payload = await readPlacesApiError(response);
    const status = payload.error?.status ?? `HTTP_${response.status}`;
    throwPlacesApiError(status, payload.error?.message ?? `Places API HTTP ${response.status}`, {
      api: "new",
      httpStatus: response.status
    });
  }

  const data = (await response.json()) as { places?: PlacesApiNewPlace[] };
  return (data.places ?? [])
    .map(mapNewPlaceToGooglePlaceResult)
    .filter((place): place is GooglePlaceResult => place != null)
    .filter((place) => place.business_status !== "CLOSED_PERMANENTLY");
}

async function nearbySearchLegacy(
  latitude: number,
  longitude: number,
  includedTypes: string[],
  apiKey: string
): Promise<GooglePlaceResult[]> {
  const byId = new Map<string, GooglePlaceResult>();

  for (const type of includedTypes) {
    const url = new URL(`${LEGACY_PLACES_API}/nearbysearch/json`);
    url.searchParams.set("location", `${latitude},${longitude}`);
    url.searchParams.set("radius", `${NEARBY_RADIUS_M}`);
    url.searchParams.set("type", type);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    const data = (await response.json()) as LegacyPlacesResponse;

    if (data.status === "ZERO_RESULTS") {
      continue;
    }

    if (data.status !== "OK") {
      throwPlacesApiError(data.status, data.error_message, { api: "legacy" });
    }

    for (const place of data.results ?? []) {
      if (place.business_status === "CLOSED_PERMANENTLY" || byId.has(place.place_id)) {
        continue;
      }
      byId.set(place.place_id, place);
    }
  }

  return Array.from(byId.values());
}

async function nearbySearch(
  latitude: number,
  longitude: number,
  includedTypes: string[],
  apiKey: string
): Promise<GooglePlaceResult[]> {
  try {
    return await nearbySearchNew(
      latitude,
      longitude,
      toNewApiSearchTypes(includedTypes),
      apiKey
    );
  } catch (primaryError) {
    const primaryFailure = extractPlacesApiFailure("new", primaryError);
    logPlacesApiFailure("nearbySearch", primaryFailure);
    console.warn("[places] nearbySearch: falling back to legacy Places API");

    try {
      return await nearbySearchLegacy(latitude, longitude, includedTypes, apiKey);
    } catch (fallbackError) {
      throwCombinedPlacesApiError(
        "nearbySearch",
        primaryFailure,
        extractPlacesApiFailure("legacy", fallbackError)
      );
    }
  }
}

async function placeDetailsNew(placeId: string, apiKey: string): Promise<PlaceDetailsResult> {
  const resourceId = toPlaceResourceId(placeId);

  const response = await fetch(`${PLACES_API_V1}/${resourceId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_DETAILS_FIELD_MASK
    }
  });

  if (!response.ok) {
    const payload = await readPlacesApiError(response);
    const status = payload.error?.status ?? `HTTP_${response.status}`;
    throwPlacesApiError(status, payload.error?.message ?? `Place Details HTTP ${response.status}`, {
      api: "new",
      httpStatus: response.status
    });
  }

  const place = (await response.json()) as PlacesApiNewPlace;
  const mapped = mapNewPlaceToGooglePlaceResult(place);
  if (!mapped) {
    throw new AppError("Could not load place details.", 502, "PLACES_API_ERROR");
  }

  return {
    placeId: mapped.place_id,
    name: mapped.name,
    address: mapped.formatted_address ?? mapped.vicinity ?? "",
    latitude: mapped.geometry.location.lat,
    longitude: mapped.geometry.location.lng,
    rating: mapped.rating ?? 0,
    types: mapped.types ?? [],
    phone: place.nationalPhoneNumber,
    openNow: mapped.opening_hours?.open_now,
    weekdayText: place.regularOpeningHours?.weekdayDescriptions,
    photoReference: mapped.photos?.[0]?.photo_reference
  };
}

async function placeDetailsLegacy(placeId: string, apiKey: string): Promise<PlaceDetailsResult> {
  const url = new URL(`${LEGACY_PLACES_API}/details/json`);
  url.searchParams.set("place_id", stripPlaceResourceId(placeId));
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,geometry,rating,types,formatted_phone_number,opening_hours,photos,business_status"
  );
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const data = (await response.json()) as LegacyPlacesResponse;

  if (data.status !== "OK" || !data.result) {
    throwPlacesApiError(data.status, data.error_message, { api: "legacy" });
    throw new AppError("Could not load place details.", 502, "PLACES_API_ERROR");
  }

  const place = data.result;
  if (!place.geometry?.location) {
    throw new AppError("Could not load place details.", 502, "PLACES_API_ERROR");
  }

  return {
    placeId: place.place_id,
    name: place.name,
    address: place.formatted_address ?? "",
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    rating: place.rating ?? 0,
    types: place.types ?? [],
    phone: place.formatted_phone_number,
    openNow: place.opening_hours?.open_now,
    weekdayText: place.opening_hours?.weekday_text,
    photoReference: place.photos?.[0]?.photo_reference
  };
}

async function placeDetailsWithFallback(placeId: string, apiKey: string): Promise<PlaceDetailsResult> {
  try {
    return await placeDetailsNew(placeId, apiKey);
  } catch (primaryError) {
    const primaryFailure = extractPlacesApiFailure("new", primaryError);
    logPlacesApiFailure("placeDetails", primaryFailure);
    console.warn("[places] placeDetails: falling back to legacy Places API");

    try {
      return await placeDetailsLegacy(placeId, apiKey);
    } catch (fallbackError) {
      throwCombinedPlacesApiError(
        "placeDetails",
        primaryFailure,
        extractPlacesApiFailure("legacy", fallbackError)
      );
    }
  }
}

export type PlaceSuggestionResult = {
  placeId: string;
  name: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
};

const AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat";

async function suggestPlacesNew(
  query: string,
  proximity: { latitude: number; longitude: number } | null,
  apiKey: string
): Promise<PlaceSuggestionResult[]> {
  const response = await fetch(`${PLACES_API_V1}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": AUTOCOMPLETE_FIELD_MASK
    },
    body: JSON.stringify({
      input: query,
      languageCode: "en",
      includedRegionCodes: ["gh"],
      ...(proximity
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: proximity.latitude,
                  longitude: proximity.longitude
                },
                radius: 50000
              }
            }
          }
        : {})
    })
  });

  if (!response.ok) {
    const payload = await readPlacesApiError(response);
    const status = payload.error?.status ?? `HTTP_${response.status}`;
    throwPlacesApiError(status, payload.error?.message ?? `Autocomplete HTTP ${response.status}`, {
      api: "new",
      httpStatus: response.status
    });
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
  };

  return (payload.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction) => Boolean(prediction?.placeId))
    .slice(0, 5)
    .map((prediction) => ({
      placeId: prediction!.placeId!,
      name:
        prediction!.structuredFormat?.mainText?.text?.trim() ||
        prediction!.text?.text?.trim() ||
        query,
      fullAddress:
        prediction!.text?.text?.trim() ||
        [
          prediction!.structuredFormat?.mainText?.text?.trim(),
          prediction!.structuredFormat?.secondaryText?.text?.trim()
        ]
          .filter(Boolean)
          .join(", ") ||
        query
    }));
}

async function suggestPlacesLegacy(
  query: string,
  proximity: { latitude: number; longitude: number } | null,
  apiKey: string
): Promise<PlaceSuggestionResult[]> {
  const url = new URL(`${LEGACY_PLACES_API}/autocomplete/json`);
  url.searchParams.set("input", query);
  url.searchParams.set("components", "country:gh");
  url.searchParams.set("key", apiKey);

  if (proximity) {
    url.searchParams.set("location", `${proximity.latitude},${proximity.longitude}`);
    url.searchParams.set("radius", "50000");
  }

  const response = await fetch(url);
  const data = (await response.json()) as LegacyPlacesResponse & {
    predictions?: Array<{
      place_id?: string;
      description?: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throwPlacesApiError(data.status, data.error_message, { api: "legacy" });
  }

  return (data.predictions ?? [])
    .filter((prediction) => Boolean(prediction.place_id))
    .slice(0, 5)
    .map((prediction) => ({
      placeId: prediction.place_id!,
      name:
        prediction.structured_formatting?.main_text?.trim() ||
        prediction.description?.trim() ||
        query,
      fullAddress:
        prediction.description?.trim() ||
        [
          prediction.structured_formatting?.main_text?.trim(),
          prediction.structured_formatting?.secondary_text?.trim()
        ]
          .filter(Boolean)
          .join(", ") ||
        query
    }));
}

async function suggestPlacesWithGoogle(
  query: string,
  proximity: { latitude: number; longitude: number } | null,
  apiKey: string
): Promise<PlaceSuggestionResult[]> {
  try {
    return await suggestPlacesNew(query, proximity, apiKey);
  } catch (primaryError) {
    const primaryFailure = extractPlacesApiFailure("new", primaryError);
    logPlacesApiFailure("autocomplete", primaryFailure);
    console.warn("[places] autocomplete: falling back to legacy Places API");

    try {
      return await suggestPlacesLegacy(query, proximity, apiKey);
    } catch (fallbackError) {
      throwCombinedPlacesApiError(
        "autocomplete",
        primaryFailure,
        extractPlacesApiFailure("legacy", fallbackError)
      );
    }
  }
}

async function suggestPlacesMapbox(
  query: string,
  proximity: { latitude: number; longitude: number } | null
): Promise<PlaceSuggestionResult[]> {
  if (!appConfig.mapboxAccessToken) {
    return [];
  }

  const mapboxUrl = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  mapboxUrl.searchParams.set("q", query);
  mapboxUrl.searchParams.set("access_token", appConfig.mapboxAccessToken);
  mapboxUrl.searchParams.set("country", "gh");
  mapboxUrl.searchParams.set("language", "en");
  mapboxUrl.searchParams.set("limit", "5");
  mapboxUrl.searchParams.set(
    "types",
    "address,street,neighborhood,locality,place,district,region"
  );

  if (proximity) {
    mapboxUrl.searchParams.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  } else {
    mapboxUrl.searchParams.set("proximity", "-0.187,5.6037");
  }

  const response = await fetch(mapboxUrl, {
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as MapboxForwardResponse;

  return (payload.features ?? [])
    .slice(0, 5)
    .map((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      const formattedAddress =
        compactAddressPart(feature.properties?.full_address) ??
        compactAddressPart(feature.properties?.place_formatted) ??
        compactAddressPart(feature.properties?.name) ??
        query;

      return {
        placeId: `mapbox:${index}:${coordinates?.join(",") ?? query}`,
        name:
          compactAddressPart(feature.properties?.name) ??
          buildDestinationLabel(
            [
              compactAddressPart(feature.properties?.name),
              compactAddressPart(feature.properties?.place_formatted),
              formattedAddress
            ],
            query
          ),
        fullAddress: formattedAddress,
        latitude: coordinates?.[1],
        longitude: coordinates?.[0]
      } satisfies PlaceSuggestionResult;
    })
    .filter((item) => typeof item.latitude === "number" && typeof item.longitude === "number");
}

async function suggestPlacesNominatim(
  query: string
): Promise<PlaceSuggestionResult[]> {
  const requestUrl = new URL(`${appConfig.geocodingBaseUrl}/search`);
  requestUrl.searchParams.set("format", "jsonv2");
  requestUrl.searchParams.set("q", query);
  requestUrl.searchParams.set("countrycodes", "gh");
  requestUrl.searchParams.set("limit", "5");
  requestUrl.searchParams.set("accept-language", "en");

  if (appConfig.geocodingContactEmail) {
    requestUrl.searchParams.set("email", appConfig.geocodingContactEmail);
  }

  const response = await fetch(requestUrl, {
    headers: {
      "User-Agent": appConfig.geocodingUserAgent,
      Referer: appConfig.appWebUrl
    }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as NominatimSearchResponse;

  return payload
    .filter((item) => item.lat && item.lon)
    .slice(0, 5)
    .map((item, index) => {
      const formattedAddress = compactAddressPart(item.display_name) ?? query;
      return {
        placeId: `nominatim:${index}:${item.lat},${item.lon}`,
        name:
          compactAddressPart(item.name) ??
          buildDestinationLabel(
            [
              compactAddressPart(item.name),
              ...((item.display_name ?? "")
                .split(",")
                .map((part) => compactAddressPart(part))
                .slice(0, 2) as Array<string | null>)
            ],
            query
          ),
        fullAddress: formattedAddress,
        latitude: Number(item.lat),
        longitude: Number(item.lon)
      } satisfies PlaceSuggestionResult;
    });
}

export class BootstrapService {
  async listPassengers(limit = 25) {
    const where = {
      user: {
        role: UserRole.PASSENGER,
        deletedAt: null
      }
    };
    const [data, total] = await Promise.all([
      prisma.passengerProfile.findMany({
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: { user: true }
      }),
      prisma.passengerProfile.count({ where })
    ]);
    return { data, total };
  }

  async listRiders(limit = 25) {
    const where = {
      user: {
        deletedAt: null
      }
    };
    const [data, total] = await Promise.all([
      prisma.riderProfile.findMany({
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: { user: true, serviceZone: true, vehicle: true }
      }),
      prisma.riderProfile.count({ where })
    ]);
    return { data, total };
  }

  async listServiceZones(limit = 25) {
    return prisma.serviceZone.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async createPassenger(input: CreatePassengerInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: UserRole.PASSENGER,
          accountStatus: AccountStatus.ACTIVE,
          fullName: input.fullName,
          email: input.email,
          phoneCountryCode: input.phoneCountryCode,
          phoneLocal: input.phoneLocal,
          phoneE164: input.phoneE164,
          preferredCurrency: input.preferredCurrency,
          isPhoneVerified: true,
          passengerProfile: {
            create: {
              referralCode: makeReferralCode(),
              defaultServiceCity: input.defaultServiceCity,
              preferredPayment: mapPaymentMethod(input.preferredPayment)
            }
          },
          wallets: {
            create: [
              {
                type: WalletType.PASSENGER_CASHLESS,
                currency: input.preferredCurrency
              },
              {
                type: WalletType.PROMO_CREDIT,
                currency: input.preferredCurrency
              }
            ]
          }
        },
        include: {
          passengerProfile: true,
          wallets: true
        }
      });

      return user;
    });
  }

  async createRider(input: CreateRiderInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: UserRole.RIDER,
          accountStatus: AccountStatus.ACTIVE,
          fullName: input.fullName,
          email: input.email,
          phoneCountryCode: input.phoneCountryCode,
          phoneLocal: input.phoneLocal,
          phoneE164: input.phoneE164,
          preferredCurrency: input.preferredCurrency,
          isPhoneVerified: true,
          riderProfile: {
            create: {
              displayCode: makeRiderCode(),
              approvalStatus: mapApprovalStatus(input.approvalStatus),
              city: input.city,
              serviceZoneId: input.serviceZoneId,
              commissionPercent: input.commissionPercent,
              approvedAt: input.approvalStatus === "approved" ? new Date() : undefined,
              vehicle: input.vehicle
                ? {
                    create: {
                      make: input.vehicle.make,
                      model: input.vehicle.model,
                      plateNumber: input.vehicle.plateNumber,
                      color: input.vehicle.color,
                      year: input.vehicle.year,
                      status: VehicleStatus.ACTIVE
                    }
                  }
                : undefined
            }
          },
          wallets: {
            create: [
              {
                type: WalletType.RIDER_SETTLEMENT,
                currency: input.preferredCurrency
              },
              {
                type: WalletType.RIDER_BONUS,
                currency: input.preferredCurrency
              }
            ]
          }
        },
        include: {
          riderProfile: {
            include: {
              vehicle: true
            }
          },
          wallets: true
        }
      });

      return user;
    });
  }

  async createServiceZone(input: CreateServiceZoneInput) {
    return prisma.serviceZone.create({
      data: {
        name: input.name,
        city: input.city,
        countryCode: input.countryCode,
        currency: input.currency,
        polygonGeoJson: input.polygonGeoJson as never,
        baseFare: input.baseFare,
        perKmFee: input.perKmFee,
        perMinuteFee: input.perMinuteFee,
        minimumFare: input.minimumFare,
        cancellationFee: input.cancellationFee,
        waitingFeePerMin: input.waitingFeePerMin
      }
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    const cacheKey = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    const cached = reverseGeocodeCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const result = await queueReverseGeocodeRequest(async () => {
      let label = "Current location";
      let formattedAddress: string | null = null;

      if (appConfig.mapboxAccessToken) {
        const mapboxUrl = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
        mapboxUrl.searchParams.set("longitude", `${longitude}`);
        mapboxUrl.searchParams.set("latitude", `${latitude}`);
        mapboxUrl.searchParams.set("access_token", appConfig.mapboxAccessToken);
        mapboxUrl.searchParams.set("country", "gh");
        mapboxUrl.searchParams.set("language", "en");
        mapboxUrl.searchParams.set(
          "types",
          "address,street,neighborhood,locality,place,district,region"
        );

        const mapboxResponse = await fetch(mapboxUrl, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (mapboxResponse.ok) {
          const payload = (await mapboxResponse.json()) as MapboxReverseResponse;
          formattedAddress = buildMapboxFormattedAddress(payload);
          label = buildMapboxLocationLabel(payload, formattedAddress);
        }
      }

      if (!formattedAddress) {
        const requestUrl = new URL(`${appConfig.geocodingBaseUrl}/reverse`);
        requestUrl.searchParams.set("format", "jsonv2");
        requestUrl.searchParams.set("lat", `${latitude}`);
        requestUrl.searchParams.set("lon", `${longitude}`);
        requestUrl.searchParams.set("addressdetails", "1");
        requestUrl.searchParams.set("zoom", "18");
        requestUrl.searchParams.set("accept-language", "en");

        if (appConfig.geocodingContactEmail) {
          requestUrl.searchParams.set("email", appConfig.geocodingContactEmail);
        }

        const response = await fetch(requestUrl, {
          headers: {
            "User-Agent": appConfig.geocodingUserAgent,
            Referer: appConfig.appWebUrl
          }
        });

        if (!response.ok) {
          throw new Error(`Reverse geocoding failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as ReverseGeocodeResponse;
        formattedAddress = buildNominatimFormattedAddress(payload);
        label = buildNominatimLocationLabelFromFormatted(formattedAddress);
        if (label === "Current location") {
          label = buildNominatimLocationLabel(payload);
        }
      }

      const shortLabel = buildShortLabelFromFormatted(formattedAddress);

      return {
        label,
        displayName: formattedAddress,
        formattedAddress,
        shortLabel,
        latitude,
        longitude
      };
    });

    reverseGeocodeCache.set(cacheKey, {
      expiresAt: Date.now() + reverseGeocodeCacheTtlMs,
      value: result
    });

    return result;
  }

  async forwardGeocode(query: string): Promise<ForwardGeocodeResult> {
    const normalizedQuery = query.trim();
    const cacheKey = normalizedQuery.toLowerCase();
    const cached = forwardGeocodeCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const result = await queueReverseGeocodeRequest(async () => {
      if (appConfig.mapboxAccessToken) {
        const mapboxUrl = new URL("https://api.mapbox.com/search/geocode/v6/forward");
        mapboxUrl.searchParams.set("q", normalizedQuery);
        mapboxUrl.searchParams.set("access_token", appConfig.mapboxAccessToken);
        mapboxUrl.searchParams.set("country", "gh");
        mapboxUrl.searchParams.set("language", "en");
        mapboxUrl.searchParams.set("limit", "1");
        mapboxUrl.searchParams.set(
          "types",
          "address,street,neighborhood,locality,place,district,region"
        );
        mapboxUrl.searchParams.set("proximity", "-0.187,5.6037");

        const mapboxResponse = await fetch(mapboxUrl, {
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (mapboxResponse.ok) {
          const payload = (await mapboxResponse.json()) as MapboxForwardResponse;
          const feature = payload.features?.[0];
          const coordinates = feature?.geometry?.coordinates;

          if (coordinates) {
            const formattedAddress =
              compactAddressPart(feature.properties?.full_address) ??
              compactAddressPart(feature.properties?.place_formatted) ??
              compactAddressPart(feature.properties?.name) ??
              normalizedQuery;

            const result = {
              label: buildDestinationLabel(
                [
                  compactAddressPart(feature.properties?.name),
                  compactAddressPart(feature.properties?.place_formatted),
                  formattedAddress
                ],
                normalizedQuery
              ),
              displayName: formattedAddress,
              formattedAddress,
              shortLabel: buildShortLabelFromFormatted(formattedAddress),
              latitude: coordinates[1],
              longitude: coordinates[0]
            } satisfies ForwardGeocodeResult;

            return result;
          }
        }
      }

      const requestUrl = new URL(`${appConfig.geocodingBaseUrl}/search`);
      requestUrl.searchParams.set("format", "jsonv2");
      requestUrl.searchParams.set("q", normalizedQuery);
      requestUrl.searchParams.set("countrycodes", "gh");
      requestUrl.searchParams.set("limit", "1");
      requestUrl.searchParams.set("accept-language", "en");

      if (appConfig.geocodingContactEmail) {
        requestUrl.searchParams.set("email", appConfig.geocodingContactEmail);
      }

      const response = await fetch(requestUrl, {
        headers: {
          "User-Agent": appConfig.geocodingUserAgent,
          Referer: appConfig.appWebUrl
        }
      });

      if (!response.ok) {
        throw new Error(`Forward geocoding failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as NominatimSearchResponse;
      const firstResult = payload[0];

      if (!firstResult?.lat || !firstResult.lon) {
        throw new Error("Location could not be resolved.");
      }

      return {
        label: buildDestinationLabel(
          [
            compactAddressPart(firstResult.name),
            ...((firstResult.display_name ?? "")
              .split(",")
              .map((part) => compactAddressPart(part))
              .slice(0, 3) as Array<string | null>)
          ],
          normalizedQuery
        ),
        displayName: compactAddressPart(firstResult.display_name) ?? normalizedQuery,
        formattedAddress: compactAddressPart(firstResult.display_name) ?? normalizedQuery,
        shortLabel: buildShortLabelFromFormatted(
          compactAddressPart(firstResult.display_name) ?? normalizedQuery
        ),
        latitude: Number(firstResult.lat),
        longitude: Number(firstResult.lon)
      } satisfies ForwardGeocodeResult;
    });

    forwardGeocodeCache.set(cacheKey, {
      expiresAt: Date.now() + forwardGeocodeCacheTtlMs,
      value: result
    });

    return result;
  }

  async routePreview(input: RoutePreviewInput): Promise<RoutePreviewResult> {
    const cacheKey = [
      input.startLatitude.toFixed(5),
      input.startLongitude.toFixed(5),
      input.endLatitude.toFixed(5),
      input.endLongitude.toFixed(5)
    ].join(":");
    const cached = routePreviewCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    let result: RoutePreviewResult | null = null;

    if (appConfig.mapboxAccessToken) {
      const mapboxUrl = new URL(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${input.startLongitude},${input.startLatitude};${input.endLongitude},${input.endLatitude}`
      );
      mapboxUrl.searchParams.set("access_token", appConfig.mapboxAccessToken);
      mapboxUrl.searchParams.set("overview", "full");
      mapboxUrl.searchParams.set("geometries", "geojson");
      mapboxUrl.searchParams.set("alternatives", "false");
      mapboxUrl.searchParams.set("steps", "false");

      const mapboxResponse = await fetch(mapboxUrl, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (mapboxResponse.ok) {
        const payload = (await mapboxResponse.json()) as MapboxDirectionsResponse;
        const route = payload.routes?.[0];
        const geometry = route?.geometry?.coordinates;

        if (geometry && geometry.length > 1 && typeof route.distance === "number" && typeof route.duration === "number") {
          result = {
            provider: "mapbox",
            distanceKm: round(route.distance / 1000),
            durationMinutes: Math.max(1, Math.round(route.duration / 60)),
            route: geometry.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
          };
        }
      }
    }

    if (!result) {
      const osrmUrl = new URL(
        `https://router.project-osrm.org/route/v1/driving/${input.startLongitude},${input.startLatitude};${input.endLongitude},${input.endLatitude}`
      );
      osrmUrl.searchParams.set("overview", "full");
      osrmUrl.searchParams.set("geometries", "geojson");

      const osrmResponse = await fetch(osrmUrl);

      if (!osrmResponse.ok) {
        throw new Error(`Route preview failed with status ${osrmResponse.status}.`);
      }

      const payload = (await osrmResponse.json()) as OsrmRouteResponse;
      const route = payload.routes?.[0];
      const geometry = route?.geometry?.coordinates;

      if (!geometry || geometry.length < 2 || typeof route.distance !== "number" || typeof route.duration !== "number") {
        throw new Error("Route preview is unavailable for this trip.");
      }

      result = {
        provider: "osrm",
        distanceKm: round(route.distance / 1000),
        durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        route: geometry.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
      };
    }

    routePreviewCache.set(cacheKey, {
      expiresAt: Date.now() + routePreviewCacheTtlMs,
      value: result
    });

    return result;
  }

  async autocompletePlaces(input: {
    query: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ suggestions: PlaceSuggestionResult[] }> {
    const normalizedQuery = input.query.trim();
    const proximity =
      typeof input.latitude === "number" && typeof input.longitude === "number"
        ? { latitude: input.latitude, longitude: input.longitude }
        : null;

    let suggestions: PlaceSuggestionResult[] = [];

    try {
      const apiKey = getGooglePlacesApiKey();
      suggestions = await suggestPlacesWithGoogle(normalizedQuery, proximity, apiKey);
    } catch (error) {
      if (error instanceof AppError && error.code === "PLACES_NOT_CONFIGURED") {
        suggestions = [];
      } else {
        console.warn("[places] autocomplete: Google Places unavailable, using geocoding fallback");
      }
    }

    if (suggestions.length === 0) {
      suggestions = await suggestPlacesMapbox(normalizedQuery, proximity);
    }

    if (suggestions.length === 0) {
      suggestions = await suggestPlacesNominatim(normalizedQuery);
    }

    return { suggestions };
  }

  async nearbyPlaces(input: {
    latitude: number;
    longitude: number;
    categoryId?: string;
    type?: string;
  }): Promise<{ results: GooglePlaceResult[] }> {
    const apiKey = getGooglePlacesApiKey();
    const types = searchTypesForCategory(input.categoryId, input.type);
    const batch = await nearbySearch(input.latitude, input.longitude, types, apiKey);

    const byId = new Map<string, GooglePlaceResult>();
    for (const place of batch) {
      if (!byId.has(place.place_id)) {
        byId.set(place.place_id, place);
      }
    }

    const results = Array.from(byId.values()).sort((a, b) => {
      const distA = haversineKm(
        input.latitude,
        input.longitude,
        a.geometry.location.lat,
        a.geometry.location.lng
      );
      const distB = haversineKm(
        input.latitude,
        input.longitude,
        b.geometry.location.lat,
        b.geometry.location.lng
      );
      return distA - distB;
    });

    return { results };
  }

  async placeDetails(placeId: string): Promise<PlaceDetailsResult> {
    const apiKey = getGooglePlacesApiKey();
    return placeDetailsWithFallback(placeId, apiKey);
  }

  placePhotoUrl(photoReference: string, maxWidth = 400) {
    const apiKey = getGooglePlacesApiKey();
    if (photoReference.startsWith("places/")) {
      const params = new URLSearchParams({
        maxWidthPx: `${maxWidth}`,
        key: apiKey
      });
      return `${PLACES_API_V1}/${photoReference}/media?${params.toString()}`;
    }

    const params = new URLSearchParams({
      maxwidth: `${maxWidth}`,
      photoreference: photoReference,
      key: apiKey
    });
    return `${LEGACY_PLACES_API}/photo?${params.toString()}`;
  }
}
