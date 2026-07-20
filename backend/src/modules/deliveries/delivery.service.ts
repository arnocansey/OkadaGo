import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { findNearbyRiderCandidates } from "../../common/geo.js";
import {
  CancellationParty,
  DeliveryStatus,
  JobPreference,
  PaymentMethod,
  RiderApprovalStatus
} from "../../generated/prisma/enums.js";
import { FareService } from "../pricing/fare.service.js";
import { MatchingService } from "../matching/matching.service.js";
import { pushService } from "../notifications/push.service.js";
import {
  emitDeliveryStatusUpdate,
  serializeDeliveryForRealtime
} from "../realtime/realtime.service.js";
import type {
  createDeliveryRequestSchema,
  deliveryEstimateSchema,
  deliveryStatusUpdateSchema
} from "./delivery.schemas.js";
import type { z } from "zod";

type CreateDeliveryRequestInput = z.infer<typeof createDeliveryRequestSchema>;
type DeliveryEstimateInput = z.infer<typeof deliveryEstimateSchema>;
type DeliveryStatusUpdateInput = z.infer<typeof deliveryStatusUpdateSchema>;

const deliveryTransitions: Record<string, string[]> = {
  searching: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: [],
  cancelled: []
};

const apiToDbDeliveryStatus = {
  assigned: DeliveryStatus.ASSIGNED,
  picked_up: DeliveryStatus.PICKED_UP,
  in_transit: DeliveryStatus.IN_TRANSIT,
  delivered: DeliveryStatus.DELIVERED,
  cancelled: DeliveryStatus.CANCELLED
} as const;

const apiToDbPaymentMethod = {
  cash: PaymentMethod.CASH,
  card: PaymentMethod.CARD,
  wallet: PaymentMethod.WALLET,
  mobile_money: PaymentMethod.MOBILE_MONEY
} as const;

const deliveryDetailsInclude = {
  passenger: {
    include: {
      user: true
    }
  },
  rider: {
    include: {
      user: true,
      vehicle: true,
      serviceZone: true
    }
  },
  serviceZone: true
} as const;

function toApiDeliveryStatus(status: DeliveryStatus) {
  return status.toLowerCase() as Lowercase<DeliveryStatus>;
}

function roundCoordinate(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000_000) / 10_000_000;
}

const deliveryJobPreferenceFilter = [JobPreference.DELIVERY_ONLY, JobPreference.BOTH];

function haversineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const earthRadiusKm = 6371;
  const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = degreesToRadians(toLatitude - fromLatitude);
  const deltaLongitude = degreesToRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(degreesToRadians(fromLatitude)) *
      Math.cos(degreesToRadians(toLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class DeliveryService {
  private readonly fareService = new FareService();
  private readonly matchingService = new MatchingService();

  private validateLifecycle(currentStatus: string, nextStatus: string) {
    const allowedNextStatuses = deliveryTransitions[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new AppError(
        `Cannot move delivery from ${currentStatus} to ${nextStatus}`,
        409,
        "INVALID_DELIVERY_TRANSITION",
        { allowedNextStatuses }
      );
    }
  }

  private async findRiderForAssignment(
    delivery: {
      riderId: string | null;
      serviceZoneId: string | null;
      pickupLatitude: unknown;
      pickupLongitude: unknown;
    },
    riderProfileId?: string
  ) {
    if (delivery.riderId && riderProfileId && delivery.riderId !== riderProfileId) {
      throw new AppError("Delivery already has a different assigned rider", 409, "DELIVERY_ALREADY_ASSIGNED");
    }

    if (delivery.riderId) {
      const currentRider = await prisma.riderProfile.findUnique({
        where: {
          id: delivery.riderId
        },
        include: {
          user: true,
          vehicle: true,
          serviceZone: true
        }
      });

      if (!currentRider) {
        throw new AppError("Assigned rider profile was not found", 404, "RIDER_NOT_FOUND");
      }

      return currentRider;
    }

    if (!delivery.serviceZoneId) {
      throw new AppError(
        "Delivery cannot be accepted because it is not linked to a service zone",
        409,
        "DELIVERY_MISSING_SERVICE_ZONE"
      );
    }

    const nearbyCandidates = riderProfileId
      ? null
      : await findNearbyRiderCandidates({
          serviceZoneId: delivery.serviceZoneId,
          latitude: Number(delivery.pickupLatitude),
          longitude: Number(delivery.pickupLongitude),
          radiusKm: 8
        });

    const riderWhere = {
      serviceZoneId: delivery.serviceZoneId,
      onlineStatus: true,
      approvalStatus: RiderApprovalStatus.APPROVED,
      deletedAt: null,
      jobPreference: { in: deliveryJobPreferenceFilter },
      ...(nearbyCandidates ? { id: { in: nearbyCandidates.map((candidate) => candidate.id) } } : {})
    };

    const riders = await prisma.riderProfile.findMany({
      where: riderProfileId
        ? {
            ...riderWhere,
            id: riderProfileId
          }
        : riderWhere,
      include: {
        user: true,
        vehicle: true,
        serviceZone: true
      }
    });

    if (riders.length === 0) {
      throw new AppError(
        riderProfileId
          ? "Selected rider is not online, approved, or in this delivery zone"
          : "No online approved rider is available for this delivery zone",
        409,
        "NO_AVAILABLE_RIDER"
      );
    }

    if (riderProfileId) {
      return riders[0]!;
    }

    const rankedCandidates = this.matchingService.rankCandidates({
      requestedServiceZoneId: delivery.serviceZoneId,
      maxPickupRadiusKm: 8,
      candidates: riders
        .filter((rider) => rider.currentLatitude !== null && rider.currentLongitude !== null)
        .map((rider) => {
          const distanceToPickupKm = haversineDistanceKm(
            Number(rider.currentLatitude),
            Number(rider.currentLongitude),
            Number(delivery.pickupLatitude),
            Number(delivery.pickupLongitude)
          );
          const etaMinutes = Math.max(2, Math.round((distanceToPickupKm / 22) * 60));

          return {
            riderId: rider.id,
            displayName: rider.user.fullName,
            serviceZoneId: rider.serviceZoneId ?? "",
            distanceToPickupKm,
            etaMinutes,
            ratingAverage: Number(rider.ratingAverage),
            acceptanceRate: Number(rider.acceptanceRate),
            cancellationRate: Number(rider.cancellationRate),
            isOnline: rider.onlineStatus,
            isApproved: rider.approvalStatus === RiderApprovalStatus.APPROVED,
            isAvailable: true
          };
        })
    });

    const selectedCandidate = rankedCandidates[0];
    const selectedRider = selectedCandidate
      ? riders.find((rider) => rider.id === selectedCandidate.riderId)
      : riders[0];

    if (!selectedRider) {
      throw new AppError("No online approved rider with usable location is available", 409, "NO_AVAILABLE_RIDER");
    }

    return selectedRider;
  }

  async estimateDelivery(input: DeliveryEstimateInput) {
    const serviceZone = await prisma.serviceZone.findUnique({
      where: {
        id: input.serviceZoneId
      }
    });

    if (!serviceZone) {
      throw new AppError("Service zone was not found", 404, "SERVICE_ZONE_NOT_FOUND");
    }

    const pricing = this.fareService.compute({
      countryCode: serviceZone.countryCode as "GH" | "NG",
      currency: serviceZone.currency as "GHS" | "NGN",
      rideType: "standard_bike",
      baseFare: Number(serviceZone.baseFare),
      perKmFee: Number(serviceZone.perKmFee),
      perMinuteFee: Number(serviceZone.perMinuteFee),
      minimumFare: Number(serviceZone.minimumFare),
      cancellationFee: Number(serviceZone.cancellationFee),
      waitingFeePerMinute: Number(serviceZone.waitingFeePerMin),
      commissionPercent: 12,
      surgeMultiplier: 1,
      zoneFee: 0,
      promoDiscount: 0,
      referralDiscount: 0,
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      waitingMinutes: 0
    });

    return { pricing };
  }

  async createDeliveryRequest(input: CreateDeliveryRequestInput) {
    const passenger = await prisma.passengerProfile.findUnique({
      where: {
        id: input.passengerProfileId
      },
      include: {
        user: true
      }
    });

    if (!passenger) {
      throw new AppError("Passenger profile was not found", 404, "PASSENGER_NOT_FOUND");
    }

    const serviceZone = await prisma.serviceZone.findUnique({
      where: {
        id: input.serviceZoneId
      }
    });

    if (!serviceZone) {
      throw new AppError("Service zone was not found", 404, "SERVICE_ZONE_NOT_FOUND");
    }

    if (!serviceZone.isActive || !serviceZone.deliveriesEnabled) {
      throw new AppError(
        "Delivery is currently unavailable in this area",
        403,
        "DELIVERY_DISABLED_IN_REGION"
      );
    }

    const nearbyCandidates = await findNearbyRiderCandidates({
      serviceZoneId: input.serviceZoneId,
      latitude: input.pickup.latitude,
      longitude: input.pickup.longitude,
      radiusKm: 8
    });

    const riders = await prisma.riderProfile.findMany({
      where: {
        serviceZoneId: input.serviceZoneId,
        onlineStatus: true,
        approvalStatus: RiderApprovalStatus.APPROVED,
        deletedAt: null,
        jobPreference: { in: deliveryJobPreferenceFilter },
        ...(nearbyCandidates ? { id: { in: nearbyCandidates.map((candidate) => candidate.id) } } : {})
      },
      include: {
        user: true
      }
    });

    const rankedCandidates = this.matchingService.rankCandidates({
      requestedServiceZoneId: input.serviceZoneId,
      maxPickupRadiusKm: 8,
      candidates: riders
        .filter((rider) => rider.currentLatitude !== null && rider.currentLongitude !== null)
        .map((rider) => {
          const distanceToPickupKm = haversineDistanceKm(
            Number(rider.currentLatitude),
            Number(rider.currentLongitude),
            input.pickup.latitude,
            input.pickup.longitude
          );
          const etaMinutes = Math.max(2, Math.round((distanceToPickupKm / 22) * 60));

          return {
            riderId: rider.id,
            displayName: rider.user.fullName,
            serviceZoneId: rider.serviceZoneId ?? "",
            distanceToPickupKm,
            etaMinutes,
            ratingAverage: Number(rider.ratingAverage),
            acceptanceRate: Number(rider.acceptanceRate),
            cancellationRate: Number(rider.cancellationRate),
            isOnline: rider.onlineStatus,
            isApproved: rider.approvalStatus === RiderApprovalStatus.APPROVED,
            isAvailable: true
          };
        })
    });

    const selectedCandidate = rankedCandidates[0];
    const selectedRider = selectedCandidate
      ? riders.find((rider) => rider.id === selectedCandidate.riderId)
      : undefined;
    const commissionPercent = selectedRider ? Number(selectedRider.commissionPercent) : 12;

    const pricing = this.fareService.compute({
      countryCode: serviceZone.countryCode as "GH" | "NG",
      currency: serviceZone.currency as "GHS" | "NGN",
      rideType: "standard_bike",
      baseFare: Number(serviceZone.baseFare),
      perKmFee: Number(serviceZone.perKmFee),
      perMinuteFee: Number(serviceZone.perMinuteFee),
      minimumFare: Number(serviceZone.minimumFare),
      cancellationFee: Number(serviceZone.cancellationFee),
      waitingFeePerMinute: Number(serviceZone.waitingFeePerMin),
      commissionPercent,
      surgeMultiplier: 1,
      zoneFee: 0,
      promoDiscount: 0,
      referralDiscount: 0,
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      waitingMinutes: 0
    });

    const delivery = await prisma.deliveryRequest.create({
      data: {
        passengerId: passenger.id,
        riderId: selectedRider?.id,
        serviceZoneId: serviceZone.id,
        status: selectedRider ? DeliveryStatus.ASSIGNED : DeliveryStatus.SEARCHING,
        paymentMethod: apiToDbPaymentMethod[input.paymentMethod],
        pickupAddress: input.pickup.address,
        pickupLatitude: roundCoordinate(input.pickup.latitude),
        pickupLongitude: roundCoordinate(input.pickup.longitude),
        dropoffAddress: input.dropoff.address,
        dropoffLatitude: roundCoordinate(input.dropoff.latitude),
        dropoffLongitude: roundCoordinate(input.dropoff.longitude),
        recipientName: input.recipientName,
        recipientPhoneE164: input.recipientPhoneE164,
        packageType: input.packageType,
        packageDescription: input.packageDescription,
        estimatedDistanceKm: input.estimatedDistanceKm,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        estimatedFee: pricing.totalFare,
        finalFee: pricing.totalFare,
        riderEarnings: pricing.riderEarnings,
        platformCommission: pricing.platformCommission,
        currency: serviceZone.currency,
        notes: input.notes,
        assignedAt: selectedRider ? new Date() : undefined
      },
      include: deliveryDetailsInclude
    });

    return {
      delivery,
      pricing,
      matching: {
        requestedServiceZoneId: input.serviceZoneId,
        rankedCandidates
      }
    };
  }

  async listDeliveries() {
    return prisma.deliveryRequest.findMany({
      take: 50,
      orderBy: {
        createdAt: "desc"
      },
      include: deliveryDetailsInclude
    });
  }

  async getDelivery(deliveryId: string) {
    const delivery = await prisma.deliveryRequest.findUnique({
      where: {
        id: deliveryId
      },
      include: deliveryDetailsInclude
    });

    if (!delivery) {
      throw new AppError("Delivery was not found", 404, "DELIVERY_NOT_FOUND");
    }

    return delivery;
  }

  async updateDeliveryStatus(deliveryId: string, input: DeliveryStatusUpdateInput) {
    const delivery = await prisma.deliveryRequest.findUnique({
      where: {
        id: deliveryId
      },
      include: deliveryDetailsInclude
    });

    if (!delivery) {
      throw new AppError("Delivery was not found", 404, "DELIVERY_NOT_FOUND");
    }

    this.validateLifecycle(toApiDeliveryStatus(delivery.status), input.nextStatus);

    const assignedRider =
      input.nextStatus === "assigned"
        ? await this.findRiderForAssignment(delivery, input.riderProfileId)
        : undefined;

    const updated = await prisma.deliveryRequest.update({
      where: {
        id: deliveryId
      },
      data: {
        status: apiToDbDeliveryStatus[input.nextStatus],
        riderId: assignedRider?.id,
        assignedAt: input.nextStatus === "assigned" ? new Date() : undefined,
        pickedUpAt: input.nextStatus === "picked_up" ? new Date() : undefined,
        inTransitAt: input.nextStatus === "in_transit" ? new Date() : undefined,
        deliveredAt: input.nextStatus === "delivered" ? new Date() : undefined,
        cancelledAt: input.nextStatus === "cancelled" ? new Date() : undefined,
        cancellationParty: input.nextStatus === "cancelled" ? CancellationParty.ADMIN : undefined,
        cancellationReason: input.cancellationReason
      },
      include: deliveryDetailsInclude
    });

    const passengerUserId = updated.passenger.userId;
    emitDeliveryStatusUpdate({
      delivery: serializeDeliveryForRealtime(updated),
      passengerUserId,
      riderUserId: updated.rider?.userId
    });

    void pushService.sendToUser(passengerUserId, {
      title: "Delivery update",
      body: `Status: ${input.nextStatus.replace(/_/g, " ")}`,
      data: { deliveryId, type: "delivery_status", status: input.nextStatus }
    });

    if (updated.rider?.userId) {
      void pushService.sendToUser(updated.rider.userId, {
        title: "Delivery update",
        body: `Status: ${input.nextStatus.replace(/_/g, " ")}`,
        data: { deliveryId, type: "delivery_status", status: input.nextStatus }
      });
    }

    return updated;
  }
}
