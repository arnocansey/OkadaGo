import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import type { RiderApprovalInput, RiderSuspensionInput } from "./admin.schemas.js";

export class AdminRiderService {
  async approveRider(token: string, riderProfileId: string, input: RiderApprovalInput) {
    await this.verifyAdmin(token);

    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: { user: true }
    });

    if (!rider) {
      throw new AppError("Rider not found", 404, "RIDER_NOT_FOUND");
    }

    const newStatus = input.action === "approve" ? "APPROVED" : "REJECTED";

    const updated = await prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: {
        approvalStatus: newStatus,
        approvedAt: input.action === "approve" ? new Date() : rider.approvedAt,
        suspendedAt: null
      },
      include: { user: true, vehicle: true, serviceZone: true }
    });

    if (input.action === "approve") {
      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "ACTIVE" }
      });
    }

    return updated;
  }

  async suspendRider(token: string, riderProfileId: string, input: RiderSuspensionInput) {
    await this.verifyAdmin(token);

    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: { user: true }
    });

    if (!rider) {
      throw new AppError("Rider not found", 404, "RIDER_NOT_FOUND");
    }

    if (input.action === "suspend") {
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          approvalStatus: "SUSPENDED",
          suspendedAt: new Date(),
          onlineStatus: false
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "SUSPENDED" }
      });

      return updated;
    }

    if (input.action === "reinstate") {
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          approvalStatus: "APPROVED",
          suspendedAt: null
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "ACTIVE" }
      });

      return updated;
    }

    if (input.action === "extend") {
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          suspendedAt: new Date()
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      return updated;
    }

    if (input.action === "warn") {
      return { message: "Warning sent to rider", riderId: riderProfileId };
    }

    throw new AppError("Invalid action", 400, "INVALID_ACTION");
  }

  async listRiders(token: string, query?: { status?: string; search?: string; limit?: number }) {
    await this.verifyAdmin(token);

    const where: Record<string, unknown> = {};

    if (query?.status) {
      where.approvalStatus = query.status.toUpperCase();
    }

    if (query?.search) {
      where.OR = [
        { user: { fullName: { contains: query.search, mode: "insensitive" } } },
        { displayCode: { contains: query.search, mode: "insensitive" } }
      ];
    }

    return prisma.riderProfile.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneE164: true, accountStatus: true, preferredCurrency: true } },
        vehicle: true,
        serviceZone: true
      },
      orderBy: { createdAt: "desc" },
      take: query?.limit ?? 100
    });
  }

  private async verifyAdmin(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }
}
