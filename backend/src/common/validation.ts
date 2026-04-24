import type { FastifyRequest } from "fastify";
import type { z, ZodTypeAny } from "zod";

export function parseBody<TSchema extends ZodTypeAny>(
  request: FastifyRequest,
  schema: TSchema
): z.infer<TSchema> {
  return schema.parse(request.body);
}

export function parseQuery<TSchema extends ZodTypeAny>(
  request: FastifyRequest,
  schema: TSchema
): z.infer<TSchema> {
  return schema.parse(request.query);
}

export function parseParams<TSchema extends ZodTypeAny>(
  request: FastifyRequest,
  schema: TSchema
): z.infer<TSchema> {
  return schema.parse(request.params);
}
