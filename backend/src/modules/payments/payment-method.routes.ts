import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams } from "../../common/validation.js";
import {
  chargeSavedMethodSchema,
  createManualPaymentMethodSchema,
  initializeCardVaultSchema,
  paymentMethodParamsSchema
} from "./payment-method.schemas.js";
import { PaymentMethodService } from "./payment-method.service.js";

const paymentMethodService = new PaymentMethodService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }
  return authorizationHeader.slice("Bearer ".length).trim();
}

export const paymentMethodRoutes: FastifyPluginAsync = async (server) => {
  server.get("/payments/methods", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return paymentMethodService.listMethods(token);
  });

  server.post("/payments/methods/paystack/initialize", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, initializeCardVaultSchema);
    return paymentMethodService.initializeCardVault(token, input);
  });

  server.get("/payments/methods/paystack/callback", async (request, reply) => {
    const query = request.query as { reference?: string };
    if (!query.reference) {
      return reply.redirect("/payment-methods?vault=failed&reason=missing_reference");
    }
    const url = await paymentMethodService.handleCardVaultCallback(query.reference);
    return reply.redirect(url);
  });

  server.post("/payments/methods", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createManualPaymentMethodSchema);
    const result = await paymentMethodService.createManualMethod(token, input);
    return reply.status(201).send(result);
  });

  server.post("/payments/methods/:methodId/default", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, paymentMethodParamsSchema);
    return paymentMethodService.setDefault(token, params.methodId);
  });

  server.delete("/payments/methods/:methodId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, paymentMethodParamsSchema);
    return paymentMethodService.revokeMethod(token, params.methodId);
  });

  server.post("/payments/methods/:methodId/charge", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, paymentMethodParamsSchema);
    const input = parseBody(request, chargeSavedMethodSchema);
    return paymentMethodService.chargeMethod(token, params.methodId, input);
  });
};
