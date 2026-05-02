import { z } from "zod";

export const rideRatingParamsSchema = z.object({
  rideId: z.string().cuid()
});

export const createRideRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  category: z.string().trim().min(2).max(80).optional(),
  review: z.string().trim().min(2).max(500).optional()
});

export const adminRatingsQuerySchema = z.object({
  riderId: z.string().cuid().optional(),
  rideId: z.string().cuid().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional()
});
