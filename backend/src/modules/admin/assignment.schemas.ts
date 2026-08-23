import { z } from "zod";

export const assignRiderSchema = z.object({
  riderProfileId: z.string().cuid(),
  reason: z.string().max(200).optional()
});

export const reassignRiderSchema = z.object({
  riderProfileId: z.string().cuid(),
  reason: z.enum([
    "rider_unavailable",
    "rider_cancelled",
    "rider_too_far",
    "customer_requested",
    "bike_problem",
    "emergency",
    "other"
  ]),
  reasonNote: z.string().max(200).optional()
});

export const autoAssignSchema = z.object({
  maxRadiusKm: z.number().min(1).max(20).default(8)
});

export const assignmentHistoryQuerySchema = z.object({
  rideId: z.string().cuid().optional(),
  riderProfileId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const rideParamsSchema = z.object({
  rideId: z.string().cuid()
});
