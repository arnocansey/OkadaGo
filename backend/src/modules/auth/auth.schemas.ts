import { z } from "zod";

const phoneSchema = z.object({
  phoneCountryCode: z.string().min(1).max(6),
  phoneLocal: z.string().min(4).max(20),
  phoneE164: z.string().min(8).max(24)
});

const passwordSchema = z.string().min(8).max(128);
const deviceSchema = z.object({
  deviceId: z.string().max(191).optional(),
  platform: z.string().max(40).optional(),
  userAgent: z.string().max(512).optional()
});

export const passengerSignupSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional(),
  preferredCurrency: z.enum(["GHS", "NGN"]),
  defaultServiceCity: z.string().max(120).optional(),
  preferredPayment: z.enum(["cash", "card", "wallet", "mobile_money"]).optional(),
  password: passwordSchema,
  device: deviceSchema.optional()
}).and(phoneSchema);

export const riderSignupSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional(),
  preferredCurrency: z.enum(["GHS", "NGN"]),
  city: z.string().max(120).optional(),
  serviceZoneId: z.string().cuid().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  password: passwordSchema,
  device: deviceSchema.optional(),
  vehicle: z
    .object({
      make: z.string().min(1).max(80),
      model: z.string().min(1).max(80),
      plateNumber: z.string().min(3).max(32),
      color: z.string().max(50).optional(),
      year: z.number().int().min(2000).max(2100).optional()
    })
    .optional()
}).and(phoneSchema);

export const adminRegisterSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email(),
  phoneCountryCode: z.string().min(1).max(6),
  phoneLocal: z.string().min(4).max(20),
  phoneE164: z.string().min(8).max(24),
  preferredCurrency: z.enum(["GHS", "NGN"]).default("GHS"),
  password: passwordSchema,
  title: z.string().max(120).optional(),
  permissions: z.array(z.string().min(1).max(120)).default([]),
  device: deviceSchema.optional()
});

export const adminPromoteSchema = z.object({
  passengerUserId: z.string().cuid(),
  email: z.string().email(),
  password: passwordSchema,
  title: z.string().max(120).optional(),
  permissions: z.array(z.string().min(1).max(120)).default([])
});

export const passengerLoginSchema = z.object({
  phoneE164: z.string().min(8).max(24).optional(),
  phoneLocal: z.string().min(4).max(20).optional(),
  password: passwordSchema,
  device: deviceSchema.optional()
}).refine((value) => value.phoneE164 || value.phoneLocal, {
  message: "Either phoneE164 or phoneLocal is required",
  path: ["phoneE164"]
});

export const riderLoginSchema = passengerLoginSchema;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  device: deviceSchema.optional()
});

export const passengerSettingsUpdateSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().nullable(),
  defaultServiceCity: z.string().max(120).nullable(),
  preferredPayment: z.enum(["cash", "card", "wallet", "mobile_money"]).nullable()
});
