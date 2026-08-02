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
  adminOpsSummaryQuerySchema,
  adminFinanceSummaryQuerySchema
} from "./admin.schemas.js";

import { prisma } from "../../common/prisma.js";

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
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: { actor: { select: { id: true, fullName: true, email: true } } }
    });
    if (!query.page) return logs;
    const total = await prisma.auditLog.count();
    return { data: logs, total, page: query.page, limit };
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
};
