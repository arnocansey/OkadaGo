import { z } from "zod";

export const registerPushTokenSchema = z.object({
  deviceId: z.string().min(1).max(191),
  platform: z.string().min(1).max(40),
  pushToken: z.string().min(1).max(255),
  appVersion: z.string().max(50).optional(),
});

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().cuid(),
});

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
