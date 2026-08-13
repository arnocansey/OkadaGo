import type { FastifyReply, FastifyRequest } from "fastify";

type CachedResponse = {
  status: number;
  payload: unknown;
  inProgress: boolean;
  createdAt: number;
};

const idempotencyCache = new Map<string, CachedResponse>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyCache.entries()) {
    if (now - val.createdAt > TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export async function idempotencyHook(request: FastifyRequest, reply: FastifyReply) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method.toUpperCase())) {
    return;
  }

  const keyHeader =
    request.headers["idempotency-key"] || request.headers["x-idempotency-key"];
  const idempotencyKey = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;

  if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
    return;
  }

  const fullKey = `${request.url}:${idempotencyKey.trim()}`;
  const existing = idempotencyCache.get(fullKey);

  if (existing) {
    if (existing.inProgress) {
      return reply.status(409).send({
        code: "IDEMPOTENCY_CONFLICT",
        message: "A request with this Idempotency-Key is currently processing. Please try again shortly.",
      });
    }

    return reply.status(existing.status).send(existing.payload);
  }

  // Mark as in-progress
  idempotencyCache.set(fullKey, {
    status: 200,
    payload: null,
    inProgress: true,
    createdAt: Date.now(),
  });

  // Intercept payload to cache upon completion
  const originalSend = reply.send.bind(reply);
  reply.send = function (payload?: unknown) {
    if (reply.statusCode >= 200 && reply.statusCode < 300) {
      idempotencyCache.set(fullKey, {
        status: reply.statusCode,
        payload,
        inProgress: false,
        createdAt: Date.now(),
      });
    } else {
      idempotencyCache.delete(fullKey);
    }
    return originalSend(payload);
  };
}
