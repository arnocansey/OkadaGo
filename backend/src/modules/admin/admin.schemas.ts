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

export const createEscalationRuleSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().min(2).max(500),
  triggerCondition: z.string().min(2).max(160),
  thresholdHours: z.number().int().positive().max(168).default(4),
  action: z.string().min(2).max(160),
  targetRole: z.string().min(2).max(40),
  enabled: z.boolean().optional().default(true)
});

export type CreateEscalationRuleInput = z.infer<typeof createEscalationRuleSchema>;

export const updateEscalationRuleSchema = createEscalationRuleSchema.partial();

export type UpdateEscalationRuleInput = z.infer<typeof updateEscalationRuleSchema>;

export const escalationRuleParamsSchema = z.object({
  ruleId: z.string().min(1)
});

export const createScheduledBroadcastSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(500),
  targetAudience: z
    .enum(["all", "riders", "passengers", "zone", "inactive_riders", "new_passengers"])
    .default("all"),
  targetZoneId: z.string().min(1).optional(),
  scheduledAt: z.string().datetime()
});

export type CreateScheduledBroadcastInput = z.infer<typeof createScheduledBroadcastSchema>;

export const scheduledBroadcastParamsSchema = z.object({
  broadcastId: z.string().min(1)
});

export const adminNotesQuerySchema = z.object({
  entityType: z.enum(["RIDER", "INCIDENT", "PAYOUT", "PASSENGER", "TICKET"]),
  entityId: z.string().min(1).max(64)
});

export const createAdminNoteSchema = z.object({
  entityType: z.enum(["RIDER", "INCIDENT", "PAYOUT", "PASSENGER", "TICKET"]),
  entityId: z.string().min(1).max(64),
  body: z.string().trim().min(2).max(1000)
});

export type CreateAdminNoteInput = z.infer<typeof createAdminNoteSchema>;

export const updatePlatformSettingsSchema = z.object({
  settings: z.record(z.string().min(1).max(80), z.unknown())
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

export const riderRequestInfoSchema = z.object({
  message: z.string().trim().min(5).max(500)
});

export type RiderRequestInfoInput = z.infer<typeof riderRequestInfoSchema>;

export const adminExportParamsSchema = z.object({
  entity: z.enum(["rides", "deliveries", "wallet-transactions", "payout-requests", "riders", "audit-logs"])
});

export const adminAuditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).optional()
});

export const adminOpsSummaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const adminFinanceSummaryQuerySchema = adminOpsSummaryQuerySchema;
