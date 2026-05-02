import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams } from "../../common/validation.js";
import { createRideRatingSchema, rideRatingParamsSchema } from "./rating.schemas.js";
import { RatingService } from "./rating.service.js";

const ratingService = new RatingService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const ratingRoutes: FastifyPluginAsync = async (server) => {
  server.post("/ratings/rides/:rideId", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, rideRatingParamsSchema);
    const input = parseBody(request, createRideRatingSchema);
    const result = await ratingService.createCurrentPassengerRideRating(token, params.rideId, input);
    return reply.status(201).send(result);
  });
};
