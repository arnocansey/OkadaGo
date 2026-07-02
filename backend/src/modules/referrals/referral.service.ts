import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import {
  WalletTransactionStatus,
  WalletTransactionType,
  WalletType
} from "../../generated/prisma/enums.js";
import type { applyReferralCodeSchema, referralQuerySchema } from "./referral.schemas.js";
import type { z } from "zod";

type ApplyReferralInput = z.infer<typeof applyReferralCodeSchema>;
type ReferralQuery = z.infer<typeof referralQuerySchema>;

const REFERRAL_REWARD_AMOUNT = 5;

export class ReferralService {
  private async getActiveSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenId: token },
      include: {
        user: {
          include: { passengerProfile: true },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    return session;
  }

  async applyReferralCode(token: string, input: ApplyReferralInput) {
    const session = await this.getActiveSession(token);

    if (!session.user.passengerProfile) {
      throw new AppError("Passenger profile required", 409, "PASSENGER_PROFILE_REQUIRED");
    }

    const existing = await prisma.referral.findUnique({
      where: { refereeUserId: session.userId },
    });

    if (existing) {
      throw new AppError("Referral code already applied", 409, "REFERRAL_ALREADY_APPLIED");
    }

    const referrerProfile = await prisma.passengerProfile.findFirst({
      where: {
        referralCode: input.referralCode.toUpperCase(),
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!referrerProfile) {
      throw new AppError("Referral code not found", 404, "REFERRAL_NOT_FOUND");
    }

    if (referrerProfile.userId === session.userId) {
      throw new AppError("You cannot use your own referral code", 409, "REFERRAL_SELF_USE");
    }

    const referral = await prisma.referral.create({
      data: {
        referrerUserId: referrerProfile.userId,
        refereeUserId: session.userId,
        codeUsed: referrerProfile.referralCode,
        rewardAmount: REFERRAL_REWARD_AMOUNT,
        rewardCurrency: session.user.preferredCurrency,
      },
    });

    return {
      id: referral.id,
      codeUsed: referral.codeUsed,
      rewardAmount: Number(referral.rewardAmount),
      rewardCurrency: referral.rewardCurrency,
      message: "Referral applied. Reward releases after your first completed ride.",
    };
  }

  async settleReferralForCompletedRide(rideId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { passenger: { include: { user: true } } },
    });

    if (!ride || ride.status !== "COMPLETED") {
      return null;
    }

    const referral = await prisma.referral.findUnique({
      where: { refereeUserId: ride.passenger.userId },
    });

    if (!referral || referral.rewardReleasedAt || referral.firstRideId) {
      return referral;
    }

    const rewardAmount = Number(referral.rewardAmount ?? REFERRAL_REWARD_AMOUNT);
    const currency = referral.rewardCurrency ?? ride.currency;

    await prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          firstRideId: ride.id,
          rewardReleasedAt: new Date(),
        },
      });

      for (const userId of [referral.referrerUserId, referral.refereeUserId]) {
        await tx.wallet.upsert({
          where: {
            userId_type_currency: {
              userId,
              type: WalletType.PROMO_CREDIT,
              currency,
            },
          },
          update: {
            availableBalance: { increment: rewardAmount },
          },
          create: {
            userId,
            type: WalletType.PROMO_CREDIT,
            currency,
            availableBalance: rewardAmount,
          },
        });

        const wallet = await tx.wallet.findUniqueOrThrow({
          where: {
            userId_type_currency: {
              userId,
              type: WalletType.PROMO_CREDIT,
              currency,
            },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.BONUS,
            status: WalletTransactionStatus.POSTED,
            amount: rewardAmount,
            currency,
            direction: "credit",
            reference: `REFERRAL-REWARD-${ride.id}`,
            description: `Referral reward for ride ${ride.id}`,
            postedAt: new Date(),
          },
        });
      }
    });

    return referral;
  }

  async listMyReferrals(token: string, query: ReferralQuery) {
    const session = await this.getActiveSession(token);

    const [sent, received] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerUserId: session.userId },
        orderBy: { createdAt: "desc" },
        take: query.limit,
      }),
      prisma.referral.findUnique({
        where: { refereeUserId: session.userId },
      }),
    ]);

    return { sent, received };
  }
}

export const referralService = new ReferralService();
