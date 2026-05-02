import { z } from "zod";

export const safetyContactParamsSchema = z.object({
  contactId: z.string().cuid()
});

export const safetyIncidentParamsSchema = z.object({
  incidentId: z.string().cuid()
});

export const createSafetyContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phoneE164: z.string().trim().min(8).max(24),
  relationship: z.string().trim().min(2).max(60).optional(),
  isPrimary: z.boolean().optional()
});

export const createSafetyIncidentSchema = z.object({
  rideId: z.string().cuid().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  category: z.string().trim().min(2).max(80).default("SOS"),
  description: z.string().trim().min(2).max(1000),
  evidence: z.array(z.string().trim().url()).max(10).optional()
});

export const createSafetyShareEventSchema = z.object({
  rideId: z.string().cuid(),
  mode: z.enum(["START", "STOP"]).default("START"),
  channel: z.enum(["SMS", "WHATSAPP", "LINK"]).default("LINK"),
  contactId: z.string().cuid().optional(),
  note: z.string().trim().min(2).max(240).optional()
});

export const requestSafetyContactVerificationSchema = z.object({
  contactId: z.string().cuid()
});

export const verifySafetyContactOtpSchema = z.object({
  contactId: z.string().cuid(),
  code: z.string().trim().length(6)
});

export const adminIncidentsQuerySchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "ACTIONED", "RESOLVED", "CLOSED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  riderId: z.string().cuid().optional(),
  rideId: z.string().cuid().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional()
});

export const adminIncidentReviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "ACTIONED", "RESOLVED", "CLOSED"]),
  note: z.string().trim().min(2).max(500).optional()
});
