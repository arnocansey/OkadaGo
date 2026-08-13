import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  riderPayoutAccountParamsSchema,
  riderPayoutAccountSchema,
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

  server.get("/rider/earnings", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return walletService.getRiderEarnings(token);
  });

  server.get("/wallets/rider/payout-requests", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return walletService.listCurrentRiderPayoutRequests(token);
  });

  server.post(
    "/wallets/rider/payout-requests",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (request, reply) => {
      const token = extractBearerToken(request.headers.authorization);
      const input = parseBody(request, riderPayoutRequestSchema);
      const result = await walletService.createCurrentRiderPayoutRequest(token, input);
      return reply.status(201).send(result);
    },
  );

  server.get("/wallets/rider/payout-accounts", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return walletService.listCurrentRiderPayoutAccounts(token);
  });

  server.post("/wallets/rider/payout-accounts", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, riderPayoutAccountSchema);
    const result = await walletService.createCurrentRiderPayoutAccount(token, input);
    return reply.status(201).send(result);
  });

  server.post("/wallets/rider/payout-accounts/:payoutAccountId/default", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderPayoutAccountParamsSchema);
    return walletService.setCurrentRiderPayoutAccountDefault(token, params.payoutAccountId);
  });

  server.delete("/wallets/rider/payout-accounts/:payoutAccountId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, riderPayoutAccountParamsSchema);
    return walletService.revokeCurrentRiderPayoutAccount(token, params.payoutAccountId);
  });

  server.post("/wallets/top-up", async (request, reply) => {
    const input = parseBody(request, walletTopUpSchema);
    const result = await walletService.topUpWallet(input);
    return reply.status(201).send(result);
  });

  server.post(
    "/wallets/top-up/paystack/initialize",
    { config: { rateLimit: { max: 15, timeWindow: "1 hour" } } },
    async (request, reply) => {
      const token = extractBearerToken(request.headers.authorization);
      const input = parseBody(request, walletPaystackInitializeSchema);
      const result = await walletService.initializePaystackTopUp(token, input);
      return reply.status(201).send(result);
    },
  );

  server.get("/wallets/top-up/paystack/callback", async (request, reply) => {
    const query = parseQuery(request, walletPaystackCallbackQuerySchema);
    const redirectUrl = await walletService.handlePaystackTopUpCallback(
      query.reference ?? query.trxref ?? ""
    );
    return reply.redirect(redirectUrl, 302);
  });

  // Paystack transfer webhooks — signature verified against the raw JSON body.
  server.post(
    "/wallets/paystack/transfer-webhook",
    {
      preParsing: async (request, _reply, payload) => {
        const chunks: Buffer[] = [];
        for await (const chunk of payload) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        const raw = Buffer.concat(chunks);
        (request as typeof request & { rawBody?: string }).rawBody = raw.toString("utf8");
        const { Readable } = await import("node:stream");
        return Readable.from(raw);
      }
    },
    async (request, reply) => {
      const signature = request.headers["x-paystack-signature"];
      const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
      const rawBody =
        (request as typeof request & { rawBody?: string }).rawBody ??
        (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}));
      const result = await walletService.handlePaystackTransferWebhook(rawBody, signatureHeader);
      return reply.status(200).send(result);
    }
  );
};
