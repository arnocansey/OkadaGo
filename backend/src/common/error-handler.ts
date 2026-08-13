import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

export function setErrorHandler(server: FastifyInstance) {
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
        traceId: request.id
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
        details: error.details,
        traceId: request.id
      });
    }

    const fastifyStatusCode = (error as { statusCode?: number }).statusCode;
    const fastifyCode = (error as { code?: string }).code;
    if (fastifyStatusCode && fastifyStatusCode >= 400 && fastifyStatusCode < 500) {
      return reply.status(fastifyStatusCode).send({
        code: fastifyCode || "BAD_REQUEST",
        message: (error as Error).message,
        traceId: request.id
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
      traceId: request.id
    });
  });
}
