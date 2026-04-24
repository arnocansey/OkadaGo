import { z } from "zod";

export const settlementPreviewSchema = z.object({
  currency: z.enum(["GHS", "NGN"]),
  totalFare: z.number().nonnegative(),
  platformCommissionPercent: z.number().min(0).max(100),
  gatewayFee: z.number().nonnegative().default(0),
  riderBonus: z.number().nonnegative().default(0),
  refundAmount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(["cash", "card", "wallet", "mobile_money"])
});

export const payoutEligibilitySchema = z.object({
  availableBalance: z.number().nonnegative(),
  requestedAmount: z.number().positive(),
  minimumPayoutAmount: z.number().nonnegative(),
  hasPendingComplianceIssue: z.boolean().default(false),
  hasPendingPayout: z.boolean().default(false)
});

export const riderPayoutRequestSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["BANK_ACCOUNT", "MOBILE_MONEY"]).default("MOBILE_MONEY"),
  destinationLabel: z.string().trim().min(3).max(191)
});

export const walletTopUpSchema = z.object({
  userId: z.string().cuid(),
  currency: z.enum(["GHS", "NGN"]),
  amount: z.number().positive(),
  walletType: z
    .enum(["passenger_cashless", "promo_credit", "rider_settlement"])
    .default("passenger_cashless"),
  description: z.string().max(255).optional()
});

export const walletPaystackInitializeSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["GHS", "NGN"]).optional(),
  walletType: z
    .enum(["passenger_cashless", "promo_credit", "rider_settlement"])
    .default("passenger_cashless"),
  description: z.string().max(255).optional()
});

export const walletPaystackCallbackQuerySchema = z.object({
  reference: z.string().min(6).max(120).optional(),
  trxref: z.string().min(6).max(120).optional()
}).refine((value) => value.reference || value.trxref, {
  message: "A Paystack transaction reference is required",
  path: ["reference"]
});

export const walletUserParamsSchema = z.object({
  userId: z.string().cuid()
});

export const adminWalletTransactionsQuerySchema = z.object({
  status: z.enum(["PENDING", "POSTED", "REVERSED", "FAILED"]).optional(),
  type: z
    .enum(["TOP_UP", "DEBIT", "CREDIT", "REFUND", "BONUS", "COMMISSION", "WITHDRAWAL", "ADJUSTMENT"])
    .optional()
});

export const adminPayoutRequestsQuerySchema = z.object({
  status: z
    .enum(["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING", "PAID", "REJECTED", "CANCELLED"])
    .optional()
});

export const adminPayoutReviewParamsSchema = z.object({
  payoutRequestId: z.string().cuid()
});

export const adminPayoutReviewSchema = z.object({
  action: z.enum([
    "mark_reviewing",
    "approve",
    "mark_processing",
    "mark_paid",
    "reject",
    "cancel"
  ]),
  rejectionReason: z.string().trim().max(255).optional()
});
