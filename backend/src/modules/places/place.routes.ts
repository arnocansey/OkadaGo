import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams } from "../../common/validation.js";
import {
  createSavedPlaceSchema,
  savedPlaceParamsSchema,
  updateSavedPlaceSchema
} from "./place.schemas.js";
import { PlaceService } from "./place.service.js";

const placeService = new PlaceService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const placeRoutes: FastifyPluginAsync = async (server) => {
  server.get("/places/saved", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return placeService.listSavedPlaces(token);
  });

  server.post("/places/saved", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createSavedPlaceSchema);
    const place = await placeService.createSavedPlace(token, input);
    return reply.status(201).send(place);
  });

  server.patch("/places/saved/:placeId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, savedPlaceParamsSchema);
    const input = parseBody(request, updateSavedPlaceSchema);
    return placeService.updateSavedPlace(token, params.placeId, input);
  });

  server.delete("/places/saved/:placeId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, savedPlaceParamsSchema);
    return placeService.deleteSavedPlace(token, params.placeId);
  });
};
