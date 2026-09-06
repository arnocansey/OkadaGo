import { prisma } from "../../common/prisma.js";
import { LiveLocationService } from "../realtime/location.service.js";

export interface SurgeCalculationResult {
  surgeMultiplier: number;
  demandCount: number;
  supplyCount: number;
  demandSupplyRatio: number;
  zoneName: string | null;
  appliedRule: string | null;
}

export class SurgeService {
  private locationService: LiveLocationService;

  constructor() {
    this.locationService = new LiveLocationService();
  }

  /**
   * Calculate dynamic surge multiplier for a pickup location.
   *
   * Logic:
   * 1. Count active ride requests (SEARCHING + ASSIGNED) within ~2km of pickup
   * 2. Count available (online, not on trip) riders within ~2km
   * 3. Calculate demand/supply ratio
   * 4. Apply surge tiers
   * 5. Check for admin-configured PricingRule overrides
   */
  async calculateSurge(
    pickupLatitude: number,
    pickupLongitude: number,
    serviceZoneId: string | null,
    rideType: string,
  ): Promise<SurgeCalculationResult> {
    const RADIUS_KM = 2.0;

    const [demandCount, supplyCount] = await Promise.all([
      this.countDemandInRadius(pickupLatitude, pickupLongitude, RADIUS_KM),
      this.countSupplyInRadius(pickupLatitude, pickupLongitude, RADIUS_KM),
    ]);

    const demandSupplyRatio = supplyCount > 0 ? demandCount / supplyCount : demandCount > 0 ? 10.0 : 0;

    let calculatedSurge = this.ratioToSurgeTier(demandSupplyRatio);

    const pricingRule = await this.findApplicablePricingRule(serviceZoneId, rideType);
    let appliedRule: string | null = null;
    let zoneName: string | null = null;

    if (pricingRule) {
      if (pricingRule.surgeMultiplier !== null) {
        calculatedSurge = Math.max(1.0, Number(pricingRule.surgeMultiplier));
      }
      appliedRule = pricingRule.name;
      zoneName = pricingRule.zoneName;
    }

    return {
      surgeMultiplier: Math.round(calculatedSurge * 100) / 100,
      demandCount,
      supplyCount,
      demandSupplyRatio: Math.round(demandSupplyRatio * 100) / 100,
      zoneName,
      appliedRule,
    };
  }

  /**
   * Count ride requests in a radius using the haversine formula.
   * Counts rides with status SEARCHING or ASSIGNED (active demand).
   */
  private async countDemandInRadius(
    lat: number,
    lon: number,
    radiusKm: number,
  ): Promise<number> {
    const results = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Ride"
      WHERE status IN ('SEARCHING', 'ASSIGNED')
        AND cancelled_at IS NULL
        AND (
          6371 * acos(
            cos(radians(${lat})) *
            cos(radians("pickupLatitude")) *
            cos(radians("pickupLongitude") - radians(${lon})) +
            sin(radians(${lat})) *
            sin(radians("pickupLatitude"))
          )
        ) <= ${radiusKm}
    `;
    return Number(results[0]?.count ?? 0);
  }

  /**
   * Count available riders in a radius.
   * Riders are "available" if they're online, approved, and not on an active trip.
   * Uses PostGIS ST_DWithin on the rider's geography column for efficient spatial search.
   */
  private async countSupplyInRadius(
    lat: number,
    lon: number,
    radiusKm: number,
  ): Promise<number> {
    const results = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "RiderProfile" rp
      WHERE rp."approvalStatus" = 'APPROVED'
        AND rp."onlineStatus" = true
        AND rp."deletedAt" IS NULL
        AND rp."currentLocation" IS NOT NULL
        AND rp."tripStatus" = 'IDLE'
        AND ST_DWithin(
          rp."currentLocation",
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )
    `;
    return Number(results[0]?.count ?? 0);
  }

  /**
   * Check for admin-configured PricingRule that applies to this context.
   * Returns the most specific matching rule, or null if none apply.
   */
  private async findApplicablePricingRule(
    serviceZoneId: string | null,
    rideType: string,
  ): Promise<{
    surgeMultiplier: number | null;
    name: string;
    zoneName: string | null;
  } | null> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();

    const rule = await prisma.pricingRule.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { serviceZoneId: serviceZoneId },
              { serviceZoneId: null },
            ],
          },
          {
            OR: [
              { dayOfWeek: dayOfWeek },
              { dayOfWeek: null },
            ],
          },
          {
            OR: [
              {
                AND: [
                  { startMinuteOfDay: { not: null } },
                  { endMinuteOfDay: { not: null } },
                  { startMinuteOfDay: { lte: minuteOfDay } },
                  { endMinuteOfDay: { gte: minuteOfDay } },
                ],
              },
              {
                AND: [
                  { startMinuteOfDay: null },
                  { endMinuteOfDay: null },
                ],
              },
            ],
          },
          {
            OR: [
              { rideType: rideType },
              { rideType: null },
            ],
          },
        ],
      },
      include: {
        serviceZone: { select: { name: true } },
      },
      orderBy: [
        { serviceZoneId: "desc" },
        { dayOfWeek: "desc" },
        { startMinuteOfDay: "desc" },
        { rideType: "desc" },
      ],
    });

    if (!rule) return null;

    return {
      surgeMultiplier: rule.surgeMultiplier ? Number(rule.surgeMultiplier) : null,
      name: rule.name,
      zoneName: rule.serviceZone?.name ?? null,
    };
  }

  /**
   * Map demand/supply ratio to surge tier.
   */
  private ratioToSurgeTier(ratio: number): number {
    if (ratio < 1.0) return 1.0;
    if (ratio < 1.5) return 1.1;
    if (ratio < 2.0) return 1.25;
    if (ratio < 3.0) return 1.5;
    if (ratio < 4.0) return 2.0;
    return 2.5;
  }
}

export const surgeService = new SurgeService();
