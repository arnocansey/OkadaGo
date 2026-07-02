import { z } from "zod";

export const applyPromoCodeSchema = z.object({
  code: z.string().trim().min(2).max(40),
  estimatedFare: z.number().nonnegative(),
  currency: z.enum(["GHS", "NGN"]).optional(),
  city: z.string().max(120).optional(),
});

export const createPromoCodeSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(160),
  type: z.enum(["FLAT", "PERCENTAGE", "CREDIT"]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"]).default("DRAFT"),
  discountValue: z.number().positive(),
  maxDiscount: z.number().nonnegative().optional(),
  minRideAmount: z.number().nonnegative().optional(),
  maxRedemptions: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  city: z.string().max(120).optional(),
  currency: z.enum(["GHS", "NGN"]).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export const updatePromoCodeSchema = createPromoCodeSchema.partial();

export const promoCodeParamsSchema = z.object({
  promoCodeId: z.string().cuid(),
});

export const promoCodeQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
