import { v2 as cloudinary } from "cloudinary";
import { appConfig } from "../../common/config.js";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { findNearbyRiderCandidates } from "../../common/geo.js";
import {
  CancellationParty,
  DeliveryStatus,
  DeliveryStopStatus,
  DeliveryStopType,
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
  completeDeliveryStopSchema,
  createDeliveryRequestSchema,
  deliveryEstimateSchema,
  deliveryStatusUpdateSchema
} from "./delivery.schemas.js";
import type { z } from "zod";

type CreateDeliveryRequestInput = z.infer<typeof createDeliveryRequestSchema>;
type DeliveryEstimateInput = z.infer<typeof deliveryEstimateSchema>;
type DeliveryStatusUpdateInput = z.infer<typeof deliveryStatusUpdateSchema>;
type CompleteDeliveryStopInput = z.infer<typeof completeDeliveryStopSchema>;

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

if (appConfig.cloudinaryCloudName && appConfig.cloudinaryApiKey && appConfig.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: appConfig.cloudinaryCloudName,
    api_key: appConfig.cloudinaryApiKey,
    api_secret: appConfig.cloudinaryApiSecret
  });
}

function roundCoordinate(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000_000) / 10_000_000;
}

const deliveryJobPreferenceFilter = [JobPreference.DELIVERY_ONLY, JobPreference.BOTH];

async function uploadProofPhoto(base64: string, publicId: string) {
  if (!appConfig.cloudinaryCloudName || !appConfig.cloudinaryApiKey || !appConfig.cloudinaryApiSecret) {
    throw new AppError("Photo uploads are not configured", 503, "CLOUDINARY_NOT_CONFIGURED");
  }

  const dataUri = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "okadago/proof-of-delivery",
    public_id: publicId,
    transformation: [{ width: 1280, height: 1280, crop: "limit" }, { quality: "auto", fetch_format: "auto" }]
  });

  return result.secure_url;
}

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

    const additionalStops = input.additionalStops ?? [];

    const delivery = await prisma.$transaction(async (tx) => {
      const createdDelivery = await tx.deliveryRequest.create({
        data: {
          passengerId: passenger.id,
          riderId: selectedRider?.id,
          serviceZoneId: serviceZone.id,
          status: selectedRider ? DeliveryStatus.ASSIGNED : DeliveryStatus.SEARCHING,
          paymentMethod: apiToDbPaymentMethod[input.paymentMethod],
          pickupAddress: input.pickup.address,
          pickupLatitude: roundCoordinate(input.pickup.latitude),
          pickupLongitude: roundCoordinate(input.pickup.longitude),
          pickupLandmark: input.pickup.landmark,
          dropoffAddress: input.dropoff.address,
          dropoffLatitude: roundCoordinate(input.dropoff.latitude),
          dropoffLongitude: roundCoordinate(input.dropoff.longitude),
          dropoffLandmark: input.dropoff.landmark,
          recipientName: input.recipientName,
          recipientPhoneE164: input.recipientPhoneE164,
          packageType: input.packageType,
          packageDescription: input.packageDescription,
          pickupLocationMocked: Boolean(input.pickup.isMocked),
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

      // Every delivery gets a canonical stop sequence (pickup, then each dropoff in order)
      // so the rider app can drive a single stop-by-stop UI whether or not there are
      // additional waypoints beyond the primary pickup/dropoff pair.
      const dropoffStops = [
        ...additionalStops.map((stop) => ({
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          landmark: stop.landmark,
          recipientName: stop.recipientName ?? input.recipientName,
          recipientPhoneE164: stop.recipientPhoneE164 ?? input.recipientPhoneE164,
          instructions: stop.instructions
        })),
        {
          address: input.dropoff.address,
          latitude: input.dropoff.latitude,
          longitude: input.dropoff.longitude,
          landmark: input.dropoff.landmark,
          recipientName: input.recipientName,
          recipientPhoneE164: input.recipientPhoneE164,
          instructions: undefined as string | undefined
        }
      ];

      await tx.deliveryStop.createMany({
        data: [
          {
            deliveryId: createdDelivery.id,
            sequence: 0,
            type: DeliveryStopType.PICKUP,
            address: input.pickup.address,
            latitude: roundCoordinate(input.pickup.latitude),
            longitude: roundCoordinate(input.pickup.longitude),
            landmark: input.pickup.landmark
          },
          ...dropoffStops.map((stop, index) => ({
            deliveryId: createdDelivery.id,
            sequence: index + 1,
            type: DeliveryStopType.DROPOFF,
            address: stop.address,
            latitude: roundCoordinate(stop.latitude),
            longitude: roundCoordinate(stop.longitude),
            landmark: stop.landmark,
            recipientName: stop.recipientName,
            recipientPhoneE164: stop.recipientPhoneE164,
            instructions: stop.instructions
          }))
        ]
      });

      return createdDelivery;
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

  async listDeliveryStops(deliveryId: string) {
    const delivery = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryId },
      select: { id: true }
    });

    if (!delivery) {
      throw new AppError("Delivery was not found", 404, "DELIVERY_NOT_FOUND");
    }

    return prisma.deliveryStop.findMany({
      where: { deliveryId },
      orderBy: { sequence: "asc" }
    });
  }

  async listDeliveries(query: { limit?: number; page?: number } = {}) {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 300);
    const page = query.page;

    const data = await prisma.deliveryRequest.findMany({
      take: limit,
      ...(page ? { skip: (page - 1) * limit } : {}),
      orderBy: {
        createdAt: "desc"
      },
      include: deliveryDetailsInclude
    });

    if (!page) return data;
    const total = await prisma.deliveryRequest.count();
    return { data, total, page, limit };
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

    if (input.nextStatus === "delivered" && input.actorRole === "rider" && !input.proofPhotoBase64) {
      throw new AppError(
        "A proof-of-delivery photo is required before marking this delivery as delivered.",
        400,
        "PROOF_PHOTO_REQUIRED"
      );
    }

    const assignedRider =
      input.nextStatus === "assigned"
        ? await this.findRiderForAssignment(delivery, input.riderProfileId)
        : undefined;

    let proofPhotoUrl: string | undefined;
    if (input.nextStatus === "delivered" && input.proofPhotoBase64) {
      proofPhotoUrl = await uploadProofPhoto(input.proofPhotoBase64, `${deliveryId}-${Date.now()}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.deliveryRequest.update({
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
          cancellationReason: input.cancellationReason,
          proofPhotoUrl
        },
        include: deliveryDetailsInclude
      });

      // Keep the per-stop sequence in sync with the coarse-grained delivery status so the
      // rider app's stop list reflects reality even when the legacy single-shot status
      // endpoint (rather than the per-stop completion endpoint) is what advanced things.
      if (input.nextStatus === "picked_up") {
        await tx.deliveryStop.updateMany({
          where: { deliveryId, type: DeliveryStopType.PICKUP, status: { not: DeliveryStopStatus.COMPLETED } },
          data: { status: DeliveryStopStatus.COMPLETED, arrivedAt: new Date(), completedAt: new Date() }
        });
      } else if (input.nextStatus === "delivered") {
        await tx.deliveryStop.updateMany({
          where: { deliveryId, type: DeliveryStopType.DROPOFF, status: { not: DeliveryStopStatus.COMPLETED } },
          data: {
            status: DeliveryStopStatus.COMPLETED,
            arrivedAt: new Date(),
            completedAt: new Date(),
            proofPhotoUrl
          }
        });
      }

      return updatedDelivery;
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

  /**
   * Marks a single dropoff stop complete for a multi-stop delivery. Intermediate stops just
   * get marked done; completing the final dropoff stop also finalizes the whole delivery
   * (proof photo, wallet settlement, notifications) via the same path as updateDeliveryStatus.
   */
  async completeDeliveryStop(deliveryId: string, stopId: string, input: CompleteDeliveryStopInput) {
    const delivery = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryId },
      include: deliveryDetailsInclude
    });

    if (!delivery) {
      throw new AppError("Delivery was not found", 404, "DELIVERY_NOT_FOUND");
    }

    const stops = await prisma.deliveryStop.findMany({
      where: { deliveryId },
      orderBy: { sequence: "asc" }
    });

    const stop = stops.find((candidate) => candidate.id === stopId);
    if (!stop) {
      throw new AppError("Delivery stop was not found", 404, "DELIVERY_STOP_NOT_FOUND");
    }

    if (stop.type !== DeliveryStopType.DROPOFF) {
      throw new AppError("Only dropoff stops can be completed individually", 409, "INVALID_STOP_TYPE");
    }

    if (stop.status === DeliveryStopStatus.COMPLETED) {
      throw new AppError("This stop has already been completed", 409, "STOP_ALREADY_COMPLETED");
    }

    const dropoffStops = stops.filter((candidate) => candidate.type === DeliveryStopType.DROPOFF);
    const isFinalDropoff = dropoffStops[dropoffStops.length - 1]?.id === stop.id;

    if (isFinalDropoff && delivery.status !== DeliveryStatus.DELIVERED) {
      if (input.actorRole === "rider" && !input.proofPhotoBase64) {
        throw new AppError(
          "A proof-of-delivery photo is required before completing the final stop.",
          400,
          "PROOF_PHOTO_REQUIRED"
        );
      }

      // Delegate to updateDeliveryStatus so proof upload, wallet settlement, and
      // notifications stay in one place; it also marks this (and any other remaining)
      // dropoff stop COMPLETED with the uploaded photo URL.
      const updatedDelivery = await this.updateDeliveryStatus(deliveryId, {
        nextStatus: "delivered",
        actorRole: input.actorRole,
        proofPhotoBase64: input.proofPhotoBase64
      });
      const updatedStop = await prisma.deliveryStop.findUniqueOrThrow({ where: { id: stopId } });
      return { stop: updatedStop, delivery: updatedDelivery };
    }

    let proofPhotoUrl: string | undefined;
    if (input.proofPhotoBase64) {
      proofPhotoUrl = await uploadProofPhoto(input.proofPhotoBase64, `${deliveryId}-${stopId}-${Date.now()}`);
    }

    const updatedStop = await prisma.deliveryStop.update({
      where: { id: stopId },
      data: {
        status: DeliveryStopStatus.COMPLETED,
        arrivedAt: stop.arrivedAt ?? new Date(),
        completedAt: new Date(),
        proofPhotoUrl: proofPhotoUrl ?? stop.proofPhotoUrl
      }
    });

    const passengerUserId = delivery.passenger.userId;
    void pushService.sendToUser(passengerUserId, {
      title: "Delivery update",
      body: `Stop completed: ${stop.address}`,
      data: { deliveryId, type: "delivery_stop_completed", stopId }
    });

    return { stop: updatedStop, delivery };
  }
}
