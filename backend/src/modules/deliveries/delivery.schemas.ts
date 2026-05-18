import { z } from "zod";
import { locationSchema } from "../rides/ride.schemas.js";

export const createDeliveryRequestSchema = z.object({
  passengerProfileId: z.string().cuid(),
  serviceZoneId: z.string().cuid(),
  paymentMethod: z.enum(["cash", "card", "wallet", "mobile_money"]),
  pickup: locationSchema,
  dropoff: locationSchema,
  recipientName: z.string().min(2).max(160),
  recipientPhoneE164: z.string().min(8).max(24),
  packageType: z.string().min(2).max(60).default("parcel"),
  packageDescription: z.string().min(3).max(255),
  estimatedDistanceKm: z.number().positive(),
  estimatedDurationMinutes: z.number().int().positive(),
  notes: z.string().max(500).optional()
});

export const deliveryIdParamsSchema = z.object({
  deliveryId: z.string().cuid()
});

export const deliveryStatusUpdateSchema = z.object({
  nextStatus: z.enum(["assigned", "picked_up", "in_transit", "delivered", "cancelled"]),
  actorRole: z.enum(["passenger", "rider", "admin", "dispatcher", "system"]),
  actorUserId: z.string().cuid().optional(),
  riderProfileId: z.string().cuid().optional(),
  cancellationReason: z.string().max(300).optional()
});
