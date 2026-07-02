import { z } from "zod";

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180)
});

export const forwardGeocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(200)
});

export const routePreviewQuerySchema = z.object({
  startLat: z.coerce.number().min(-90).max(90),
  startLon: z.coerce.number().min(-180).max(180),
  endLat: z.coerce.number().min(-90).max(90),
  endLon: z.coerce.number().min(-180).max(180)
});

export const placesNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  categoryId: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional()
});

export const placesAutocompleteQuerySchema = z.object({
  q: z.string().trim().min(2).max(200),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional()
});

export const placesDetailsQuerySchema = z.object({
  placeId: z.string().trim().min(1)
});

export const placesPhotoQuerySchema = z.object({
  photoreference: z.string().trim().min(1),
  maxwidth: z.coerce.number().int().min(1).max(1600).default(400)
});
