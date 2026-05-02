import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  adminIncidentReviewSchema,
  adminIncidentsQuerySchema,
  createSafetyContactSchema,
  createSafetyIncidentSchema,
  createSafetyShareEventSchema,
  requestSafetyContactVerificationSchema,
  safetyIncidentParamsSchema,
  safetyContactParamsSchema,
  verifySafetyContactOtpSchema
} from "./safety.schemas.js";
import { SafetyService } from "./safety.service.js";

const safetyService = new SafetyService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const safetyRoutes: FastifyPluginAsync = async (server) => {
  server.get("/safety/overview", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return safetyService.getSafetyOverview(token);
  });

  server.post("/safety/contacts", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createSafetyContactSchema);
    const result = await safetyService.createSafetyContact(token, input);
    return reply.status(201).send(result);
  });

  server.delete("/safety/contacts/:contactId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, safetyContactParamsSchema);
    return safetyService.removeSafetyContact(token, params.contactId);
  });

  server.post("/safety/incidents", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createSafetyIncidentSchema);
    const result = await safetyService.reportSafetyIncident(token, input);
    return reply.status(201).send(result);
  });

  server.post("/safety/share-trip", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createSafetyShareEventSchema);
    const result = await safetyService.createSafetyShareEvent(token, input);
    return reply.status(201).send(result);
  });

  server.post("/safety/contacts/verification/request", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, requestSafetyContactVerificationSchema);
    return safetyService.requestSafetyContactVerification(token, input);
  });

  server.post("/safety/contacts/verification/confirm", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, verifySafetyContactOtpSchema);
    return safetyService.verifySafetyContactOtp(token, input);
  });

  server.get("/admin/incidents", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminIncidentsQuerySchema);
    return safetyService.listAdminIncidents(token, query);
  });

  server.patch("/admin/incidents/:incidentId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, safetyIncidentParamsSchema);
    const input = parseBody(request, adminIncidentReviewSchema);
    return safetyService.reviewAdminIncident(token, params.incidentId, input);
  });
};
