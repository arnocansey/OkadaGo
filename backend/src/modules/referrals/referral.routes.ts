import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  applyReferralCodeSchema,
  referralQuerySchema,
  settleReferralParamsSchema,
} from "./referral.schemas.js";
import { ReferralService } from "./referral.service.js";

const referralService = new ReferralService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const referralRoutes: FastifyPluginAsync = async (server) => {
  server.post("/referrals/apply", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, applyReferralCodeSchema);
    const result = await referralService.applyReferralCode(token, input);
    return reply.status(201).send(result);
  });

  server.get("/referrals/mine", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, referralQuerySchema);
    return referralService.listMyReferrals(token, query);
  });

  server.post("/referrals/settle/:rideId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    extractBearerToken(request.headers.authorization);
    const params = parseParams(request, settleReferralParamsSchema);
    void token;
    return referralService.settleReferralForCompletedRide(params.rideId);
  });
};
