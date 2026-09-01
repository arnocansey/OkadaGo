import { z } from "zod";

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
  phoneCountryCode: z.string().min(1).max(6).optional().default("+233"),
  phoneLocal: z.string().min(4).max(20).optional(),
  phoneE164: z.string().min(8).max(24).optional(),
  device: deviceSchema.optional()
}).transform((val) => {
  let e164 = val.phoneE164;
  let local = val.phoneLocal;
  const country = val.phoneCountryCode || "+233";

  if (!e164 && local) {
    const cleanLocal = local.startsWith("0") ? local.slice(1) : local;
    e164 = `${country}${cleanLocal}`;
  } else if (e164 && !local) {
    local = e164.startsWith("+233") ? e164.slice(4) : e164.startsWith("233") ? e164.slice(3) : e164;
  }
  return {
    ...val,
    phoneCountryCode: country,
    phoneLocal: local || "",
    phoneE164: e164 || ""
  };
}).refine((val) => Boolean(val.phoneE164 && val.phoneE164.length >= 8), {
  message: "Valid phone number is required",
  path: ["phoneE164"]
});

export const riderSignupSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().optional(),
  preferredCurrency: z.enum(["GHS", "NGN"]),
  city: z.string().max(120).optional(),
  serviceZoneId: z.string().cuid().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  jobPreference: z.enum(["rides_only", "delivery_only", "both"]).default("both"),
  password: passwordSchema,
  phoneCountryCode: z.string().min(1).max(6).optional().default("+233"),
  phoneLocal: z.string().min(4).max(20).optional(),
  phoneE164: z.string().min(8).max(24).optional(),
  device: deviceSchema.optional(),
  vehicle: z
    .object({
      make: z.string().min(1).max(80),
      model: z.string().min(1).max(80),
      plateNumber: z.string().min(3).max(32),
      color: z.string().max(50).optional(),
      year: z.number().int().min(2000).max(2100).optional(),
      vehicleType: z.enum(["okada", "tricycle", "bicycle"]).default("okada")
    })
    .optional()
}).transform((val) => {
  let e164 = val.phoneE164;
  let local = val.phoneLocal;
  const country = val.phoneCountryCode || "+233";

  if (!e164 && local) {
    const cleanLocal = local.startsWith("0") ? local.slice(1) : local;
    e164 = `${country}${cleanLocal}`;
  } else if (e164 && !local) {
    local = e164.startsWith("+233") ? e164.slice(4) : e164.startsWith("233") ? e164.slice(3) : e164;
  }
  return {
    ...val,
    phoneCountryCode: country,
    phoneLocal: local || "",
    phoneE164: e164 || ""
  };
}).refine((val) => Boolean(val.phoneE164 && val.phoneE164.length >= 8), {
  message: "Valid phone number is required",
  path: ["phoneE164"]
});

export const adminRegisterSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().or(z.literal("")).optional(),
  phoneCountryCode: z.string().min(1).max(6).optional(),
  phoneLocal: z.string().min(1).max(20).optional(),
  phoneE164: z.string().min(8).max(24),
  preferredCurrency: z.enum(["GHS", "NGN"]).default("GHS"),
  password: passwordSchema,
  title: z.string().max(120).optional(),
  permissions: z.array(z.string().min(1).max(120)).default([]),
  device: deviceSchema.optional()
});

export const adminPromoteSchema = z.object({
  passengerUserId: z.string().cuid(),
  email: z.string().email().or(z.literal("")).optional(),
  password: passwordSchema,
  title: z.string().max(120).optional(),
  permissions: z.array(z.string().min(1).max(120)).default([])
});

export const passengerLoginSchema = z.object({
  phoneE164: z.string().min(8).max(24).optional(),
  phoneLocal: z.string().min(4).max(20).optional(),
  phoneCountryCode: z.string().min(1).max(6).optional().default("+233"),
  password: passwordSchema,
  device: deviceSchema.optional()
}).transform((val) => {
  let e164 = val.phoneE164;
  if (!e164 && val.phoneLocal) {
    const clean = val.phoneLocal.startsWith("0") ? val.phoneLocal.slice(1) : val.phoneLocal;
    e164 = `${val.phoneCountryCode || "+233"}${clean}`;
  }
  return {
    ...val,
    phoneE164: e164
  };
}).refine((value) => Boolean(value.phoneE164), {
  message: "Either phoneE164 or phoneLocal is required",
  path: ["phoneE164"]
});

export const riderLoginSchema = passengerLoginSchema;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  device: deviceSchema.optional(),
  /// 6-digit authenticator code, required only when the admin has 2FA enabled.
  totpCode: z.string().trim().min(6).max(8).optional(),
  /// One-time backup code (XXXX-XXXX) accepted in place of totpCode.
  backupCode: z.string().trim().min(8).max(20).optional()
});

export const adminTotpCodeSchema = z.object({
  code: z.string().trim().min(6).max(8)
});

export const adminUserParamsSchema = z.object({
  userId: z.string().cuid()
});

export const passengerSettingsUpdateSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().nullable(),
  defaultServiceCity: z.string().max(120).nullable(),
  preferredPayment: z.enum(["cash", "card", "wallet", "mobile_money"]).nullable()
});

export const riderSettingsUpdateSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email().nullable(),
  city: z.string().max(120).nullable()
});

export const riderVehicleUpdateSchema = z.object({
  make: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(80).optional(),
  plateNumber: z.string().min(3).max(32).optional(),
  color: z.string().max(50).nullable().optional(),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
  insuranceNumber: z.string().max(80).nullable().optional(),
  vehicleType: z.enum(["okada", "tricycle", "bicycle"]).optional()
});

export const otpRequestSchema = z.object({
  phoneE164: z.string().min(8).max(24)
});

export const otpVerifySchema = z.object({
  phoneE164: z.string().min(8).max(24),
  code: z.string().trim().length(6)
});

export const avatarUploadSchema = z.object({
  imageBase64: z.string().min(1)
});

export const adminChangePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: "New password must be different from the current password",
  path: ["newPassword"]
});

export const forgotPasswordSchema = z.object({
  phoneE164: z.string().min(8).max(24)
});

export const resetPasswordSchema = z.object({
  phoneE164: z.string().min(8).max(24),
  code: z.string().trim().length(6),
  newPassword: passwordSchema
});

export const adminProfileUpdateSchema = z.object({
  fullName: z.string().min(2).max(160).optional(),
  email: z.string().email().optional(),
  phoneCountryCode: z.string().min(1).max(6).optional(),
  phoneLocal: z.string().min(4).max(20).optional(),
  phoneE164: z.string().min(8).max(24).optional(),
  title: z.string().max(120).nullable().optional()
}).refine(
  (value) =>
    value.fullName !== undefined ||
    value.email !== undefined ||
    value.phoneE164 !== undefined ||
    value.phoneLocal !== undefined ||
    value.phoneCountryCode !== undefined ||
    value.title !== undefined,
  { message: "Provide at least one field to update" }
);

export const adminSessionParamsSchema = z.object({
  sessionId: z.string().cuid()
});
