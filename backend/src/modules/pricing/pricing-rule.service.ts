import { prisma } from "../../common/prisma.js";

export interface PricingContext {
  serviceZoneId: string | null;
  rideType: string;
  countryCode: string;
  isScheduled: boolean;
}

export interface ResolvedPricing {
  baseFare: number;
  perKmFee: number;
  perMinuteFee: number;
  minimumFare: number;
  surgeMultiplier: number;
  appliedRules: string[];
}

export class PricingRuleService {
  async resolvePricing(
    context: PricingContext,
    basePricing: {
      baseFare: number;
      perKmFee: number;
      perMinuteFee: number;
      minimumFare: number;
    },
  ): Promise<ResolvedPricing> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startMinuteOfDay = now.getHours() * 60 + now.getMinutes();

    const rules = await prisma.pricingRule.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { serviceZoneId: null },
          { serviceZoneId: context.serviceZoneId },
        ],
        AND: [
          {
            OR: [
              { rideType: null },
              { rideType: context.rideType },
            ],
          },
          {
            OR: [
              { dayOfWeek: null },
              { dayOfWeek },
            ],
          },
          {
            OR: [
              {
                startMinuteOfDay: null,
                endMinuteOfDay: null,
              },
              {
                startMinuteOfDay: { lte: startMinuteOfDay },
                endMinuteOfDay: { gte: startMinuteOfDay },
              },
            ],
          },
          {
            OR: [
              { appliesToScheduled: true },
              { appliesToScheduled: false, scope: { not: "SCHEDULED_RIDE" } },
            ],
          },
        ],
      },
      orderBy: [
        { serviceZoneId: "desc" },
        { dayOfWeek: "desc" },
        { startMinuteOfDay: "desc" },
        { rideType: "desc" },
      ],
    });

    let resolved: ResolvedPricing = {
      baseFare: basePricing.baseFare,
      perKmFee: basePricing.perKmFee,
      perMinuteFee: basePricing.perMinuteFee,
      minimumFare: basePricing.minimumFare,
      surgeMultiplier: 1.0,
      appliedRules: [],
    };

    for (const rule of rules) {
      if (rule.baseFareOverride != null && resolved.baseFare === basePricing.baseFare) {
        resolved.baseFare = Number(rule.baseFareOverride);
        resolved.appliedRules.push(rule.name);
      }
      if (rule.perKmFeeOverride != null && resolved.perKmFee === basePricing.perKmFee) {
        resolved.perKmFee = Number(rule.perKmFeeOverride);
        if (!resolved.appliedRules.includes(rule.name)) resolved.appliedRules.push(rule.name);
      }
      if (rule.perMinuteOverride != null && resolved.perMinuteFee === basePricing.perMinuteFee) {
        resolved.perMinuteFee = Number(rule.perMinuteOverride);
        if (!resolved.appliedRules.includes(rule.name)) resolved.appliedRules.push(rule.name);
      }
      if (rule.minimumFareOverride != null && resolved.minimumFare === basePricing.minimumFare) {
        resolved.minimumFare = Number(rule.minimumFareOverride);
        if (!resolved.appliedRules.includes(rule.name)) resolved.appliedRules.push(rule.name);
      }
      if (rule.surgeMultiplier != null && resolved.surgeMultiplier === 1.0) {
        resolved.surgeMultiplier = Math.max(1.0, Number(rule.surgeMultiplier));
        if (!resolved.appliedRules.includes(rule.name)) resolved.appliedRules.push(rule.name);
      }
    }

    return resolved;
  }

  async listActiveRules() {
    return prisma.pricingRule.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsertRule(data: {
    id?: string;
    serviceZoneId?: string | null;
    name: string;
    scope: string;
    rideType?: string | null;
    dayOfWeek?: number | null;
    startMinuteOfDay?: number | null;
    endMinuteOfDay?: number | null;
    surgeMultiplier?: number | null;
    baseFareOverride?: number | null;
    perKmFeeOverride?: number | null;
    perMinuteOverride?: number | null;
    minimumFareOverride?: number | null;
    appliesToScheduled?: boolean;
  }) {
    if (data.id) {
      return prisma.pricingRule.update({
        where: { id: data.id },
        data: {
          name: data.name,
          scope: data.scope as any,
          rideType: data.rideType,
          dayOfWeek: data.dayOfWeek,
          startMinuteOfDay: data.startMinuteOfDay,
          endMinuteOfDay: data.endMinuteOfDay,
          surgeMultiplier: data.surgeMultiplier,
          baseFareOverride: data.baseFareOverride,
          perKmFeeOverride: data.perKmFeeOverride,
          perMinuteOverride: data.perMinuteOverride,
          minimumFareOverride: data.minimumFareOverride,
          appliesToScheduled: data.appliesToScheduled,
        },
      });
    }

    return prisma.pricingRule.create({
      data: {
        serviceZoneId: data.serviceZoneId,
        name: data.name,
        scope: data.scope as any,
        rideType: data.rideType,
        dayOfWeek: data.dayOfWeek,
        startMinuteOfDay: data.startMinuteOfDay,
        endMinuteOfDay: data.endMinuteOfDay,
        surgeMultiplier: data.surgeMultiplier,
        baseFareOverride: data.baseFareOverride,
        perKmFeeOverride: data.perKmFeeOverride,
        perMinuteOverride: data.perMinuteOverride,
        minimumFareOverride: data.minimumFareOverride,
        appliesToScheduled: data.appliesToScheduled,
      },
    });
  }

  async deactivateRule(ruleId: string) {
    await prisma.pricingRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
  }
}

export const pricingRuleService = new PricingRuleService();
