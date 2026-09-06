import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import { adminPromoteSchema, adminRegisterSchema, adminUserParamsSchema } from "../auth/auth.schemas.js";
import { AuthService } from "../auth/auth.service.js";
import { adminRatingsQuerySchema } from "../ratings/rating.schemas.js";
import { RatingService } from "../ratings/rating.service.js";
import { WalletService } from "../wallets/wallet.service.js";
import {
  adminPayoutRequestsQuerySchema,
  adminPayoutReviewParamsSchema,
  adminPayoutReviewSchema,
  adminRiderPayoutAccountsQuerySchema,
  adminWalletTransactionsQuerySchema
} from "../wallets/wallet.schemas.js";
import { AdminRiderService } from "./admin.service.js";
import { AdminOpsService } from "./admin-ops.service.js";
import { AdminConsoleService } from "./admin-console.service.js";
import {
  riderApprovalParamsSchema,
  riderApprovalSchema,
  riderSuspensionParamsSchema,
  riderSuspensionSchema,
  createEscalationRuleSchema,
  updateEscalationRuleSchema,
  escalationRuleParamsSchema,
  createScheduledBroadcastSchema,
  scheduledBroadcastParamsSchema,
  adminNotesQuerySchema,
  createAdminNoteSchema,
  updatePlatformSettingsSchema,
  settingImageUploadSchema,
  riderRequestInfoSchema,
  adminExportParamsSchema,
  adminAuditLogsQuerySchema,
  adminAccessLogsQuerySchema,
  adminUnauthorizedUsersQuerySchema,
  adminDeleteUserParamsSchema,
  adminDeleteUserBodySchema,
  adminOpsSummaryQuerySchema,
  adminFinanceSummaryQuerySchema
} from "./admin.schemas.js";

import { prisma } from "../../common/prisma.js";
import { assignmentService } from "./assignment.service.js";
import { assignRiderSchema, reassignRiderSchema, rideParamsSchema } from "./assignment.schemas.js";
import { z } from "zod";

const authService = new AuthService();
const walletService = new WalletService();
const ratingService = new RatingService();
const adminRiderService = new AdminRiderService();
const adminOpsService = new AdminOpsService();
const adminConsoleService = new AdminConsoleService();

const LIVE_STREAM_INTERVAL_MS = 12000;

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const adminRoutes: FastifyPluginAsync = async (server) => {
  server.get("/admin/accounts", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.listAdmins(token);
  });

  server.post("/admin/accounts", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminRegisterSchema);
    const session = await authService.createAdminByAdmin(token, input);
    return reply.status(201).send(session);
  });

  server.post("/admin/accounts/create", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminRegisterSchema);
    const session = await authService.createAdminByAdmin(token, input);
    return reply.status(201).send(session);
  });

  server.post("/admin/accounts/promote", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminPromoteSchema);
    const promoted = await authService.promotePassengerToAdminByAdmin(token, input);
    return reply.status(201).send(promoted);
  });

  server.delete("/admin/accounts/:userId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, adminUserParamsSchema);
    return authService.softDeleteAdmin(token, params.userId);
  });

  server.get("/admin/permissions", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return {
      roles: {
        passenger: [
          "rides:create",
          "rides:cancel:self",
          "wallets:read:self",
          "support:create:self"
        ],
        rider: [
          "availability:update:self",
          "rides:accept:self",
          "rides:progress:self",
          "payouts:create:self"
        ],
        dispatcher: [
          "rides:read:any",
          "rides:reassign:any",
          "support:manage:any",
          "incidents:manage:any"
        ],
        admin: [
          "users:manage:any",
          "pricing:manage:any",
          "wallets:manage:any",
          "analytics:read:any",
          "audit:read:any"
        ]
      }
    };
  });

  server.get("/admin/modules", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return {
      modules: [
        "dashboard-overview",
        "riders-and-documents",
        "passengers",
        "trips-and-live-map",
        "pricing-and-zones",
        "wallets-payouts-and-commissions",
        "promotions-and-referrals",
        "incidents-disputes-and-audit"
      ]
    };
  });

  server.get("/admin/audit-logs", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const query = parseQuery(request, adminAuditLogsQuerySchema);
    const limit = query.limit ?? 50;
    const skip = query.page ? (query.page - 1) * limit : query.offset ?? 0;

    const where: {
      actorRole?: any;
      action?: any;
      OR?: any[];
    } = {};

    if (query.role && query.role !== "ALL") {
      where.actorRole = query.role;
    }
    if (query.action) {
      where.action = { contains: query.action, mode: "insensitive" };
    }
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: "insensitive" } },
        { entityType: { contains: query.search, mode: "insensitive" } },
        { ipAddress: { contains: query.search, mode: "insensitive" } },
        { actor: { fullName: { contains: query.search, mode: "insensitive" } } },
        { actor: { email: { contains: query.search, mode: "insensitive" } } },
        { actor: { phoneE164: { contains: query.search, mode: "insensitive" } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneE164: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    if (!query.page) return logs;
    return { data: logs, total, page: query.page, limit };
  });

  server.get("/admin/access-logs", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const query = parseQuery(request, adminAccessLogsQuerySchema);
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;

    const now = new Date();
    const where: {
      user: {
        deletedAt: null;
        role?: any;
        OR?: any[];
      };
      revokedAt?: any;
      expiresAt?: any;
    } = {
      user: {
        deletedAt: null
      }
    };

    if (query.role && query.role !== "ALL") {
      where.user.role = query.role;
    } else {
      where.user.role = { in: ["PASSENGER", "RIDER"] };
    }

    if (query.status === "ACTIVE") {
      where.revokedAt = null;
      where.expiresAt = { gt: now };
    } else if (query.status === "REVOKED") {
      where.revokedAt = { not: null };
    } else if (query.status === "EXPIRED") {
      where.revokedAt = null;
      where.expiresAt = { lte: now };
    }

    if (query.search) {
      where.user.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { phoneE164: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { id: { contains: query.search, mode: "insensitive" } }
      ];
    }

    const [sessions, total] = await Promise.all([
      prisma.userSession.findMany({
        where,
        orderBy: { lastUsedAt: "desc" },
        take: limit,
        skip,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneE164: true,
              role: true,
              accountStatus: true,
              avatarUrl: true,
              createdAt: true,
              passengerProfile: { select: { id: true, defaultServiceCity: true } },
              riderProfile: { select: { id: true, displayCode: true, city: true, approvalStatus: true } }
            }
          }
        }
      }),
      prisma.userSession.count({ where })
    ]);

    const formatted = sessions.map((s) => {
      const isRevoked = Boolean(s.revokedAt);
      const isExpired = s.expiresAt <= now;
      const status = isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE";

      return {
        id: s.id,
        userId: s.userId,
        role: s.user.role,
        status,
        ipAddress: s.ipAddress || "Unknown IP",
        userAgent: s.userAgent || "Unknown Device",
        lastUsedAt: s.lastUsedAt?.toISOString() ?? s.createdAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        revokedAt: s.revokedAt?.toISOString() ?? null,
        user: {
          id: s.user.id,
          fullName: s.user.fullName,
          email: s.user.email,
          phoneE164: s.user.phoneE164,
          accountStatus: s.user.accountStatus,
          avatarUrl: s.user.avatarUrl,
          profileId: s.user.passengerProfile?.id ?? s.user.riderProfile?.id ?? null,
          displayCode: s.user.riderProfile?.displayCode ?? null,
          city: s.user.passengerProfile?.defaultServiceCity ?? s.user.riderProfile?.city ?? null
        }
      };
    });

    return { data: formatted, total, page, limit };
  });

  server.post("/admin/access-logs/:sessionId/revoke", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const adminSession = await authService.requireAdminSession(token);
    const params = request.params as { sessionId: string };

    const session = await prisma.userSession.findUnique({
      where: { id: params.sessionId },
      include: { user: true }
    });

    if (!session) {
      throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
    }

    await prisma.userSession.update({
      where: { id: params.sessionId },
      data: { revokedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminSession.userId,
        actorRole: "ADMIN",
        action: "ADMIN_REVOKE_USER_SESSION",
        entityType: "UserSession",
        entityId: params.sessionId,
        changes: {
          targetUserId: session.userId,
          targetUserRole: session.user.role,
          targetUserName: session.user.fullName
        }
      }
    });

    return { success: true, message: "Session revoked successfully." };
  });

  server.get("/admin/unauthorized-users", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const query = parseQuery(request, adminUnauthorizedUsersQuerySchema);
    const limit = query.limit ?? 50;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      role: { in: ["PASSENGER", "RIDER"] },
      OR: [
        { accountStatus: { in: ["PENDING_VERIFICATION", "SUSPENDED", "BANNED"] } },
        { isPhoneVerified: false },
        { riderProfile: { approvalStatus: { in: ["PENDING", "REJECTED", "SUSPENDED"] } } }
      ]
    };

    if (query.role && query.role !== "ALL") {
      where.role = query.role;
    }
    if (query.status && query.status !== "ALL") {
      where.accountStatus = query.status;
    }
    if (query.search) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: query.search, mode: "insensitive" } },
            { phoneE164: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { id: { contains: query.search, mode: "insensitive" } }
          ]
        }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          passengerProfile: true,
          riderProfile: true,
          sessions: {
            where: { revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formatted = users.map((u) => {
      let unauthorizedReason = "Pending phone/account verification";
      if (u.accountStatus === "BANNED") {
        unauthorizedReason = "Account banned by system/policy";
      } else if (u.accountStatus === "SUSPENDED") {
        unauthorizedReason = u.riderProfile?.suspensionReason || "Account suspended";
      } else if (u.riderProfile?.approvalStatus === "REJECTED") {
        unauthorizedReason = "Rider documents/application rejected";
      } else if (u.riderProfile?.approvalStatus === "PENDING") {
        unauthorizedReason = "Rider onboarding pending approval";
      } else if (!u.isPhoneVerified) {
        unauthorizedReason = "Unverified phone number";
      }

      return {
        id: u.id,
        role: u.role,
        fullName: u.fullName,
        email: u.email,
        phoneE164: u.phoneE164,
        accountStatus: u.accountStatus,
        isPhoneVerified: u.isPhoneVerified,
        createdAt: u.createdAt.toISOString(),
        unauthorizedReason,
        activeSessionCount: u.sessions.length,
        profileId: u.passengerProfile?.id ?? u.riderProfile?.id ?? null,
        displayCode: u.riderProfile?.displayCode ?? null
      };
    });

    return { data: formatted, total, page, limit };
  });

  server.delete("/admin/users/:userId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const adminSession = await authService.requireAdminSession(token);
    const params = parseParams(request, adminDeleteUserParamsSchema);
    const body = parseBody(request, adminDeleteUserBodySchema);

    if (adminSession.userId === params.userId) {
      throw new AppError("You cannot delete your own admin account", 400, "CANNOT_DELETE_SELF");
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: params.userId, deletedAt: null },
      include: { adminProfile: true, passengerProfile: true, riderProfile: true }
    });

    if (!targetUser) {
      throw new AppError("User not found or already deleted", 404, "USER_NOT_FOUND");
    }

    // Safety guard: Protect master administrators
    if (targetUser.role === "ADMIN") {
      throw new AppError(
        "Admin accounts cannot be deleted from this screen. Use Administrator Management.",
        403,
        "CANNOT_DELETE_ADMIN_HERE"
      );
    }

    // Revoke all active sessions and soft-delete user safely
    await prisma.$transaction([
      prisma.user.update({
        where: { id: params.userId },
        data: {
          deletedAt: new Date(),
          accountStatus: "BANNED"
        }
      }),
      prisma.userSession.updateMany({
        where: { userId: params.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await prisma.auditLog.create({
      data: {
        actorUserId: adminSession.userId,
        actorRole: "ADMIN",
        action: "ADMIN_DELETE_UNAUTHORIZED_USER",
        entityType: "User",
        entityId: params.userId,
        changes: {
          targetUserId: targetUser.id,
          targetRole: targetUser.role,
          targetName: targetUser.fullName,
          targetPhone: targetUser.phoneE164,
          reason: body.reason || "Unauthorized account removal"
        }
      }
    });

    return {
      success: true,
      userId: params.userId,
      message: `User ${targetUser.fullName} deleted successfully and all sessions revoked.`
    };
  });

  server.get("/admin/payments/wallet-transactions", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminWalletTransactionsQuerySchema);
    return walletService.listAdminWalletTransactions(token, query);
  });

  server.get("/admin/payments/payout-requests", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminPayoutRequestsQuerySchema);
    return walletService.listAdminPayoutRequests(token, query);
  });

  server.get("/admin/payments/rider-payout-accounts", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminRiderPayoutAccountsQuerySchema);
    return walletService.listAdminRiderPayoutAccounts(token, query);
  });

  server.patch("/admin/payments/payout-requests/:payoutRequestId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, adminPayoutReviewParamsSchema);
    const input = parseBody(request, adminPayoutReviewSchema);
    return walletService.reviewAdminPayoutRequest(token, params.payoutRequestId, input);
  });

  server.get("/admin/ratings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminRatingsQuerySchema);
    return ratingService.listAdminRatings(token, query);
  });

  server.get("/admin/user-stats", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return adminRiderService.getUserStats(token);
  });

  server.get("/admin/ops-summary", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminOpsSummaryQuerySchema);
    return adminConsoleService.getOpsSummary(token, query);
  });

  server.get("/admin/finance-summary", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminFinanceSummaryQuerySchema);
    return adminConsoleService.getFinanceSummary(token, query);
  });

  server.get("/admin/riders", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = request.query as { status?: string; search?: string; limit?: number };
    return adminRiderService.listRiders(token, query);
  });

  server.patch("/admin/riders/:riderProfileId/approval", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderApprovalParamsSchema);
    const input = parseBody(request, riderApprovalSchema);
    return adminRiderService.approveRider(token, params.riderProfileId, input);
  });

  server.patch("/admin/riders/:riderProfileId/suspension", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderSuspensionParamsSchema);
    const input = parseBody(request, riderSuspensionSchema);
    return adminRiderService.suspendRider(token, params.riderProfileId, input);
  });

  server.get("/admin/escalation-rules", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return adminOpsService.listEscalationRules(token);
  });

  server.post("/admin/escalation-rules", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createEscalationRuleSchema);
    const rule = await adminOpsService.createEscalationRule(token, input);
    return reply.status(201).send(rule);
  });

  server.patch("/admin/escalation-rules/:ruleId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, escalationRuleParamsSchema);
    const input = parseBody(request, updateEscalationRuleSchema);
    return adminOpsService.updateEscalationRule(token, params.ruleId, input);
  });

  server.get("/admin/scheduled-broadcasts", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return adminOpsService.listScheduledBroadcasts(token);
  });

  server.post("/admin/scheduled-broadcasts", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createScheduledBroadcastSchema);
    const broadcast = await adminOpsService.createScheduledBroadcast(token, input);
    return reply.status(201).send(broadcast);
  });

  server.patch("/admin/scheduled-broadcasts/:broadcastId/cancel", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, scheduledBroadcastParamsSchema);
    return adminOpsService.cancelScheduledBroadcast(token, params.broadcastId);
  });

  server.post("/admin/scheduled-broadcasts/:broadcastId/retry", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, scheduledBroadcastParamsSchema);
    return adminOpsService.retryScheduledBroadcast(token, params.broadcastId);
  });

  server.get("/admin/ops-jobs/status", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return adminOpsService.getOpsJobStatus(token);
  });

  // ── Ops notes ──────────────────────────────────────────────────────────

  server.get("/admin/notes", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminNotesQuerySchema);
    return adminConsoleService.listNotes(token, query.entityType, query.entityId);
  });

  server.post("/admin/notes", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createAdminNoteSchema);
    const note = await adminConsoleService.createNote(token, input);
    return reply.status(201).send(note);
  });

  // ── Platform settings ──────────────────────────────────────────────────

  server.get("/admin/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return adminConsoleService.getSettings(token);
  });

  server.put("/admin/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, updatePlatformSettingsSchema);
    return adminConsoleService.updateSettings(token, input);
  });

  server.post("/admin/settings/upload-image", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, settingImageUploadSchema);
    return adminConsoleService.uploadSettingImage(token, input);
  });

  // ── Rider info request ─────────────────────────────────────────────────

  server.post("/admin/riders/:riderProfileId/request-info", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderSuspensionParamsSchema);
    const input = parseBody(request, riderRequestInfoSchema);
    const result = await adminConsoleService.requestRiderInfo(token, params.riderProfileId, input);
    return reply.status(201).send(result);
  });

  // ── Full CSV export ────────────────────────────────────────────────────

  server.get("/admin/export/:entity", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, adminExportParamsSchema);
    const { filename, csv } = await adminConsoleService.exportCsv(token, params.entity);
    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="${filename}"`);
    return reply.send(csv);
  });

  // ── Rider online/offline log ───────────────────────────────────────────────
  server.get("/admin/riders/:riderProfileId/online-log", async (request, reply) => {
    const params = parseParams(request, riderApprovalParamsSchema);
    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(Number(query.limit) || 50, 200);
    const offset = Number(query.offset) || 0;

    const logs = await prisma.riderOnlineLog.findMany({
      where: { riderProfileId: params.riderProfileId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        riderProfile: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    const total = await prisma.riderOnlineLog.count({
      where: { riderProfileId: params.riderProfileId },
    });

    return reply.send({ logs, total });
  });

  // ── Live ops stream (SSE) ──────────────────────────────────────────────
  // EventSource cannot set headers, so the session token arrives as a query param.

  server.get("/admin/stream", async (request, reply) => {
    const query = request.query as { token?: string };
    if (!query.token) {
      throw new AppError("A session token is required", 401, "AUTHORIZATION_REQUIRED");
    }

    // Throws if the token is not a valid admin session.
    const snapshot = await adminConsoleService.getLiveSnapshot(query.token);

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": request.headers.origin ?? "*"
    });

    const send = (payload: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    send(snapshot);

    const interval = setInterval(async () => {
      try {
        send(await adminConsoleService.buildLiveSnapshot());
      } catch {
        clearInterval(interval);
        reply.raw.end();
      }
    }, LIVE_STREAM_INTERVAL_MS);

    request.raw.on("close", () => {
      clearInterval(interval);
    });

    // Keep the reply open; Fastify must not try to serialize a return value.
    return reply;
  });

  // ── GoPoints ────────────────────────────────────────────────────────────

  const handleGetGoPointRules = async (request: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return prisma.goPointRule.findMany({ orderBy: { createdAt: "desc" } });
  };
  server.get("/admin/go-points/rules", handleGetGoPointRules);
  server.get("/admin/go-point-rules", handleGetGoPointRules);

  const handlePostGoPointRules = async (request: any, reply: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const body = request.body as { name: string; description?: string; eventType: string; points: number; perUnit?: number; minSpend?: number; active?: boolean };
    const rule = await prisma.goPointRule.create({ data: body });
    return reply.status(201).send(rule);
  };
  server.post("/admin/go-points/rules", handlePostGoPointRules);
  server.post("/admin/go-point-rules", handlePostGoPointRules);

  const handlePutGoPointRules = async (request: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const params = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    return prisma.goPointRule.update({ where: { id: params.id }, data: body });
  };
  server.put("/admin/go-points/rules/:id", handlePutGoPointRules);
  server.put("/admin/go-point-rules/:id", handlePutGoPointRules);

  const handleGetGoPointBalances = async (request: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return prisma.goPointBalance.findMany({
      include: { passenger: { include: { user: { select: { fullName: true, phoneE164: true } } } } },
      orderBy: { points: "desc" }
    });
  };
  server.get("/admin/go-points/balances", handleGetGoPointBalances);
  server.get("/admin/go-point-balances", handleGetGoPointBalances);

  const handleGetGoPointLedger = async (request: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const query = request.query as { passengerId?: string; limit?: string };
    const limit = Math.min(parseInt(query.limit ?? "100", 10) || 100, 500);
    return prisma.goPointLedger.findMany({
      where: query.passengerId ? { passengerId: query.passengerId } : {},
      include: { passenger: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  };
  server.get("/admin/go-points/ledger", handleGetGoPointLedger);
  server.get("/admin/go-point-ledger", handleGetGoPointLedger);

  const handleGetGoPointRedemptions = async (request: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return prisma.goPointRedemption.findMany({ orderBy: { pointsCost: "asc" } });
  };
  server.get("/admin/go-points/redemptions", handleGetGoPointRedemptions);
  server.get("/admin/go-point-redemptions", handleGetGoPointRedemptions);

  const handlePostGoPointRedemptions = async (request: any, reply: any) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const body = request.body as { name: string; description?: string; pointsCost: number; cashValue: number; available?: boolean };
    const item = await prisma.goPointRedemption.create({ data: body });
    return reply.status(201).send(item);
  };
  server.post("/admin/go-points/redemptions", handlePostGoPointRedemptions);
  server.post("/admin/go-point-redemptions", handlePostGoPointRedemptions);

  // ── Message Templates ───────────────────────────────────────────────────

  server.get("/admin/message-templates", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    return prisma.messageTemplate.findMany({ orderBy: { updatedAt: "desc" } });
  });

  server.post("/admin/message-templates", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const body = request.body as { name: string; category: string; channel: string; subject: string; body: string; active?: boolean };
    const template = await prisma.messageTemplate.create({ data: body });
    return reply.status(201).send(template);
  });

  server.put("/admin/message-templates/:id", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const params = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    return prisma.messageTemplate.update({ where: { id: params.id }, data: body });
  });

  server.delete("/admin/message-templates/:id", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    await authService.listAdmins(token);
    const params = request.params as { id: string };
    return prisma.messageTemplate.delete({ where: { id: params.id } });
  });

  // ── Rider Assignment ──────────────────────────────────────────────────────

  server.get("/admin/rides/active", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = (request.query ?? {}) as { status?: string };
    return assignmentService.getActiveRides(token, query.status);
  });

  server.get("/admin/rides/:rideId/available-riders", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    return assignmentService.getAvailableRiders(token, params.rideId);
  });

  server.post("/admin/rides/:rideId/assign-rider", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    const body = parseBody(request, assignRiderSchema);
    const result = await assignmentService.assignRider(token, params.rideId, body);
    return reply.status(201).send(result);
  });

  server.post("/admin/rides/:rideId/reassign-rider", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    const body = parseBody(request, reassignRiderSchema);
    const result = await assignmentService.reassignRider(token, params.rideId, body);
    return reply.status(201).send(result);
  });

  server.post("/admin/rides/:rideId/unassign-rider", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    return assignmentService.unassignRider(token, params.rideId);
  });

  server.post("/admin/rides/:rideId/auto-assign", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    const body = (request.body ?? {}) as { maxRadiusKm?: number };
    const result = await assignmentService.autoAssign(token, params.rideId, { maxRadiusKm: body.maxRadiusKm ?? 8 });
    return reply.status(201).send(result);
  });

  server.get("/admin/rides/:rideId/assignment-history", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    return assignmentService.getAssignmentHistory(token, params.rideId);
  });

  server.get("/admin/assignments/history", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = (request.query ?? {}) as { limit?: string };
    const limit = query.limit ? Math.min(100, Math.max(1, parseInt(query.limit, 10))) : 50;
    return assignmentService.getAllAssignmentHistory(token, limit);
  });

  server.get("/admin/rides/:rideId/timeline", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideParamsSchema);
    return assignmentService.getRideTimeline(token, params.rideId);
  });

  // ── Assignment Stats ──
  server.get("/admin/assignments/stats", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return assignmentService.getAssignmentStats(token);
  });

  // ── Assignment Rules CRUD ──
  server.get("/admin/assignment-rules", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return assignmentService.listRules(token);
  });

  server.post("/admin/assignment-rules", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const body = request.body as Record<string, unknown>;
    const ip = request.ip;
    const ua = request.headers["user-agent"];
    const rule = await assignmentService.createRule(token, body, ip, ua);
    return reply.status(201).send(rule);
  });

  server.put("/admin/assignment-rules/:ruleId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, z.object({ ruleId: z.string().cuid() }));
    const body = request.body as Record<string, unknown>;
    const ip = request.ip;
    const ua = request.headers["user-agent"];
    return assignmentService.updateRule(token, params.ruleId, body, ip, ua);
  });

  server.delete("/admin/assignment-rules/:ruleId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, z.object({ ruleId: z.string().cuid() }));
    const ip = request.ip;
    const ua = request.headers["user-agent"];
    return assignmentService.deleteRule(token, params.ruleId, ip, ua);
  });

  // ── Assignment Audit Logs ──
  server.get("/admin/assignment-audit-logs", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = request.query as { rideId?: string; action?: string; page?: string; limit?: string };
    return assignmentService.getAssignmentAuditLogs(token, {
      rideId: query.rideId,
      action: query.action,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined
    });
  });

  // ── Live Ops Map ──
  server.get("/admin/map/riders", async (request) => {
    extractBearerToken(request.headers.authorization);
    const query = request.query as { status?: string; type?: string; sos?: string; zoneId?: string };
    const where: any = { approvalStatus: "APPROVED" };
    if (query.zoneId) where.serviceZoneId = query.zoneId;
    if (query.status === "online") where.onlineStatus = true;
    if (query.status === "offline") where.onlineStatus = false;
    if (query.type) where.tripStatus = query.type;

    const riders = await prisma.riderProfile.findMany({
      where,
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        onlineStatus: true,
        tripStatus: true,
        serviceZoneId: true,
        user: { select: { fullName: true, phoneE164: true } },
      },
      take: 500,
    });
    return { riders };
  });

  server.get("/admin/map/rides", async (request) => {
    extractBearerToken(request.headers.authorization);
    const query = request.query as { status?: string; zoneId?: string };
    const where: any = {};
    if (query.status) where.status = query.status.toUpperCase();
    if (query.zoneId) where.serviceZoneId = query.zoneId;

    const rides = await prisma.ride.findMany({
      where,
      select: {
        id: true,
        status: true,
        pickupLatitude: true,
        pickupLongitude: true,
        destinationLatitude: true,
        destinationLongitude: true,
        pickupAddress: true,
        destinationAddress: true,
        routePolyline: true,
        serviceZoneId: true,
        rider: { select: { id: true, user: { select: { fullName: true } } } },
        passenger: { select: { id: true, user: { select: { fullName: true } } } },
      },
      orderBy: { requestedAt: "desc" },
      take: 200,
    });
    return { rides };
  });

  server.get("/admin/map/geofences", async (request) => {
    extractBearerToken(request.headers.authorization);
    const { geofenceService } = await import("../geofencing/geofence.service.js");
    return geofenceService.getGeofenceGeoJSON();
  });

  server.get("/admin/map/demand", async (request) => {
    extractBearerToken(request.headers.authorization);
    const { demandHeatMapService } = await import("../pricing/demand-heatmap.service.js");
    return demandHeatMapService.getDemandGeoJSON();
  });

  // ── Pricing Rules ──
  server.get("/admin/pricing-rules", async (request) => {
    extractBearerToken(request.headers.authorization);
    const { pricingRuleService } = await import("../pricing/pricing-rule.service.js");
    return pricingRuleService.listActiveRules();
  });

  server.post("/admin/pricing-rules", async (request) => {
    extractBearerToken(request.headers.authorization);
    const { pricingRuleService } = await import("../pricing/pricing-rule.service.js");
    return pricingRuleService.upsertRule(request.body as any);
  });

  server.patch("/admin/pricing-rules/:ruleId/deactivate", async (request) => {
    extractBearerToken(request.headers.authorization);
    const params = parseParams(request, z.object({ ruleId: z.string().cuid() }));
    const { pricingRuleService } = await import("../pricing/pricing-rule.service.js");
    await pricingRuleService.deactivateRule(params.ruleId);
    return { success: true };
  });
};
