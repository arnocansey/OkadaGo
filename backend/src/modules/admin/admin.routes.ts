import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody } from "../../common/validation.js";
import { adminPromoteSchema, adminRegisterSchema } from "../auth/auth.schemas.js";
import { AuthService } from "../auth/auth.service.js";

const authService = new AuthService();

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
};
