import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { TicketStatus, UserRole } from "../../generated/prisma/enums.js";
import type {
  adminTicketsQuerySchema,
  adminUpdateTicketSchema,
  createSupportTicketSchema,
  createTicketMessageSchema
} from "./ticket.schemas.js";
import type { z } from "zod";

type CreateTicketInput = z.infer<typeof createSupportTicketSchema>;
type AdminTicketsQuery = z.infer<typeof adminTicketsQuerySchema>;
type AdminUpdateTicketInput = z.infer<typeof adminUpdateTicketSchema>;
type CreateMessageInput = z.infer<typeof createTicketMessageSchema>;

export class TicketService {
  private async getActiveSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: true }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  private async requireAdmin(token: string) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }

  async createTicket(token: string, input: CreateTicketInput) {
    const session = await this.getActiveSession(token);

    if (session.user.role !== UserRole.PASSENGER && session.user.role !== UserRole.RIDER) {
      throw new AppError("Passenger or rider access is required", 403, "TICKET_ACCESS_FORBIDDEN");
    }

    if (input.rideId) {
      const ride = await prisma.ride.findUnique({
        where: { id: input.rideId },
        include: {
          passenger: { select: { userId: true } },
          rider: { select: { userId: true } }
        }
      });

      if (!ride) {
        throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
      }

      const canAccess =
        ride.passenger.userId === session.user.id ||
        ride.rider?.userId === session.user.id;

      if (!canAccess) {
        throw new AppError("You cannot link this ride to a ticket", 403, "RIDE_ACCESS_FORBIDDEN");
      }
    }

    return prisma.supportTicket.create({
      data: {
        createdById: session.user.id,
        rideId: input.rideId,
        title: input.title,
        category: input.category,
        description: input.description,
        priority: input.priority,
        status: TicketStatus.OPEN
      },
      include: {
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        }
      }
    });
  }

  async listMyTickets(token: string) {
    const session = await this.getActiveSession(token);

    return prisma.supportTicket.findMany({
      where: {
        createdById: session.user.id,
        deletedAt: null
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        },
        _count: { select: { messages: true } }
      }
    });
  }

  async listAdminTickets(token: string, query: AdminTicketsQuery) {
    await this.requireAdmin(token);

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {})
    };
    const page = query.page;

    const data = await prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: query.limit,
      ...(page ? { skip: (page - 1) * query.limit } : {}),
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
            role: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        },
        _count: { select: { messages: true } }
      }
    });

    if (!page) return data;
    const total = await prisma.supportTicket.count({ where });
    return { data, total, page, limit: query.limit };
  }

  async updateAdminTicket(token: string, ticketId: string, input: AdminUpdateTicketInput) {
    await this.requireAdmin(token);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

    if (!ticket || ticket.deletedAt) {
      throw new AppError("Support ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const closedStatuses: TicketStatus[] = [TicketStatus.RESOLVED, TicketStatus.CLOSED];

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
        ...(input.status && closedStatuses.includes(input.status)
          ? { closedAt: new Date() }
          : input.status
            ? { closedAt: null }
            : {})
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, phoneE164: true, role: true }
        },
        assignedTo: {
          select: { id: true, fullName: true, email: true }
        },
        ride: {
          select: {
            id: true,
            status: true,
            pickupAddress: true,
            destinationAddress: true
          }
        }
      }
    });
  }

  async listTicketMessages(token: string, ticketId: string) {
    await this.requireAdmin(token);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

    if (!ticket || ticket.deletedAt) {
      throw new AppError("Support ticket not found", 404, "TICKET_NOT_FOUND");
    }

    return prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });
  }

  async createTicketMessage(token: string, ticketId: string, input: CreateMessageInput) {
    const session = await this.requireAdmin(token);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

    if (!ticket || ticket.deletedAt) {
      throw new AppError("Support ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const closedStatuses: TicketStatus[] = [TicketStatus.RESOLVED, TicketStatus.CLOSED];
    if (closedStatuses.includes(ticket.status)) {
      throw new AppError("Cannot send messages to a closed ticket", 400, "TICKET_CLOSED");
    }

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        authorId: session.user.id,
        body: input.body
      },
      include: {
        author: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    return message;
  }
}

export const ticketService = new TicketService();
