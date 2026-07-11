import { z } from "zod";

export const riderApprovalSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional()
});

export type RiderApprovalInput = z.infer<typeof riderApprovalSchema>;

export const riderApprovalParamsSchema = z.object({
  riderProfileId: z.string().min(1)
});

export const riderSuspensionSchema = z.object({
  action: z.enum(["suspend", "reinstate", "extend", "warn"]),
  reason: z.string().max(500).optional(),
  durationDays: z.number().int().positive().optional()
});

export type RiderSuspensionInput = z.infer<typeof riderSuspensionSchema>;

export const riderSuspensionParamsSchema = z.object({
  riderProfileId: z.string().min(1)
});
