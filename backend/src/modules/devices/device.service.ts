import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import type { z } from "zod";
import type { registerPushTokenSchema } from "./device.schemas.js";

type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export class DeviceService {
  private async getSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: true }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  async registerPushToken(token: string, input: RegisterPushTokenInput) {
    const session = await this.getSession(token);

    const device = await prisma.userDevice.upsert({
      where: {
        userId_deviceId: {
          userId: session.user.id,
          deviceId: input.deviceId
        }
      },
      update: {
        platform: input.platform,
        pushToken: input.pushToken,
        appVersion: input.appVersion,
        lastSeenAt: new Date()
      },
      create: {
        userId: session.user.id,
        deviceId: input.deviceId,
        platform: input.platform,
        pushToken: input.pushToken,
        appVersion: input.appVersion,
        lastSeenAt: new Date()
      }
    });

    return { device };
  }
}
