import { z } from "zod";

export const initializeCardVaultSchema = z.object({
  /// Authorization charge in major units (GHS). Defaults to 1.00.
  amount: z.number().positive().max(50).optional(),
  currency: z.enum(["GHS", "NGN"]).default("GHS"),
  label: z.string().trim().max(80).optional()
});

export const createManualPaymentMethodSchema = z.object({
  channel: z.enum(["mobile_money", "paypal"]),
  label: z.string().trim().min(1).max(80).optional(),
  momoPhone: z.string().trim().min(8).max(24).optional(),
  momoProvider: z.string().trim().max(40).optional(),
  paypalEmail: z.string().email().optional()
}).superRefine((value, ctx) => {
  if (value.channel === "mobile_money" && !value.momoPhone) {
    ctx.addIssue({ code: "custom", message: "momoPhone is required", path: ["momoPhone"] });
  }
  if (value.channel === "paypal" && !value.paypalEmail) {
    ctx.addIssue({ code: "custom", message: "paypalEmail is required", path: ["paypalEmail"] });
  }
});

export const paymentMethodParamsSchema = z.object({
  methodId: z.string().cuid()
});

export const chargeSavedMethodSchema = z.object({
  amount: z.number().positive().max(100_000),
  currency: z.enum(["GHS", "NGN"]).default("GHS"),
  description: z.string().trim().max(190).optional()
});

export type InitializeCardVaultInput = z.infer<typeof initializeCardVaultSchema>;
export type CreateManualPaymentMethodInput = z.infer<typeof createManualPaymentMethodSchema>;
export type ChargeSavedMethodInput = z.infer<typeof chargeSavedMethodSchema>;
