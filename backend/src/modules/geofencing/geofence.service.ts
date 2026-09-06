import { prisma } from "../../common/prisma.js";

export interface GeofenceCheckResult {
  isInside: boolean;
  zoneId: string | null;
  zoneName: string | null;
  ridesEnabled: boolean;
  deliveriesEnabled: boolean;
}

const EMPTY_RESULT: GeofenceCheckResult = {
  isInside: false,
  zoneId: null,
  zoneName: null,
  ridesEnabled: false,
  deliveriesEnabled: false,
};

export class GeofenceService {
  async checkPointInZone(
    latitude: number,
    longitude: number,
  ): Promise<GeofenceCheckResult> {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        ridesEnabled: boolean;
        deliveriesEnabled: boolean;
      }>
    >`
      SELECT id, name, "ridesEnabled", "deliveriesEnabled"
      FROM "ServiceZone"
      WHERE "isActive" = true
        AND ST_Contains(
          ST_GeomFromGeoJSON("polygonGeoJson"::text),
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      LIMIT 1
    `;

    if (rows.length === 0) return EMPTY_RESULT;

    const zone = rows[0]!;
    return {
      isInside: true,
      zoneId: zone.id,
      zoneName: zone.name,
      ridesEnabled: zone.ridesEnabled,
      deliveriesEnabled: zone.deliveriesEnabled,
    };
  }

  async findZoneForLocation(
    latitude: number,
    longitude: number,
  ): Promise<GeofenceCheckResult> {
    const polygonMatch = await this.checkPointInZone(latitude, longitude);
    if (polygonMatch.isInside) return polygonMatch;

    const nearest = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        ridesEnabled: boolean;
        deliveriesEnabled: boolean;
        distMeters: number;
      }>
    >`
      SELECT
        id, name, "ridesEnabled", "deliveriesEnabled",
        ST_Distance(
          ST_Centroid("polygonGeoJson"::geometry)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) AS "distMeters"
      FROM "ServiceZone"
      WHERE "isActive" = true
      ORDER BY "distMeters" ASC
      LIMIT 1
    `;

    if (nearest.length === 0) return EMPTY_RESULT;

    const zone = nearest[0]!;
    return {
      isInside: false,
      zoneId: zone.id,
      zoneName: zone.name,
      ridesEnabled: zone.ridesEnabled,
      deliveriesEnabled: zone.deliveriesEnabled,
    };
  }

  async getGeofenceGeoJSON(): Promise<{
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: unknown;
      properties: {
        id: string;
        name: string;
        ridesEnabled: boolean;
        deliveriesEnabled: boolean;
      };
    }>;
  }> {
    const zones = await prisma.serviceZone.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        ridesEnabled: true,
        deliveriesEnabled: true,
        polygonGeoJson: true,
      },
    });

    return {
      type: "FeatureCollection",
      features: zones.map((z) => ({
        type: "Feature" as const,
        geometry: z.polygonGeoJson,
        properties: {
          id: z.id,
          name: z.name,
          ridesEnabled: z.ridesEnabled,
          deliveriesEnabled: z.deliveriesEnabled,
        },
      })),
    };
  }

  async checkBoundaryCrossing(
    riderId: string,
    newLatitude: number,
    newLongitude: number,
  ): Promise<GeofenceCheckResult | null> {
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderId },
      select: { serviceZoneId: true },
    });

    if (!rider) return null;

    const newZone = await this.checkPointInZone(newLatitude, newLongitude);

    if (newZone.zoneId === rider.serviceZoneId) return null;

    return newZone;
  }
}

export const geofenceService = new GeofenceService();
