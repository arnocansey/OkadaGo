import { z } from "zod";

export const sendPhoneOtpSchema = z.object({
  phoneE164: z.string().min(8).max(24),
});

export const verifyPhoneOtpSchema = z.object({
  phoneE164: z.string().min(8).max(24),
  code: z.string().trim().length(6),
});
