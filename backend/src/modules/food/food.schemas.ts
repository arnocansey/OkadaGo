import { z } from "zod";

export const foodOrderItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  customizations: z.array(z.string()).optional(),
});

export const createFoodOrderSchema = z.object({
  passengerProfileId: z.string().cuid(),
  merchantId: z.string().min(1),
  merchantName: z.string().min(1),
  merchantAddress: z.string().min(1),
  merchantLatitude: z.number(),
  merchantLongitude: z.number(),
  dropoffAddress: z.string().min(1),
  dropoffLatitude: z.number(),
  dropoffLongitude: z.number(),
  deliveryInstructions: z.string().max(300).optional(),
  items: z.array(foodOrderItemSchema).min(1),
  paymentMethod: z.enum(["cash", "card", "wallet", "mobile_money"]),
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().default("GHS"),
});

export const foodOrderIdParamsSchema = z.object({
  orderId: z.string().min(1),
});
