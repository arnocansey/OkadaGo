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

    const endsAtFromDuration = (days?: number, from = new Date()) => {
      if (!days || days <= 0) return null;
      return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
    };

    if (input.action === "suspend") {
      const suspendedAt = new Date();
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          approvalStatus: "SUSPENDED",
          suspendedAt,
          suspensionReason: input.reason?.trim() || rider.suspensionReason || "Policy violation",
          suspensionEndsAt: endsAtFromDuration(input.durationDays, suspendedAt),
          onlineStatus: false
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "SUSPENDED" }
      });

      await prisma.auditLog.create({
        data: {
          actorRole: "ADMIN",
          action: "RIDER_SUSPEND",
          entityType: "RiderProfile",
          entityId: riderProfileId,
          changes: {
            reason: updated.suspensionReason,
            durationDays: input.durationDays ?? null,
            suspensionEndsAt: updated.suspensionEndsAt
          }
        }
      });

      return updated;
    }

    if (input.action === "reinstate") {
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          approvalStatus: "APPROVED",
          suspendedAt: null,
          suspensionReason: null,
          suspensionEndsAt: null
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "ACTIVE" }
      });

      await prisma.auditLog.create({
        data: {
          actorRole: "ADMIN",
          action: "RIDER_REINSTATE",
          entityType: "RiderProfile",
          entityId: riderProfileId,
          changes: { previousReason: rider.suspensionReason }
        }
      });

      return updated;
    }

    if (input.action === "extend") {
      const base =
        rider.suspensionEndsAt && rider.suspensionEndsAt.getTime() > Date.now()
          ? rider.suspensionEndsAt
          : new Date();
      const days = input.durationDays ?? 7;
      const updated = await prisma.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          approvalStatus: "SUSPENDED",
          suspendedAt: rider.suspendedAt ?? new Date(),
          suspensionReason: input.reason?.trim() || rider.suspensionReason || "Suspension extended",
          suspensionEndsAt: endsAtFromDuration(days, base),
          onlineStatus: false
        },
        include: { user: true, vehicle: true, serviceZone: true }
      });

      await prisma.user.update({
        where: { id: rider.userId },
        data: { accountStatus: "SUSPENDED" }
      });

      await prisma.auditLog.create({
        data: {
          actorRole: "ADMIN",
          action: "RIDER_SUSPENSION_EXTEND",
          entityType: "RiderProfile",
          entityId: riderProfileId,
          changes: {
            durationDays: days,
            suspensionEndsAt: updated.suspensionEndsAt,
            reason: updated.suspensionReason
          }
        }
      });

      return updated;
    }

    if (input.action === "warn") {
      const title = "Account warning from OkadaGo ops";
      const body =
        input.reason?.trim() ||
        "Please review OkadaGo rider safety and conduct policies. Further issues may lead to suspension.";

      await prisma.notification.create({
        data: {
          userId: rider.userId,
          channel: "PUSH",
          status: "QUEUED",
          title,
          body,
          data: { type: "RIDER_WARNING", riderProfileId }
        }
      });

      await prisma.auditLog.create({
        data: {
          actorRole: "ADMIN",
          action: "RIDER_WARN",
          entityType: "RiderProfile",
          entityId: riderProfileId,
          changes: { reason: body }
        }
      });

      return { message: "Warning queued for rider", riderId: riderProfileId };
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

  /** Aggregate registered account counts for passengers and riders (pending vs verified). */
  async getUserStats(token: string) {
    await this.verifyAdmin(token);

    const passengerWhere = { user: { role: "PASSENGER" as const, deletedAt: null } };
    const riderWhere = { user: { deletedAt: null } };

    const [
      passengersTotal,
      passengersVerified,
      passengersPending,
      riderApprovalGroups
    ] = await Promise.all([
      prisma.passengerProfile.count({ where: passengerWhere }),
      prisma.passengerProfile.count({
        where: { user: { ...passengerWhere.user, isPhoneVerified: true } }
      }),
      prisma.passengerProfile.count({
        where: { user: { ...passengerWhere.user, isPhoneVerified: false } }
      }),
      prisma.riderProfile.groupBy({
        by: ["approvalStatus"],
        where: riderWhere,
        _count: { _all: true }
      })
    ]);

    const ridersByStatus = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0
    };

    for (const row of riderApprovalGroups) {
      const key = row.approvalStatus as keyof typeof ridersByStatus;
      if (key in ridersByStatus) {
        ridersByStatus[key] = row._count._all;
      }
    }

    const ridersTotal =
      ridersByStatus.PENDING +
      ridersByStatus.APPROVED +
      ridersByStatus.REJECTED +
      ridersByStatus.SUSPENDED;

    return {
      passengers: {
        total: passengersTotal,
        pending: passengersPending,
        verified: passengersVerified
      },
      riders: {
        total: ridersTotal,
        pending: ridersByStatus.PENDING,
        verified: ridersByStatus.APPROVED,
        rejected: ridersByStatus.REJECTED,
        suspended: ridersByStatus.SUSPENDED
      },
      totals: {
        users: passengersTotal + ridersTotal
      }
    };
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
