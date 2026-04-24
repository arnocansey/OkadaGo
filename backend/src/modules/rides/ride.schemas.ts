import { z } from "zod";

export const countryCodeSchema = z.enum(["GH", "NG"]);
export const currencySchema = z.enum(["GHS", "NGN"]);

export const locationSchema = z.object({
  address: z.string().min(3).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const pricingInputSchema = z.object({
  countryCode: countryCodeSchema,
  currency: currencySchema,
  rideType: z.enum(["standard_bike", "express_bike"]),
  baseFare: z.number().nonnegative(),
  perKmFee: z.number().nonnegative(),
  perMinuteFee: z.number().nonnegative(),
  minimumFare: z.number().nonnegative(),
  cancellationFee: z.number().nonnegative().default(0),
  waitingFeePerMinute: z.number().nonnegative().default(0),
  commissionPercent: z.number().min(0).max(100),
  surgeMultiplier: z.number().min(1).default(1),
  zoneFee: z.number().nonnegative().default(0),
  promoDiscount: z.number().nonnegative().default(0),
  referralDiscount: z.number().nonnegative().default(0),
  estimatedDistanceKm: z.number().nonnegative(),
  estimatedDurationMinutes: z.number().int().nonnegative(),
  waitingMinutes: z.number().int().nonnegative().default(0)
});

export const rideEstimateSchema = z.object({
  pickup: locationSchema,
  destination: locationSchema,
  pricing: pricingInputSchema
});

export const createRideRequestSchema = z.object({
  passengerProfileId: z.string().cuid(),
  serviceZoneId: z.string().cuid(),
  paymentMethod: z.enum(["cash", "card", "wallet", "mobile_money"]),
  pickup: locationSchema,
  destination: locationSchema,
  estimatedDistanceKm: z.number().positive(),
  estimatedDurationMinutes: z.number().int().positive(),
  rideType: z.enum(["standard_bike", "express_bike"]).default("standard_bike"),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  promoDiscount: z.number().nonnegative().default(0),
  referralDiscount: z.number().nonnegative().default(0),
  waitingMinutes: z.number().int().nonnegative().default(0),
  surgeMultiplier: z.number().min(1).default(1)
});

export const rideLifecycleValidationSchema = z.object({
  currentStatus: z.enum([
    "searching",
    "assigned",
    "arriving",
    "arrived",
    "started",
    "completed",
    "cancelled"
  ]),
  nextStatus: z.enum([
    "assigned",
    "arriving",
    "arrived",
    "started",
    "completed",
    "cancelled"
  ]),
  actorRole: z.enum(["passenger", "rider", "admin", "dispatcher", "system"])
});

export const rideStatusUpdateSchema = z.object({
  nextStatus: z.enum(["assigned", "arriving", "arrived", "started", "completed", "cancelled"]),
  actorRole: z.enum(["passenger", "rider", "admin", "dispatcher", "system"]),
  actorUserId: z.string().cuid().optional(),
  cancellationReason: z.string().max(300).optional()
});

export const rideIdParamsSchema = z.object({
  rideId: z.string().cuid()
});

export const rideLocationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30)
});

export const riderAvailabilityParamsSchema = z.object({
  riderProfileId: z.string().cuid()
});

export const riderAvailabilitySchema = z.object({
  onlineStatus: z.boolean(),
  serviceZoneId: z.string().cuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

export const rideLocationUpdateSchema = z.object({
  riderProfileId: z.string().cuid().optional(),
  source: z
    .enum(["rider_app", "rider_web", "dispatcher_console", "system"])
    .default("rider_app"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKph: z.number().min(0).max(300).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracyM: z.number().min(0).max(5000).optional()
});

export const riderCandidateSchema = z.object({
  riderId: z.string().min(1),
  displayName: z.string().min(1).max(160),
  serviceZoneId: z.string().min(1),
  distanceToPickupKm: z.number().nonnegative(),
  etaMinutes: z.number().int().nonnegative(),
  ratingAverage: z.number().min(0).max(5),
  acceptanceRate: z.number().min(0).max(100),
  cancellationRate: z.number().min(0).max(100),
  isOnline: z.boolean(),
  isApproved: z.boolean(),
  isAvailable: z.boolean()
});

export const matchingPreviewSchema = z.object({
  requestedServiceZoneId: z.string().min(1),
  maxPickupRadiusKm: z.number().positive().default(6),
  candidates: z.array(riderCandidateSchema)
});
