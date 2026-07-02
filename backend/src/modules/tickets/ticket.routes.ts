import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../common/errors.js";
import { parseBody, parseParams, parseQuery } from "../../common/validation.js";
import {
  adminTicketsQuerySchema,
  adminUpdateTicketSchema,
  createSupportTicketSchema,
  ticketParamsSchema
} from "./ticket.schemas.js";
import { ticketService } from "./ticket.service.js";

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError("Authorization header is required", 401, "AUTHORIZATION_REQUIRED");
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export const ticketRoutes: FastifyPluginAsync = async (server) => {
  server.post("/support/tickets", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    const input = parseBody(request, createSupportTicketSchema);
    const ticket = await ticketService.createTicket(token, input);
    return reply.status(201).send(ticket);
  });

  server.get("/support/tickets", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    return ticketService.listMyTickets(token);
  });

  server.get("/admin/support/tickets", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const query = parseQuery(request, adminTicketsQuerySchema);
    return ticketService.listAdminTickets(token, query);
  });

  server.patch("/admin/support/tickets/:ticketId", async (request) => {
    const token = extractBearerToken(request.headers.authorization);
    const params = parseParams(request, ticketParamsSchema);
    const input = parseBody(request, adminUpdateTicketSchema);
    return ticketService.updateAdminTicket(token, params.ticketId, input);
  });
};
