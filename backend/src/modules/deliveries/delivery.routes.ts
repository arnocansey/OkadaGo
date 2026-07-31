import type { FastifyPluginAsync } from "fastify";
import { parseBody, parseParams } from "../../common/validation.js";
import {
  completeDeliveryStopSchema,
  createDeliveryRequestSchema,
  deliveryEstimateSchema,
  deliveryIdParamsSchema,
  deliveryStatusUpdateSchema,
  deliveryStopParamsSchema
} from "./delivery.schemas.js";
import { DeliveryService } from "./delivery.service.js";

const deliveryService = new DeliveryService();

export const deliveryRoutes: FastifyPluginAsync = async (server) => {
  server.post("/deliveries/estimate", async (request) => {
    const input = parseBody(request, deliveryEstimateSchema);
    return deliveryService.estimateDelivery(input);
  });

  server.post("/deliveries/request", async (request, reply) => {
    const input = parseBody(request, createDeliveryRequestSchema);
    const delivery = await deliveryService.createDeliveryRequest(input);
    return reply.status(201).send(delivery);
  });

  server.get("/deliveries", async (request) => {
    const query = request.query as { limit?: string; page?: string };
    return deliveryService.listDeliveries({
      limit: query.limit ? Number(query.limit) || undefined : undefined,
      page: query.page ? Number(query.page) || undefined : undefined
    });
  });

  server.get("/deliveries/:deliveryId", async (request) => {
    const params = parseParams(request, deliveryIdParamsSchema);
    return deliveryService.getDelivery(params.deliveryId);
  });

  server.patch("/deliveries/:deliveryId/status", async (request) => {
    const params = parseParams(request, deliveryIdParamsSchema);
    const input = parseBody(request, deliveryStatusUpdateSchema);
    return deliveryService.updateDeliveryStatus(params.deliveryId, input);
  });

  server.get("/deliveries/:deliveryId/stops", async (request) => {
    const params = parseParams(request, deliveryIdParamsSchema);
    return deliveryService.listDeliveryStops(params.deliveryId);
  });

  server.patch("/deliveries/:deliveryId/stops/:stopId/complete", async (request) => {
    const params = parseParams(request, deliveryStopParamsSchema);
    const input = parseBody(request, completeDeliveryStopSchema);
    return deliveryService.completeDeliveryStop(params.deliveryId, params.stopId, input);
  });
};
