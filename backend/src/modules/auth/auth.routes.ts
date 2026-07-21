import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody } from "../../common/validation.js";
import {
  adminLoginSchema,
  avatarUploadSchema,
  otpRequestSchema,
  otpVerifySchema,
  passengerLoginSchema,
  passengerSettingsUpdateSchema,
  passengerSignupSchema,
  riderLoginSchema,
  riderSettingsUpdateSchema,
  riderSignupSchema,
  riderVehicleUpdateSchema
} from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";

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

  server.post("/auth/passenger/login", async (request) => {
    const input = parseBody(request, passengerLoginSchema);
    return authService.loginPassenger(input);
  });

  server.post("/auth/rider/signup", async (request, reply) => {
    const input = parseBody(request, riderSignupSchema);
    const session = await authService.signupRider(input);
    return reply.status(201).send(session);
  });

  server.post("/auth/rider/login", async (request) => {
    const input = parseBody(request, riderLoginSchema);
    return authService.loginRider(input);
  });

  server.post("/auth/admin/login", async (request) => {
    const input = parseBody(request, adminLoginSchema);
    return authService.loginAdmin(input);
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

  server.post("/auth/logout", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return authService.logout(token);
  });

  server.post("/auth/otp/request", async (request) => {
    const input = parseBody(request, otpRequestSchema);
    return authService.requestPhoneOtp(input);
  });

  server.post("/auth/otp/verify", async (request) => {
    const input = parseBody(request, otpVerifySchema);
    return authService.verifyPhoneOtp(input);
  });

  server.post("/auth/avatar", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, avatarUploadSchema);
    return authService.uploadAvatar(token, input);
  });
};
