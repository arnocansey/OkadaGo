import { z } from "zod";

export const uploadDocumentSchema = z.object({
  type: z.enum([
    "NATIONAL_ID",
    "RIDER_LICENSE",
    "VEHICLE_REGISTRATION",
    "INSURANCE",
    "PROFILE_PHOTO",
    "OTHER",
  ]),
  fileName: z.string().min(1).max(120),
  contentType: z.string().min(3).max(80),
  dataBase64: z.string().min(20),
  notes: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const documentIdParamsSchema = z.object({
  documentId: z.string().cuid(),
});

export const riderDocumentsParamsSchema = z.object({
  riderProfileId: z.string().cuid(),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "EXPIRED"]),
  notes: z.string().max(500).optional(),
});
