import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody } from "../../common/validation.js";
import {
  adminChangePasswordSchema,
  adminLoginSchema,
  adminProfileUpdateSchema,
  adminSessionParamsSchema,
  adminTotpCodeSchema,
  adminUserParamsSchema,
  avatarUploadSchema,
  forgotPasswordSchema,
  otpRequestSchema,
  otpVerifySchema,
  passengerLoginSchema,
  passengerSettingsUpdateSchema,
  passengerSignupSchema,
  resetPasswordSchema,
  riderLoginSchema,
  riderSettingsUpdateSchema,
  riderSignupSchema,
  riderVehicleUpdateSchema
} from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";
import { parseParams } from "../../common/validation.js";

const authService = new AuthService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.post("/auth/passenger/signup", async (request, reply) => {
    const input = parseBody(request, passengerSignupSchema);
    const session = await authService.signupPassenger(input);
    return reply.status(201).send(session);
  });

  server.post(
    "/auth/passenger/login",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request) => {
      const input = parseBody(request, passengerLoginSchema);
      if (!input.device?.userAgent && request.headers["user-agent"]) {
        input.device = { ...input.device, userAgent: request.headers["user-agent"] };
      }
      return authService.loginPassenger(input, request.ip);
    }
  );

  server.post("/auth/rider/signup", async (request, reply) => {
    const input = parseBody(request, riderSignupSchema);
    const session = await authService.signupRider(input);
    return reply.status(201).send(session);
  });

  server.post(
    "/auth/rider/login",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request) => {
      const input = parseBody(request, riderLoginSchema);
      if (!input.device?.userAgent && request.headers["user-agent"]) {
        input.device = { ...input.device, userAgent: request.headers["user-agent"] };
      }
      return authService.loginRider(input, request.ip);
    }
  );

  server.post(
    "/auth/admin/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const input = parseBody(request, adminLoginSchema);
      if (!input.device?.userAgent && request.headers["user-agent"]) {
        input.device = { ...input.device, userAgent: request.headers["user-agent"] };
      }
      return authService.loginAdmin(input, request.ip);
    }
  );

  server.get("/auth/admin/2fa", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getAdminTotpStatus(token);
  });

  server.post("/auth/admin/2fa/setup", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.setupAdminTotp(token);
  });

  server.post("/auth/admin/2fa/enable", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminTotpCodeSchema);
    return authService.enableAdminTotp(token, input.code);
  });

  server.post("/auth/admin/2fa/disable", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminTotpCodeSchema);
    return authService.disableAdminTotp(token, input.code);
  });

  server.get("/auth/admin/2fa/backup-codes", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getAdminBackupCodeStatus(token);
  });

  server.post("/auth/admin/2fa/backup-codes/generate", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminTotpCodeSchema);
    return authService.generateAdminBackupCodes(token, input.code);
  });

  server.post("/auth/admin/change-password", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminChangePasswordSchema);
    return authService.changeAdminPassword(token, input);
  });

  server.patch("/auth/admin/profile", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, adminProfileUpdateSchema);
    return authService.updateAdminProfile(token, input);
  });

  server.get("/auth/admin/sessions", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.listAdminSessions(token);
  });

  server.post("/auth/admin/sessions/logout-others", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.logoutOtherAdminSessions(token);
  });

  server.post("/auth/admin/sessions/:sessionId/revoke", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, adminSessionParamsSchema);
    return authService.revokeAdminSession(token, params.sessionId);
  });

  server.get("/auth/admin/login-activity", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.listAdminLoginActivity(token);
  });

  server.get("/auth/session", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getSessionByToken(token);
  });

  server.get("/auth/passenger/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getPassengerSettings(token);
  });

  server.patch("/auth/passenger/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, passengerSettingsUpdateSchema);
    return authService.updatePassengerSettings(token, input);
  });

  server.get("/auth/rider/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getRiderSettings(token);
  });

  server.patch("/auth/rider/settings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, riderSettingsUpdateSchema);
    return authService.updateRiderSettings(token, input);
  });

  server.patch("/auth/rider/vehicle", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, riderVehicleUpdateSchema);
    return authService.updateRiderVehicle(token, input);
  });

  server.get("/auth/rider/profile", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getRiderFullProfile(token);
  });

  server.get("/rider/performance", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getRiderPerformance(token);
  });

  server.get("/rider/achievements", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getRiderAchievements(token);
  });

  server.get("/rider/demand", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.getRiderDemand(token);
  });

  server.post("/auth/logout", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.logout(token);
  });

  server.post(
    "/auth/otp/request",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (request) => {
      const input = parseBody(request, otpRequestSchema);
      return authService.requestPhoneOtp(input);
    },
  );

  server.post(
    "/auth/otp/verify",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (request) => {
      const input = parseBody(request, otpVerifySchema);
      return authService.verifyPhoneOtp(input);
    },
  );

  server.post("/auth/avatar", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, avatarUploadSchema);
    return authService.uploadAvatar(token, input);
  });

  server.post(
    "/auth/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request) => {
      const input = parseBody(request, forgotPasswordSchema);
      return authService.forgotPassword(input);
    }
  );

  server.post(
    "/auth/reset-password",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request) => {
      const input = parseBody(request, resetPasswordSchema);
      return authService.resetPassword(input);
    }
  );
};
