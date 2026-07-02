import { z } from "zod";

export const applyReferralCodeSchema = z.object({
  referralCode: z.string().trim().min(4).max(40),
});

export const settleReferralParamsSchema = z.object({
  rideId: z.string().cuid(),
});

export const referralQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
