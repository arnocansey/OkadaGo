import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { PromoStatus, PromoType } from "../../generated/prisma/enums.js";
import type {
  applyPromoCodeSchema,
  createPromoCodeSchema,
  promoCodeQuerySchema,
  updatePromoCodeSchema
} from "./promotion.schemas.js";
import type { z } from "zod";

type ApplyPromoInput = z.infer<typeof applyPromoCodeSchema>;
type CreatePromoInput = z.infer<typeof createPromoCodeSchema>;
type UpdatePromoInput = z.infer<typeof updatePromoCodeSchema>;
type PromoQuery = z.infer<typeof promoCodeQuerySchema>;

function parsePromoEndDate(dateStr?: string | null): Date | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;
  const d = new Date(dateStr.trim());
  if (isNaN(d.getTime())) return undefined;
  if (
    dateStr.trim().length === 10 ||
    (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0)
  ) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

export class PromotionService {
  private async requireAdmin(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }

  private computeDiscount(
    promo: {
      type: PromoType;
      discountValue: unknown;
      maxDiscount: unknown;
      minRideAmount: unknown;
    },
    estimatedFare: number
  ) {
    const minRideAmount = promo.minRideAmount != null ? Number(promo.minRideAmount) : 0;
    if (estimatedFare < minRideAmount) {
      throw new AppError(
        `Minimum ride amount of ${minRideAmount} required for this promo`,
        409,
        "PROMO_MIN_AMOUNT_NOT_MET"
      );
    }

    let discount = 0;
    const value = Number(promo.discountValue);

    if (promo.type === PromoType.FLAT || promo.type === PromoType.CREDIT) {
      discount = value;
    } else if (promo.type === PromoType.PERCENTAGE) {
      discount = estimatedFare * (value / 100);
    }

    if (promo.maxDiscount != null) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }

    return Math.min(Math.max(0, discount), estimatedFare);
  }

  private async validatePromoForUse(promoCode: string, passengerId?: string) {
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: promoCode.toUpperCase(),
        deletedAt: null,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    if (!promo) {
      throw new AppError("Promo code not found", 404, "PROMO_NOT_FOUND");
    }

    if (promo.status !== PromoStatus.ACTIVE) {
      throw new AppError("Promo code is not active", 409, "PROMO_INACTIVE");
    }

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      throw new AppError("Promo code is not yet valid", 409, "PROMO_NOT_STARTED");
    }

    if (promo.endsAt) {
      const effectiveEnd = new Date(promo.endsAt);
      if (
        effectiveEnd.getUTCHours() === 0 &&
        effectiveEnd.getUTCMinutes() === 0 &&
        effectiveEnd.getUTCSeconds() === 0
      ) {
        effectiveEnd.setUTCHours(23, 59, 59, 999);
      }
      if (effectiveEnd < now) {
        throw new AppError("Promo code has expired", 409, "PROMO_EXPIRED");
      }
    }

    if (promo.maxRedemptions != null && promo._count.redemptions >= promo.maxRedemptions) {
      throw new AppError("Promo code redemption limit reached", 409, "PROMO_LIMIT_REACHED");
    }

    if (passengerId && promo.perUserLimit != null) {
      const userRedemptions = await prisma.promoRedemption.count({
        where: { promoCodeId: promo.id, passengerId },
      });

      if (userRedemptions >= promo.perUserLimit) {
        throw new AppError("You have already used this promo code", 409, "PROMO_USER_LIMIT_REACHED");
      }
    }

    return promo;
  }

  private async getPassengerSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { passengerProfile: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (!session.user.passengerProfile) {
      throw new AppError("Passenger access is required", 403, "PASSENGER_ACCESS_REQUIRED");
    }

    return session;
  }

  async applyPromoForSession(token: string, input: ApplyPromoInput) {
    const session = await this.getPassengerSession(token);
    return this.applyPromoCode(input, session.user.passengerProfile!.id);
  }

  async applyPromoCode(input: ApplyPromoInput, passengerId?: string) {
    const promo = await this.validatePromoForUse(input.code, passengerId);

    if (input.currency && promo.currency && promo.currency !== input.currency) {
      throw new AppError("Promo code currency mismatch", 409, "PROMO_CURRENCY_MISMATCH");
    }

    if (input.city && promo.city && promo.city.toLowerCase() !== input.city.toLowerCase()) {
      throw new AppError("Promo code is not valid in this city", 409, "PROMO_CITY_MISMATCH");
    }

    const discountAmount = this.computeDiscount(promo, input.estimatedFare);

    return {
      promoCodeId: promo.id,
      code: promo.code,
      name: promo.name,
      type: promo.type.toLowerCase(),
      discountAmount,
    };
  }

  async redeemPromoForRide(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    params: {
      promoCode: string;
      passengerId: string;
      rideId: string;
      estimatedFare: number;
    }
  ) {
    const promo = await this.validatePromoForUse(params.promoCode, params.passengerId);
    const discountAmount = this.computeDiscount(promo, params.estimatedFare);

    await tx.promoRedemption.create({
      data: {
        promoCodeId: promo.id,
        passengerId: params.passengerId,
        rideId: params.rideId,
        discountAmount,
      },
    });

    return { promoCodeId: promo.id, discountAmount };
  }

  async listPromoCodes(token: string, query: PromoQuery) {
    await this.requireAdmin(token);

    return prisma.promoCode.findMany({
      where: {
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit,
      include: {
        _count: { select: { redemptions: true } },
      },
    });
  }

  async createPromoCode(token: string, input: CreatePromoInput) {
    await this.requireAdmin(token);

    return prisma.promoCode.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        type: input.type,
        status: input.status,
        discountValue: input.discountValue,
        maxDiscount: input.maxDiscount,
        minRideAmount: input.minRideAmount,
        maxRedemptions: input.maxRedemptions,
        perUserLimit: input.perUserLimit,
        city: input.city,
        currency: input.currency,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: parsePromoEndDate(input.endsAt),
      },
    });
  }

  async updatePromoCode(token: string, promoCodeId: string, input: UpdatePromoInput) {
    await this.requireAdmin(token);

    const existing = await prisma.promoCode.findUnique({ where: { id: promoCodeId } });
    if (!existing || existing.deletedAt) {
      throw new AppError("Promo code not found", 404, "PROMO_NOT_FOUND");
    }

    return prisma.promoCode.update({
      where: { id: promoCodeId },
      data: {
        ...(input.code ? { code: input.code.toUpperCase() } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.discountValue != null ? { discountValue: input.discountValue } : {}),
        ...(input.maxDiscount != null ? { maxDiscount: input.maxDiscount } : {}),
        ...(input.minRideAmount != null ? { minRideAmount: input.minRideAmount } : {}),
        ...(input.maxRedemptions != null ? { maxRedemptions: input.maxRedemptions } : {}),
        ...(input.perUserLimit != null ? { perUserLimit: input.perUserLimit } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt ? { endsAt: parsePromoEndDate(input.endsAt) } : {}),
      },
    });
  }
}

export const promotionService = new PromotionService();
