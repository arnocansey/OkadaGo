import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { appConfig } from "./common/config.js";
import { setErrorHandler } from "./common/error-handler.js";
import { idempotencyHook } from "./common/idempotency.js";
import { registerRoutes } from "./modules/index.js";

export function buildServer() {
  const server = Fastify({
    bodyLimit: 5 * 1024 * 1024, // 5 MB payload limit
    logger: {
      level: appConfig.nodeEnv === "production" ? "info" : "debug"
    }
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

  void server.register(cors, {
    origin: appConfig.corsOrigin === "*" ? true : appConfig.corsOrigin.split(","),
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
  });

  void server.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: ["127.0.0.1", "localhost"]
  });

  server.addHook("preHandler", idempotencyHook);

  setErrorHandler(server);
  void server.register(registerRoutes, { prefix: "/v1" });

  return server;
}
