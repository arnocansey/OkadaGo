import { AppError } from "../../common/errors.js";
import { appConfig } from "../../common/config.js";
import { makeWalletReference } from "../../common/codes.js";
import { prisma } from "../../common/prisma.js";
import { findNearbyRiderCandidates, syncRiderLocationGeography } from "../../common/geo.js";
import {
  JobPreference,
  PaymentMethod,
  PaymentStatus,
  RideStatus,
  RiderApprovalStatus,
  RiderTripStatus,
  VehicleType,
  WalletTransactionStatus,
  WalletTransactionType,
  WalletType
} from "../../generated/prisma/enums.js";
import { FareService } from "../pricing/fare.service.js";
import { commissionService } from "../finance/commission.service.js";
import { financeLedgerService } from "../finance/finance-ledger.service.js";
import { FinanceLedgerType, LedgerDirection } from "../../generated/prisma/client.js";
import { MatchingService } from "../matching/matching.service.js";
import { dispatchService } from "../matching/dispatch.service.js";
import { pushService } from "../notifications/push.service.js";
import { hasSmsConfig } from "../notifications/sms.service.js";
import { promotionService } from "../promotions/promotion.service.js";
import { referralService } from "../referrals/referral.service.js";
import {
  emitRideAssigned,
  emitRideRequestToRiders,
  emitRideStatusUpdate,
  emitRiderLocationUpdate,
  serializeRideForRealtime
} from "../realtime/realtime.service.js";
import { liveLocationService } from "../realtime/location.service.js";
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
  scheduled: ["searching", "assigned", "cancelled"],
  searching: ["assigned", "arriving", "cancelled"],
  assigned: ["arriving", "arrived", "started", "cancelled"],
  arriving: ["arrived", "started", "cancelled"],
  arrived: ["started", "completed", "cancelled"],
  started: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

const startActors = new Set(["rider", "admin", "dispatcher"]);
const completionActors = new Set(["rider", "admin", "dispatcher", "system"]);
const riderDeficitWarningThreshold = 100;
const riderDeficitOfflineThreshold = 200;
/** Minimum positive settlement-wallet balance required before a rider can go online (0 GHS under 10% commission model). */
const riderMinOnlineBalance = 0;

/**
 * Rides scheduled further out than this window are held as SCHEDULED (no matching yet).
 * Rides due within this window are dispatched immediately, either at creation time or by
 * the periodic scheduled-ride dispatcher (see dispatchScheduledRides).
 */
export const SCHEDULED_RIDE_LOOKAHEAD_MS = 15 * 60 * 1000;

const apiToDbRideStatus = {
  scheduled: RideStatus.SCHEDULED,
  searching: RideStatus.SEARCHING,
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

const adminUserListSelect = {
  id: true,
  fullName: true,
  email: true,
  phoneE164: true,
  preferredCurrency: true,
  accountStatus: true,
  role: true
} as const;

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

/** Slim list payload for admin/ops tables — avoids full User rows + location history. */
const rideListInclude = {
  passenger: {
    select: {
      id: true,
      user: { select: adminUserListSelect }
    }
  },
  rider: {
    select: {
      id: true,
      displayCode: true,
      user: { select: adminUserListSelect },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          plateNumber: true,
          vehicleType: true,
          status: true
        }
      },
      serviceZone: {
        select: { id: true, name: true, city: true, currency: true }
      }
    }
  },
  serviceZone: {
    select: { id: true, name: true, city: true, currency: true }
  }
} as const;

export class RideService {
  private readonly fareService = new FareService();
  private readonly matchingService = new MatchingService();

  private async matchRiderForZone(params: {
    serviceZoneId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    requiredVehicleType: VehicleType;
  }) {
    const nearbyCandidates = await findNearbyRiderCandidates({
      serviceZoneId: params.serviceZoneId,
      latitude: params.pickupLatitude,
      longitude: params.pickupLongitude,
      radiusKm: 25
    });

    const riders = await prisma.riderProfile.findMany({
      where: {
        serviceZoneId: params.serviceZoneId,
        onlineStatus: true,
        approvalStatus: RiderApprovalStatus.APPROVED,
        deletedAt: null,
        jobPreference: { in: ridesJobPreferenceFilter },
        OR: [
          { vehicle: null },
          { vehicle: { vehicleType: params.requiredVehicleType } },
          { vehicle: { vehicleType: VehicleType.OKADA } },
        ],
        ...(nearbyCandidates && nearbyCandidates.length > 0
          ? { id: { in: nearbyCandidates.map((candidate) => candidate.id) } }
          : {})
      },
      include: {
        user: true,
        vehicle: true
      }
    });

    const rankedCandidates = this.matchingService.rankCandidates({
      requestedServiceZoneId: params.serviceZoneId,
      maxPickupRadiusKm: 25,
      candidates: riders
        .map((rider) => {
          const lat = Number(rider.currentLatitude ?? params.pickupLatitude);
          const lon = Number(rider.currentLongitude ?? params.pickupLongitude);
          const distanceToPickupKm = haversineDistanceKm(
            lat,
            lon,
            params.pickupLatitude,
            params.pickupLongitude
          );
          const etaMinutes = Math.max(2, Math.round((distanceToPickupKm / 22) * 60));

          return {
            riderId: rider.id,
            displayName: rider.user.fullName,
            serviceZoneId: rider.serviceZoneId ?? "",
            distanceToPickupKm,
            etaMinutes,
            ratingAverage: Number(rider.ratingAverage ?? 5.0),
            acceptanceRate: Number(rider.acceptanceRate ?? 100),
            cancellationRate: Number(rider.cancellationRate ?? 0),
            isOnline: rider.onlineStatus,
            isApproved: rider.approvalStatus === RiderApprovalStatus.APPROVED,
            isAvailable: true
          };
        })
    });

    const selectedCandidate = rankedCandidates[0];
    const selectedRider = selectedCandidate
      ? riders.find((candidate) => candidate.id === selectedCandidate.riderId)
      : undefined;

    return { selectedRider, rankedCandidates, riders };
  }

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

  async getRiderProfile(riderProfileId: string) {
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: {
        id: true,
        onlineStatus: true,
        approvalStatus: true,
        serviceZoneId: true,
        currentLatitude: true,
        currentLongitude: true,
        lastOnlineAt: true,
      }
    });

    if (!riderProfile) {
      throw new AppError("Rider profile was not found", 404, "RIDER_NOT_FOUND");
    }

    return riderProfile;
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
      if (riderProfile.approvalStatus !== RiderApprovalStatus.APPROVED) {
        if (process.env.NODE_ENV !== "production" || appConfig.nodeEnv === "development") {
          await prisma.riderProfile.update({
            where: { id: riderProfileId },
            data: { approvalStatus: RiderApprovalStatus.APPROVED, approvedAt: new Date() }
          });
          riderProfile.approvalStatus = RiderApprovalStatus.APPROVED;
        } else {
          await prisma.riderProfile.update({
            where: { id: riderProfileId },
            data: { onlineStatus: false }
          });
          throw new AppError(
            "Your rider account is not approved yet. Upload documents and wait for verification before going online.",
            409,
            "RIDER_NOT_APPROVED",
            { approvalStatus: riderProfile.approvalStatus }
          );
        }
      }

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

      const balance = Number(settlementWallet?.availableBalance ?? 0);
      const currency = settlementWallet?.currency ?? riderProfile.user.preferredCurrency;
      const deficitAmount = riderDeficitFromBalance(balance);

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
          `Your rider deficit is ${currency} ${deficitAmount.toFixed(2)}. Clear it below GHS ${riderDeficitOfflineThreshold} before going online again.`,
          409,
          "RIDER_OFFLINE_DEFICIT_LOCKED",
          {
            deficitAmount,
            warningThreshold: riderDeficitWarningThreshold,
            offlineThreshold: riderDeficitOfflineThreshold
          }
        );
      }

      if (riderMinOnlineBalance > 0 && balance < riderMinOnlineBalance) {
        await prisma.riderProfile.update({
          where: {
            id: riderProfileId
          },
          data: {
            onlineStatus: false
          }
        });

        throw new AppError(
          `Insufficient Balance. Please top up at least GH₵ ${riderMinOnlineBalance} via MoMo to ride.`,
          409,
          "RIDER_INSUFFICIENT_BALANCE",
          {
            availableBalance: balance,
            requiredBalance: riderMinOnlineBalance,
            currency
          }
        );
      }
    }

    let assignedZoneId = input.serviceZoneId ?? riderProfile.serviceZoneId;
    if (!assignedZoneId) {
      const defaultZone = await prisma.serviceZone.findFirst({
        where: { isActive: true }
      });
      assignedZoneId = defaultZone?.id ?? null;
    }

    const updated = await prisma.riderProfile.update({
      where: {
        id: riderProfileId
      },
      data: {
        onlineStatus: input.onlineStatus,
        serviceZoneId: assignedZoneId,
        currentLatitude: input.latitude !== undefined ? roundCoordinate(input.latitude) : undefined,
        currentLongitude: input.longitude !== undefined ? roundCoordinate(input.longitude) : undefined,
        lastOnlineAt: input.onlineStatus ? new Date() : undefined,
        lastLocationMocked: input.isMocked ?? undefined,
        lastLocationMockedAt: input.isMocked ? new Date() : undefined
      },
      include: {
        user: true,
        serviceZone: true
      }
    });

    // Log online/offline transition for admin panel
    void prisma.riderOnlineLog.create({
      data: {
        riderProfileId,
        status: input.onlineStatus,
        latitude: input.latitude !== undefined ? roundCoordinate(input.latitude) : undefined,
        longitude: input.longitude !== undefined ? roundCoordinate(input.longitude) : undefined,
        serviceZoneId: input.serviceZoneId ?? riderProfile.serviceZoneId ?? undefined,
        isMocked: input.isMocked ?? false,
      },
    }).catch(() => undefined);

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
      if (
        !appConfig.requirePhoneVerification ||
        !hasSmsConfig() ||
        process.env.NODE_ENV !== "production" ||
        appConfig.nodeEnv === "development"
      ) {
        await prisma.user.update({
          where: { id: passenger.user.id },
          data: { isPhoneVerified: true }
        });
        passenger.user.isPhoneVerified = true;
      } else {
        throw new AppError(
          "Verify your phone number before requesting a ride",
          403,
          "PHONE_NOT_VERIFIED"
        );
      }
    }

    let serviceZoneId = input.serviceZoneId;
    let serviceZone = serviceZoneId
      ? await prisma.serviceZone.findUnique({
          where: { id: serviceZoneId }
        })
      : null;

    if (!serviceZone) {
      serviceZone = await prisma.serviceZone.findFirst({
        where: { isActive: true, ridesEnabled: true }
      });
      if (!serviceZone) {
        serviceZone = await prisma.serviceZone.findFirst({
          where: { isActive: true }
        });
      }
      if (!serviceZone) {
        throw new AppError("Service zone was not found", 404, "SERVICE_ZONE_NOT_FOUND");
      }
      serviceZoneId = serviceZone.id;
    }

    if (!serviceZone.isActive || !serviceZone.ridesEnabled) {
      throw new AppError(
        "Rides are currently unavailable in this area",
        403,
        "RIDES_DISABLED_IN_REGION"
      );
    }

    const requiredVehicleType = requiredVehicleTypeForRideType(input.rideType);

    const scheduledForDate = input.scheduledFor ? new Date(input.scheduledFor) : undefined;
    const isFutureSchedule = Boolean(
      scheduledForDate && scheduledForDate.getTime() - Date.now() > SCHEDULED_RIDE_LOOKAHEAD_MS
    );

    const { selectedRider, rankedCandidates, riders } = isFutureSchedule
      ? { selectedRider: undefined, rankedCandidates: [] as ReturnType<MatchingService["rankCandidates"]>, riders: [] }
      : await this.matchRiderForZone({
          serviceZoneId: serviceZoneId!,
          pickupLatitude: input.pickup.latitude,
          pickupLongitude: input.pickup.longitude,
          requiredVehicleType
        });
    const commissionPercent = selectedRider ? Number(selectedRider.commissionPercent) : 10;

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

    const safetyPin = dispatchService.generateSafetyPin();

    const ride = await prisma.$transaction(async (tx) => {
      const createdRide = await tx.ride.create({
        data: {
          passengerId: passenger.id,
          riderId: selectedRider?.id,
          serviceZoneId: serviceZone.id,
          promoCodeId,
          safetyPin,
          dispatchRound: isFutureSchedule ? 0 : 1,
          status: isFutureSchedule
            ? RideStatus.SCHEDULED
            : selectedRider
              ? RideStatus.ASSIGNED
              : RideStatus.SEARCHING,
          paymentMethod: apiToDbPaymentMethod[input.paymentMethod],
          pickupAddress: input.pickup.address,
          pickupLatitude: roundCoordinate(input.pickup.latitude),
          pickupLongitude: roundCoordinate(input.pickup.longitude),
          pickupLandmark: input.pickup.landmark,
          destinationAddress: input.destination.address,
          destinationLatitude: roundCoordinate(input.destination.latitude),
          destinationLongitude: roundCoordinate(input.destination.longitude),
          destinationLandmark: input.destination.landmark,
          pickupLocationMocked: Boolean(input.pickup.isMocked),
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
          scheduledFor: scheduledForDate,
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
                    score: rankedCandidates[0]?.score ?? null
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

      if (!isFutureSchedule) {
        // Trigger multi-round intelligent dispatch escalation
        void dispatchService.dispatchRide(ride.id, 1);
      }
    }

    void pushService.sendToUser(passenger.userId, {
      title: ride.rider ? "Rider assigned" : isFutureSchedule ? "Ride scheduled" : "Ride requested",
      body: ride.rider
        ? `${ride.rider.user.fullName} is on the way`
        : isFutureSchedule
          ? `We'll find you a rider closer to ${scheduledForDate?.toLocaleString() ?? "your scheduled time"}`
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

  /**
   * Periodic dispatcher for scheduled rides. Promotes SCHEDULED rides whose scheduledFor
   * time has entered the lookahead window into active matching, mirroring the immediate
   * ride-request flow. Intended to be invoked on an interval (see main.ts).
   */
  async dispatchScheduledRides() {
    const dueBy = new Date(Date.now() + SCHEDULED_RIDE_LOOKAHEAD_MS);

    const dueRides = await prisma.ride.findMany({
      where: {
        status: RideStatus.SCHEDULED,
        scheduledFor: { lte: dueBy }
      },
      include: rideDetailsInclude
    });

    const results: Array<{ rideId: string; outcome: "assigned" | "searching" }> = [];

    for (const dueRide of dueRides) {
      const rideType = await getRideRequestedType(dueRide.id);
      const requiredVehicleType = requiredVehicleTypeForRideType(rideType);

      const { selectedRider } = dueRide.serviceZoneId
        ? await this.matchRiderForZone({
            serviceZoneId: dueRide.serviceZoneId,
            pickupLatitude: Number(dueRide.pickupLatitude),
            pickupLongitude: Number(dueRide.pickupLongitude),
            requiredVehicleType
          })
        : { selectedRider: undefined };

      const updatedRide = await prisma.ride.update({
        where: { id: dueRide.id },
        data: {
          status: selectedRider ? RideStatus.ASSIGNED : RideStatus.SEARCHING,
          riderId: selectedRider?.id,
          assignedAt: selectedRider ? new Date() : undefined
        },
        include: rideDetailsInclude
      });

      await prisma.rideEvent.create({
        data: {
          rideId: dueRide.id,
          eventType: selectedRider ? "rider_assigned" : "scheduled_ride_dispatched",
          payload: {
            source: "scheduled_dispatch",
            riderProfileId: selectedRider?.id ?? null
          }
        }
      });

      const realtimeRide = serializeRideForRealtime(updatedRide);
      if (updatedRide.rider?.userId) {
        emitRideAssigned({
          ride: realtimeRide,
          passengerUserId: updatedRide.passenger.userId,
          riderUserId: updatedRide.rider.userId
        });
        void pushService.sendToUser(updatedRide.rider.userId, {
          title: "New ride assigned",
          body: `Pickup: ${updatedRide.pickupAddress}`,
          data: { rideId: updatedRide.id, type: "ride_assigned" }
        });
        void pushService.sendToUser(updatedRide.passenger.userId, {
          title: "Rider assigned",
          body: `${updatedRide.rider.user.fullName} is on the way for your scheduled ride`,
          data: { rideId: updatedRide.id, type: "ride_requested" }
        });
      } else {
        emitRideStatusUpdate({
          ride: realtimeRide,
          passengerUserId: updatedRide.passenger.userId
        });
        void pushService.sendToUser(updatedRide.passenger.userId, {
          title: "Searching for your scheduled ride",
          body: "We're now matching you with a nearby rider",
          data: { rideId: updatedRide.id, type: "ride_requested" }
        });
      }

      results.push({ rideId: dueRide.id, outcome: selectedRider ? "assigned" : "searching" });
    }

    return results;
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

  async listRides(query: { limit?: number; page?: number; riderId?: string; passengerId?: string; status?: string } = {}) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 300);
    const page = query.page;

    const dbStatus = query.status
      ? apiToDbRideStatus[query.status.toLowerCase() as keyof typeof apiToDbRideStatus] ??
        (RideStatus[query.status.toUpperCase() as keyof typeof RideStatus] || undefined)
      : undefined;

    const isSearchingOnly = dbStatus === RideStatus.SEARCHING && !query.riderId && !query.passengerId;
    const freshWindow = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes

    const where = {
      ...(query.riderId ? { riderId: query.riderId } : {}),
      ...(query.passengerId ? { passengerId: query.passengerId } : {}),
      ...(dbStatus ? { status: dbStatus } : {}),
      ...(isSearchingOnly ? { createdAt: { gte: freshWindow } } : {})
    };

    const data = await prisma.ride.findMany({
      where,
      take: limit,
      ...(page ? { skip: (page - 1) * limit } : {}),
      orderBy: {
        createdAt: "desc"
      },
      include: rideListInclude
    });

    if (!page) return data;
    const total = await prisma.ride.count({ where });
    return { data, total, page, limit };
  }

  async getActiveRide(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passengerProfile: true, riderProfile: true }
    });
    if (!user) return null;

    const activeStatuses: RideStatus[] = [
      RideStatus.SEARCHING,
      RideStatus.ASSIGNED,
      RideStatus.ARRIVING,
      RideStatus.ARRIVED,
      RideStatus.STARTED
    ];

    const passengerId = user.passengerProfile?.id;
    const riderId = user.riderProfile?.id;

    if (!passengerId && !riderId) return null;

    const activeRide = await prisma.ride.findFirst({
      where: {
        OR: [
          ...(passengerId ? [{ passengerId, status: { in: activeStatuses } }] : []),
          ...(riderId ? [{ riderId, status: { in: activeStatuses } }] : [])
        ]
      },
      orderBy: { createdAt: "desc" },
      include: rideDetailsInclude
    });

    if (!activeRide) return null;

    return serializeRideForRealtime(activeRide);
  }

  async getNearbyRiders(latitude: number, longitude: number, radiusKm = 5) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!lat || !lon) return [];

    // 1. Check live in-memory location service first
    const liveNearby = liveLocationService.getNearbyRiders(lat, lon, radiusKm);
    if (liveNearby && liveNearby.length > 0) {
      return liveNearby.map((r) => {
        const distanceKm = haversineDistanceKm(lat, lon, r.latitude, r.longitude);
        return {
          id: r.riderId,
          name: r.displayName,
          latitude: r.latitude,
          longitude: r.longitude,
          speed: r.speed,
          heading: r.heading,
          accuracy: r.accuracy,
          timestamp: r.timestamp,
          status: r.status,
          distanceKm: Math.round(distanceKm * 10) / 10,
          etaMinutes: Math.max(1, Math.round((distanceKm / 25) * 60)),
          vehicleType: r.vehicleType ?? "motorcycle",
          rating: Number(r.rating ?? 5.0),
        };
      });
    }

    // 2. Fallback to Prisma database if memory index has not populated yet
    const riders = await prisma.riderProfile.findMany({
      where: {
        onlineStatus: true,
        approvalStatus: RiderApprovalStatus.APPROVED,
        deletedAt: null,
        currentLatitude: { not: null },
        currentLongitude: { not: null }
      },
      select: {
        id: true,
        currentLatitude: true,
        currentLongitude: true,
        ratingAverage: true,
        vehicle: {
          select: {
            make: true,
            model: true,
            vehicleType: true
          }
        },
        user: {
          select: {
            fullName: true
          }
        }
      },
      take: 25
    });

    return riders
      .map((r) => {
        const rLat = Number(r.currentLatitude);
        const rLon = Number(r.currentLongitude);
        const distanceKm = haversineDistanceKm(lat, lon, rLat, rLon);
        return {
          id: r.id,
          name: r.user.fullName,
          latitude: rLat,
          longitude: rLon,
          speed: 0,
          heading: 0,
          accuracy: 10,
          timestamp: Date.now(),
          status: "ONLINE",
          distanceKm: Math.round(distanceKm * 10) / 10,
          etaMinutes: Math.max(1, Math.round((distanceKm / 25) * 60)),
          vehicleType: r.vehicle?.vehicleType ?? "motorcycle",
          rating: Number(r.ratingAverage ?? 5.0)
        };
      })
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
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
          accuracyM: input.accuracyM,
          isMocked: input.isMocked ?? false
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
          lastOnlineAt: new Date(),
          lastLocationMocked: input.isMocked ?? undefined,
          lastLocationMockedAt: input.isMocked ? new Date() : undefined
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
          radiusKm: 25
        });

    const riderWhere = {
      serviceZoneId: ride.serviceZoneId,
      onlineStatus: true,
      approvalStatus: RiderApprovalStatus.APPROVED,
      deletedAt: null,
      jobPreference: { in: ridesJobPreferenceFilter },
      OR: [
        { vehicle: null },
        { vehicle: { vehicleType: requiredVehicleType } },
        { vehicle: { vehicleType: VehicleType.OKADA } },
      ],
      ...(nearbyCandidates && nearbyCandidates.length > 0
        ? { id: { in: nearbyCandidates.map((candidate) => candidate.id) } }
        : {})
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

    if (toApiRideStatus(ride.status) === input.nextStatus) {
      return ride;
    }

    this.validateLifecycle({
      currentStatus: toApiRideStatus(ride.status),
      nextStatus: input.nextStatus,
      actorRole: input.actorRole
    });

    const nextDbStatus = apiToDbRideStatus[input.nextStatus];
    const assignedRider =
      input.nextStatus === "assigned" || (input.nextStatus === "arriving" && !ride.riderId)
        ? await this.findRiderForAssignment(ride, input.riderProfileId)
        : undefined;

    await prisma.$transaction(async (tx) => {
      const updatedRide = await tx.ride.update({
        where: {
          id: rideId
        },
        data: {
          status: nextDbStatus,
          riderId: assignedRider?.id ?? ride.riderId,
          assignedAt: input.nextStatus === "assigned" || (input.nextStatus === "arriving" && !ride.assignedAt) ? new Date() : undefined,
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

      const activeRiderId = assignedRider?.id ?? ride.riderId;
      if (activeRiderId) {
        let nextTripStatus: RiderTripStatus | undefined;
        if (input.nextStatus === "arriving") nextTripStatus = RiderTripStatus.ARRIVING;
        if (input.nextStatus === "arrived") nextTripStatus = RiderTripStatus.ARRIVED;
        if (input.nextStatus === "started") nextTripStatus = RiderTripStatus.ON_TRIP;
        if (input.nextStatus === "completed" || input.nextStatus === "cancelled") nextTripStatus = RiderTripStatus.IDLE;

        if (nextTripStatus) {
          await tx.riderProfile.update({
            where: { id: activeRiderId },
            data: {
              tripStatus: nextTripStatus,
              ...(input.nextStatus === "completed" ? { onlineStatus: true } : {})
            }
          });
        }
      }

      if (input.nextStatus === "cancelled") {
        void dispatchService.cancelDispatch(rideId);
      }

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
          const cashAmountCollected = Number(input.cashCollectedAmount ?? finalAmount);

          await tx.ride.update({
            where: { id: rideId },
            data: {
              cashCollected: cashAmountCollected,
              cashConfirmedByRiderAt: new Date(),
              cashDeclaredAmount: cashAmountCollected,
              commissionLiability: platformCommissionAmount
            }
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.CASH_COLLECTED
            }
          });

          await commissionService.accrueCashTripCommission(tx, {
            rideId,
            riderProfileId: updatedRide.riderId!,
            passengerProfileId: updatedRide.passengerId,
            cashAmountCollected,
            commissionAmount: platformCommissionAmount,
            riderEarnings: riderSettlementAmount,
            currency: updatedRide.currency
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
              description: "Cash trip commission liability owed",
              postedAt: new Date()
            }
          });
        } else if (riderSettlementAmount > 0) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID
            }
          });

          await financeLedgerService.recordEntry(tx, {
            riderId: updatedRide.riderId,
            passengerId: updatedRide.passengerId,
            rideId,
            amount: finalAmount,
            currency: updatedRide.currency,
            type: FinanceLedgerType.TRIP_EARNING,
            direction: LedgerDirection.CREDIT,
            description: `Gross fare for digital trip #${rideId.slice(-6).toUpperCase()}`,
            paymentMethod: updatedRide.paymentMethod,
            referenceId: `DIGITAL-${rideId}`,
            idempotencyKey: `DIGITAL-GROSS-${rideId}`
          });

          if (platformCommissionAmount > 0) {
            await financeLedgerService.recordEntry(tx, {
              riderId: updatedRide.riderId,
              passengerId: updatedRide.passengerId,
              rideId,
              amount: platformCommissionAmount,
              currency: updatedRide.currency,
              type: FinanceLedgerType.OKADAGO_COMMISSION,
              direction: LedgerDirection.DEBIT,
              description: `Platform commission retained on digital trip #${rideId.slice(-6).toUpperCase()}`,
              paymentMethod: updatedRide.paymentMethod,
              referenceId: `COMM-${rideId}`,
              idempotencyKey: `DIGITAL-COMM-${rideId}`
            });
          }

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
              description: "Rider trip net earnings",
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
