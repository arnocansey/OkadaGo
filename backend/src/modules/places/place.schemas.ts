import { z } from "zod";

export const savedPlaceParamsSchema = z.object({
  placeId: z.string().cuid(),
});

export const createSavedPlaceSchema = z.object({
  label: z.string().trim().min(1).max(80),
  address: z.string().trim().min(3).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().trim().max(500).optional(),
});

export const updateSavedPlaceSchema = createSavedPlaceSchema.partial();
