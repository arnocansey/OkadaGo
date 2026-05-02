import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import { RideStatus, UserRole } from "../../generated/prisma/enums.js";
import type { z } from "zod";
import { adminRatingsQuerySchema, createRideRatingSchema } from "./rating.schemas.js";

type CreateRideRatingInput = z.infer<typeof createRideRatingSchema>;
type AdminRatingsQuery = z.infer<typeof adminRatingsQuerySchema>;

export class RatingService {
  private async getCurrentPassengerSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: {
          include: {
            passengerProfile: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (session.user.role !== UserRole.PASSENGER || !session.user.passengerProfile) {
      throw new AppError("Passenger access is required", 403, "PASSENGER_ACCESS_REQUIRED");
    }

    return session;
  }

  private async getCurrentAdminSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: true
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (session.user.role !== UserRole.ADMIN) {
      throw new AppError("Admin access is required", 403, "ADMIN_ACCESS_REQUIRED");
    }

    return session;
  }

  async createCurrentPassengerRideRating(token: string, rideId: string, input: CreateRideRatingInput) {
    const session = await this.getCurrentPassengerSession(token);

    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId
      },
      include: {
        passenger: {
          include: {
            user: true
          }
        },
        rider: {
          include: {
            user: true
          }
        }
      }
    });

    if (!ride) {
      throw new AppError("Ride could not be found.", 404, "RIDE_NOT_FOUND");
    }

    if (ride.passenger.userId !== session.user.passengerProfile!.userId) {
      throw new AppError("You can only rate your own rides.", 403, "RATING_FORBIDDEN");
    }

    if (!ride.rider || !ride.rider.userId) {
      throw new AppError("This ride has no assigned rider to rate.", 409, "RATED_USER_MISSING");
    }

    if (ride.status !== RideStatus.COMPLETED) {
      throw new AppError("You can only rate completed rides.", 409, "RIDE_NOT_COMPLETED");
    }

    const result = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.upsert({
        where: {
          rideId_raterUserId_ratedUserId: {
            rideId: ride.id,
            raterUserId: session.user.id,
            ratedUserId: ride.rider!.userId
          }
        },
        update: {
          score: input.score,
          category: input.category?.trim() || null
        },
        create: {
          rideId: ride.id,
          raterUserId: session.user.id,
          ratedUserId: ride.rider!.userId,
          score: input.score,
          category: input.category?.trim() || null
        }
      });

      const reviewText = input.review?.trim();
      if (reviewText) {
        await tx.review.upsert({
          where: {
            ratingId: rating.id
          },
          update: {
            body: reviewText
          },
          create: {
            ratingId: rating.id,
            rideId: ride.id,
            authorId: session.user.id,
            body: reviewText
          }
        });
      }

      const aggregate = await tx.rating.aggregate({
        where: {
          ratedUserId: ride.rider!.userId
        },
        _avg: {
          score: true
        },
        _count: {
          score: true
        }
      });

      await tx.riderProfile.update({
        where: {
          id: ride.rider!.id
        },
        data: {
          ratingAverage: aggregate._avg.score ?? 0
        }
      });

      return {
        rating,
        riderAverageScore: aggregate._avg.score ?? 0,
        riderTotalRatings: aggregate._count.score
      };
    });

    return result;
  }

  async listAdminRatings(token: string, query: AdminRatingsQuery) {
    await this.getCurrentAdminSession(token);

    const fromDate = query.fromDate ? new Date(`${query.fromDate}T00:00:00.000Z`) : null;
    const toDate = query.toDate ? new Date(`${query.toDate}T23:59:59.999Z`) : null;

    return prisma.rating.findMany({
      where: {
        rated: {
          riderProfile: query.riderId
            ? {
                id: query.riderId
              }
            : undefined
        },
        rideId: query.rideId,
        createdAt:
          fromDate || toDate
            ? {
                gte: fromDate ?? undefined,
                lte: toDate ?? undefined
              }
            : undefined
      },
      include: {
        ride: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true,
            pickupAddress: true,
            destinationAddress: true
          }
        },
        rater: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true
          }
        },
        rated: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
            riderProfile: {
              select: {
                id: true,
                displayCode: true
              }
            }
          }
        },
        review: {
          select: {
            id: true,
            body: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
}
