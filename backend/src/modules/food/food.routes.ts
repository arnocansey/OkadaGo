import type { FastifyPluginAsync } from "fastify";
import { parseBody, parseParams } from "../../common/validation.js";
import { createFoodOrderSchema, foodOrderIdParamsSchema } from "./food.schemas.js";
import { FoodService } from "./food.service.js";

const foodService = new FoodService();

export const foodRoutes: FastifyPluginAsync = async (server) => {
  server.get("/food/merchants", async () => {
    return foodService.listMerchants();
  });

  server.get("/food/merchants/:merchantId", async (request) => {
    const params = parseParams(request, foodOrderIdParamsSchema.pick({ orderId: true }).extend({
      merchantId: foodOrderIdParamsSchema.shape.orderId,
    }));
    return foodService.getMerchant(params.merchantId);
  });

  server.post("/food/orders", async (request, reply) => {
    const input = parseBody(request, createFoodOrderSchema);
    const order = await foodService.createFoodOrder(input);
    return reply.status(201).send(order);
  });
};
