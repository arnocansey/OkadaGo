import { z } from "zod";

export const ticketParamsSchema = z.object({
  ticketId: z.string().cuid()
});

export const createSupportTicketSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(80).default("GENERAL"),
  description: z.string().trim().min(3).max(1000),
  rideId: z.string().cuid().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL")
});

export const adminTicketsQuerySchema = z.object({
  status: z
    .enum(["OPEN", "PENDING_PASSENGER", "PENDING_RIDER", "ESCALATED", "RESOLVED", "CLOSED"])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const adminUpdateTicketSchema = z.object({
  status: z
    .enum(["OPEN", "PENDING_PASSENGER", "PENDING_RIDER", "ESCALATED", "RESOLVED", "CLOSED"])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().cuid().nullable().optional()
});
