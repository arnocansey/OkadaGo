import { z } from "zod";

export const registerPushTokenSchema = z.object({
  deviceId: z.string().min(1).max(191),
  platform: z.string().min(1).max(40),
  pushToken: z.string().min(1).max(255),
  appVersion: z.string().max(50).optional()
});
