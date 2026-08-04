import { z } from "zod";
import { locationSchema } from "../rides/ride.schemas.js";

export const deliveryEstimateSchema = z.object({
  serviceZoneId: z.string().cuid(),
  estimatedDistanceKm: z.number().nonnegative(),
  estimatedDurationMinutes: z.number().int().nonnegative()
});

export const deliveryStopInputSchema = z.object({
  address: z.string().min(3).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  landmark: z.string().trim().max(200).optional(),
  recipientName: z.string().min(2).max(160).optional(),
  recipientPhoneE164: z.string().min(8).max(24).optional(),
  instructions: z.string().max(300).optional()
});

export const createDeliveryRequestSchema = z.object({
  passengerProfileId: z.string().cuid(),
  serviceZoneId: z.string().cuid(),
  paymentMethod: z.enum(["cash", "card", "wallet", "mobile_money"]),
  pickup: locationSchema,
  dropoff: locationSchema,
  /** Optional intermediate stops visited between pickup and the final dropoff, in order. */
  additionalStops: z.array(deliveryStopInputSchema).max(5).optional(),
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

export const deliveryStopParamsSchema = z.object({
  deliveryId: z.string().cuid(),
  stopId: z.string().cuid()
});

export const deliveryStatusUpdateSchema = z.object({
  nextStatus: z.enum(["assigned", "picked_up", "in_transit", "delivered", "cancelled"]),
  actorRole: z.enum(["passenger", "rider", "admin", "dispatcher", "system"]),
  actorUserId: z.string().cuid().optional(),
  riderProfileId: z.string().cuid().optional(),
  cancellationReason: z.string().max(300).optional(),
  proofPhotoBase64: z.string().min(1).optional()
});

export const completeDeliveryStopSchema = z.object({
  actorRole: z.enum(["passenger", "rider", "admin", "dispatcher", "system"]),
  proofPhotoBase64: z.string().min(1).optional()
});
