import type { FastifyPluginAsync } from "fastify";
import { parseBody, parseParams } from "../../common/validation.js";
import {
  createDeliveryRequestSchema,
  deliveryIdParamsSchema,
  deliveryStatusUpdateSchema
} from "./delivery.schemas.js";
import { DeliveryService } from "./delivery.service.js";

const deliveryService = new DeliveryService();

export const deliveryRoutes: FastifyPluginAsync = async (server) => {
  server.post("/deliveries/request", async (request, reply) => {
    const input = parseBody(request, createDeliveryRequestSchema);
    const delivery = await deliveryService.createDeliveryRequest(input);
    return reply.status(201).send(delivery);
  });

  server.get("/deliveries", async () => {
    return deliveryService.listDeliveries();
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
};
