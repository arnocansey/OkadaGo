import { v2 as cloudinary } from "cloudinary";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import { liveLocationService } from "../realtime/location.service.js";
import type {
  CreateAdminNoteInput,
  RiderRequestInfoInput,
  UpdatePlatformSettingsInput
} from "./admin.schemas.js";
import type { z } from "zod";
import type { settingImageUploadSchema } from "./admin.schemas.js";

type SettingImageUploadInput = z.infer<typeof settingImageUploadSchema>;

if (appConfig.cloudinaryCloudName && appConfig.cloudinaryApiKey && appConfig.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: appConfig.cloudinaryCloudName,
    api_key: appConfig.cloudinaryApiKey,
    api_secret: appConfig.cloudinaryApiSecret
  });
}

const EXPORT_ROW_CAP = 10_000;

function num(value: unknown) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolveDateRange(query?: { from?: string; to?: string }, defaultDays = 7) {
  const dayMs = 86_400_000;
  const toKey = query?.to ?? new Date().toISOString().slice(0, 10);
  const fromKey =
    query?.from ??
    new Date(Date.parse(`${toKey}T00:00:00Z`) - (defaultDays - 1) * dayMs).toISOString().slice(0, 10);
  const rangeStart = new Date(`${fromKey}T00:00:00.000Z`);
  const rangeEnd = new Date(`${toKey}T23:59:59.999Z`);
  const dayKeys: string[] = [];
  for (let t = rangeStart.getTime(); t <= Date.parse(`${toKey}T00:00:00.000Z`); t += dayMs) {
    dayKeys.push(new Date(t).toISOString().slice(0, 10));
  }
  return { fromKey, toKey, rangeStart, rangeEnd, dayKeys };
}

function csvEscape(value: unknown) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers: string[], rows: unknown[][]) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Admin-console-only capabilities: ops notes, persisted platform settings,
 * rider info requests, full CSV exports, and the live ops snapshot for SSE.
 */
export class AdminConsoleService {
  private async verifyAdmin(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }

  // ── Ops notes ──────────────────────────────────────────────────────────

  async listNotes(token: string, entityType: string, entityId: string) {
    await this.verifyAdmin(token);
    return prisma.adminNote.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { author: { select: { id: true, fullName: true, email: true } } }
    });
  }

  async createNote(token: string, input: CreateAdminNoteInput) {
    const session = await this.verifyAdmin(token);
    const note = await prisma.adminNote.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        body: input.body,
        authorId: session.user.id
      },
      include: { author: { select: { id: true, fullName: true, email: true } } }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: "ADMIN",
        action: "ADMIN_NOTE_CREATE",
        entityType: input.entityType,
        entityId: input.entityId,
        changes: { body: input.body }
      }
    });

    return note;
  }

  // ── Platform settings ──────────────────────────────────────────────────

  async getSettings(token: string) {
    await this.verifyAdmin(token);
    const rows = await prisma.platformSetting.findMany();
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return { settings };
  }

  async updateSettings(token: string, input: UpdatePlatformSettingsInput) {
    const session = await this.verifyAdmin(token);
    const entries = Object.entries(input.settings);
    if (entries.length === 0) {
      throw new AppError("No settings provided", 400, "SETTINGS_EMPTY");
    }
    if (entries.length > 100) {
      throw new AppError("Too many settings in one request", 400, "SETTINGS_TOO_MANY");
    }

    for (const [key, value] of entries) {
      await prisma.platformSetting.upsert({
        where: { key },
        create: { key, value: value as object, updatedById: session.user.id },
        update: { value: value as object, updatedById: session.user.id }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: "ADMIN",
        action: "PLATFORM_SETTINGS_UPDATE",
        entityType: "PlatformSetting",
        entityId: entries.map(([key]) => key).join(",").slice(0, 80),
        changes: { keys: entries.map(([key]) => key) }
      }
    });

    return this.getSettings(token);
  }

  async uploadSettingImage(token: string, input: SettingImageUploadInput) {
    const session = await this.verifyAdmin(token);

    if (!appConfig.cloudinaryCloudName || !appConfig.cloudinaryApiKey || !appConfig.cloudinaryApiSecret) {
      throw new AppError("Image uploads are not configured", 503, "CLOUDINARY_NOT_CONFIGURED");
    }

    const dataUri = input.imageBase64.startsWith("data:")
      ? input.imageBase64
      : `data:image/jpeg;base64,${input.imageBase64}`;

    const folder = input.kind === "company_document" ? "okadago/company/documents" : "okadago/company";
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      overwrite: true,
      transformation:
        input.kind === "company_logo"
          ? [{ width: 512, height: 512, crop: "limit" }, { quality: "auto", fetch_format: "auto" }]
          : [{ quality: "auto", fetch_format: "auto" }]
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: "ADMIN",
        action: "PLATFORM_SETTINGS_IMAGE_UPLOAD",
        entityType: "PlatformSetting",
        entityId: input.kind,
        changes: { url: result.secure_url, kind: input.kind }
      }
    });

    return { url: result.secure_url, kind: input.kind };
  }

  // ── Rider info requests ────────────────────────────────────────────────

  async requestRiderInfo(token: string, riderProfileId: string, input: RiderRequestInfoInput) {
    const session = await this.verifyAdmin(token);

    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: { user: { select: { id: true, fullName: true } } }
    });
    if (!rider) {
      throw new AppError("Rider was not found", 404, "RIDER_NOT_FOUND");
    }

    await prisma.notification.create({
      data: {
        userId: rider.user.id,
        channel: "PUSH",
        status: "QUEUED",
        title: "OkadaGo verification: more information needed",
        body: input.message,
        data: { type: "RIDER_INFO_REQUEST", riderProfileId }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: "ADMIN",
        action: "RIDER_REQUEST_INFO",
        entityType: "RiderProfile",
        entityId: riderProfileId,
        changes: { message: input.message }
      }
    });

    return { message: "Info request queued for rider", riderProfileId };
  }

  // ── CSV export ─────────────────────────────────────────────────────────

  async exportCsv(token: string, entity: string): Promise<{ filename: string; csv: string }> {
    await this.verifyAdmin(token);

    if (entity === "rides") {
      const rows = await prisma.ride.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          destinationAddress: true,
          estimatedFare: true,
          finalFare: true,
          platformCommission: true,
          riderEarnings: true,
          currency: true,
          createdAt: true,
          completedAt: true,
          passenger: { select: { user: { select: { fullName: true, phoneE164: true } } } },
          rider: { select: { displayCode: true, user: { select: { fullName: true } } } },
          serviceZone: { select: { name: true } }
        }
      });
      return {
        filename: "rides.csv",
        csv: toCsv(
          ["ID", "Status", "Passenger", "Passenger Phone", "Rider", "Rider Code", "Pickup", "Destination", "Zone", "Estimated Fare", "Final Fare", "Commission", "Rider Earnings", "Currency", "Created", "Completed"],
          rows.map((r) => [
            r.id,
            r.status,
            r.passenger.user.fullName,
            r.passenger.user.phoneE164,
            r.rider?.user.fullName ?? "",
            r.rider?.displayCode ?? "",
            r.pickupAddress,
            r.destinationAddress,
            r.serviceZone?.name ?? "",
            r.estimatedFare?.toString() ?? "",
            r.finalFare?.toString() ?? "",
            r.platformCommission?.toString() ?? "",
            r.riderEarnings?.toString() ?? "",
            r.currency,
            r.createdAt.toISOString(),
            r.completedAt?.toISOString() ?? ""
          ])
        )
      };
    }

    if (entity === "deliveries") {
      const rows = await prisma.deliveryRequest.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          recipientName: true,
          packageType: true,
          estimatedFee: true,
          finalFee: true,
          platformCommission: true,
          currency: true,
          createdAt: true,
          deliveredAt: true,
          passenger: { select: { user: { select: { fullName: true } } } },
          rider: { select: { user: { select: { fullName: true } } } },
          serviceZone: { select: { name: true } }
        }
      });
      return {
        filename: "deliveries.csv",
        csv: toCsv(
          ["ID", "Status", "Customer", "Rider", "Pickup", "Dropoff", "Recipient", "Package", "Zone", "Estimated Fee", "Final Fee", "Commission", "Currency", "Created", "Delivered"],
          rows.map((d) => [
            d.id,
            d.status,
            d.passenger.user.fullName,
            d.rider?.user.fullName ?? "",
            d.pickupAddress,
            d.dropoffAddress,
            d.recipientName,
            d.packageType,
            d.serviceZone?.name ?? "",
            d.estimatedFee?.toString() ?? "",
            d.finalFee?.toString() ?? "",
            d.platformCommission?.toString() ?? "",
            d.currency,
            d.createdAt.toISOString(),
            d.deliveredAt?.toISOString() ?? ""
          ])
        )
      };
    }

    if (entity === "wallet-transactions") {
      const rows = await prisma.walletTransaction.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          direction: true,
          amount: true,
          currency: true,
          status: true,
          reference: true,
          createdAt: true,
          wallet: { select: { user: { select: { fullName: true, role: true } } } }
        }
      });
      return {
        filename: "wallet-transactions.csv",
        csv: toCsv(
          ["ID", "User", "Role", "Type", "Direction", "Amount", "Currency", "Status", "Reference", "Date"],
          rows.map((tx) => [
            tx.id,
            tx.wallet.user.fullName,
            tx.wallet.user.role,
            tx.type,
            tx.direction,
            tx.amount.toString(),
            tx.currency,
            tx.status,
            tx.reference ?? "",
            tx.createdAt.toISOString()
          ])
        )
      };
    }

    if (entity === "payout-requests") {
      const rows = await prisma.payoutRequest.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          method: true,
          destinationLabel: true,
          rejectionReason: true,
          requestedAt: true,
          reviewedAt: true,
          paidAt: true,
          rider: { select: { displayCode: true, user: { select: { fullName: true } } } },
          reviewer: { select: { fullName: true } }
        }
      });
      return {
        filename: "payout-requests.csv",
        csv: toCsv(
          ["ID", "Rider", "Rider Code", "Amount", "Currency", "Method", "Destination", "Status", "Rejection Reason", "Requested", "Reviewed", "Paid", "Reviewer"],
          rows.map((p) => [
            p.id,
            p.rider.user.fullName,
            p.rider.displayCode,
            p.amount.toString(),
            p.currency,
            p.method,
            p.destinationLabel,
            p.status,
            p.rejectionReason ?? "",
            p.requestedAt.toISOString(),
            p.reviewedAt?.toISOString() ?? "",
            p.paidAt?.toISOString() ?? "",
            p.reviewer?.fullName ?? ""
          ])
        )
      };
    }

    if (entity === "riders") {
      const rows = await prisma.riderProfile.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { createdAt: "desc" },
        where: { deletedAt: null },
        select: {
          id: true,
          displayCode: true,
          approvalStatus: true,
          city: true,
          onlineStatus: true,
          completedTrips: true,
          ratingAverage: true,
          suspendedAt: true,
          createdAt: true,
          user: { select: { fullName: true, phoneE164: true, email: true, accountStatus: true } },
          serviceZone: { select: { name: true } },
          vehicle: { select: { plateNumber: true } }
        }
      });
      return {
        filename: "riders.csv",
        csv: toCsv(
          ["ID", "Name", "Code", "Phone", "Email", "Account Status", "Approval", "City", "Zone", "Vehicle", "Online", "Trips", "Rating", "Suspended At", "Joined"],
          rows.map((r) => [
            r.id,
            r.user.fullName,
            r.displayCode,
            r.user.phoneE164,
            r.user.email ?? "",
            r.user.accountStatus,
            r.approvalStatus,
            r.city ?? "",
            r.serviceZone?.name ?? "",
            r.vehicle?.plateNumber ?? "",
            r.onlineStatus ? "Online" : "Offline",
            r.completedTrips,
            r.ratingAverage.toString(),
            r.suspendedAt?.toISOString() ?? "",
            r.createdAt.toISOString()
          ])
        )
      };
    }

    if (entity === "audit-logs") {
      const rows = await prisma.auditLog.findMany({
        take: EXPORT_ROW_CAP,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true, email: true } } }
      });
      return {
        filename: "audit-logs.csv",
        csv: toCsv(
          ["ID", "Timestamp", "Actor", "Actor Email", "Role", "Action", "Entity", "Entity ID", "Changes"],
          rows.map((log) => [
            log.id,
            log.createdAt.toISOString(),
            log.actor?.fullName ?? "System",
            log.actor?.email ?? "",
            log.actorRole ?? "",
            log.action,
            log.entityType,
            log.entityId,
            log.changes ? JSON.stringify(log.changes) : ""
          ])
        )
      };
    }

    throw new AppError("Unknown export entity", 400, "EXPORT_ENTITY_UNKNOWN");
  }

  // ── Ops summary (dashboard KPIs + nav badges) ───────────────────────────

  async getOpsSummary(token: string, query?: { from?: string; to?: string }) {
    await this.verifyAdmin(token);

    const { fromKey, toKey, rangeStart, rangeEnd, dayKeys } = resolveDateRange(query, 7);
    const createdInRange = { createdAt: { gte: rangeStart, lte: rangeEnd } };

    const activeRideStatuses = [
      "SCHEDULED",
      "SEARCHING",
      "ASSIGNED",
      "ARRIVING",
      "ARRIVED",
      "STARTED"
    ] as const;
    const activeDeliveryStatuses = ["SEARCHING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"] as const;
    const openSosStatuses = ["OPEN", "UNDER_REVIEW", "ACTIONED"] as const;
    const openTicketStatuses = ["OPEN", "PENDING_PASSENGER", "PENDING_RIDER", "ESCALATED"] as const;
    const pendingPayoutStatuses = ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"] as const;
    const requestedPayoutStatuses = ["REQUESTED", "REVIEWING"] as const;

    // Cap chart buckets so a huge custom range stays cheap.
    const chartKeys = dayKeys.length > 14 ? dayKeys.slice(-14) : dayKeys;
    const chartStart = new Date(`${chartKeys[0]}T00:00:00.000Z`);
    const chartEnd = new Date(`${chartKeys[chartKeys.length - 1]}T23:59:59.999Z`);

    const passengerUser = { role: "PASSENGER" as const, deletedAt: null };
    const riderUser = { deletedAt: null };

    const [
      ridesActive,
      ridesCompletedInRange,
      ridesTotalInRange,
      ridesPromoAdjusted,
      rideCommissionAgg,
      deliveriesActive,
      deliveriesCompletedInRange,
      deliveriesTotalInRange,
      deliveryCommissionAgg,
      ridersTotal,
      ridersOnline,
      ridersWithCoords,
      ridersSuspended,
      riderApprovalGroups,
      passengersTotal,
      passengersVerified,
      passengersPending,
      pendingPayoutRequests,
      requestedRiderPayouts,
      riderWalletTxCount,
      ratingsTotal,
      zonesActive,
      openSupportTickets,
      openSos,
      riderIncidents,
      pendingDocuments,
      adminAccounts,
      ridersWithEarnings,
      recentCompletedRides,
      recentDeliveries,
      dailyRideRows
    ] = await Promise.all([
      prisma.ride.count({ where: { status: { in: [...activeRideStatuses] } } }),
      prisma.ride.count({ where: { status: "COMPLETED", ...createdInRange } }),
      prisma.ride.count({ where: createdInRange }),
      prisma.ride.count({
        where: {
          ...createdInRange,
          OR: [{ promoDiscount: { gt: 0 } }, { referralDiscount: { gt: 0 } }]
        }
      }),
      prisma.ride.aggregate({
        where: { status: "COMPLETED", ...createdInRange },
        _sum: { platformCommission: true }
      }),
      prisma.deliveryRequest.count({
        where: { status: { in: [...activeDeliveryStatuses] } }
      }),
      prisma.deliveryRequest.count({
        where: { status: "DELIVERED", ...createdInRange }
      }),
      prisma.deliveryRequest.count({ where: createdInRange }),
      prisma.deliveryRequest.aggregate({
        where: { status: "DELIVERED", ...createdInRange },
        _sum: { platformCommission: true }
      }),
      prisma.riderProfile.count({ where: { user: riderUser } }),
      prisma.riderProfile.count({
        where: { deletedAt: null, onlineStatus: true, user: riderUser }
      }),
      prisma.riderProfile.count({
        where: {
          deletedAt: null,
          onlineStatus: true,
          currentLatitude: { not: null },
          currentLongitude: { not: null },
          user: riderUser
        }
      }),
      prisma.riderProfile.count({
        where: {
          OR: [
            { approvalStatus: "SUSPENDED" },
            { suspendedAt: { not: null } },
            { user: { accountStatus: { in: ["SUSPENDED", "BANNED"] } } }
          ]
        }
      }),
      prisma.riderProfile.groupBy({
        by: ["approvalStatus"],
        where: { user: riderUser },
        _count: { _all: true }
      }),
      prisma.passengerProfile.count({ where: { user: passengerUser } }),
      prisma.passengerProfile.count({
        where: { user: { ...passengerUser, isPhoneVerified: true } }
      }),
      prisma.passengerProfile.count({
        where: { user: { ...passengerUser, isPhoneVerified: false } }
      }),
      prisma.payoutRequest.count({
        where: { status: { in: [...pendingPayoutStatuses] } }
      }),
      prisma.payoutRequest.count({
        where: { status: { in: [...requestedPayoutStatuses] } }
      }),
      prisma.walletTransaction.count({
        where: { wallet: { type: { in: ["RIDER_SETTLEMENT", "RIDER_BONUS"] } } }
      }),
      prisma.rating.count(),
      prisma.serviceZone.count({ where: { isActive: true } }),
      prisma.supportTicket.count({
        where: { deletedAt: null, status: { in: [...openTicketStatuses] } }
      }),
      prisma.incident.count({
        where: {
          deletedAt: null,
          status: { in: [...openSosStatuses] },
          OR: [{ severity: "CRITICAL" }, { category: { contains: "SOS", mode: "insensitive" } }]
        }
      }),
      prisma.incident.count({
        where: { deletedAt: null, riderId: { not: null } }
      }),
      prisma.riderDocument.count({
        where: { status: { in: ["PENDING", "REJECTED", "EXPIRED"] } }
      }),
      prisma.adminProfile.count(),
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(DISTINCT "riderId")::int AS count
        FROM "Ride"
        WHERE status = 'COMPLETED'
          AND "riderId" IS NOT NULL
          AND "riderEarnings" > 0
      `.then((rows) => rows[0]?.count ?? 0),
      prisma.ride.findMany({
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          completedAt: true,
          passenger: { select: { user: { select: { fullName: true } } } },
          rider: { select: { user: { select: { fullName: true } } } }
        }
      }),
      prisma.deliveryRequest.findMany({
        where: { status: "DELIVERED" },
        orderBy: { deliveredAt: "desc" },
        take: 3,
        select: {
          id: true,
          createdAt: true,
          deliveredAt: true,
          recipientName: true,
          passenger: { select: { user: { select: { fullName: true } } } }
        }
      }),
      prisma.$queryRaw<Array<{ key: string; rides: number; completed: number }>>`
        SELECT
          to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS key,
          COUNT(*)::int AS rides,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
        FROM "Ride"
        WHERE "createdAt" >= ${chartStart}
          AND "createdAt" <= ${chartEnd}
        GROUP BY 1
        ORDER BY 1
      `
    ]);

    const dailyByKey = new Map(dailyRideRows.map((row) => [row.key, row]));
    const dailyRideCounts = chartKeys.map((key) => {
      const row = dailyByKey.get(key);
      return { key, rides: row?.rides ?? 0, completed: row?.completed ?? 0 };
    });

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

    const rideCommission = Number(rideCommissionAgg._sum.platformCommission ?? 0);
    const deliveryCommission = Number(deliveryCommissionAgg._sum.platformCommission ?? 0);

    return {
      generatedAt: new Date().toISOString(),
      range: { from: fromKey, to: toKey },
      rides: {
        active: ridesActive,
        completedInRange: ridesCompletedInRange,
        totalInRange: ridesTotalInRange,
        promoAdjustedInRange: ridesPromoAdjusted,
        commissionInRange: rideCommission
      },
      deliveries: {
        active: deliveriesActive,
        completedInRange: deliveriesCompletedInRange,
        totalInRange: deliveriesTotalInRange,
        commissionInRange: deliveryCommission
      },
      riders: {
        total: ridersTotal,
        online: ridersOnline,
        withCoords: ridersWithCoords,
        suspended: ridersSuspended,
        pending: ridersByStatus.PENDING,
        verified: ridersByStatus.APPROVED,
        rejected: ridersByStatus.REJECTED,
        underReview: Math.max(
          0,
          ridersTotal -
            ridersByStatus.PENDING -
            ridersByStatus.APPROVED -
            ridersByStatus.REJECTED -
            ridersByStatus.SUSPENDED
        ),
        withEarnings: ridersWithEarnings
      },
      passengers: {
        total: passengersTotal,
        pending: passengersPending,
        verified: passengersVerified
      },
      finance: {
        pendingPayoutRequests,
        requestedRiderPayouts,
        riderWalletTxCount,
        commissionInRange: rideCommission + deliveryCommission
      },
      ratings: { total: ratingsTotal },
      zones: { active: zonesActive },
      support: { openTickets: openSupportTickets },
      sos: { open: openSos },
      incidents: { riderRelated: riderIncidents },
      documents: { pendingOrMissing: pendingDocuments },
      adminAccounts: { total: adminAccounts },
      weeklyRides: dailyRideCounts,
      recentActivity: {
        rides: recentCompletedRides.map((r) => ({
          id: r.id,
          createdAt: (r.completedAt ?? r.createdAt).toISOString(),
          passengerName: r.passenger.user.fullName,
          riderName: r.rider?.user.fullName ?? null
        })),
        deliveries: recentDeliveries.map((d) => ({
          id: d.id,
          createdAt: (d.deliveredAt ?? d.createdAt).toISOString(),
          passengerName: d.passenger.user.fullName,
          recipientName: d.recipientName
        }))
      }
    };
  }

  // ── Finance summary (payments / reports / earnings KPIs) ───────────────

  async getFinanceSummary(token: string, query?: { from?: string; to?: string }) {
    await this.verifyAdmin(token);

    const { fromKey, toKey, rangeStart, rangeEnd, dayKeys } = resolveDateRange(query, 30);
    const chartKeys = dayKeys.length > 31 ? dayKeys.slice(-31) : dayKeys;
    const chartStart = new Date(`${chartKeys[0]}T00:00:00.000Z`);
    const chartEnd = new Date(`${chartKeys[chartKeys.length - 1]}T23:59:59.999Z`);

    const pendingPayoutStatuses = ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"] as const;

    const [
      rideFinance,
      deliveryFinance,
      paidPayoutAgg,
      pendingPayoutAgg,
      walletStatusGroups,
      postedWalletVolumeRows,
      lockedBalanceAgg,
      paymentMethodRows,
      dailyFinanceRows,
      dailyPayoutRows,
      topRiderRows
    ] = await Promise.all([
      prisma.$queryRaw<Array<{ revenue: unknown; commission: unknown; earnings: unknown; trips: number }>>`
        SELECT
          COALESCE(SUM(COALESCE("finalFare", "estimatedFare")), 0) AS revenue,
          COALESCE(SUM("platformCommission"), 0) AS commission,
          COALESCE(SUM("riderEarnings"), 0) AS earnings,
          COUNT(*)::int AS trips
        FROM "Ride"
        WHERE status = 'COMPLETED'
          AND "createdAt" >= ${rangeStart}
          AND "createdAt" <= ${rangeEnd}
      `,
      prisma.$queryRaw<Array<{ revenue: unknown; commission: unknown; earnings: unknown; trips: number }>>`
        SELECT
          COALESCE(SUM(COALESCE("finalFee", "estimatedFee")), 0) AS revenue,
          COALESCE(SUM("platformCommission"), 0) AS commission,
          COALESCE(SUM("riderEarnings"), 0) AS earnings,
          COUNT(*)::int AS trips
        FROM "DeliveryRequest"
        WHERE status = 'DELIVERED'
          AND "createdAt" >= ${rangeStart}
          AND "createdAt" <= ${rangeEnd}
      `,
      prisma.payoutRequest.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: rangeStart, lte: rangeEnd }
        },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: [...pendingPayoutStatuses] } },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.walletTransaction.groupBy({
        by: ["status"],
        where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
        _count: { _all: true }
      }),
      prisma.$queryRaw<Array<{ volume: unknown }>>`
        SELECT COALESCE(SUM(ABS(amount)), 0) AS volume
        FROM "WalletTransaction"
        WHERE status = 'POSTED'
          AND "createdAt" >= ${rangeStart}
          AND "createdAt" <= ${rangeEnd}
      `,
      prisma.wallet.aggregate({
        where: {
          type: { in: ["RIDER_SETTLEMENT", "RIDER_BONUS"] },
          isActive: true
        },
        _sum: { lockedBalance: true, availableBalance: true }
      }),
      prisma.$queryRaw<Array<{ method: string; amount: unknown }>>`
        SELECT method::text AS method, COALESCE(SUM(amount), 0) AS amount
        FROM "Payment"
        WHERE status = 'CAPTURED'
          AND "createdAt" >= ${rangeStart}
          AND "createdAt" <= ${rangeEnd}
        GROUP BY method
        ORDER BY amount DESC
      `,
      prisma.$queryRaw<
        Array<{
          key: string;
          revenue: unknown;
          commission: unknown;
          riderEarnings: unknown;
          rides: number;
          deliveries: number;
        }>
      >`
        SELECT
          key,
          SUM(revenue) AS revenue,
          SUM(commission) AS commission,
          SUM(earnings) AS "riderEarnings",
          SUM(rides)::int AS rides,
          SUM(deliveries)::int AS deliveries
        FROM (
          SELECT
            to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS key,
            COALESCE("finalFare", "estimatedFare") AS revenue,
            COALESCE("platformCommission", 0) AS commission,
            COALESCE("riderEarnings", 0) AS earnings,
            1 AS rides,
            0 AS deliveries
          FROM "Ride"
          WHERE status = 'COMPLETED'
            AND "createdAt" >= ${chartStart}
            AND "createdAt" <= ${chartEnd}
          UNION ALL
          SELECT
            to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS key,
            COALESCE("finalFee", "estimatedFee") AS revenue,
            COALESCE("platformCommission", 0) AS commission,
            COALESCE("riderEarnings", 0) AS earnings,
            0 AS rides,
            1 AS deliveries
          FROM "DeliveryRequest"
          WHERE status = 'DELIVERED'
            AND "createdAt" >= ${chartStart}
            AND "createdAt" <= ${chartEnd}
        ) buckets
        GROUP BY key
        ORDER BY key
      `,
      prisma.$queryRaw<Array<{ key: string; payouts: unknown }>>`
        SELECT
          to_char("paidAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS key,
          COALESCE(SUM(amount), 0) AS payouts
        FROM "PayoutRequest"
        WHERE status = 'PAID'
          AND "paidAt" >= ${chartStart}
          AND "paidAt" <= ${chartEnd}
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<
        Array<{
          riderId: string;
          name: string;
          displayCode: string;
          completedCount: number;
          revenue: unknown;
          commission: unknown;
          earnings: unknown;
          averageRating: unknown;
          ratingCount: number;
          payoutTotal: unknown;
        }>
      >`
        SELECT
          rp.id AS "riderId",
          u."fullName" AS name,
          rp."displayCode" AS "displayCode",
          COALESCE(stats.completed_count, 0)::int AS "completedCount",
          COALESCE(stats.revenue, 0) AS revenue,
          COALESCE(stats.commission, 0) AS commission,
          COALESCE(stats.earnings, 0) AS earnings,
          COALESCE(rating_stats.avg_score, 0) AS "averageRating",
          COALESCE(rating_stats.rating_count, 0)::int AS "ratingCount",
          COALESCE(payout_stats.payout_total, 0) AS "payoutTotal"
        FROM "RiderProfile" rp
        INNER JOIN "User" u ON u.id = rp."userId"
        INNER JOIN (
          SELECT
            "riderId",
            COUNT(*)::int AS completed_count,
            SUM(COALESCE("finalFare", "estimatedFare")) AS revenue,
            SUM(COALESCE("platformCommission", 0)) AS commission,
            SUM(COALESCE("riderEarnings", 0)) AS earnings
          FROM "Ride"
          WHERE status = 'COMPLETED'
            AND "riderId" IS NOT NULL
            AND "createdAt" >= ${rangeStart}
            AND "createdAt" <= ${rangeEnd}
          GROUP BY "riderId"
        ) stats ON stats."riderId" = rp.id
        LEFT JOIN (
          SELECT
            rp2.id AS rider_id,
            AVG(r.score)::float AS avg_score,
            COUNT(*)::int AS rating_count
          FROM "Rating" r
          INNER JOIN "User" rated ON rated.id = r."ratedUserId"
          INNER JOIN "RiderProfile" rp2 ON rp2."userId" = rated.id
          GROUP BY rp2.id
        ) rating_stats ON rating_stats.rider_id = rp.id
        LEFT JOIN (
          SELECT
            "riderId",
            SUM(amount) AS payout_total
          FROM "PayoutRequest"
          WHERE status = 'PAID'
            AND "paidAt" >= ${rangeStart}
            AND "paidAt" <= ${rangeEnd}
          GROUP BY "riderId"
        ) payout_stats ON payout_stats."riderId" = rp.id
        WHERE u."deletedAt" IS NULL
        ORDER BY stats.completed_count DESC, stats.earnings DESC
        LIMIT 50
      `
    ]);

    const rideRevenue = num(rideFinance[0]?.revenue);
    const rideCommission = num(rideFinance[0]?.commission);
    const rideEarnings = num(rideFinance[0]?.earnings);
    const deliveryRevenue = num(deliveryFinance[0]?.revenue);
    const deliveryCommission = num(deliveryFinance[0]?.commission);
    const deliveryEarnings = num(deliveryFinance[0]?.earnings);
    const totalRevenue = rideRevenue + deliveryRevenue;
    const totalCommission = rideCommission + deliveryCommission;
    const riderEarningsTotal = rideEarnings + deliveryEarnings;
    const payoutOutflow = num(paidPayoutAgg._sum.amount);
    const pendingPayoutValue = num(pendingPayoutAgg._sum.amount);
    const platformNetProfit = totalCommission - payoutOutflow;
    const profitMargin = totalRevenue > 0 ? (platformNetProfit / totalRevenue) * 100 : 0;

    const walletCounts = { posted: 0, pending: 0, failed: 0 };
    for (const row of walletStatusGroups) {
      const status = String(row.status).toUpperCase();
      if (status === "POSTED") walletCounts.posted = row._count._all;
      else if (status === "PENDING") walletCounts.pending = row._count._all;
      else if (status === "FAILED" || status === "REVERSED") {
        walletCounts.failed += row._count._all;
      }
    }

    const financeByKey = new Map(dailyFinanceRows.map((row) => [row.key, row]));
    const payoutByKey = new Map(dailyPayoutRows.map((row) => [row.key, row]));

    const daily = chartKeys.map((key) => {
      const finance = financeByKey.get(key);
      const payout = payoutByKey.get(key);
      return {
        key,
        revenue: num(finance?.revenue),
        commission: num(finance?.commission),
        riderEarnings: num(finance?.riderEarnings),
        rides: finance?.rides ?? 0,
        deliveries: finance?.deliveries ?? 0,
        payouts: num(payout?.payouts)
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      range: { from: fromKey, to: toKey },
      revenue: {
        rides: rideRevenue,
        deliveries: deliveryRevenue,
        total: totalRevenue
      },
      commission: {
        rides: rideCommission,
        deliveries: deliveryCommission,
        total: totalCommission
      },
      riderEarningsTotal,
      payouts: {
        paidOutflow: payoutOutflow,
        paidCount: paidPayoutAgg._count._all,
        pendingValue: pendingPayoutValue,
        pendingCount: pendingPayoutAgg._count._all
      },
      wallet: {
        postedVolume: num(postedWalletVolumeRows[0]?.volume),
        postedCount: walletCounts.posted,
        pendingCount: walletCounts.pending,
        failedCount: walletCounts.failed,
        lockedBalance: num(lockedBalanceAgg._sum.lockedBalance),
        availableBalance: num(lockedBalanceAgg._sum.availableBalance)
      },
      platformNetProfit,
      profitMargin,
      paymentMethods: paymentMethodRows.map((row) => [row.method, num(row.amount)] as [string, number]),
      daily,
      topRiders: topRiderRows.map((row) => ({
        riderId: row.riderId,
        name: row.name,
        displayCode: row.displayCode,
        completedCount: row.completedCount,
        revenue: num(row.revenue),
        commission: num(row.commission),
        earnings: num(row.earnings),
        averageRating: num(row.averageRating),
        ratingCount: row.ratingCount,
        payoutTotal: num(row.payoutTotal)
      }))
    };
  }

  // ── Live snapshot (SSE) ────────────────────────────────────────────────

  async getLiveSnapshot(token: string) {
    await this.verifyAdmin(token);
    return this.buildLiveSnapshot();
  }

  /** No auth here — callers must verify the session first (SSE loop reuses one check). */
  async buildLiveSnapshot() {
    const liveFleet = liveLocationService.getAllAdminFleet();

    const [dbRiders, sosIncidents] = await Promise.all([
      prisma.riderProfile.findMany({
        where: {
          deletedAt: null,
          onlineStatus: true,
          currentLatitude: { not: null },
          currentLongitude: { not: null }
        },
        take: 500,
        select: {
          id: true,
          displayCode: true,
          currentLatitude: true,
          currentLongitude: true,
          user: { select: { fullName: true } }
        }
      }),
      prisma.incident.findMany({
        where: {
          deletedAt: null,
          status: { in: ["OPEN", "UNDER_REVIEW"] },
          OR: [{ severity: "CRITICAL" }, { category: { contains: "SOS", mode: "insensitive" } }]
        },
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          severity: true,
          status: true,
          category: true,
          description: true,
          createdAt: true,
          reporter: { select: { fullName: true, phoneE164: true } }
        }
      })
    ]);

    const combinedRiders: Array<{
      id: string;
      displayCode: string;
      name: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      status?: string;
      plateNumber?: string | null;
    }> = [];

    const seenIds = new Set<string>();

    for (const lf of liveFleet) {
      seenIds.add(lf.riderId);
      combinedRiders.push({
        id: lf.riderId,
        displayCode: lf.riderId.slice(-6).toUpperCase(),
        name: lf.displayName,
        latitude: lf.latitude,
        longitude: lf.longitude,
        speed: lf.speed,
        heading: lf.heading,
        status: lf.status,
        plateNumber: lf.vehiclePlate
      });
    }

    for (const dbr of dbRiders) {
      if (!seenIds.has(dbr.id)) {
        combinedRiders.push({
          id: dbr.id,
          displayCode: dbr.displayCode,
          name: dbr.user.fullName,
          latitude: Number(dbr.currentLatitude),
          longitude: Number(dbr.currentLongitude),
          speed: 0,
          heading: 0,
          status: "ONLINE"
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      riders: combinedRiders,
      sos: sosIncidents
    };
  }
}
