import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  registerPushTokenSchema,
} from "./notification.schemas.js";
import { NotificationService } from "./notification.service.js";

const notificationService = new NotificationService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const notificationRoutes: FastifyPluginAsync = async (server) => {
  server.post("/notifications/push-token", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, registerPushTokenSchema);
    return notificationService.registerPushToken(token, input);
  });

  server.get("/notifications", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, listNotificationsQuerySchema);
    return notificationService.listNotifications(token, query);
  });

  server.post("/notifications/read-all", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return notificationService.markAllNotificationsRead(token);
  });

  server.patch("/notifications/read-all", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return notificationService.markAllNotificationsRead(token);
  });

  server.post("/notifications/mark-all-read", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return notificationService.markAllNotificationsRead(token);
  });

  server.patch("/notifications/mark-all-read", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return notificationService.markAllNotificationsRead(token);
  });

  server.patch("/notifications/:notificationId/read", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, notificationIdParamsSchema);
    return notificationService.markNotificationRead(token, params.notificationId);
  });
};
