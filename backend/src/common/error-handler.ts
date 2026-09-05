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

    if (error instanceof SyntaxError) {
      return reply.status(400).send({
        code: "INVALID_JSON",
        message: "Invalid JSON format in request body",
        traceId: request.id
      });
    }

    const errorCode = (error as { code?: string }).code;
    if (errorCode === "P2002") {
      const meta = (error as { meta?: { target?: string[] | string } }).meta;
      const fields = Array.isArray(meta?.target)
        ? meta.target.join(", ")
        : typeof meta?.target === "string"
        ? meta.target
        : "field";
      return reply.status(409).send({
        code: "DUPLICATE_ENTRY",
        message: `An account with this ${fields} already exists.`,
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
