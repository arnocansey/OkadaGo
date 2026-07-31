import { prisma } from "../../common/prisma.js";
import { pushService } from "../notifications/push.service.js";
import { BroadcastStatus, IncidentStatus, TicketStatus, UserRole } from "../../generated/prisma/enums.js";

const MAX_BROADCAST_RETRIES = 3;
const FAILED_RETRY_COOLDOWN_MS = 2 * 60 * 1000;

/**
 * Background ticks for scheduled broadcasts and escalation rules.
 * Mirrors the scheduled-ride dispatcher pattern (in-process setInterval).
 */
export class AdminJobsService {
  async getJobStatus() {
    const heartbeats = await prisma.opsJobHeartbeat.findMany();
    const byId = Object.fromEntries(heartbeats.map((row) => [row.id, row]));
    const failedBroadcasts = await prisma.scheduledBroadcast.count({
      where: { status: BroadcastStatus.FAILED }
    });
    const pendingBroadcasts = await prisma.scheduledBroadcast.count({
      where: { status: BroadcastStatus.PENDING, scheduledAt: { lte: new Date() } }
    });

    return {
      broadcasts: {
        ...(byId.broadcasts ?? null),
        pendingDue: pendingBroadcasts,
        failed: failedBroadcasts
      },
      escalations: byId.escalations ?? null
    };
  }

  async dispatchDueBroadcasts() {
    const startedAt = new Date();
    await this.touchHeartbeat("broadcasts", { startedAt });

    try {
      const retryBefore = new Date(Date.now() - FAILED_RETRY_COOLDOWN_MS);
      const due = await prisma.scheduledBroadcast.findMany({
        where: {
          OR: [
            {
              status: BroadcastStatus.PENDING,
              scheduledAt: { lte: new Date() }
            },
            {
              status: BroadcastStatus.FAILED,
              retryCount: { lt: MAX_BROADCAST_RETRIES },
              OR: [{ lastRunAt: null }, { lastRunAt: { lte: retryBefore } }]
            }
          ]
        },
        take: 20,
        orderBy: { scheduledAt: "asc" }
      });

      let sent = 0;
      let failed = 0;
      for (const broadcast of due) {
        const result = await this.deliverBroadcast(broadcast.id);
        if (result === "sent") sent += 1;
        if (result === "failed") failed += 1;
      }

      const stats = { processed: due.length, sent, failed };
      await this.touchHeartbeat("broadcasts", { finishedAt: new Date(), stats, clearError: true });
      return stats;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Broadcast dispatch failed";
      await this.touchHeartbeat("broadcasts", { finishedAt: new Date(), error: message });
      throw error;
    }
  }

  async deliverBroadcast(broadcastId: string): Promise<"sent" | "failed" | "skipped"> {
    const broadcast = await prisma.scheduledBroadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast) return "skipped";
    if (broadcast.status === BroadcastStatus.SENT || broadcast.status === BroadcastStatus.CANCELLED) {
      return "skipped";
    }

    const attemptAt = new Date();
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
          sentCount: delivered,
          lastRunAt: attemptAt,
          lastError: null
        }
      });
      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Delivery failed";
      await prisma.scheduledBroadcast.update({
        where: { id: broadcast.id },
        data: {
          status: BroadcastStatus.FAILED,
          lastRunAt: attemptAt,
          lastError: message,
          retryCount: { increment: 1 }
        }
      });
      return "failed";
    }
  }

  async runEscalationRules() {
    const startedAt = new Date();
    await this.touchHeartbeat("escalations", { startedAt });

    try {
      const rules = await prisma.escalationRule.findMany({
        where: { enabled: true }
      });

      let actions = 0;
      for (const rule of rules) {
        const ruleActions = await this.runOneEscalationRule(rule);
        actions += ruleActions;
        await prisma.escalationRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: new Date(),
            lastActionCount: ruleActions
          }
        });
      }

      const stats = { rules: rules.length, actions };
      await this.touchHeartbeat("escalations", { finishedAt: new Date(), stats, clearError: true });
      return stats;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Escalation tick failed";
      await this.touchHeartbeat("escalations", { finishedAt: new Date(), error: message });
      throw error;
    }
  }

  private async runOneEscalationRule(rule: {
    id: string;
    name: string;
    triggerCondition: string;
    thresholdHours: number;
    action: string;
    targetRole: string;
  }) {
    const thresholdMs = Math.max(1, rule.thresholdHours) * 60 * 60 * 1000;
    const olderThan = new Date(Date.now() - thresholdMs);
    const trigger = rule.triggerCondition.toLowerCase();
    let actions = 0;

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

    return actions;
  }

  private async touchHeartbeat(
    id: "broadcasts" | "escalations",
    input: {
      startedAt?: Date;
      finishedAt?: Date;
      error?: string;
      stats?: Record<string, number>;
      clearError?: boolean;
    }
  ) {
    await prisma.opsJobHeartbeat.upsert({
      where: { id },
      create: {
        id,
        lastStartedAt: input.startedAt,
        lastFinishedAt: input.finishedAt,
        lastError: input.error ?? null,
        lastStats: input.stats ?? undefined
      },
      update: {
        ...(input.startedAt ? { lastStartedAt: input.startedAt } : {}),
        ...(input.finishedAt ? { lastFinishedAt: input.finishedAt } : {}),
        ...(input.stats ? { lastStats: input.stats } : {}),
        ...(input.clearError ? { lastError: null } : {}),
        ...(input.error ? { lastError: input.error.slice(0, 500) } : {})
      }
    });
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

    if (broadcast.targetAudience === "INACTIVE_RIDERS") {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const riders = await prisma.riderProfile.findMany({
        where: {
          deletedAt: null,
          OR: [{ lastOnlineAt: { lt: cutoff } }, { lastOnlineAt: null }]
        },
        select: { userId: true }
      });
      return riders.map((r) => r.userId);
    }

    if (broadcast.targetAudience === "NEW_PASSENGERS") {
      const passengers = await prisma.passengerProfile.findMany({
        where: { deletedAt: null, totalTrips: 0 },
        select: { userId: true }
      });
      return passengers.map((p) => p.userId);
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
