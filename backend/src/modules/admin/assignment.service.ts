import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { MatchingService } from "../matching/matching.service.js";
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
  private matchingService = new MatchingService();

  private async requireAdmin(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: { user: true }
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }
    if (session.user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }
    return session;
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

  async getAvailableRiders(token: string, rideId: string) {
    await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { user: { select: { id: true, fullName: true, phoneE164: true } } } },
        rider: { include: { user: { select: { id: true, fullName: true } } } }
      }
    });

    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");

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
      where: {
        status: { in: ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "SCHEDULED"] }
      },
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
            where: {
              riderId: rider.id,
              status: "COMPLETED",
              completedAt: { gte: todayStart }
            },
            _sum: { riderEarnings: true }
          });

          const todayTrips = await prisma.ride.count({
            where: {
              riderId: rider.id,
              status: "COMPLETED",
              completedAt: { gte: todayStart }
            }
          });

          const lat = rider.currentLatitude ? Number(rider.currentLatitude) : null;
          const lng = rider.currentLongitude ? Number(rider.currentLongitude) : null;
          let distanceToPickupKm = 999;
          let etaMinutes = 99;

          if (lat && lng) {
            distanceToPickupKm = haversineKm(lat, lng, pickupLat, pickupLng);
            etaMinutes = Math.round(distanceToPickupKm * 2.5);
          }

          const proximityScore = Math.max(0, 100 - distanceToPickupKm * 12);
          const etaScore = Math.max(0, 100 - etaMinutes * 8);
          const ratingScore = Number(rider.ratingAverage) * 20;
          const acceptanceScore = Number(rider.acceptanceRate);
          const cancellationPenalty = Number(rider.cancellationRate) * 0.6;
          const score =
            proximityScore * 0.35 +
            etaScore * 0.25 +
            ratingScore * 0.15 +
            acceptanceScore * 0.25 -
            cancellationPenalty;

          return {
            riderId: rider.id,
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
            score: Math.round(score * 100) / 100,
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

    enriched.sort((a, b) => b.score - a.score);

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
        assignedRider: ride.rider
          ? { id: ride.rider.id, name: ride.rider.user.fullName }
          : null,
        passenger: ride.passenger?.user
          ? { name: ride.passenger.user.fullName, phone: ride.passenger.user.phoneE164 }
          : null
      },
      availableRiders: enriched,
      recommendedRiderId: enriched.length > 0 ? enriched[0]!.riderId : null
    };
  }

  async assignRider(token: string, rideId: string, input: AssignRiderInput) {
    const session = await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (ride.status !== "SEARCHING" && ride.status !== "SCHEDULED") {
      throw new AppError("Ride is not in a state that allows assignment", 400, "RIDE_NOT_ASSIGNABLE");
    }
    if (ride.riderId) {
      throw new AppError("Ride already has an assigned rider", 409, "RIDE_ALREADY_ASSIGNED");
    }

    await this.validateRiderAvailable(input.riderProfileId, ride.serviceZoneId);

    await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId: input.riderProfileId,
        status: "ASSIGNED",
        assignedAt: new Date()
      }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_ASSIGNED", {
      riderProfileId: input.riderProfileId,
      reason: input.reason ?? "Manual admin assignment",
      method: "MANUAL"
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

    return { rideId, riderProfileId: input.riderProfileId, status: "ASSIGNED" };
  }

  async reassignRider(token: string, rideId: string, input: ReassignRiderInput) {
    const session = await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (!ride.riderId) {
      throw new AppError("Ride has no assigned rider to reassign", 400, "RIDE_NO_RIDER");
    }
    if (ride.riderId === input.riderProfileId) {
      throw new AppError("Cannot reassign to the same rider", 400, "SAME_RIDER");
    }

    await this.validateRiderAvailable(input.riderProfileId, ride.serviceZoneId);

    const previousRiderId = ride.riderId;

    await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId: input.riderProfileId,
        assignedAt: new Date()
      }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_REASSIGNED", {
      previousRiderId,
      newRiderId: input.riderProfileId,
      reason: input.reason,
      reasonLabel: REASON_LABELS[input.reason] ?? input.reason,
      reasonNote: input.reasonNote,
      method: "MANUAL"
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_REASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: {
          previousRiderId,
          newRiderId: input.riderProfileId,
          reason: input.reason
        }
      }
    });

    return { rideId, previousRiderId, newRiderId: input.riderProfileId, status: ride.status };
  }

  async unassignRider(token: string, rideId: string) {
    const session = await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (!ride.riderId) {
      throw new AppError("Ride has no assigned rider", 400, "RIDE_NO_RIDER");
    }

    const previousRiderId = ride.riderId;

    await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId: null,
        status: "SEARCHING",
        assignedAt: null
      }
    });

    await this.logRideEvent(rideId, session.user.id, "ADMIN_UNASSIGNED", {
      previousRiderId,
      method: "MANUAL"
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

    return { rideId, previousRiderId, status: "SEARCHING" };
  }

  async autoAssign(token: string, rideId: string, input: AutoAssignInput) {
    const session = await this.requireAdmin(token);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError("Ride not found", 404, "RIDE_NOT_FOUND");
    if (ride.status !== "SEARCHING" && ride.status !== "SCHEDULED") {
      throw new AppError("Ride is not in a state that allows assignment", 400, "RIDE_NOT_ASSIGNABLE");
    }
    if (ride.riderId) {
      throw new AppError("Ride already has an assigned rider", 409, "RIDE_ALREADY_ASSIGNED");
    }

    const pickupLat = Number(ride.pickupLatitude);
    const pickupLng = Number(ride.pickupLongitude);

    const riders = await prisma.riderProfile.findMany({
      where: {
        onlineStatus: true,
        approvalStatus: "APPROVED",
        ...(ride.serviceZoneId ? { serviceZoneId: ride.serviceZoneId } : {})
      },
      include: { user: true, vehicle: true }
    });

    const activeRideRiders = await prisma.ride.findMany({
      where: {
        status: { in: ["ASSIGNED", "ARRIVING", "ARRIVED", "STARTED", "SCHEDULED"] }
      },
      select: { riderId: true }
    });
    const busyRiderIds = new Set(activeRideRiders.map((r) => r.riderId).filter(Boolean) as string[]);

    const available = riders.filter((r) => !busyRiderIds.has(r.id) && r.user.accountStatus !== "BANNED");

    if (available.length === 0) {
      throw new AppError("No available riders found nearby", 404, "NO_RIDERS_FOUND");
    }

    const candidates = available
      .map((r) => {
        const lat = r.currentLatitude ? Number(r.currentLatitude) : null;
        const lng = r.currentLongitude ? Number(r.currentLongitude) : null;
        const dist = lat && lng ? haversineKm(lat, lng, pickupLat, pickupLng) : 99;
        return {
          riderId: r.id,
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
      })
      .filter((c) => c.distanceToPickupKm <= input.maxRadiusKm);

    const ranked = this.matchingService.rankCandidates({
      requestedServiceZoneId: ride.serviceZoneId ?? "",
      maxPickupRadiusKm: input.maxRadiusKm,
      candidates
    });

    if (ranked.length === 0) {
      throw new AppError("No riders passed availability checks", 409, "NO_QUALIFIED_RIDERS");
    }

    const selected = ranked[0]!;

    await prisma.ride.update({
      where: { id: rideId },
      data: {
        riderId: selected.riderId,
        status: "ASSIGNED",
        assignedAt: new Date()
      }
    });

    await this.logRideEvent(rideId, session.user.id, "AUTO_ASSIGNED", {
      riderProfileId: selected.riderId,
      score: selected.score,
      rationale: selected.rationale,
      method: "AUTOMATIC"
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        actorRole: session.user.role,
        action: "RIDER_AUTO_ASSIGN",
        entityType: "Ride",
        entityId: rideId,
        changes: { riderProfileId: selected.riderId, score: selected.score }
      }
    });

    return {
      rideId,
      riderProfileId: selected.riderId,
      score: selected.score,
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
        ride: {
          include: {
            rider: { include: { user: { select: { id: true, fullName: true } } } }
          }
        }
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

  async getActiveRides(token: string) {
    await this.requireAdmin(token);

    const rides = await prisma.ride.findMany({
      where: {
        status: { in: ["SEARCHING", "SCHEDULED", "ASSIGNED", "ARRIVING", "ARRIVED"] }
      },
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
        ? { id: ride.passenger.user.id, name: ride.passenger.user.fullName, phone: ride.passenger.user.phoneE164 }
        : null,
      assignedRider: ride.rider
        ? {
            id: ride.rider.id,
            name: ride.rider.user.fullName,
            phone: ride.rider.user.phoneE164,
            vehicle: ride.rider.vehicle
              ? { make: ride.rider.vehicle.make, model: ride.rider.vehicle.model, plateNumber: ride.rider.vehicle.plateNumber }
              : null
          }
        : null,
      assignmentStatus: ride.riderId ? "assigned" : "unassigned"
    }));
  }
}

export const assignmentService = new AssignmentService();
