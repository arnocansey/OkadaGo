import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import { adminJobsService } from "./admin-jobs.service.js";
import type {
  CreateEscalationRuleInput,
  CreateScheduledBroadcastInput,
  UpdateEscalationRuleInput
} from "./admin.schemas.js";

const audienceMap = {
  all: "ALL",
  riders: "RIDERS",
  passengers: "PASSENGERS",
  zone: "ZONE"
} as const;

export class AdminOpsService {
  async listEscalationRules(token: string) {
    await this.verifyAdmin(token);
    return prisma.escalationRule.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async createEscalationRule(token: string, input: CreateEscalationRuleInput) {
    await this.verifyAdmin(token);
    return prisma.escalationRule.create({
      data: {
        name: input.name,
        description: input.description,
        triggerCondition: input.triggerCondition,
        thresholdHours: input.thresholdHours,
        action: input.action,
        targetRole: input.targetRole,
        enabled: input.enabled ?? true
      }
    });
  }

  async updateEscalationRule(token: string, ruleId: string, input: UpdateEscalationRuleInput) {
    await this.verifyAdmin(token);
    const existing = await prisma.escalationRule.findUnique({ where: { id: ruleId } });
    if (!existing) {
      throw new AppError("Escalation rule not found", 404, "ESCALATION_RULE_NOT_FOUND");
    }

    return prisma.escalationRule.update({
      where: { id: ruleId },
      data: {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.description != null ? { description: input.description } : {}),
        ...(input.triggerCondition != null ? { triggerCondition: input.triggerCondition } : {}),
        ...(input.thresholdHours != null ? { thresholdHours: input.thresholdHours } : {}),
        ...(input.action != null ? { action: input.action } : {}),
        ...(input.targetRole != null ? { targetRole: input.targetRole } : {}),
        ...(input.enabled != null ? { enabled: input.enabled } : {})
      }
    });
  }

  async listScheduledBroadcasts(token: string) {
    await this.verifyAdmin(token);
    return prisma.scheduledBroadcast.findMany({
      orderBy: { scheduledAt: "desc" },
      include: { targetZone: { select: { id: true, name: true } } }
    });
  }

  async createScheduledBroadcast(token: string, input: CreateScheduledBroadcastInput) {
    await this.verifyAdmin(token);

    if (input.targetAudience === "zone" && !input.targetZoneId) {
      throw new AppError("targetZoneId is required for zone broadcasts", 400, "ZONE_REQUIRED");
    }

    if (input.targetZoneId) {
      const zone = await prisma.serviceZone.findUnique({ where: { id: input.targetZoneId } });
      if (!zone) {
        throw new AppError("Service zone not found", 404, "ZONE_NOT_FOUND");
      }
    }

    return prisma.scheduledBroadcast.create({
      data: {
        title: input.title,
        body: input.body,
        targetAudience: audienceMap[input.targetAudience],
        targetZoneId: input.targetZoneId,
        scheduledAt: new Date(input.scheduledAt)
      },
      include: { targetZone: { select: { id: true, name: true } } }
    });
  }

  async cancelScheduledBroadcast(token: string, broadcastId: string) {
    await this.verifyAdmin(token);
    const existing = await prisma.scheduledBroadcast.findUnique({ where: { id: broadcastId } });
    if (!existing) {
      throw new AppError("Broadcast not found", 404, "BROADCAST_NOT_FOUND");
    }
    if (existing.status !== "PENDING") {
      throw new AppError("Only pending broadcasts can be cancelled", 400, "BROADCAST_NOT_PENDING");
    }

    return prisma.scheduledBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date()
      },
      include: { targetZone: { select: { id: true, name: true } } }
    });
  }

  async retryScheduledBroadcast(token: string, broadcastId: string) {
    await this.verifyAdmin(token);
    const existing = await prisma.scheduledBroadcast.findUnique({ where: { id: broadcastId } });
    if (!existing) {
      throw new AppError("Broadcast not found", 404, "BROADCAST_NOT_FOUND");
    }
    if (existing.status !== "FAILED") {
      throw new AppError("Only failed broadcasts can be retried", 400, "BROADCAST_NOT_FAILED");
    }

    await prisma.scheduledBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: "PENDING",
        lastError: null,
        scheduledAt: new Date()
      }
    });

    const result = await adminJobsService.deliverBroadcast(broadcastId);
    const broadcast = await prisma.scheduledBroadcast.findUniqueOrThrow({
      where: { id: broadcastId },
      include: { targetZone: { select: { id: true, name: true } } }
    });
    return { broadcast, result };
  }

  async getOpsJobStatus(token: string) {
    await this.verifyAdmin(token);
    return adminJobsService.getJobStatus();
  }

  private async verifyAdmin(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (!session.user.adminProfile) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }
}
