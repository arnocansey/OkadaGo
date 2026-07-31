import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import type {
  CreateAdminNoteInput,
  RiderRequestInfoInput,
  UpdatePlatformSettingsInput
} from "./admin.schemas.js";

const EXPORT_ROW_CAP = 10_000;

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

  // ── Live snapshot (SSE) ────────────────────────────────────────────────

  async getLiveSnapshot(token: string) {
    await this.verifyAdmin(token);
    return this.buildLiveSnapshot();
  }

  /** No auth here — callers must verify the session first (SSE loop reuses one check). */
  async buildLiveSnapshot() {
    const [riders, sosIncidents] = await Promise.all([
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

    return {
      timestamp: new Date().toISOString(),
      riders: riders.map((r) => ({
        id: r.id,
        displayCode: r.displayCode,
        name: r.user.fullName,
        latitude: Number(r.currentLatitude),
        longitude: Number(r.currentLongitude)
      })),
      sos: sosIncidents
    };
  }
}
