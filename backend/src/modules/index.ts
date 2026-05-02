import type { FastifyPluginAsync } from "fastify";
import { authRoutes } from "./auth/auth.routes.js";
import { healthRoutes } from "./ops/health.routes.js";
import { rideRoutes } from "./rides/ride.routes.js";
import { walletRoutes } from "./wallets/wallet.routes.js";
import { adminRoutes } from "./admin/admin.routes.js";
import { bootstrapRoutes } from "./bootstrap/bootstrap.routes.js";
import { ratingRoutes } from "./ratings/rating.routes.js";
import { safetyRoutes } from "./safety/safety.routes.js";

export const registerRoutes: FastifyPluginAsync = async (server) => {
  await server.register(healthRoutes);
  await server.register(authRoutes);
  await server.register(bootstrapRoutes);
  await server.register(rideRoutes);
  await server.register(walletRoutes);
  await server.register(ratingRoutes);
  await server.register(safetyRoutes);
  await server.register(adminRoutes);
};
