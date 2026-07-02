import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import type {
  listNotificationsQuerySchema,
  registerPushTokenSchema
} from "./notification.schemas.js";
import type { z } from "zod";

type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export class NotificationService {
  private async getActiveSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  async registerPushToken(token: string, input: RegisterPushTokenInput) {
    const session = await this.getActiveSession(token);

    const device = await prisma.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId: session.userId,
          deviceId: input.deviceId,
        },
      },
      update: {
        platform: input.platform,
        pushToken: input.pushToken,
        appVersion: input.appVersion,
        lastSeenAt: new Date(),
      },
      create: {
        userId: session.userId,
        deviceId: input.deviceId,
        platform: input.platform,
        pushToken: input.pushToken,
        appVersion: input.appVersion,
        lastSeenAt: new Date(),
      },
    });

    return { ok: true, deviceId: device.deviceId };
  }

  async listNotifications(token: string, query: ListNotificationsQuery) {
    const session = await this.getActiveSession(token);

    return prisma.notification.findMany({
      where: {
        userId: session.userId,
        ...(query.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
  }

  async markNotificationRead(token: string, notificationId: string) {
    const session = await this.getActiveSession(token);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.userId) {
      throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllNotificationsRead(token: string) {
    const session = await this.getActiveSession(token);

    await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { ok: true };
  }
}
