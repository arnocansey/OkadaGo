import { z } from "zod";

const currencySchema = z.enum(["GHS", "NGN"]);

export const createPassengerSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional(),
  phoneCountryCode: z.string().min(1).max(6),
  phoneLocal: z.string().min(4).max(20),
  phoneE164: z.string().min(8).max(24),
  preferredCurrency: currencySchema,
  defaultServiceCity: z.string().max(120).optional(),
  preferredPayment: z.enum(["cash", "card", "wallet", "mobile_money"]).optional()
});

export const createRiderSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional(),
  phoneCountryCode: z.string().min(1).max(6),
  phoneLocal: z.string().min(4).max(20),
  phoneE164: z.string().min(8).max(24),
  preferredCurrency: currencySchema,
  city: z.string().max(120).optional(),
  serviceZoneId: z.string().cuid().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected", "suspended"]).default("approved"),
  vehicle: z
    .object({
      make: z.string().min(1).max(80),
      model: z.string().min(1).max(80),
      plateNumber: z.string().min(3).max(32),
      color: z.string().max(50).optional(),
      year: z.number().int().min(2000).max(2100).optional()
    })
    .optional()
});

export const createServiceZoneSchema = z.object({
  name: z.string().min(2).max(160),
  city: z.string().min(2).max(120),
  countryCode: z.enum(["GH", "NG"]),
  currency: currencySchema,
  baseFare: z.number().nonnegative(),
  perKmFee: z.number().nonnegative(),
  perMinuteFee: z.number().nonnegative(),
  minimumFare: z.number().nonnegative(),
  cancellationFee: z.number().nonnegative(),
  waitingFeePerMin: z.number().nonnegative(),
  polygonGeoJson: z.record(z.string(), z.unknown())
});
