import type { FastifyPluginAsync } from "fastify";
import { appConfig } from "../../common/config.js";

export const healthRoutes: FastifyPluginAsync = async (server) => {
  server.get("/health", async () => {
    return {
      status: "ok",
      service: "okadago-backend",
      environment: appConfig.nodeEnv,
      checkedAt: new Date().toISOString()
    };
  });
};
