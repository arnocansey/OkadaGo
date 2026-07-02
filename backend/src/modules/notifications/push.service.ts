import { prisma } from "../../common/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { NotificationChannel, NotificationStatus } from "../../generated/prisma/enums.js";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export class PushService {
  async sendToUser(userId: string, payload: PushPayload) {
    const devices = await prisma.userDevice.findMany({
      where: {
        userId,
        pushToken: { not: null },
      },
      select: { pushToken: true },
    });

    const tokens = devices
      .map((device) => device.pushToken)
      .filter((token): token is string => Boolean(token));

    await prisma.notification.create({
      data: {
        userId,
        channel: NotificationChannel.PUSH,
        status: tokens.length > 0 ? NotificationStatus.QUEUED : NotificationStatus.FAILED,
        title: payload.title,
        body: payload.body,
        data: (payload.data ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (tokens.length === 0) {
      return { sent: 0 };
    }

    const messages = tokens.map((to) => ({
      to,
      sound: "default" as const,
      title: payload.title,
      body: payload.body,
        data: (payload.data ?? {}) as Prisma.InputJsonValue,
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        return { sent: 0, error: await response.text() };
      }

      return { sent: tokens.length };
    } catch (error) {
      return {
        sent: 0,
        error: error instanceof Error ? error.message : "Push delivery failed",
      };
    }
  }
}

export const pushService = new PushService();
