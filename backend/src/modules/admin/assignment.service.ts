import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import { UserRole, RideStatus } from "../../generated/prisma/enums.js";
import { pushService } from "../notifications/push.service.js";
import { emitRideAssigned, emitRideStatusUpdate } from "../realtime/realtime.service.js";
import type { assignRiderSchema, reassignRiderSchema, autoAssignSchema } from "./assignment.schemas.js";
import type { z } from "zod";

type AssignRiderInput = z.infer<typeof assignRiderSchema>;
type ReassignRiderInput = z.infer<typeof reassignRiderSchema>;
type AutoAssignInput = z.infer<typeof autoAssignSchema>;

const REASON_LABELS: Record<string, string> = {
  rider_unavailable: "Rider unavailable",
  rider_cancelled: "Rider cancelled",
  rider_too_far: "Rider too far",
  customer_requested: "Customer requested change",
  bike_problem: "Bike problem",
  emergency: "Emergency",
  other: "Other"
};

const REQUIRED_PERMISSIONS = [
  "rides.assign",
  "rides.reassign",
  "rides.unassign",
  "rides.auto_assign",
  "rides.view_active",
  "assignment_rules.manage"
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class AssignmentService {
  private async requireAdmin(token: string, ip?: string, ua?: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: { include: { adminProfile: true } } }
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }
    if (session.user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    return { session, ip, ua };
  }

  private async requirePermission(session: { user: { adminProfile?: { permissions: unknown } | null } }, permission: string) {
    const perms = (session.user.adminProfile?.permissions as string[]) ?? [];
    if (!perms.includes(permission) && !perms.includes("*")) {
      throw new AppError(`Missing permission: ${permission}`, 403, "MISSING_PERMISSION");
    }
  }

  private async validateRiderAvailable(riderProfileId: string, serviceZoneId: string | null) {
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      include: { user: true, vehicle: true }
    });

    if (!rider) throw new AppError("Rider not found", 404, "RIDER_NOT_FOUND");
    if (rider.user.accountStatus === "BANNED") {
      throw new AppError("Rider is blocked", 400, "RIDER_BLOCKED");
    }
    if (rider.approvalStatus === "REJECTED") {
      throw new AppError("Rider is not approved", 400, "RIDER_NOT_APPROVED");
    }
    if (rider.approvalStatus === "SUSPENDED") {
      throw new AppError("Rider is suspended", 400, "RIDER_SUSPENDED");
    }
    if (!rider.onlineStatus) {
      throw new AppError("Rider is offline", 400, "RIDER_OFFLINE");
    }
    if (serviceZoneId && rider.serviceZoneId !== serviceZoneId) {
      throw new AppError("Rider is not in this service zone", 400, "RIDER_WRONG_ZONE");
    }

    const activeRide = await prisma.ride.findFirst({
      where: {
        riderId: riderProfileId,
        status: { in: ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "SCHEDULED"] }
      }
    });
    if (activeRide) {
      throw new AppError("Rider already has an active trip", 400, "RIDER_BUSY");
    }

    return rider;
  }

  private async logAssignmentAudit(params: {
    rideId: string;
    action: string;
    actorUserId?: string;
    riderId?: string;
    previousRiderId?: string;
    reason?: string;
    reasonNote?: string;
    score?: number;
    metadata?: Record<string, unknown>;
    ip?: string;
    ua?: string;
  }) {
    await prisma.assignmentAuditLog.create({
      data: {
        rideId: params.rideId,
        action: params.action,
        actorUserId: params.actorUserId ?? null,
        riderId: params.riderId ?? null,
        previousRiderId: params.previousRiderId ?? null,
        reason: params.reason ?? null,
        reasonNote: params.reasonNote ?? null,
        score: params.score ?? null,
        metadata: (params.metadata ?? undefined) as Record<string, never> | undefined,
        ipAddress: params.ip ?? null,
        userAgent: params.ua ?? null
      }
    });
  }

  private async logRideEvent(rideId: string, actorUserId: string | undefined, eventType: string, payload: Record<string, unknown>) {
    await prisma.rideEvent.create({
      data: {
        rideId,
        actorUserId: actorUserId ?? null,
        eventType,
        payload: payload as unknown as Record<string, never>
      }
    });
  }

  private async notifyRiderAssigned(riderUserId: string, ride: { id: string; pickupAddress: string; destinationAddress: string; estimatedFare: unknown; currency: string }) {
    await pushService.sendToUser(riderUserId, {
      title: "You have been assigned a ride",
      body: `Pickup: ${ride.pickupAddress} → ${ride.destinationAddress}`,
      data: { rideId: ride.id, type: "ride_assigned" }
    });
  }

  private async notifyRiderUnassigned(riderUserId: string, rideId: string) {
    await pushService.sendToUser(riderUserId, {
      title: "Ride unassigned",
      body: "You have been unassigned from a ride",
      data: { rideId, type: "ride_unassigned" }
    });
  }

  private async notifyPassengerAssigned(passengerUserId: string, riderName: string, ride: { id: string; pickupAddress: string }) {
    await pushService.sendToUser(passengerUserId, {
      title: "Rider assigned",
      body: `${riderName} is on the way to ${ride.pickupAddress}`,
      data: { rideId: ride.id, type: "passenger_rider_assigned" }
    });
  }

  private async loadActiveRules(zoneId?: string | null) {
    const where: Record<string, unknown> = { enabled: true };
    if (zoneId) {
      where.OR = [{ zoneId }, { zoneId: null }];
    }
    return prisma.assignmentRule.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
    });
  }

  private computeScore(params: {
    distanceKm: number;
    etaMinutes: number;
    rating: number;
    acceptanceRate: number;
    cancellationRate: number;
    rule?: { weightProximity: number; weightEta: number; weightRating: number; weightAcceptance: number; cancellationPenalty: number } | null;
  }) {
    const rule = params.rule;
    const wP = rule?.weightProximity ?? 0.35;
    const wE = rule?.weightEta ?? 0.25;
    const wR = rule?.weightRating ?? 0.15;
    const wA = rule?.weightAcceptance ?? 0.25;
    const cP = rule?.cancellationPenalty ?? 0.6;

    const proximityScore = Math.max(0, 100 - params.distanceKm * 12);
    const etaScore = Math.max(0, 100 - params.etaMinutes * 8);
    const ratingScore = params.rating * 20;
    const acceptanceScore = params.acceptanceRate;
    const cancellationPenalty = params.cancellationRate * cP;

    return {
      proximityScore,
      etaScore,
      ratingScore,
      acceptanceScore,
      cancellationPenalty,
      score: proximityScore * wP + etaScore * wE + ratingScore * wR + acceptanceScore * wA - cancellationPenalty
    };
  }

  async getActiveRides(token: string, statusFilter?: string) {
    const { session } = await this.requireAdmin(token);

    const filter = (statusFilter ?? "").toLowerCase();
    let whereStatus: { in: RideStatus[] } | RideStatus | undefined;
    if (filter === "all") {
      whereStatus = undefined;
    } else if (filter === "searching" || filter === "unassigned") {
      whereStatus = { in: [RideStatus.SEARCHING, RideStatus.SCHEDULED] };
    } else if (filter === "assigned") {
      whereStatus = RideStatus.ASSIGNED;
    } else if (filter === "arriving" || filter === "en_route") {
      whereStatus = RideStatus.ARRIVING;
    } else if (filter === "arrived") {
      whereStatus = RideStatus.ARRIVED;
    } else if (filter === "started" || filter === "active") {
      whereStatus = { in: [RideStatus.STARTED, RideStatus.ARRIVED, RideStatus.ARRIVING, RideStatus.ASSIGNED] };
    } else if (filter === "completed") {
      whereStatus = RideStatus.COMPLETED;
    } else if (filter === "cancelled") {
      whereStatus = RideStatus.CANCELLED;
    } else {
      whereStatus = { in: [RideStatus.SEARCHING, RideStatus.SCHEDULED, RideStatus.ASSIGNED, RideStatus.ARRIVING, RideStatus.ARRIVED, RideStatus.STARTED] };
    }

    const rides = await prisma.ride.findMany({
      where: whereStatus ? { status: whereStatus } : undefined,
      orderBy: [{ requestedAt: "desc" }],
      take: 200,
      include: {
        passenger: { include: { user: { select: { id: true, fullName: true, phoneE164: true } } } },
        rider: {
          include: {
            user: { select: { id: true, fullName: true, phoneE164: true } },
            vehicle: true
          }
        },
        serviceZone: { select: { id: true, name: true } }
      }
    });

    return rides.map((ride) => ({
      id: ride.id,
      status: ride.status,
      type: ride.serviceZone?.name ?? "Ride",
      pickupAddress: ride.pickupAddress,
      pickupLatitude: Number(ride.pickupLatitude),
      pickupLongitude: Number(ride.pickupLongitude),
      destinationAddress: ride.destinationAddress,
      destinationLatitude: ride.destinationLatitude ? Number(ride.destinationLatitude) : null,
      destinationLongitude: ride.destinationLongitude ? Number(ride.destinationLongitude) : null,
      estimatedFare: ride.estimatedFare,
      estimatedDistanceKm: ride.estimatedDistanceKm,
      estimatedDurationMinutes: ride.estimatedDurationMinutes,
      currency: ride.currency,
      requestedAt: ride.requestedAt,
      assignedAt: ride.assignedAt,
      passenger: ride.passenger?.user
        ? { id: ride.passenger.user.id, name: ride.passenger.user.fullName, phone: ride.passenger.user.phoneE164, userId: ride.passenger.userId }
        : null,
      assignedRider: ride.rider
        ? {
            id: ride.rider.id,
            name: ride.rider.user.fullName,
            phone: ride.rider.user.phoneE164,
            userId: ride.rider.userId,
            vehicle: ride.rider.vehicle
              ? { make: ride.rider.vehicle.make, model: ride.rider.vehicle.model, plateNumber: ride.rider.vehicle.plateNumber, vehicleType: ride.rider.vehicle.vehicleType }
              : null
          }
        : null,
      assignmentStatus: ride.riderId ? "assigned" : (ride.status === "CANCELLED" ? "cancelled" : (ride.status === "SEARCHING" ? "searching" : "unassigned"))
    }));
  }

  async getAvailableRiders(token: string, rideId: string) {
    const { session } = await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { user: { select: { id: true, fullName: true, phoneE164: true } } } },
        rider: { include: { user: { select: { id: true, fullName: true } } } }
      }
    });

    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const rules = await this.loadActiveRules(ride.serviceZoneId);
    const activeRule = rules[0] ?? null;

    const pickupLat = Number(ride.pickupLatitude);
    const pickupLng = Number(ride.pickupLongitude);

    const riders = await prisma.riderProfile.findMany({
      where: {
        onlineStatus: true,
        approvalStatus: "APPROVED",
        ...(ride.serviceZoneId ? { serviceZoneId: ride.serviceZoneId } : {})
      },
      include: {
        user: { select: { id: true, fullName: true, phoneE164: true, accountStatus: true } },
        vehicle: true,
        serviceZone: { select: { id: true, name: true } }
      }
    });

    const activeRideRiders = await prisma.ride.findMany({
      where: { status: { in: ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "SCHEDULED"] } },
      select: { riderId: true }
    });
    const busyRiderIds = new Set(activeRideRiders.map((r) => r.riderId).filter(Boolean) as string[]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const enriched = await Promise.all(
      riders
        .filter((r) => !busyRiderIds.has(r.id) && r.user.accountStatus !== "BANNED")
        .map(async (rider) => {
          const todayEarnings = await prisma.ride.aggregate({
            where: { riderId: rider.id, status: "COMPLETED", completedAt: { gte: todayStart } },
            _sum: { riderEarnings: true }
          });

          const todayTrips = await prisma.ride.count({
            where: { riderId: rider.id, status: "COMPLETED", completedAt: { gte: todayStart } }
          });

          const lat = rider.currentLatitude ? Number(rider.currentLatitude) : null;
          const lng = rider.currentLongitude ? Number(rider.currentLongitude) : null;
          let distanceToPickupKm = 999;
          let etaMinutes = 99;

          if (lat && lng) {
            distanceToPickupKm = haversineKm(lat, lng, pickupLat, pickupLng);
            etaMinutes = Math.round(distanceToPickupKm * 2.5);
          }

          const scores = this.computeScore({
            distanceKm: distanceToPickupKm,
            etaMinutes,
            rating: Number(rider.ratingAverage),
            acceptanceRate: Number(rider.acceptanceRate),
            cancellationRate: Number(rider.cancellationRate),
            rule: activeRule
          });

          const qualificationIssues: string[] = [];
          if (activeRule) {
            if (activeRule.minRating > 0 && Number(rider.ratingAverage) < activeRule.minRating) {
              qualificationIssues.push(`Rating ${rider.ratingAverage} below minimum ${activeRule.minRating}`);
            }
            if (activeRule.minAcceptanceRate > 0 && Number(rider.acceptanceRate) < activeRule.minAcceptanceRate) {
              qualificationIssues.push(`Acceptance ${rider.acceptanceRate}% below minimum ${activeRule.minAcceptanceRate}%`);
            }
            if (activeRule.maxCancellationRate < 100 && Number(rider.cancellationRate) > activeRule.maxCancellationRate) {
              qualificationIssues.push(`Cancellation ${rider.cancellationRate}% exceeds maximum ${activeRule.maxCancellationRate}%`);
            }
            if (activeRule.requireVehicle && !rider.vehicle) {
              qualificationIssues.push("No vehicle registered");
            }
          }

          return {
            riderId: rider.id,
            userId: rider.userId,
            displayName: rider.user.fullName,
            displayCode: rider.displayCode,
            phone: rider.user.phoneE164,
            rating: Number(rider.ratingAverage),
            acceptanceRate: Number(rider.acceptanceRate),
            cancellationRate: Number(rider.cancellationRate),
            completedTrips: rider.completedTrips,
            todayTrips,
            todayEarnings: Number(todayEarnings._sum.riderEarnings ?? 0),
            currentLatitude: lat,
            currentLongitude: lng,
            distanceToPickupKm: Math.round(distanceToPickupKm * 100) / 100,
            etaMinutes,
            score: Math.round(scores.score * 100) / 100,
            scoreBreakdown: {
              proximity: Math.round(scores.proximityScore * 100) / 100,
              eta: Math.round(scores.etaScore * 100) / 100,
              rating: Math.round(scores.ratingScore * 100) / 100,
              acceptance: Math.round(scores.acceptanceScore * 100) / 100,
              cancellationPenalty: Math.round(scores.cancellationPenalty * 100) / 100
            },
            qualificationIssues,
            qualified: qualificationIssues.length === 0,
            onlineStatus: rider.onlineStatus,
            vehicle: rider.vehicle
              ? {
                  make: rider.vehicle.make,
                  model: rider.vehicle.model,
                  color: rider.vehicle.color,
                  plateNumber: rider.vehicle.plateNumber,
                  vehicleType: rider.vehicle.vehicleType
                }
              : null,
            serviceZone: rider.serviceZone?.name ?? null
          };
        })
    );

    enriched.sort((a, b) => {
      if (a.qualified && !b.qualified) return -1;
      if (!a.qualified && b.qualified) return 1;
      return b.score - a.score;
    });

    return {
      ride: {
        id: ride.id,
        status: ride.status,
        pickupAddress: ride.pickupAddress,
        destinationAddress: ride.destinationAddress,
        estimatedFare: ride.estimatedFare,
        estimatedDistanceKm: ride.estimatedDistanceKm,
        estimatedDurationMinutes: ride.estimatedDurationMinutes,
        currency: ride.currency,
        requestedAt: ride.requestedAt,
        assignedRider: ride.rider ? { id: ride.rider.id, name: ride.rider.user.fullName } : null,
        passenger: ride.passenger?.user ? { name: ride.passenger.user.fullName, phone: ride.passenger.user.phoneE164 } : null
      },
      availableRiders: enriched,
      recommendedRiderId: enriched.length > 0 && enriched[0]!.qualified ? enriched[0]!.riderId : null,
      activeRules: activeRule ? {
        id: activeRule.id,
        name: activeRule.name,
        weights: { proximity: activeRule.weightProximity, eta: activeRule.weightEta, rating: activeRule.weightRating, acceptance: activeRule.weightAcceptance },
        maxPickupRadiusKm: activeRule.maxPickupRadiusKm
      } : null
    };
  }

  async assignRider(token: string, rideId: string, input: AssignRiderInput, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "rides.assign");

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: { include: { user: true } } }
    });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (ride.status !== "SEARCHING" && ride.status !== "SCHEDULED") {
      throw new AppError("Ride is not in a state that allows assignment", 400, "RIDE_NOT_ASSIGNABLE");
    }
    if (ride.riderId) {
      throw new AppError("Ride already has an assigned rider", 409, "RIDE_ALREADY_ASSIGNED");
    }

    const rider = await this.validateRiderAvailable(input.riderProfileId, ride.serviceZoneId);

    await prisma.ride.update({
      where: { id: rideId },
      data: { riderId: input.riderProfileId, status: "ASSIGNED", assignedAt: new Date() }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_ASSIGNED", {
      riderProfileId: input.riderProfileId,
      reason: input.reason ?? "Manual admin assignment",
      method: "MANUAL",
      actorName: session.user.fullName
    });

    await this.logAssignmentAudit({
      rideId,
      action: "MANUAL_ASSIGN",
      actorUserId: session.user.id,
      riderId: input.riderProfileId,
      reason: input.reason,
      metadata: { method: "MANUAL", actorName: session.user.fullName },
      ip, ua
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_ASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: { riderProfileId: input.riderProfileId, reason: input.reason }
      }
    });

    // Push notifications
    if (rider.userId) {
      await this.notifyRiderAssigned(rider.userId, {
        id: ride.id,
        pickupAddress: ride.pickupAddress,
        destinationAddress: ride.destinationAddress,
        estimatedFare: ride.estimatedFare,
        currency: ride.currency
      });
    }
    if (ride.passenger?.userId) {
      await this.notifyPassengerAssigned(ride.passenger.userId, rider.user.fullName, {
        id: ride.id,
        pickupAddress: ride.pickupAddress
      });
    }

    // Real-time WebSocket
    emitRideAssigned({
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: rider.userId ?? "",
      ride: { id: ride.id, status: "ASSIGNED", pickupAddress: ride.pickupAddress } as Record<string, unknown>
    });
    emitRideStatusUpdate({
      ride: { id: ride.id, status: "ASSIGNED" } as Record<string, unknown>,
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: rider.userId ?? ""
    });

    return { rideId, riderProfileId: input.riderProfileId, status: "ASSIGNED" };
  }

  async reassignRider(token: string, rideId: string, input: ReassignRiderInput, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "rides.reassign");

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: { include: { user: true } }, rider: { include: { user: true } } }
    });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (!ride.riderId) {
      throw new AppError("Ride has no assigned rider to reassign", 400, "RIDE_NO_RIDER");
    }
    if (ride.riderId === input.riderProfileId) {
      throw new AppError("Cannot reassign to the same rider", 400, "SAME_RIDER");
    }

    const newRider = await this.validateRiderAvailable(input.riderProfileId, ride.serviceZoneId);
    const previousRiderId = ride.riderId;
    const previousRiderUserId = ride.rider?.userId;

    await prisma.ride.update({
      where: { id: rideId },
      data: { riderId: input.riderProfileId, assignedAt: new Date() }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_REASSIGNED", {
      previousRiderId,
      newRiderId: input.riderProfileId,
      reason: input.reason,
      reasonLabel: REASON_LABELS[input.reason] ?? input.reason,
      reasonNote: input.reasonNote,
      method: "MANUAL",
      actorName: session.user.fullName
    });

    await this.logAssignmentAudit({
      rideId,
      action: "MANUAL_REASSIGN",
      actorUserId: session.user.id,
      riderId: input.riderProfileId,
      previousRiderId,
      reason: input.reason,
      reasonNote: input.reasonNote,
      metadata: { method: "MANUAL", reasonLabel: REASON_LABELS[input.reason], actorName: session.user.fullName },
      ip, ua
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_REASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: { previousRiderId, newRiderId: input.riderProfileId, reason: input.reason }
      }
    });

    // Push notifications to both riders
    if (previousRiderUserId) {
      await this.notifyRiderUnassigned(previousRiderUserId, rideId);
    }
    if (newRider.userId) {
      await this.notifyRiderAssigned(newRider.userId, {
        id: ride.id,
        pickupAddress: ride.pickupAddress,
        destinationAddress: ride.destinationAddress,
        estimatedFare: ride.estimatedFare,
        currency: ride.currency
      });
    }
    if (ride.passenger?.userId) {
      await this.notifyPassengerAssigned(ride.passenger.userId, newRider.user.fullName, {
        id: ride.id,
        pickupAddress: ride.pickupAddress
      });
    }

    // Real-time
    emitRideStatusUpdate({
      ride: { id: ride.id, status: "ASSIGNED" } as Record<string, unknown>,
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: newRider.userId ?? ""
    });

    return { rideId, previousRiderId, newRiderId: input.riderProfileId, status: ride.status };
  }

  async unassignRider(token: string, rideId: string, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "rides.unassign");

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: { include: { user: true } }, rider: { include: { user: true } } }
    });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (!ride.riderId) {
      throw new AppError("Ride has no assigned rider", 400, "RIDE_NO_RIDER");
    }

    const previousRiderId = ride.riderId;
    const previousRiderUserId = ride.rider?.userId;

    await prisma.ride.update({
      where: { id: rideId },
      data: { riderId: null, status: "SEARCHING", assignedAt: null }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_UNASSIGNED", {
      previousRiderId,
      method: "MANUAL",
      actorName: session.user.fullName
    });

    await this.logAssignmentAudit({
      rideId,
      action: "UNASSIGN",
      actorUserId: session.user.id,
      previousRiderId,
      metadata: { method: "MANUAL", actorName: session.user.fullName },
      ip, ua
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_UNASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: { previousRiderId }
      }
    });

    // Push notification to unassigned rider
    if (previousRiderUserId) {
      await this.notifyRiderUnassigned(previousRiderUserId, rideId);
    }

    // Real-time
    emitRideStatusUpdate({
      ride: { id: ride.id, status: "SEARCHING" } as Record<string, unknown>,
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: previousRiderUserId ?? ""
    });

    return { rideId, previousRiderId, status: "SEARCHING" };
  }

  async autoAssign(token: string, rideId: string, input: AutoAssignInput, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "rides.auto_assign");

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: { include: { user: true } } }
    });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (ride.status !== "SEARCHING" && ride.status !== "SCHEDULED") {
      throw new AppError("Ride is not in a state that allows assignment", 400, "RIDE_NOT_ASSIGNABLE");
    }
    if (ride.riderId) {
      throw new AppError("Ride already has an assigned rider", 409, "RIDE_ALREADY_ASSIGNED");
    }

    const rules = await this.loadActiveRules(ride.serviceZoneId);
    const activeRule = rules[0] ?? null;

    const pickupLat = Number(ride.pickupLatitude);
    const pickupLng = Number(ride.pickupLongitude);

    const maxRadius = activeRule?.maxPickupRadiusKm ?? input.maxRadiusKm;

    const riders = await prisma.riderProfile.findMany({
      where: {
        onlineStatus: activeRule?.requireOnline !== false,
        approvalStatus: activeRule?.requireApproved !== false ? "APPROVED" : undefined,
        ...(ride.serviceZoneId ? { serviceZoneId: ride.serviceZoneId } : {})
      },
      include: { user: true, vehicle: true }
    });

    const activeRideRiders = await prisma.ride.findMany({
      where: { status: { in: ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "SCHEDULED"] } },
      select: { riderId: true }
    });
    const busyRiderIds = new Set(activeRideRiders.map((r) => r.riderId).filter(Boolean) as string[]);

    const available = riders.filter((r) => {
      if (busyRiderIds.has(r.id)) return false;
      if (r.user.accountStatus === "BANNED") return false;
      if (activeRule?.excludeSuspended && r.approvalStatus === "SUSPENDED") return false;
      if (activeRule?.requireVehicle && !r.vehicle) return false;
      return true;
    });

    if (available.length === 0) {
      throw new AppError("No available riders found nearby", 404, "NO_RIDERS_FOUND");
    }

    const candidates = available.map((r) => {
      const lat = r.currentLatitude ? Number(r.currentLatitude) : null;
      const lng = r.currentLongitude ? Number(r.currentLongitude) : null;
      const dist = lat && lng ? haversineKm(lat, lng, pickupLat, pickupLng) : 99;
      return {
        riderId: r.id,
        userId: r.userId,
        displayName: r.user.fullName,
        isOnline: r.onlineStatus,
        isApproved: r.approvalStatus === "APPROVED",
        isAvailable: !busyRiderIds.has(r.id),
        serviceZoneId: r.serviceZoneId ?? "",
        distanceToPickupKm: dist,
        etaMinutes: Math.round(dist * 2.5),
        ratingAverage: Number(r.ratingAverage),
        acceptanceRate: Number(r.acceptanceRate),
        cancellationRate: Number(r.cancellationRate)
      };
    }).filter((c) => c.distanceToPickupKm <= maxRadius);

    if (candidates.length === 0) {
      throw new AppError("No riders within pickup radius", 409, "NO_RIDERS_IN_RADIUS");
    }

    // Score and rank
    const scored = candidates.map((c) => {
      const scores = this.computeScore({
        distanceKm: c.distanceToPickupKm,
        etaMinutes: c.etaMinutes,
        rating: c.ratingAverage,
        acceptanceRate: c.acceptanceRate,
        cancellationRate: c.cancellationRate,
        rule: activeRule
      });
      return { ...c, score: scores.score, scoreBreakdown: scores };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0]!;

    await prisma.ride.update({
      where: { id: rideId },
      data: { riderId: selected.riderId, status: "ASSIGNED", assignedAt: new Date() }
    });

    await this.logRideEvent(rideId, session.user.id, "AUTO_ASSIGNED", {
      riderProfileId: selected.riderId,
      score: selected.score,
      scoreBreakdown: selected.scoreBreakdown,
      method: "AUTOMATIC",
      ruleApplied: activeRule?.name ?? "Default",
      actorName: session.user.fullName
    });

    await this.logAssignmentAudit({
      rideId,
      action: "AUTO_ASSIGN",
      actorUserId: session.user.id,
      riderId: selected.riderId,
      score: selected.score,
      reason: activeRule?.name ?? "Default algorithm",
      metadata: { method: "AUTOMATIC", scoreBreakdown: selected.scoreBreakdown, ruleApplied: activeRule?.name, actorName: session.user.fullName },
      ip, ua
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_AUTO_ASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: { riderProfileId: selected.riderId, score: selected.score, ruleApplied: activeRule?.name }
      }
    });

    // Push notifications
    if (selected.userId) {
      await this.notifyRiderAssigned(selected.userId, {
        id: ride.id,
        pickupAddress: ride.pickupAddress,
        destinationAddress: ride.destinationAddress,
        estimatedFare: ride.estimatedFare,
        currency: ride.currency
      });
    }
    if (ride.passenger?.userId) {
      await this.notifyPassengerAssigned(ride.passenger.userId, selected.displayName, {
        id: ride.id,
        pickupAddress: ride.pickupAddress
      });
    }

    // Real-time
    emitRideAssigned({
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: selected.userId ?? "",
      ride: { id: ride.id, status: "ASSIGNED", pickupAddress: ride.pickupAddress } as Record<string, unknown>
    });
    emitRideStatusUpdate({
      ride: { id: ride.id, status: "ASSIGNED" } as Record<string, unknown>,
      passengerUserId: ride.passenger?.userId ?? "",
      riderUserId: selected.userId ?? ""
    });

    return {
      rideId,
      riderProfileId: selected.riderId,
      score: selected.score,
      scoreBreakdown: selected.scoreBreakdown,
      status: "ASSIGNED"
    };
  }

  async getAssignmentHistory(token: string, rideId: string) {
    await this.requireAdmin(token);

    const events = await prisma.rideEvent.findMany({
      where: {
        rideId,
        eventType: { in: ["ADMIN_ASSIGNED", "ADMIN_REASSIGNED", "ADMIN_UNASSIGNED", "AUTO_ASSIGNED"] }
      },
      orderBy: { createdAt: "desc" },
      include: {
        ride: { include: { rider: { include: { user: { select: { id: true, fullName: true } } } } } }
      }
    });

    return events.map((event) => ({
      id: event.id,
      rideId: event.rideId,
      eventType: event.eventType,
      payload: event.payload,
      createdAt: event.createdAt,
      currentRider: event.ride.rider?.user.fullName ?? "Unassigned"
    }));
  }

  async getAllAssignmentHistory(token: string, limit = 50) {
    await this.requireAdmin(token);

    const events = await prisma.rideEvent.findMany({
      where: {
        eventType: { in: ["ADMIN_ASSIGNED", "ADMIN_REASSIGNED", "ADMIN_UNASSIGNED", "AUTO_ASSIGNED"] }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        ride: {
          include: {
            passenger: { include: { user: { select: { fullName: true, phoneE164: true } } } },
            rider: {
              include: {
                user: { select: { fullName: true, phoneE164: true } },
                vehicle: { select: { make: true, model: true, plateNumber: true } }
              }
            }
          }
        }
      }
    });

    return events.map((event) => {
      const payload = (event.payload && typeof event.payload === "object" ? event.payload : {}) as Record<string, unknown>;
      const method = event.eventType === "AUTO_ASSIGNED" || payload.method === "AUTOMATIC" ? "AUTO" : "MANUAL";
      const requestedTime = event.ride?.requestedAt ? new Date(event.ride.requestedAt).getTime() : 0;
      const eventTime = new Date(event.createdAt).getTime();
      const responseTimeSec = requestedTime > 0 ? Math.max(0, Math.round((eventTime - requestedTime) / 1000)) : 0;

      return {
        id: event.id,
        rideId: event.rideId,
        passengerName: event.ride?.passenger?.user?.fullName ?? "Unknown Passenger",
        passengerPhone: event.ride?.passenger?.user?.phoneE164 ?? "",
        riderName: event.ride?.rider?.user?.fullName ?? (payload.riderName as string) ?? "Unassigned",
        riderPlate: event.ride?.rider?.vehicle?.plateNumber ?? null,
        pickupAddress: event.ride?.pickupAddress ?? "—",
        destinationAddress: event.ride?.destinationAddress ?? "—",
        assignmentMethod: method as "AUTO" | "MANUAL",
        assignmentTime: event.createdAt,
        responseTimeSec,
        status: event.ride?.status ?? "ASSIGNED",
        adminName: (payload.actorName as string) ?? (method === "AUTO" ? "System Auto-Dispatcher" : "Operations Admin"),
        reason: (payload.reason as string) ?? null,
        score: typeof payload.score === "number" ? payload.score : null
      };
    });
  }

  async getRideTimeline(token: string, rideId: string) {
    await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { user: { select: { fullName: true, phoneE164: true } } } },
        rider: {
          include: {
            user: { select: { fullName: true, phoneE164: true } },
            vehicle: true
          }
        },
        events: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

    const stages = [
      { key: "CREATED", label: "Request Created", timestamp: ride.requestedAt, completed: true },
      {
        key: "SEARCHING",
        label: "Searching for Rider",
        timestamp: ride.requestedAt,
        completed: Boolean(ride.requestedAt)
      },
      {
        key: "ASSIGNED",
        label: "Rider Assigned",
        timestamp: ride.assignedAt ?? null,
        completed: Boolean(ride.riderId || ride.assignedAt)
      },
      {
        key: "ACCEPTED",
        label: "Rider Accepted",
        timestamp: ride.assignedAt ?? null,
        completed: Boolean(ride.assignedAt && ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "COMPLETED"].includes(ride.status))
      },
      {
        key: "EN_ROUTE",
        label: "Rider En Route to Pickup",
        timestamp: ride.assignedAt ?? null,
        completed: ["ARRIVING", "ARRIVED", "STARTED", "COMPLETED"].includes(ride.status)
      },
      {
        key: "ARRIVED",
        label: "Rider Arrived at Pickup",
        timestamp: null,
        completed: ["ARRIVED", "STARTED", "COMPLETED"].includes(ride.status)
      },
      {
        key: "STARTED",
        label: "Trip Started",
        timestamp: ride.startedAt ?? null,
        completed: Boolean(ride.startedAt || ride.status === "STARTED" || ride.status === "COMPLETED")
      },
      {
        key: "COMPLETED",
        label: "Trip Completed",
        timestamp: ride.completedAt ?? null,
        completed: ride.status === "COMPLETED"
      }
    ];

    return {
      rideId: ride.id,
      status: ride.status,
      currency: ride.currency,
      estimatedFare: ride.estimatedFare,
      finalFare: ride.finalFare,
      pickupAddress: ride.pickupAddress,
      destinationAddress: ride.destinationAddress,
      pickupLatitude: Number(ride.pickupLatitude),
      pickupLongitude: Number(ride.pickupLongitude),
      destinationLatitude: ride.destinationLatitude ? Number(ride.destinationLatitude) : null,
      destinationLongitude: ride.destinationLongitude ? Number(ride.destinationLongitude) : null,
      passenger: ride.passenger?.user ? { name: ride.passenger.user.fullName, phone: ride.passenger.user.phoneE164 } : null,
      rider: ride.rider ? {
        name: ride.rider.user.fullName,
        phone: ride.rider.user.phoneE164,
        plate: ride.rider.vehicle?.plateNumber,
        model: `${ride.rider.vehicle?.make ?? ""} ${ride.rider.vehicle?.model ?? ""}`.trim()
      } : null,
      stages,
      events: ride.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        payload: e.payload,
        createdAt: e.createdAt
      }))
    };
  }

  // ── Assignment Rules CRUD ──

  async listRules(token: string) {
    await this.requireAdmin(token);
    return prisma.assignmentRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { zone: { select: { id: true, name: true, city: true } } }
    });
  }

  async createRule(token: string, data: Record<string, unknown>, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "assignment_rules.manage");

    const rule = await prisma.assignmentRule.create({
      data: {
        name: data.name as string,
        description: (data.description as string) ?? null,
        priority: (data.priority as number) ?? 0,
        weightProximity: (data.weightProximity as number) ?? 0.35,
        weightEta: (data.weightEta as number) ?? 0.25,
        weightRating: (data.weightRating as number) ?? 0.15,
        weightAcceptance: (data.weightAcceptance as number) ?? 0.25,
        cancellationPenalty: (data.cancellationPenalty as number) ?? 0.6,
        maxPickupRadiusKm: (data.maxPickupRadiusKm as number) ?? 8,
        maxEtaMinutes: (data.maxEtaMinutes as number) ?? 20,
        minRating: (data.minRating as number) ?? 0,
        minAcceptanceRate: (data.minAcceptanceRate as number) ?? 0,
        maxCancellationRate: (data.maxCancellationRate as number) ?? 100,
        requireOnline: (data.requireOnline as boolean) ?? true,
        requireApproved: (data.requireApproved as boolean) ?? true,
        excludeSuspended: (data.excludeSuspended as boolean) ?? true,
        requireVehicle: (data.requireVehicle as boolean) ?? false,
        autoAssignEnabled: (data.autoAssignEnabled as boolean) ?? false,
        autoAssignDelayMs: (data.autoAssignDelayMs as number) ?? 30000,
        zoneId: (data.zoneId as string) ?? null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "ASSIGNMENT_RULE_CREATE",
        entityType: "AssignmentRule",
        entityId: rule.id,
        changes: data as Record<string, never>
      }
    });

    return rule;
  }

  async updateRule(token: string, ruleId: string, data: Record<string, unknown>, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "assignment_rules.manage");

    const existing = await prisma.assignmentRule.findUnique({ where: { id: ruleId } });
    if (!existing) throw new AppError("Rule not found", 404, "RULE_NOT_FOUND");

    const rule = await prisma.assignmentRule.update({
      where: { id: ruleId },
      data: {
        ...(data.name !== undefined && { name: data.name as string }),
        ...(data.description !== undefined && { description: (data.description as string) ?? null }),
        ...(data.priority !== undefined && { priority: data.priority as number }),
        ...(data.weightProximity !== undefined && { weightProximity: data.weightProximity as number }),
        ...(data.weightEta !== undefined && { weightEta: data.weightEta as number }),
        ...(data.weightRating !== undefined && { weightRating: data.weightRating as number }),
        ...(data.weightAcceptance !== undefined && { weightAcceptance: data.weightAcceptance as number }),
        ...(data.cancellationPenalty !== undefined && { cancellationPenalty: data.cancellationPenalty as number }),
        ...(data.maxPickupRadiusKm !== undefined && { maxPickupRadiusKm: data.maxPickupRadiusKm as number }),
        ...(data.maxEtaMinutes !== undefined && { maxEtaMinutes: data.maxEtaMinutes as number }),
        ...(data.minRating !== undefined && { minRating: data.minRating as number }),
        ...(data.minAcceptanceRate !== undefined && { minAcceptanceRate: data.minAcceptanceRate as number }),
        ...(data.maxCancellationRate !== undefined && { maxCancellationRate: data.maxCancellationRate as number }),
        ...(data.requireOnline !== undefined && { requireOnline: data.requireOnline as boolean }),
        ...(data.requireApproved !== undefined && { requireApproved: data.requireApproved as boolean }),
        ...(data.excludeSuspended !== undefined && { excludeSuspended: data.excludeSuspended as boolean }),
        ...(data.requireVehicle !== undefined && { requireVehicle: data.requireVehicle as boolean }),
        ...(data.autoAssignEnabled !== undefined && { autoAssignEnabled: data.autoAssignEnabled as boolean }),
        ...(data.autoAssignDelayMs !== undefined && { autoAssignDelayMs: data.autoAssignDelayMs as number }),
        ...(data.zoneId !== undefined && { zoneId: (data.zoneId as string) ?? null }),
        ...(data.enabled !== undefined && { enabled: data.enabled as boolean })
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "ASSIGNMENT_RULE_UPDATE",
        entityType: "AssignmentRule",
        entityId: ruleId,
        changes: data as Record<string, never>
      }
    });

    return rule;
  }

  async deleteRule(token: string, ruleId: string, ip?: string, ua?: string) {
    const { session } = await this.requireAdmin(token, ip, ua);
    await this.requirePermission(session, "assignment_rules.manage");

    const existing = await prisma.assignmentRule.findUnique({ where: { id: ruleId } });
    if (!existing) throw new AppError("Rule not found", 404, "RULE_NOT_FOUND");

    await prisma.assignmentRule.delete({ where: { id: ruleId } });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "ASSIGNMENT_RULE_DELETE",
        entityType: "AssignmentRule",
        entityId: ruleId,
        changes: { deletedName: existing.name }
      }
    });

    return { deleted: true };
  }

  // ── Assignment Audit Logs ──

  async getAssignmentAuditLogs(token: string, query: { rideId?: string; action?: string; page?: number; limit?: number }) {
    await this.requireAdmin(token);

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.rideId) where.rideId = query.rideId;
    if (query.action) where.action = query.action;

    const [logs, total] = await Promise.all([
      prisma.assignmentAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          ride: { select: { id: true, pickupAddress: true, destinationAddress: true, status: true } }
        }
      }),
      prisma.assignmentAuditLog.count({ where })
    ]);

    return { data: logs, total, page, limit };
  }

  // ── Stats ──

  async getAssignmentStats(token: string) {
    await this.requireAdmin(token);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalActive, unassigned, assigned, arriving, arrived, todayAssigned, todayAutoAssigned, todayUnassigned, rulesCount] = await Promise.all([
      prisma.ride.count({ where: { status: { in: ["SEARCHING", "SCHEDULED", "ASSIGNED", "ARRIVING", "ARRIVED"] } } }),
      prisma.ride.count({ where: { status: { in: ["SEARCHING", "SCHEDULED"] }, riderId: null } }),
      prisma.ride.count({ where: { status: "ASSIGNED" } }),
      prisma.ride.count({ where: { status: "ARRIVING" } }),
      prisma.ride.count({ where: { status: "ARRIVED" } }),
      prisma.assignmentAuditLog.count({ where: { action: { in: ["MANUAL_ASSIGN", "AUTO_ASSIGN"] }, createdAt: { gte: today } } }),
      prisma.assignmentAuditLog.count({ where: { action: "AUTO_ASSIGN", createdAt: { gte: today } } }),
      prisma.assignmentAuditLog.count({ where: { action: "UNASSIGN", createdAt: { gte: today } } }),
      prisma.assignmentRule.count({ where: { enabled: true } })
    ]);

    return {
      totalActive,
      unassigned,
      assigned,
      arriving,
      arrived,
      todayAssigned,
      todayAutoAssigned,
      todayUnassigned,
      rulesCount,
      assignmentRate: totalActive > 0 ? Math.round(((totalActive - unassigned) / totalActive) * 100) : 0
    };
  }
}

export const assignmentService = new AssignmentService();
