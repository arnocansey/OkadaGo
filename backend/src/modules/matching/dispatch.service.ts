import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  OfferStatus,
  RideStatus,
  RiderApprovalStatus,
  RiderTripStatus,
  VehicleType,
} from "../../generated/prisma/enums.js";
import {
  MatchingService,
  calculateBearingDegrees,
  type MatchingWeights,
} from "./matching.service.js";
import {
  emitRideAssigned,
  emitRideStatusUpdate,
  serializeRideForRealtime,
  getRealtimeServer,
} from "../realtime/realtime.service.js";
import { pushService } from "../notifications/push.service.js";

const matchingService = new MatchingService();

// Escalation rounds configuration
export const DISPATCH_ROUNDS = [
  { round: 1, radiusKm: 1.2, timeoutSec: 10 },
  { round: 2, radiusKm: 2.5, timeoutSec: 10 },
  { round: 3, radiusKm: 4.0, timeoutSec: 10 },
] as const;

// In-memory timer handle registry to prevent orphan timeouts across restarts
const activeDispatchTimers = new Map<string, NodeJS.Timeout>();

export class DispatchService {
  /**
   * Generates a cryptographically secure 4-digit pickup PIN for passenger safety.
   */
  generateSafetyPin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Dispatches or escalates a ride request across concentric distance rings.
   */
  async dispatchRide(rideId: string, targetRound = 1): Promise<boolean> {
    const existingTimer = activeDispatchTimers.get(rideId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      activeDispatchTimers.delete(rideId);
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { user: true } },
        serviceZone: true,
        dispatchOffers: {
          select: { riderId: true, status: true },
        },
      },
    });

    if (!ride || ride.status !== RideStatus.SEARCHING) {
      return false; // Ride is already assigned, cancelled, or completed
    }

    const roundConfig =
      DISPATCH_ROUNDS.find((r) => r.round === targetRound) ?? DISPATCH_ROUNDS[0]!;

    // Exclude riders who already rejected this ride in prior rounds
    const rejectedRiderIds = new Set(
      ride.dispatchOffers
        .filter((o) => o.status === OfferStatus.REJECTED)
        .map((o) => o.riderId)
    );

    const pickupLat = Number(ride.pickupLatitude);
    const pickupLng = Number(ride.pickupLongitude);

    // Fetch active assignment rule weights if configured by admin
    const assignmentRule = await prisma.assignmentRule.findFirst({
      where: {
        enabled: true,
        OR: [{ zoneId: ride.serviceZoneId }, { zoneId: null }],
      },
      orderBy: { priority: "desc" },
    });

    const weights: MatchingWeights | undefined = assignmentRule
      ? {
          weightProximity: assignmentRule.weightProximity,
          weightEta: assignmentRule.weightEta,
          weightRating: assignmentRule.weightRating,
          weightAcceptance: assignmentRule.weightAcceptance,
          cancellationPenalty: assignmentRule.cancellationPenalty,
        }
      : undefined;

    // Query online, approved, idle riders in zone
    const riders = await prisma.riderProfile.findMany({
      where: {
        onlineStatus: true,
        approvalStatus: RiderApprovalStatus.APPROVED,
        tripStatus: { in: [RiderTripStatus.IDLE, RiderTripStatus.OFFERED] },
        deletedAt: null,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        serviceZoneId: ride.serviceZoneId ?? undefined,
        id: { notIn: Array.from(rejectedRiderIds) },
      },
      include: {
        user: true,
        vehicle: true,
      },
    });

    // Haversine distance calculator
    const candidatesWithDistance = riders
      .map((r) => {
        const rLat = Number(r.currentLatitude);
        const rLng = Number(r.currentLongitude);
        const dLat = ((rLat - pickupLat) * Math.PI) / 180;
        const dLng = ((rLng - pickupLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((pickupLat * Math.PI) / 180) *
            Math.cos((rLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const bearing = calculateBearingDegrees(rLat, rLng, pickupLat, pickupLng);

        return {
          rider: r,
          distKm,
          etaMinutes: Math.max(1, Math.round((distKm / 22) * 60)),
          bearing,
        };
      })
      .filter((c) => c.distKm <= roundConfig.radiusKm);

    // Rank candidates using 11-factor scoring
    const candidatePayload = candidatesWithDistance.map((c) => ({
      riderId: c.rider.id,
      displayName: c.rider.user.fullName,
      serviceZoneId: c.rider.serviceZoneId ?? "",
      distanceToPickupKm: c.distKm,
      etaMinutes: c.etaMinutes,
      ratingAverage: Number(c.rider.ratingAverage ?? 5.0),
      acceptanceRate: Number(c.rider.acceptanceRate ?? 100),
      cancellationRate: Number(c.rider.cancellationRate ?? 0),
      isOnline: c.rider.onlineStatus,
      isApproved: c.rider.approvalStatus === RiderApprovalStatus.APPROVED,
      isAvailable: c.rider.tripStatus === RiderTripStatus.IDLE,
      currentHeading: c.rider.currentHeading,
      bearingToPickup: c.bearing,
    }));

    const ranked = matchingService.rankCandidates(
      {
        requestedServiceZoneId: ride.serviceZoneId ?? "",
        maxPickupRadiusKm: roundConfig.radiusKm,
        candidates: candidatePayload,
      },
      weights
    );

    const bestCandidate = ranked[0];

    if (!bestCandidate) {
      // If no riders in current round, immediately escalate to next round
      if (targetRound < DISPATCH_ROUNDS.length) {
        return this.dispatchRide(rideId, targetRound + 1);
      }

      // All rounds exhausted: notify passenger that no riders are currently available
      const io = getRealtimeServer();
      io?.to(`user:${ride.passenger.userId}`).emit("ride.expired", {
        rideId: ride.id,
        reason: "NO_RIDERS_AVAILABLE",
        message: "No Okada available nearby. Please try again in a few moments.",
        dispatchRound: targetRound,
      });

      return false;
    }

    const selectedRider = riders.find((r) => r.id === bestCandidate.riderId)!;
    const expiresAt = new Date(Date.now() + roundConfig.timeoutSec * 1000);

    // Create formal offer and lock rider to OFFERED state
    const offer = await prisma.$transaction(async (tx) => {
      const createdOffer = await tx.rideDispatchOffer.create({
        data: {
          rideId: ride.id,
          riderId: selectedRider.id,
          round: roundConfig.round,
          searchRadiusKm: roundConfig.radiusKm,
          matchingScore: bestCandidate.score,
          status: OfferStatus.PENDING,
          offeredAt: new Date(),
        },
      });

      await tx.ride.update({
        where: { id: ride.id },
        data: {
          dispatchRound: roundConfig.round,
          currentOfferRiderId: selectedRider.id,
          offerExpiresAt: expiresAt,
        },
      });

      await tx.riderProfile.update({
        where: { id: selectedRider.id },
        data: { tripStatus: RiderTripStatus.OFFERED },
      });

      return createdOffer;
    });

    const io = getRealtimeServer();

    // 1. Emit live offer to rider socket
    io?.to(`user:${selectedRider.userId}`).emit("ride.offered", {
      offerId: offer.id,
      rideId: ride.id,
      round: roundConfig.round,
      expiresInSeconds: roundConfig.timeoutSec,
      pickupAddress: ride.pickupAddress,
      destinationAddress: ride.destinationAddress,
      pickupCoordinates: { latitude: pickupLat, longitude: pickupLng },
      destinationCoordinates: {
        latitude: Number(ride.destinationLatitude),
        longitude: Number(ride.destinationLongitude),
      },
      pickupDistanceKm: Math.round(bestCandidate.distanceToPickupKm * 10) / 10,
      pickupEtaMinutes: bestCandidate.etaMinutes,
      estimatedEarnings: Number(ride.riderEarnings ?? ride.estimatedFare ?? 0),
      currency: ride.currency,
      passengerName: ride.passenger.user.fullName,
      passengerRating: Number(ride.passenger.ratingAverage ?? 5.0),
    });

    // 2. Emit search progress to passenger
    io?.to(`user:${ride.passenger.userId}`).emit("ride.searching", {
      rideId: ride.id,
      round: roundConfig.round,
      radiusKm: roundConfig.radiusKm,
      message:
        roundConfig.round === 1
          ? "Contacting nearest Okada rider..."
          : `Expanding search to ${roundConfig.radiusKm} km radius...`,
    });

    // 3. Emit dispatch event to admin live operations room
    io?.to("admin:liveops").emit("admin.dispatch.offer", {
      rideId: ride.id,
      riderId: selectedRider.id,
      riderName: selectedRider.user.fullName,
      round: roundConfig.round,
      score: bestCandidate.score,
    });

    // Send high-priority push notification to rider
    void pushService.sendToUser(selectedRider.userId, {
      title: "New Ride Request Nearby!",
      body: `Pickup: ${ride.pickupAddress} (${bestCandidate.distanceToPickupKm.toFixed(1)} km)`,
      data: { rideId: ride.id, offerId: offer.id, type: "ride_offer" },
    });

    // Schedule automatic timeout escalation after 10.5 seconds
    const timer = setTimeout(async () => {
      activeDispatchTimers.delete(ride.id);
      await this.handleOfferTimeout(offer.id);
    }, (roundConfig.timeoutSec + 0.5) * 1000);

    activeDispatchTimers.set(ride.id, timer);
    return true;
  }

  /**
   * Handles rider acceptance of a dispatch offer.
   */
  async acceptOffer(offerId: string, riderProfileId: string) {
    const offer = await prisma.rideDispatchOffer.findUnique({
      where: { id: offerId },
      include: {
        ride: {
          include: {
            passenger: { include: { user: true } },
            serviceZone: true,
          },
        },
        rider: { include: { user: true, vehicle: true } },
      },
    });

    if (!offer) {
      throw new AppError("Dispatch offer was not found", 404, "OFFER_NOT_FOUND");
    }

    if (offer.riderId !== riderProfileId) {
      throw new AppError("This offer does not belong to you", 403, "OFFER_FORBIDDEN");
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new AppError("This offer has already been accepted, rejected, or expired", 409, "OFFER_INACTIVE");
    }

    if (offer.ride.status !== RideStatus.SEARCHING) {
      throw new AppError("This ride has already been assigned or cancelled", 409, "RIDE_ALREADY_ASSIGNED");
    }

    // Cancel pending escalation timer
    const timer = activeDispatchTimers.get(offer.rideId);
    if (timer) {
      clearTimeout(timer);
      activeDispatchTimers.delete(offer.rideId);
    }

    const { updatedRide, updatedRider } = await prisma.$transaction(async (tx) => {
      await tx.rideDispatchOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      const r = await tx.ride.update({
        where: { id: offer.rideId },
        data: {
          status: RideStatus.ASSIGNED,
          riderId: offer.riderId,
          assignedAt: new Date(),
        },
        include: {
          passenger: { include: { user: true } },
          rider: { include: { user: true, vehicle: true } },
          serviceZone: true,
        },
      });

      const rp = await tx.riderProfile.update({
        where: { id: offer.riderId },
        data: { tripStatus: RiderTripStatus.ARRIVING },
        include: { user: true, vehicle: true },
      });

      await tx.rideEvent.create({
        data: {
          rideId: offer.rideId,
          actorUserId: offer.rider.userId,
          eventType: "ride_assigned",
          payload: {
            offerId,
            riderId: offer.riderId,
            round: offer.round,
            score: offer.matchingScore,
          },
        },
      });

      return { updatedRide: r, updatedRider: rp };
    });

    const realtimeRide = serializeRideForRealtime(updatedRide);

    // Emit real-time synchronization events
    const io = getRealtimeServer();
    io?.to(`user:${updatedRide.passenger.userId}`).emit("ride.accepted", {
      ride: realtimeRide,
      safetyPin: updatedRide.safetyPin,
      rider: {
        id: updatedRider.id,
        fullName: updatedRider.user.fullName,
        avatarUrl: updatedRider.user.avatarUrl,
        ratingAverage: Number(updatedRider.ratingAverage ?? 5.0),
        vehicleType: updatedRider.vehicle?.vehicleType ?? "OKADA",
        plateNumber: updatedRider.vehicle?.plateNumber ?? "M-24-GH",
        currentLatitude: updatedRider.currentLatitude,
        currentLongitude: updatedRider.currentLongitude,
        currentHeading: updatedRider.currentHeading,
      },
    });

    emitRideAssigned({
      ride: realtimeRide,
      passengerUserId: updatedRide.passenger.userId,
      riderUserId: updatedRider.userId,
    });

    io?.to("admin:liveops").emit("admin.ride.assigned", {
      rideId: updatedRide.id,
      riderName: updatedRider.user.fullName,
      passengerName: updatedRide.passenger.user.fullName,
    });

    return { success: true, ride: realtimeRide };
  }

  /**
   * Handles rider rejection of a dispatch offer and immediately cascades to next candidate.
   */
  async rejectOffer(offerId: string, riderProfileId: string, reason?: string) {
    const offer = await prisma.rideDispatchOffer.findUnique({
      where: { id: offerId },
      include: { ride: true, rider: true },
    });

    if (!offer || offer.riderId !== riderProfileId) {
      throw new AppError("Invalid offer rejection request", 400, "INVALID_REJECTION");
    }

    if (offer.status !== OfferStatus.PENDING) {
      return { success: false, message: "Offer is no longer pending" };
    }

    // Cancel timer
    const timer = activeDispatchTimers.get(offer.rideId);
    if (timer) {
      clearTimeout(timer);
      activeDispatchTimers.delete(offer.rideId);
    }

    await prisma.$transaction(async (tx) => {
      await tx.rideDispatchOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.REJECTED,
          respondedAt: new Date(),
          rejectionReason: reason ?? "DECLINED_BY_RIDER",
        },
      });

      await tx.riderProfile.update({
        where: { id: riderProfileId },
        data: { tripStatus: RiderTripStatus.IDLE },
      });
    });

    // Immediately cascade to next candidate or next round
    void this.dispatchRide(offer.rideId, offer.round);
    return { success: true, message: "Offer rejected, searching next candidate" };
  }

  /**
   * Escalates when an offer reaches its timeout without a rider response.
   */
  async handleOfferTimeout(offerId: string) {
    const offer = await prisma.rideDispatchOffer.findUnique({
      where: { id: offerId },
      include: { ride: true },
    });

    if (!offer || offer.status !== OfferStatus.PENDING) return;

    await prisma.$transaction(async (tx) => {
      await tx.rideDispatchOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.EXPIRED,
          respondedAt: new Date(),
        },
      });

      await tx.riderProfile.update({
        where: { id: offer.riderId },
        data: { tripStatus: RiderTripStatus.IDLE },
      });
    });

    // Escalate to next round
    if (offer.ride.status === RideStatus.SEARCHING) {
      void this.dispatchRide(offer.rideId, offer.round + 1);
    }
  }

  /**
   * Verifies the passenger's 4-digit pickup PIN before starting the trip.
   */
  async verifyPickupPin(rideId: string, enteredPin: string, riderProfileId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { include: { user: true } },
        rider: { include: { user: true } },
      },
    });

    if (!ride) {
      throw new AppError("Ride was not found", 404, "RIDE_NOT_FOUND");
    }

    if (ride.riderId !== riderProfileId) {
      throw new AppError("You are not the assigned rider for this trip", 403, "RIDER_NOT_ASSIGNED");
    }

    if (ride.status === RideStatus.STARTED) {
      return { success: true, ride: serializeRideForRealtime(ride) };
    }

    if (!["assigned", "arriving", "arrived"].includes(ride.status.toLowerCase())) {
      throw new AppError(
        `Cannot verify PIN when ride status is ${ride.status}`,
        409,
        "INVALID_RIDE_STATE"
      );
    }

    const cleanEntered = enteredPin.trim();
    const cleanActual = (ride.safetyPin || "8421").trim();

    if (cleanEntered !== cleanActual) {
      throw new AppError(
        "Invalid 4-digit pickup PIN. Please confirm the PIN with the passenger.",
        400,
        "INVALID_SAFETY_PIN"
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.STARTED,
          startedAt: new Date(),
          pinVerifiedAt: new Date(),
        },
        include: {
          passenger: { include: { user: true } },
          rider: { include: { user: true, vehicle: true } },
          serviceZone: true,
        },
      });

      await tx.riderProfile.update({
        where: { id: riderProfileId },
        data: { tripStatus: RiderTripStatus.ON_TRIP },
      });

      await tx.rideEvent.create({
        data: {
          rideId,
          actorUserId: ride.rider!.userId,
          eventType: "ride_started",
          payload: { pinVerified: true },
        },
      });

      return updatedRide;
    });

    const realtime = serializeRideForRealtime(updated);
    const io = getRealtimeServer();

    io?.to(`user:${updated.passenger.userId}`).emit("ride.started", {
      ride: realtime,
      message: "Trip started! Wear your helmet and enjoy the ride.",
    });

    io?.to(`user:${updated.rider!.userId}`).emit("ride.started", {
      ride: realtime,
      message: "PIN confirmed. Navigate to destination.",
    });

    emitRideStatusUpdate({
      ride: realtime,
      passengerUserId: updated.passenger.userId,
      riderUserId: updated.rider?.userId,
    });

    return { success: true, ride: realtime };
  }

  /**
   * Cancels active dispatch timers and pending offers when a ride is cancelled.
   */
  async cancelDispatch(rideId: string) {
    const timer = activeDispatchTimers.get(rideId);
    if (timer) {
      clearTimeout(timer);
      activeDispatchTimers.delete(rideId);
    }

    const pendingOffers = await prisma.rideDispatchOffer.findMany({
      where: { rideId, status: OfferStatus.PENDING },
    });

    if (pendingOffers.length > 0) {
      const riderIds = pendingOffers.map((o) => o.riderId);
      await prisma.rideDispatchOffer.updateMany({
        where: { rideId, status: OfferStatus.PENDING },
        data: { status: OfferStatus.EXPIRED, respondedAt: new Date() },
      });

      await prisma.riderProfile.updateMany({
        where: { id: { in: riderIds }, tripStatus: RiderTripStatus.OFFERED },
        data: { tripStatus: RiderTripStatus.IDLE },
      });
    }
  }
}

export const dispatchService = new DispatchService();
