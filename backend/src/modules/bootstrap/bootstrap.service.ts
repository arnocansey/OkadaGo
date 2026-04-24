import { prisma } from "../../common/prisma.js";
import { makeReferralCode, makeRiderCode } from "../../common/codes.js";
import { appConfig } from "../../common/config.js";
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

function buildMapboxLocationLabel(payload: MapboxReverseResponse) {
  const features = payload.features ?? [];
  const areaFeature =
    features.find((feature) =>
      ["neighborhood", "locality", "place", "district", "region"].includes(
        feature.properties?.feature_type?.toLowerCase() ?? ""
      )
    ) ?? features[0];

  const areaName = compactAddressPart(areaFeature?.properties?.name);
  const placeFormatted = compactAddressPart(areaFeature?.properties?.place_formatted);
  const fullAddress = compactAddressPart(areaFeature?.properties?.full_address);

  if (areaName || placeFormatted) {
    return buildCurrentLocationLabel([areaName, placeFormatted]);
  }

  if (fullAddress) {
    const parts = fullAddress.split(",").map((part) => part.trim());
    return buildCurrentLocationLabel(parts.slice(0, 2));
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

export class BootstrapService {
  async listPassengers(limit = 25) {
    return prisma.passengerProfile.findMany({
      take: limit,
      where: {
        user: {
          role: UserRole.PASSENGER,
          deletedAt: null
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: true
      }
    });
  }

  async listRiders(limit = 25) {
    return prisma.riderProfile.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: true,
        serviceZone: true,
        vehicle: true
      }
    });
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
      let displayName: string | null = null;

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
          label = buildMapboxLocationLabel(payload);
          displayName =
            compactAddressPart(payload.features?.[0]?.properties?.full_address) ??
            compactAddressPart(payload.features?.[0]?.properties?.place_formatted) ??
            compactAddressPart(payload.features?.[0]?.properties?.name) ??
            null;
        }
      }

      if (!displayName) {
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
        label = buildNominatimLocationLabel(payload);
        displayName = compactAddressPart(payload.display_name);
      }

      return {
        label,
        displayName,
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
            const result = {
              label: buildDestinationLabel(
                [
                  compactAddressPart(feature.properties?.name),
                  compactAddressPart(feature.properties?.place_formatted),
                  compactAddressPart(feature.properties?.full_address)
                ],
                normalizedQuery
              ),
              displayName:
                compactAddressPart(feature.properties?.full_address) ??
                compactAddressPart(feature.properties?.place_formatted) ??
                compactAddressPart(feature.properties?.name) ??
                normalizedQuery,
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
}
