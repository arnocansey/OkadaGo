import { prisma } from "../../common/prisma.js";
import { pushService } from "../notifications/push.service.js";
import { BroadcastStatus, IncidentStatus, TicketStatus, UserRole } from "../../generated/prisma/enums.js";

/**
 * Background ticks for scheduled broadcasts and escalation rules.
 * Mirrors the scheduled-ride dispatcher pattern (in-process setInterval).
 */
export class AdminJobsService {
  async dispatchDueBroadcasts() {
    const due = await prisma.scheduledBroadcast.findMany({
      where: {
        status: BroadcastStatus.PENDING,
        scheduledAt: { lte: new Date() }
      },
      take: 20,
      orderBy: { scheduledAt: "asc" }
    });

    let sent = 0;
    for (const broadcast of due) {
      try {
        const userIds = await this.resolveAudienceUserIds(broadcast);
        let delivered = 0;
        for (const userId of userIds) {
          const result = await pushService.sendToUser(userId, {
            title: broadcast.title,
            body: broadcast.body,
            data: {
              type: "scheduled_broadcast",
              broadcastId: broadcast.id
            }
          });
          delivered += result.sent > 0 ? 1 : 0;
        }

        await prisma.scheduledBroadcast.update({
          where: { id: broadcast.id },
          data: {
            status: BroadcastStatus.SENT,
            sentCount: delivered
          }
        });
        sent += 1;
      } catch {
        await prisma.scheduledBroadcast.update({
          where: { id: broadcast.id },
          data: { status: BroadcastStatus.FAILED }
        });
      }
    }

    return { processed: due.length, sent };
  }

  async runEscalationRules() {
    const rules = await prisma.escalationRule.findMany({
      where: { enabled: true }
    });

    let actions = 0;
    for (const rule of rules) {
      const thresholdMs = Math.max(1, rule.thresholdHours) * 60 * 60 * 1000;
      const olderThan = new Date(Date.now() - thresholdMs);
      const trigger = rule.triggerCondition.toLowerCase();

      if (trigger.includes("ticket") || trigger.includes("support") || trigger.includes("unanswered")) {
        const tickets = await prisma.supportTicket.findMany({
          where: {
            deletedAt: null,
            status: { in: [TicketStatus.OPEN, TicketStatus.PENDING_PASSENGER, TicketStatus.PENDING_RIDER] },
            createdAt: { lte: olderThan }
          },
          take: 50,
          select: { id: true, title: true, status: true }
        });

        for (const ticket of tickets) {
          if (ticket.status === TicketStatus.ESCALATED) continue;
          await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: { status: TicketStatus.ESCALATED }
          });
          actions += 1;
          await this.notifyAdmins(
            `Escalation: ${rule.name}`,
            `Support ticket "${ticket.title}" exceeded ${rule.thresholdHours}h (${rule.action}).`,
            { type: "escalation", ruleId: rule.id, ticketId: ticket.id, targetRole: rule.targetRole }
          );
        }
      }

      if (trigger.includes("incident") || trigger.includes("sos") || trigger.includes("safety")) {
        const incidents = await prisma.incident.findMany({
          where: {
            status: IncidentStatus.OPEN,
            createdAt: { lte: olderThan }
          },
          take: 50,
          select: { id: true, category: true, severity: true, status: true }
        });

        for (const incident of incidents) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: { status: IncidentStatus.UNDER_REVIEW }
          });
          actions += 1;
          await this.notifyAdmins(
            `Escalation: ${rule.name}`,
            `Incident ${incident.category} (${incident.severity}) exceeded ${rule.thresholdHours}h.`,
            { type: "escalation", ruleId: rule.id, incidentId: incident.id, targetRole: rule.targetRole }
          );
        }
      }
    }

    return { rules: rules.length, actions };
  }

  private async resolveAudienceUserIds(broadcast: {
    targetAudience: string;
    targetZoneId: string | null;
  }) {
    if (broadcast.targetAudience === "RIDERS") {
      const riders = await prisma.user.findMany({
        where: { role: UserRole.RIDER, deletedAt: null },
        select: { id: true }
      });
      return riders.map((u) => u.id);
    }

    if (broadcast.targetAudience === "PASSENGERS") {
      const passengers = await prisma.user.findMany({
        where: { role: UserRole.PASSENGER, deletedAt: null },
        select: { id: true }
      });
      return passengers.map((u) => u.id);
    }

    if (broadcast.targetAudience === "ZONE" && broadcast.targetZoneId) {
      const zone = await prisma.serviceZone.findUnique({
        where: { id: broadcast.targetZoneId },
        select: { id: true, city: true }
      });
      const riders = await prisma.riderProfile.findMany({
        where: { serviceZoneId: broadcast.targetZoneId },
        select: { userId: true }
      });
      const passengers = zone
        ? await prisma.passengerProfile.findMany({
            where: {
              OR: [
                { defaultServiceCity: zone.city },
                { defaultServiceCity: { contains: zone.city, mode: "insensitive" } }
              ]
            },
            select: { userId: true }
          })
        : [];
      return [...new Set([...riders.map((r) => r.userId), ...passengers.map((p) => p.userId)])];
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: [UserRole.PASSENGER, UserRole.RIDER] }
      },
      select: { id: true }
    });
    return users.map((u) => u.id);
  }

  private async notifyAdmins(title: string, body: string, data: Record<string, unknown>) {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, deletedAt: null },
      select: { id: true },
      take: 50
    });
    for (const admin of admins) {
      await pushService.sendToUser(admin.id, { title, body, data });
    }
  }
}

export const adminJobsService = new AdminJobsService();
