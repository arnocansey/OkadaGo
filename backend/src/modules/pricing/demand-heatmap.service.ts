import { prisma } from "../../common/prisma.js";

export interface DemandZone {
  zoneId: string;
  zoneName: string;
  centerLat: number;
  centerLon: number;
  requestCount: number;
  availableRiders: number;
  avgWaitMinutes: number;
  surgeMultiplier: number;
  trend: "rising" | "stable" | "falling";
}

export class DemandHeatMapService {
  async getDemandZones(): Promise<DemandZone[]> {
    const zonesWithCentroid = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        centerLat: number;
        centerLon: number;
      }>
    >`
      SELECT
        id, name,
        ST_Y(ST_Centroid("polygonGeoJson"::geometry)) AS "centerLat",
        ST_X(ST_Centroid("polygonGeoJson"::geometry)) AS "centerLon"
      FROM "ServiceZone"
      WHERE "isActive" = true
    `;

    const results: DemandZone[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    for (const zone of zonesWithCentroid) {
      const [currentCount, previousCount, riderCount] = await Promise.all([
        prisma.ride.count({
          where: {
            serviceZoneId: zone.id,
            status: { in: ["SEARCHING", "ASSIGNED"] },
            createdAt: { gte: oneHourAgo },
          },
        }),
        prisma.ride.count({
          where: {
            serviceZoneId: zone.id,
            status: { in: ["SEARCHING", "ASSIGNED"] },
            createdAt: { gte: twoHoursAgo, lt: oneHourAgo },
          },
        }),
        prisma.riderProfile.count({
          where: {
            serviceZoneId: zone.id,
            onlineStatus: true,
            approvalStatus: "APPROVED",
            tripStatus: "IDLE",
          },
        }),
      ]);

      const avgWait = riderCount > 0 ? Math.round((currentCount / riderCount) * 3) : 15;
      const trend =
        currentCount > previousCount * 1.2
          ? "rising"
          : currentCount < previousCount * 0.8
            ? "falling"
            : "stable";

      const ratio = riderCount > 0 ? currentCount / riderCount : currentCount > 0 ? 3 : 1;
      const surgeMultiplier =
        ratio < 1 ? 1.0 : ratio < 1.5 ? 1.1 : ratio < 2 ? 1.25 : ratio < 3 ? 1.5 : ratio < 4 ? 2.0 : 2.5;

      results.push({
        zoneId: zone.id,
        zoneName: zone.name,
        centerLat: Number(zone.centerLat),
        centerLon: Number(zone.centerLon),
        requestCount: currentCount,
        availableRiders: riderCount,
        avgWaitMinutes: Math.min(avgWait, 30),
        surgeMultiplier,
        trend,
      });
    }

    return results;
  }

  async getDemandGeoJSON(): Promise<{
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      geometry: { type: "Point"; coordinates: [number, number] };
      properties: DemandZone;
    }>;
  }> {
    const zones = await this.getDemandZones();

    return {
      type: "FeatureCollection",
      features: zones.map((z) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [z.centerLon, z.centerLat] },
        properties: z,
      })),
    };
  }
}

export const demandHeatMapService = new DemandHeatMapService();
