import Fastify from "fastify";
import cors from "@fastify/cors";
import { appConfig } from "./common/config.js";
import { setErrorHandler } from "./common/error-handler.js";
import { registerRoutes } from "./modules/index.js";

export function buildServer() {
  const server = Fastify({
    logger: {
      level: appConfig.nodeEnv === "production" ? "info" : "debug"
    }
  });

  void server.register(cors, {
    origin: appConfig.corsOrigin === "*" ? true : appConfig.corsOrigin.split(","),
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
  });

  setErrorHandler(server);
  void server.register(registerRoutes, { prefix: "/v1" });

  return server;
}
