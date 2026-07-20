import { AppError } from "../../common/errors.js";
import { makeWalletReference } from "../../common/codes.js";
import { prisma } from "../../common/prisma.js";
import { findNearbyRiderCandidates, syncRiderLocationGeography } from "../../common/geo.js";
import {
  JobPreference,
  PaymentMethod,
  PaymentStatus,
  RideStatus,
  RiderApprovalStatus,
  VehicleType,
  WalletTransactionStatus,
  WalletTransactionType,
  WalletType
} from "../../generated/prisma/enums.js";
import { FareService } from "../pricing/fare.service.js";
import { MatchingService } from "../matching/matching.service.js";
import { pushService } from "../notifications/push.service.js";
import { promotionService } from "../promotions/promotion.service.js";
import { referralService } from "../referrals/referral.service.js";
import {
  emitRideAssigned,
  emitRideStatusUpdate,
  emitRiderLocationUpdate,
  serializeRideForRealtime
} from "../realtime/realtime.service.js";
import type {
  createRideRequestSchema,
  matchingPreviewSchema,
  rideEstimateSchema,
  rideIdParamsSchema,
  rideLocationUpdateSchema,
  riderAvailabilitySchema,
  rideLifecycleValidationSchema,
  rideStatusUpdateSchema
} from "./ride.schemas.js";
import type { z } from "zod";

type RideEstimateInput = z.infer<typeof rideEstimateSchema>;
type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
type RideLifecycleInput = z.infer<typeof rideLifecycleValidationSchema>;
type MatchingPreviewInput = z.infer<typeof matchingPreviewSchema>;
type RiderAvailabilityInput = z.infer<typeof riderAvailabilitySchema>;
type RideLocationUpdateInput = z.infer<typeof rideLocationUpdateSchema>;
type RideIdParams = z.infer<typeof rideIdParamsSchema>;
type RideStatusUpdateInput = z.infer<typeof rideStatusUpdateSchema>;

const lifecycleTransitions: Record<string, string[]> = {
  searching: ["assigned", "cancelled"],
  assigned: ["arriving", "cancelled"],
  arriving: ["arrived", "cancelled"],
  arrived: ["started", "cancelled"],
  started: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

const startActors = new Set(["rider", "admin", "dispatcher"]);
const completionActors = new Set(["rider", "admin", "dispatcher", "system"]);
const riderDeficitWarningThreshold = 100;
const riderDeficitOfflineThreshold = 200;

const apiToDbRideStatus = {
  assigned: RideStatus.ASSIGNED,
  arriving: RideStatus.ARRIVING,
  arrived: RideStatus.ARRIVED,
  started: RideStatus.STARTED,
  completed: RideStatus.COMPLETED,
  cancelled: RideStatus.CANCELLED
} as const;

const apiToDbPaymentMethod = {
  cash: PaymentMethod.CASH,
  card: PaymentMethod.CARD,
  wallet: PaymentMethod.WALLET,
  mobile_money: PaymentMethod.MOBILE_MONEY
} as const;

function toApiRideStatus(status: RideStatus): Lowercase<RideStatus> {
  return status.toLowerCase() as Lowercase<RideStatus>;
}

function roundCoordinate(value: number) {
  return Math.round((value + Number.EPSILON) * 10_000_000) / 10_000_000;
}

function riderDeficitFromBalance(balance: number) {
  return balance < 0 ? Math.abs(balance) : 0;
}

const ridesJobPreferenceFilter = [JobPreference.RIDES_ONLY, JobPreference.BOTH];

function requiredVehicleTypeForRideType(rideType: string): VehicleType {
  return rideType === "cargo_tricycle" ? VehicleType.TRICYCLE : VehicleType.OKADA;
}

async function getRideRequestedType(rideId: string): Promise<string> {
  const requestedEvent = await prisma.rideEvent.findFirst({
    where: { rideId, eventType: "ride_requested" },
    orderBy: { createdAt: "asc" }
  });

  const payload = requestedEvent?.payload as { rideType?: string } | null;
  return payload?.rideType ?? "standard_bike";
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

const rideDetailsInclude = {
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
  serviceZone: true,
  locations: {
    take: 1,
    orderBy: {
      recordedAt: "desc" as const
    }
  }
} as const;

export class RideService {
  private readonly fareService = new FareService();
  private readonly matchingService = new MatchingService();

  estimateRide(input: RideEstimateInput) {
    const fare = this.fareService.compute(input.pricing);

    return {
      pickup: input.pickup,
      destination: input.destination,
      pricing: fare,
      serviceAdvice: {
        countryCode: input.pricing.countryCode,
        rideType: input.pricing.rideType,
        recommendedRealtimeChannel: "websocket",
        lightweightModeRecommended: input.pricing.countryCode === "GH"
      }
    };
  }

  validateLifecycle(input: RideLifecycleInput) {
    const allowedNextStatuses = lifecycleTransitions[input.currentStatus] ?? [];

    if (!allowedNextStatuses.includes(input.nextStatus)) {
      throw new AppError(
        `Cannot move ride from ${input.currentStatus} to ${input.nextStatus}`,
        409,
        "INVALID_RIDE_TRANSITION",
        { allowedNextStatuses }
      );
    }

    if (input.nextStatus === "started" && !startActors.has(input.actorRole)) {
      throw new AppError(
        "Only rider-side operations can start a ride",
        403,
        "RIDE_START_NOT_ALLOWED"
      );
    }

    if (input.nextStatus === "completed" && !completionActors.has(input.actorRole)) {
      throw new AppError(
        "Only ride operations actors can complete a ride",
        403,
        "RIDE_COMPLETION_NOT_ALLOWED"
      );
    }

    return {
      valid: true,
      currentStatus: input.currentStatus,
      nextStatus: input.nextStatus,
      actorRole: input.actorRole
    };
  }

  previewMatching(input: MatchingPreviewInput) {
    const rankedCandidates = this.matchingService.rankCandidates(input);

    return {
      requestedServiceZoneId: input.requestedServiceZoneId,
      candidateCount: input.candidates.length,
      eligibleCount: rankedCandidates.length,
      rankedCandidates
    };
  }

  async updateRiderAvailability(riderProfileId: string, input: RiderAvailabilityInput) {
    const riderProfile = await prisma.riderProfile.findUnique({
      where: {
        id: riderProfileId
      },
      include: {
        user: true,
        serviceZone: true
      }
    });

    if (!riderProfile) {
      throw new AppError("Rider profile was not found", 404, "RIDER_NOT_FOUND");
    }

    if (input.onlineStatus) {
      const settlementWallet = await prisma.wallet.findFirst({
        where: {
          userId: riderProfile.userId,
          type: WalletType.RIDER_SETTLEMENT,
          isActive: true
        },
        orderBy: {
          createdAt: "asc"
        }
      });

      const deficitAmount = riderDeficitFromBalance(Number(settlementWallet?.availableBalance ?? 0));
      if (deficitAmount >= riderDeficitOfflineThreshold) {
        await prisma.riderProfile.update({
          where: {
            id: riderProfileId
          },
          data: {
            onlineStatus: false
          }
        });

        throw new AppError(
          `Your rider deficit is ${settlementWallet?.currency ?? riderProfile.user.preferredCurrency} ${deficitAmount.toFixed(2)}. Clear it below GHS ${riderDeficitOfflineThreshold} before going online again.`,
          409,
          "RIDER_OFFLINE_DEFICIT_LOCKED",
          {
            deficitAmount,
            warningThreshold: riderDeficitWarningThreshold,
            offlineThreshold: riderDeficitOfflineThreshold
          }
        );
      }
    }

    const updated = await prisma.riderProfile.update({
      where: {
        id: riderProfileId
      },
      data: {
        onlineStatus: input.onlineStatus,
        serviceZoneId: input.serviceZoneId,
        currentLatitude: input.latitude !== undefined ? roundCoordinate(input.latitude) : undefined,
        currentLongitude: input.longitude !== undefined ? roundCoordinate(input.longitude) : undefined,
        lastOnlineAt: input.onlineStatus ? new Date() : undefined
      },
      include: {
        user: true,
        serviceZone: true
      }
    });

    if (input.latitude !== undefined && input.longitude !== undefined) {
      void syncRiderLocationGeography(riderProfileId, input.latitude, input.longitude);
    }

    return updated;
  }

  async createRideRequest(input: CreateRideRequestInput) {
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

    if (!passenger.user.isPhoneVerified) {
      throw new AppError(
        "Verify your phone number before requesting a ride",
        403,
        "PHONE_NOT_VERIFIED"
      );
    }

    const serviceZone = await prisma.serviceZone.findUnique({
      where: {
        id: input.serviceZoneId
      }
    });

    if (!serviceZone) {
      throw new AppError("Service zone was not found", 404, "SERVICE_ZONE_NOT_FOUND");
    }

    if (!serviceZone.isActive || !serviceZone.ridesEnabled) {
      throw new AppError(
        "Rides are currently unavailable in this area",
        403,
        "RIDES_DISABLED_IN_REGION"
      );
    }

    const requiredVehicleType = requiredVehicleTypeForRideType(input.rideType);

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
        jobPreference: { in: ridesJobPreferenceFilter },
        vehicle: { vehicleType: requiredVehicleType },
        ...(nearbyCandidates ? { id: { in: nearbyCandidates.map((candidate) => candidate.id) } } : {})
      },
      include: {
        user: true
      }
    });

    const rankingInput = {
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
    };

    const rankedCandidates = this.matchingService.rankCandidates(rankingInput);
    const selectedCandidate = rankedCandidates[0];
    const selectedRider = selectedCandidate
      ? riders.find((candidate) => candidate.id === selectedCandidate.riderId)
      : undefined;
    const commissionPercent = selectedRider ? Number(selectedRider.commissionPercent) : 12;

    let promoDiscount = input.promoDiscount;
    let promoCodeId: string | undefined;

    if (input.promoCode) {
      const prePromoFare = this.fareService.compute({
        countryCode: serviceZone.countryCode as "GH" | "NG",
        currency: serviceZone.currency as "GHS" | "NGN",
        rideType: input.rideType,
        baseFare: Number(serviceZone.baseFare),
        perKmFee: Number(serviceZone.perKmFee),
        perMinuteFee: Number(serviceZone.perMinuteFee),
        minimumFare: Number(serviceZone.minimumFare),
        cancellationFee: Number(serviceZone.cancellationFee),
        waitingFeePerMinute: Number(serviceZone.waitingFeePerMin),
        commissionPercent,
        surgeMultiplier: input.surgeMultiplier,
        zoneFee: 0,
        promoDiscount: 0,
        referralDiscount: input.referralDiscount,
        estimatedDistanceKm: input.estimatedDistanceKm,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        waitingMinutes: input.waitingMinutes
      }).totalFare;

      const applied = await promotionService.applyPromoCode(
        {
          code: input.promoCode,
          estimatedFare: prePromoFare,
          currency: serviceZone.currency as "GHS" | "NGN",
          city: serviceZone.city
        },
        passenger.id
      );

      promoDiscount = applied.discountAmount;
      promoCodeId = applied.promoCodeId;
    }

    const pricing = this.fareService.compute({
      countryCode: serviceZone.countryCode as "GH" | "NG",
      currency: serviceZone.currency as "GHS" | "NGN",
      rideType: input.rideType,
      baseFare: Number(serviceZone.baseFare),
      perKmFee: Number(serviceZone.perKmFee),
      perMinuteFee: Number(serviceZone.perMinuteFee),
      minimumFare: Number(serviceZone.minimumFare),
      cancellationFee: Number(serviceZone.cancellationFee),
      waitingFeePerMinute: Number(serviceZone.waitingFeePerMin),
      commissionPercent,
      surgeMultiplier: input.surgeMultiplier,
      zoneFee: 0,
      promoDiscount,
      referralDiscount: input.referralDiscount,
      estimatedDistanceKm: input.estimatedDistanceKm,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      waitingMinutes: input.waitingMinutes
    });

    const ride = await prisma.$transaction(async (tx) => {
      const createdRide = await tx.ride.create({
        data: {
          passengerId: passenger.id,
          riderId: selectedRider?.id,
          serviceZoneId: serviceZone.id,
          promoCodeId,
          status: selectedRider ? RideStatus.ASSIGNED : RideStatus.SEARCHING,
          paymentMethod: apiToDbPaymentMethod[input.paymentMethod],
          pickupAddress: input.pickup.address,
          pickupLatitude: roundCoordinate(input.pickup.latitude),
          pickupLongitude: roundCoordinate(input.pickup.longitude),
          destinationAddress: input.destination.address,
          destinationLatitude: roundCoordinate(input.destination.latitude),
          destinationLongitude: roundCoordinate(input.destination.longitude),
          estimatedDistanceKm: input.estimatedDistanceKm,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          estimatedFare: pricing.totalFare,
          finalFare: pricing.totalFare,
          promoDiscount,
          referralDiscount: input.referralDiscount,
          surgeAmount: pricing.surgeAmount,
          waitingAmount: pricing.waitingAmount,
          cancellationFee: Number(serviceZone.cancellationFee),
          riderEarnings: pricing.riderEarnings,
          platformCommission: pricing.platformCommission,
          currency: serviceZone.currency,
          notes: input.notes,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
          assignedAt: selectedRider ? new Date() : undefined
        },
        include: rideDetailsInclude
      });

      await tx.rideEvent.createMany({
        data: [
          {
            rideId: createdRide.id,
            actorUserId: passenger.userId,
            eventType: "ride_requested",
            payload: {
              paymentMethod: input.paymentMethod,
              rideType: input.rideType
            }
          },
          ...(selectedRider
            ? [
                {
                  rideId: createdRide.id,
                  actorUserId: selectedRider.userId,
                  eventType: "rider_assigned",
                  payload: {
                    riderProfileId: selectedRider.id,
                    score: selectedCandidate?.score ?? null
                  }
                }
              ]
            : [])
        ]
      });

      await tx.wallet.upsert({
        where: {
          userId_type_currency: {
            userId: passenger.userId,
            type: WalletType.PASSENGER_CASHLESS,
            currency: serviceZone.currency
          }
        },
        update: {},
        create: {
          userId: passenger.userId,
          type: WalletType.PASSENGER_CASHLESS,
          currency: serviceZone.currency
        }
      });

      if (selectedRider) {
        await tx.wallet.upsert({
          where: {
            userId_type_currency: {
              userId: selectedRider.userId,
              type: WalletType.RIDER_SETTLEMENT,
              currency: serviceZone.currency
            }
          },
          update: {},
          create: {
            userId: selectedRider.userId,
            type: WalletType.RIDER_SETTLEMENT,
            currency: serviceZone.currency
          }
        });
      }

      if (input.promoCode && promoCodeId) {
        await tx.promoRedemption.create({
          data: {
            promoCodeId,
            passengerId: passenger.id,
            rideId: createdRide.id,
            discountAmount: promoDiscount
          }
        });
      }

      return createdRide;
    });

    const realtimeRide = serializeRideForRealtime(ride);
    if (ride.rider?.userId) {
      emitRideAssigned({
        ride: realtimeRide,
        passengerUserId: passenger.userId,
        riderUserId: ride.rider.userId
      });
      void pushService.sendToUser(ride.rider.userId, {
        title: "New ride assigned",
        body: `Pickup: ${ride.pickupAddress}`,
        data: { rideId: ride.id, type: "ride_assigned" }
      });
    } else {
      emitRideStatusUpdate({
        ride: realtimeRide,
        passengerUserId: passenger.userId
      });
    }

    void pushService.sendToUser(passenger.userId, {
      title: ride.rider ? "Rider assigned" : "Ride requested",
      body: ride.rider
        ? `${ride.rider.user.fullName} is on the way`
        : "Searching for a nearby rider",
      data: { rideId: ride.id, type: "ride_requested" }
    });

    return {
      ride,
      pricing,
      matching: {
        requestedServiceZoneId: input.serviceZoneId,
        rankedCandidates
      }
    };
  }

  async getRide(rideId: RideIdParams["rideId"]) {
    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId
      },
      include: {
        ...rideDetailsInclude,
        events: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!ride) {
      throw new AppError("Ride was not found", 404, "RIDE_NOT_FOUND");
    }

    return ride;
  }

  async listRides() {
    return prisma.ride.findMany({
      take: 25,
      orderBy: {
        createdAt: "desc"
      },
      include: rideDetailsInclude
    });
  }

  async listRideLocations(rideId: RideIdParams["rideId"], limit = 30) {
    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId
      },
      select: {
        id: true
      }
    });

    if (!ride) {
      throw new AppError("Ride was not found", 404, "RIDE_NOT_FOUND");
    }

    return prisma.rideLocation.findMany({
      where: {
        rideId
      },
      orderBy: {
        recordedAt: "desc"
      },
      take: limit
    });
  }

  async recordRideLocation(rideId: RideIdParams["rideId"], input: RideLocationUpdateInput) {
    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId
      },
      include: rideDetailsInclude
    });

    if (!ride) {
      throw new AppError("Ride was not found", 404, "RIDE_NOT_FOUND");
    }

    if (!ride.riderId) {
      throw new AppError(
        "Ride location cannot be recorded before a rider is assigned",
        409,
        "RIDE_MISSING_RIDER"
      );
    }

    if (input.riderProfileId && input.riderProfileId !== ride.riderId) {
      throw new AppError(
        "This ride location update does not match the assigned rider",
        403,
        "RIDE_LOCATION_RIDER_MISMATCH"
      );
    }

    const latitude = roundCoordinate(input.latitude);
    const longitude = roundCoordinate(input.longitude);

    await prisma.$transaction(async (tx) => {
      await tx.rideLocation.create({
        data: {
          rideId,
          source: input.source,
          latitude,
          longitude,
          speedKph: input.speedKph,
          heading: input.heading,
          accuracyM: input.accuracyM
        }
      });

      await tx.riderProfile.update({
        where: {
          id: ride.riderId!
        },
        data: {
          onlineStatus: true,
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastOnlineAt: new Date()
        }
      });
    });

    void syncRiderLocationGeography(ride.riderId!, latitude, longitude);

    const updatedRide = await this.getRide(rideId);
    emitRiderLocationUpdate({
      rideId,
      latitude,
      longitude,
      passengerUserId: ride.passenger.userId,
      riderUserId: ride.rider?.userId
    });

    return updatedRide;
  }

  private async findRiderForAssignment(
    ride: {
      id: string;
      riderId: string | null;
      serviceZoneId: string | null;
      pickupLatitude: unknown;
      pickupLongitude: unknown;
    },
    riderProfileId?: string
  ) {
    if (ride.riderId && riderProfileId && ride.riderId !== riderProfileId) {
      throw new AppError("Ride already has a different assigned rider", 409, "RIDE_ALREADY_ASSIGNED");
    }

    if (ride.riderId) {
      const currentRider = await prisma.riderProfile.findUnique({
        where: {
          id: ride.riderId
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

    if (!ride.serviceZoneId) {
      throw new AppError(
        "Ride cannot be accepted because it is not linked to a service zone",
        409,
        "RIDE_MISSING_SERVICE_ZONE"
      );
    }

    const rideType = await getRideRequestedType(ride.id);
    const requiredVehicleType = requiredVehicleTypeForRideType(rideType);

    const nearbyCandidates = riderProfileId
      ? null
      : await findNearbyRiderCandidates({
          serviceZoneId: ride.serviceZoneId,
          latitude: Number(ride.pickupLatitude),
          longitude: Number(ride.pickupLongitude),
          radiusKm: 8
        });

    const riderWhere = {
      serviceZoneId: ride.serviceZoneId,
      onlineStatus: true,
      approvalStatus: RiderApprovalStatus.APPROVED,
      deletedAt: null,
      jobPreference: { in: ridesJobPreferenceFilter },
      vehicle: { vehicleType: requiredVehicleType },
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
          ? "Selected rider is not online, approved, or in this ride zone"
          : "No online approved rider is available for this ride zone",
        409,
        "NO_AVAILABLE_RIDER"
      );
    }

    if (riderProfileId) {
      return riders[0];
    }

    const rankedCandidates = this.matchingService.rankCandidates({
      requestedServiceZoneId: ride.serviceZoneId,
      maxPickupRadiusKm: 8,
      candidates: riders
        .filter((rider) => rider.currentLatitude !== null && rider.currentLongitude !== null)
        .map((rider) => {
          const distanceToPickupKm = haversineDistanceKm(
            Number(rider.currentLatitude),
            Number(rider.currentLongitude),
            Number(ride.pickupLatitude),
            Number(ride.pickupLongitude)
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

  async updateRideStatus(rideId: string, input: RideStatusUpdateInput) {
    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId
      },
      include: rideDetailsInclude
    });

    if (!ride) {
      throw new AppError("Ride was not found", 404, "RIDE_NOT_FOUND");
    }

    this.validateLifecycle({
      currentStatus: toApiRideStatus(ride.status),
      nextStatus: input.nextStatus,
      actorRole: input.actorRole
    });

    const nextDbStatus = apiToDbRideStatus[input.nextStatus];
    const assignedRider =
      input.nextStatus === "assigned"
        ? await this.findRiderForAssignment(ride, input.riderProfileId)
        : undefined;

    await prisma.$transaction(async (tx) => {
      const updatedRide = await tx.ride.update({
        where: {
          id: rideId
        },
        data: {
          status: nextDbStatus,
          riderId: assignedRider?.id,
          assignedAt: input.nextStatus === "assigned" ? new Date() : undefined,
          riderArrivedAt: input.nextStatus === "arrived" ? new Date() : undefined,
          startedAt: input.nextStatus === "started" ? new Date() : undefined,
          completedAt: input.nextStatus === "completed" ? new Date() : undefined,
          cancelledAt: input.nextStatus === "cancelled" ? new Date() : undefined,
          cancellationReason: input.cancellationReason
        },
        include: rideDetailsInclude
      });

      await tx.rideEvent.create({
        data: {
          rideId,
          actorUserId: input.actorUserId,
          eventType: `ride_${input.nextStatus}`,
          payload: {
            actorRole: input.actorRole,
            riderProfileId: assignedRider?.id ?? input.riderProfileId,
            cancellationReason: input.cancellationReason
          }
        }
      });

      if (input.nextStatus === "completed") {
        const finalAmount = Number(updatedRide.finalFare ?? updatedRide.estimatedFare ?? 0);
        const riderUserId = updatedRide.rider?.userId;

        if (!riderUserId) {
          throw new AppError(
            "Ride cannot be completed without an assigned rider",
            409,
            "RIDE_MISSING_RIDER"
          );
        }

        const passengerWallet = await tx.wallet.upsert({
          where: {
            userId_type_currency: {
              userId: updatedRide.passenger.userId,
              type: WalletType.PASSENGER_CASHLESS,
              currency: updatedRide.currency
            }
          },
          update: {},
          create: {
            userId: updatedRide.passenger.userId,
            type: WalletType.PASSENGER_CASHLESS,
            currency: updatedRide.currency
          }
        });

        const riderWallet = await tx.wallet.upsert({
          where: {
            userId_type_currency: {
              userId: riderUserId,
              type: WalletType.RIDER_SETTLEMENT,
              currency: updatedRide.currency
            }
          },
          update: {},
          create: {
            userId: riderUserId,
            type: WalletType.RIDER_SETTLEMENT,
            currency: updatedRide.currency
          }
        });

        const payment = await tx.payment.upsert({
          where: {
            rideId
          },
          update: {
            amount: finalAmount,
            status: PaymentStatus.CAPTURED,
            capturedAt: new Date()
          },
          create: {
            rideId,
            payerUserId: updatedRide.passenger.userId,
            method: updatedRide.paymentMethod ?? PaymentMethod.CASH,
            status: PaymentStatus.CAPTURED,
            provider:
              updatedRide.paymentMethod === PaymentMethod.CARD
                ? "card"
                : updatedRide.paymentMethod === PaymentMethod.MOBILE_MONEY
                  ? "mobile-money"
                  : updatedRide.paymentMethod === PaymentMethod.WALLET
                    ? "wallet"
                    : "cash",
            amount: finalAmount,
            currency: updatedRide.currency,
            capturedAt: new Date()
          }
        });

        if (updatedRide.paymentMethod === PaymentMethod.WALLET) {
          const refreshedPassengerWallet = await tx.wallet.findUniqueOrThrow({
            where: {
              id: passengerWallet.id
            }
          });

          if (Number(refreshedPassengerWallet.availableBalance) < finalAmount) {
            throw new AppError(
              "Passenger wallet balance is insufficient for completion",
              409,
              "INSUFFICIENT_WALLET_BALANCE"
            );
          }

          await tx.wallet.update({
            where: {
              id: passengerWallet.id
            },
            data: {
              availableBalance: {
                decrement: finalAmount
              }
            }
          });

          await tx.walletTransaction.upsert({
            where: {
              reference: `RIDE-DEBIT-${rideId}`
            },
            update: {},
            create: {
              walletId: passengerWallet.id,
              rideId,
              paymentId: payment.id,
              type: WalletTransactionType.DEBIT,
              status: WalletTransactionStatus.POSTED,
              amount: finalAmount,
              currency: updatedRide.currency,
              direction: "debit",
              reference: `RIDE-DEBIT-${rideId}`,
              description: "Passenger ride payment",
              postedAt: new Date()
            }
          });
        }

        const riderSettlementAmount = Number(updatedRide.riderEarnings ?? 0);
        const platformCommissionAmount = Number(updatedRide.platformCommission ?? 0);

        if (updatedRide.paymentMethod === PaymentMethod.CASH) {
          if (platformCommissionAmount > 0) {
            await tx.wallet.update({
              where: {
                id: riderWallet.id
              },
              data: {
                availableBalance: {
                  decrement: platformCommissionAmount
                }
              }
            });

            await tx.walletTransaction.upsert({
              where: {
                reference: `RIDE-COMMISSION-${rideId}`
              },
              update: {},
              create: {
                walletId: riderWallet.id,
                rideId,
                paymentId: payment.id,
                type: WalletTransactionType.COMMISSION,
                status: WalletTransactionStatus.POSTED,
                amount: platformCommissionAmount,
                currency: updatedRide.currency,
                direction: "debit",
                reference: `RIDE-COMMISSION-${rideId}`,
                description: "Cash trip commission owed",
                postedAt: new Date()
              }
            });
          }
        } else if (riderSettlementAmount > 0) {
          await tx.wallet.update({
            where: {
              id: riderWallet.id
            },
            data: {
              availableBalance: {
                increment: riderSettlementAmount
              }
            }
          });

          await tx.walletTransaction.upsert({
            where: {
              reference: `RIDE-CREDIT-${rideId}`
            },
            update: {},
            create: {
              walletId: riderWallet.id,
              rideId,
              paymentId: payment.id,
              type: WalletTransactionType.CREDIT,
              status: WalletTransactionStatus.POSTED,
              amount: riderSettlementAmount,
              currency: updatedRide.currency,
              direction: "credit",
              reference: `RIDE-CREDIT-${rideId}`,
              description: "Rider trip earnings",
              postedAt: new Date()
            }
          });
        }

        const refreshedRiderWallet = await tx.wallet.findUniqueOrThrow({
          where: {
            id: riderWallet.id
          }
        });

        if (
          updatedRide.riderId &&
          riderDeficitFromBalance(Number(refreshedRiderWallet.availableBalance)) >=
            riderDeficitOfflineThreshold
        ) {
          await tx.riderProfile.update({
            where: {
              id: updatedRide.riderId
            },
            data: {
              onlineStatus: false
            }
          });
        }

        await tx.passengerProfile.update({
          where: {
            id: updatedRide.passengerId
          },
          data: {
            totalTrips: {
              increment: 1
            }
          }
        });

        if (updatedRide.riderId) {
          await tx.riderProfile.update({
            where: {
              id: updatedRide.riderId
            },
            data: {
              completedTrips: {
                increment: 1
              }
            }
          });
        }
      }

      if (input.nextStatus === "cancelled" && input.actorRole === "passenger") {
        const cancellationFee = Number(updatedRide.cancellationFee ?? 0);
        const chargeableStatuses: RideStatus[] = [
          RideStatus.ASSIGNED,
          RideStatus.ARRIVING,
          RideStatus.ARRIVED
        ];

        if (cancellationFee > 0 && chargeableStatuses.includes(ride.status)) {
          const passengerWallet = await tx.wallet.upsert({
            where: {
              userId_type_currency: {
                userId: updatedRide.passenger.userId,
                type: WalletType.PASSENGER_CASHLESS,
                currency: updatedRide.currency
              }
            },
            update: {},
            create: {
              userId: updatedRide.passenger.userId,
              type: WalletType.PASSENGER_CASHLESS,
              currency: updatedRide.currency
            }
          });

          await tx.wallet.update({
            where: { id: passengerWallet.id },
            data: {
              availableBalance: { decrement: cancellationFee }
            }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: passengerWallet.id,
              rideId,
              type: WalletTransactionType.DEBIT,
              status: WalletTransactionStatus.POSTED,
              amount: cancellationFee,
              currency: updatedRide.currency,
              direction: "debit",
              reference: `RIDE-CANCEL-FEE-${rideId}`,
              description: "Ride cancellation fee",
              postedAt: new Date()
            }
          });
        }
      }

      return updatedRide;
    });

    const refreshedRide = await this.getRide(rideId);
    const realtimeRide = serializeRideForRealtime(refreshedRide);
    emitRideStatusUpdate({
      ride: realtimeRide,
      passengerUserId: refreshedRide.passenger.userId,
      riderUserId: refreshedRide.rider?.userId
    });

    void pushService.sendToUser(refreshedRide.passenger.userId, {
      title: "Ride update",
      body: `Status: ${input.nextStatus.replace(/_/g, " ")}`,
      data: { rideId, type: "ride_status", status: input.nextStatus }
    });

    if (refreshedRide.rider?.userId) {
      void pushService.sendToUser(refreshedRide.rider.userId, {
        title: "Ride update",
        body: `Status: ${input.nextStatus.replace(/_/g, " ")}`,
        data: { rideId, type: "ride_status", status: input.nextStatus }
      });
    }

    if (input.nextStatus === "completed") {
      void referralService.settleReferralForCompletedRide(rideId);
    }

    return refreshedRide;
  }
}
