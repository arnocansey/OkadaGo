import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { appConfig } from "./common/config.js";
import { setErrorHandler } from "./common/error-handler.js";
import { idempotencyHook } from "./common/idempotency.js";
import { registerRoutes } from "./modules/index.js";

export function buildServer() {
  const server = Fastify({
    trustProxy: true, // Enables reading real client IP behind reverse proxies (Render, Cloudflare, etc.)
    bodyLimit: 5 * 1024 * 1024, // 5 MB payload limit
    logger: {
      level: appConfig.nodeEnv === "production" ? "info" : "debug"
    }
  });

  // Security HTTP Headers
  void server.register(helmet, {
    contentSecurityPolicy: false, // Pure REST/JSON API service
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });

  server.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    if (typeof body !== "string" || body.trim() === "") {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  const allowedOrigins = appConfig.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);
  void server.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server calls)
      if (!origin) return cb(null, true);
      if (appConfig.corsOrigin === "*") return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"), false);
    },
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  });

  // Global rate limiter: in production, do not bypass 127.0.0.1 to avoid proxy spoofing
  void server.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: appConfig.nodeEnv === "production" ? [] : ["127.0.0.1", "localhost"]
  });

  server.addHook("preHandler", idempotencyHook);

  setErrorHandler(server);
  void server.register(registerRoutes, { prefix: "/v1" });

  return server;
}
