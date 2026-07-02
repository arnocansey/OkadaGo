import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody } from "../../common/validation.js";
import { registerPushTokenSchema } from "./device.schemas.js";
import { DeviceService } from "./device.service.js";

const deviceService = new DeviceService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const deviceRoutes: FastifyPluginAsync = async (server) => {
  server.post("/devices/push-token", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, registerPushTokenSchema);
    return deviceService.registerPushToken(token, input);
  });
};
