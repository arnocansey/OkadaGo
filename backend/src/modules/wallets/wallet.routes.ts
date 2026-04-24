import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  riderPayoutRequestSchema,
  walletUserParamsSchema,
  payoutEligibilitySchema,
  settlementPreviewSchema,
  walletPaystackCallbackQuerySchema,
  walletPaystackInitializeSchema,
  walletTopUpSchema
} from "./wallet.schemas.js";
import { WalletService } from "./wallet.service.js";

const walletService = new WalletService();

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const walletRoutes: FastifyPluginAsync = async (server) => {
  server.get("/wallets/users/:userId", async (request) => {
    const params = parseParams(request, walletUserParamsSchema);
    return walletService.listUserWallets(params.userId);
  });

  server.get("/wallets/users/:userId/transactions", async (request) => {
    const params = parseParams(request, walletUserParamsSchema);
    return walletService.listUserWalletTransactions(params.userId);
  });

  server.post("/wallets/settlement-preview", async (request) => {
    const input = parseBody(request, settlementPreviewSchema);
    return walletService.previewSettlement(input);
  });

  server.post("/wallets/payout-eligibility", async (request) => {
    const input = parseBody(request, payoutEligibilitySchema);
    return walletService.validatePayoutEligibility(input);
  });

  server.get("/wallets/rider/payout-requests", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return walletService.listCurrentRiderPayoutRequests(token);
  });

  server.post("/wallets/rider/payout-requests", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, riderPayoutRequestSchema);
    const result = await walletService.createCurrentRiderPayoutRequest(token, input);
    return reply.status(201).send(result);
  });

  server.post("/wallets/top-up", async (request, reply) => {
    const input = parseBody(request, walletTopUpSchema);
    const result = await walletService.topUpWallet(input);
    return reply.status(201).send(result);
  });

  server.post("/wallets/top-up/paystack/initialize", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, walletPaystackInitializeSchema);
    const result = await walletService.initializePaystackTopUp(token, input);
    return reply.status(201).send(result);
  });

  server.get("/wallets/top-up/paystack/callback", async (request, reply) => {
    const query = parseQuery(request, walletPaystackCallbackQuerySchema);
    const redirectUrl = await walletService.handlePaystackTopUpCallback(
      query.reference ?? query.trxref ?? ""
    );
    return reply.redirect(redirectUrl, 302);
  });
};
