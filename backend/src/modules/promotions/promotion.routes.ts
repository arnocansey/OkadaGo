import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  applyPromoCodeSchema,
  createPromoCodeSchema,
  promoCodeParamsSchema,
  promoCodeQuerySchema,
  updatePromoCodeSchema,
} from "./promotion.schemas.js";
import { PromotionService } from "./promotion.service.js";

const promotionService = new PromotionService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const promotionRoutes: FastifyPluginAsync = async (server) => {
  server.post("/promotions/apply", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, applyPromoCodeSchema);
    return promotionService.applyPromoForSession(token, input);
  });

  server.get("/admin/promotions", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, promoCodeQuerySchema);
    return promotionService.listPromoCodes(token, query);
  });

  server.post("/admin/promotions", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createPromoCodeSchema);
    const promo = await promotionService.createPromoCode(token, input);
    return reply.status(201).send(promo);
  });

  server.patch("/admin/promotions/:promoCodeId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, promoCodeParamsSchema);
    const input = parseBody(request, updatePromoCodeSchema);
    return promotionService.updatePromoCode(token, params.promoCodeId, input);
  });
};
