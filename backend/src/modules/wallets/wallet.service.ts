import { AppError } from "../../common/errors.js";
import { makeWalletReference } from "../../common/codes.js";
import { appConfig } from "../../common/config.js";
import { prisma } from "../../common/prisma.js";
import {
  PayoutMethod,
  PayoutStatus,
  RiderApprovalStatus,
  UserRole,
  WalletTransactionStatus,
  WalletTransactionType,
  WalletType
} from "../../generated/prisma/enums.js";
import type { z } from "zod";
import {
  riderPayoutRequestSchema,
  payoutEligibilitySchema,
  settlementPreviewSchema,
  walletPaystackInitializeSchema,
  walletTopUpSchema
} from "./wallet.schemas.js";

type SettlementPreviewInput = z.infer<typeof settlementPreviewSchema>;
type PayoutEligibilityInput = z.infer<typeof payoutEligibilitySchema>;
type RiderPayoutRequestInput = z.infer<typeof riderPayoutRequestSchema>;
type WalletTopUpInput = z.infer<typeof walletTopUpSchema>;
type WalletPaystackInitializeInput = z.infer<typeof walletPaystackInitializeSchema>;

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
  };
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const minimumRiderPayoutAmount = 20;
const pendingPayoutStatuses = [
  PayoutStatus.REQUESTED,
  PayoutStatus.REVIEWING,
  PayoutStatus.APPROVED,
  PayoutStatus.PROCESSING
];

function toSubunit(amount: number) {
  return Math.round(amount * 100);
}

function buildWalletRedirectUrl(
  pathname: string,
  status: "success" | "failed",
  reference: string,
  message?: string
) {
  const url = new URL(pathname, appConfig.appWebUrl);
  url.searchParams.set("topup", status);
  url.searchParams.set("reference", reference);

  if (message) {
    url.searchParams.set("message", message);
  }

  return url.toString();
}

export class WalletService {
  private async getCurrentRiderSession(token: string) {
    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: {
          include: {
            riderProfile: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    if (session.user.role !== UserRole.RIDER || !session.user.riderProfile) {
      throw new AppError("Rider access is required", 403, "RIDER_ACCESS_REQUIRED");
    }

    return session;
  }

  async listUserWallets(userId: string) {
    return prisma.wallet.findMany({
      where: {
        userId
      },
      orderBy: [
        {
          currency: "asc"
        },
        {
          type: "asc"
        }
      ]
    });
  }

  async listUserWalletTransactions(userId: string) {
    return prisma.walletTransaction.findMany({
      where: {
        wallet: {
          userId
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30,
      include: {
        wallet: true,
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            destinationAddress: true
          }
        },
        payment: {
          select: {
            id: true,
            method: true,
            status: true,
            provider: true
          }
        }
      }
    });
  }

  previewSettlement(input: SettlementPreviewInput) {
    const commission = input.totalFare * (input.platformCommissionPercent / 100);
    const riderGross = input.totalFare - commission;
    const riderNet = riderGross - input.gatewayFee + input.riderBonus - input.refundAmount;

    return {
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      lineItems: [
        { label: "Trip fare", amount: roundMoney(input.totalFare) },
        { label: "Platform commission", amount: roundMoney(-commission) },
        { label: "Gateway fee", amount: roundMoney(-input.gatewayFee) },
        { label: "Rider bonus", amount: roundMoney(input.riderBonus) },
        { label: "Refund adjustment", amount: roundMoney(-input.refundAmount) }
      ],
      riderNetSettlement: roundMoney(riderNet),
      platformNetRevenue: roundMoney(commission - input.gatewayFee)
    };
  }

  validatePayoutEligibility(input: PayoutEligibilityInput) {
    if (input.hasPendingComplianceIssue) {
      throw new AppError(
        "Payout is blocked because the rider has an unresolved compliance issue",
        409,
        "PAYOUT_BLOCKED_COMPLIANCE"
      );
    }

    if (input.hasPendingPayout) {
      throw new AppError(
        "Payout is blocked because another payout is already in flight",
        409,
        "PAYOUT_ALREADY_PENDING"
      );
    }

    if (input.requestedAmount < input.minimumPayoutAmount) {
      throw new AppError(
        "Requested payout is below the minimum payout amount",
        409,
        "PAYOUT_BELOW_MINIMUM"
      );
    }

    if (input.requestedAmount > input.availableBalance) {
      throw new AppError(
        "Requested payout exceeds available balance",
        409,
        "PAYOUT_EXCEEDS_BALANCE"
      );
    }

    return {
      eligible: true,
      availableBalance: input.availableBalance,
      requestedAmount: input.requestedAmount,
      remainingBalance: roundMoney(input.availableBalance - input.requestedAmount)
    };
  }

  async listCurrentRiderPayoutRequests(token: string) {
    const session = await this.getCurrentRiderSession(token);

    return prisma.payoutRequest.findMany({
      where: {
        riderId: session.user.riderProfile!.id
      },
      orderBy: {
        requestedAt: "desc"
      },
      take: 12,
      select: {
        id: true,
        method: true,
        status: true,
        amount: true,
        currency: true,
        destinationLabel: true,
        rejectionReason: true,
        requestedAt: true,
        reviewedAt: true,
        paidAt: true
      }
    });
  }

  async createCurrentRiderPayoutRequest(token: string, input: RiderPayoutRequestInput) {
    const session = await this.getCurrentRiderSession(token);
    const riderProfile = session.user.riderProfile!;
    const hasPendingComplianceIssue = riderProfile.approvalStatus !== RiderApprovalStatus.APPROVED;

    const settlementWallet = await prisma.wallet.findFirst({
      where: {
        userId: session.user.id,
        type: WalletType.RIDER_SETTLEMENT,
        isActive: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!settlementWallet) {
      throw new AppError(
        "No rider settlement wallet is available yet.",
        409,
        "RIDER_SETTLEMENT_WALLET_MISSING"
      );
    }

    const hasPendingPayout = Boolean(
      await prisma.payoutRequest.findFirst({
        where: {
          riderId: riderProfile.id,
          status: {
            in: pendingPayoutStatuses
          }
        },
        select: {
          id: true
        }
      })
    );

    this.validatePayoutEligibility({
      availableBalance: Number(settlementWallet.availableBalance),
      requestedAmount: input.amount,
      minimumPayoutAmount: minimumRiderPayoutAmount,
      hasPendingComplianceIssue,
      hasPendingPayout
    });

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          id: settlementWallet.id
        }
      });

      if (!wallet) {
        throw new AppError("Settlement wallet could not be found.", 404, "WALLET_NOT_FOUND");
      }

      if (Number(wallet.availableBalance) < input.amount) {
        throw new AppError(
          "Requested payout exceeds available balance",
          409,
          "PAYOUT_EXCEEDS_BALANCE"
        );
      }

      const payoutRequest = await tx.payoutRequest.create({
        data: {
          riderId: riderProfile.id,
          walletId: wallet.id,
          method:
            input.method === "BANK_ACCOUNT"
              ? PayoutMethod.BANK_ACCOUNT
              : PayoutMethod.MOBILE_MONEY,
          status: PayoutStatus.REQUESTED,
          amount: input.amount,
          currency: wallet.currency,
          destinationLabel: input.destinationLabel,
          metadata: {
            createdFrom: "rider_web"
          }
        },
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          currency: true,
          destinationLabel: true,
          requestedAt: true,
          reviewedAt: true,
          paidAt: true,
          rejectionReason: true
        }
      });

      await tx.wallet.update({
        where: {
          id: wallet.id
        },
        data: {
          availableBalance: {
            decrement: input.amount
          },
          lockedBalance: {
            increment: input.amount
          }
        }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          payoutRequestId: payoutRequest.id,
          type: WalletTransactionType.WITHDRAWAL,
          status: WalletTransactionStatus.PENDING,
          amount: input.amount,
          currency: wallet.currency,
          direction: "debit",
          reference: makeWalletReference("PAYOUT"),
          description: `Rider payout request to ${input.destinationLabel}`
        }
      });

      return {
        payoutRequest,
        remainingBalance: roundMoney(Number(wallet.availableBalance) - input.amount),
        minimumPayoutAmount: minimumRiderPayoutAmount
      };
    });

    return result;
  }

  async topUpWallet(input: WalletTopUpInput) {
    return prisma.$transaction(async (tx) => {
      const walletType =
        input.walletType === "promo_credit"
          ? WalletType.PROMO_CREDIT
          : input.walletType === "rider_settlement"
            ? WalletType.RIDER_SETTLEMENT
            : WalletType.PASSENGER_CASHLESS;

      const wallet = await tx.wallet.upsert({
        where: {
          userId_type_currency: {
            userId: input.userId,
            type: walletType,
            currency: input.currency
          }
        },
        update: {
          availableBalance: {
            increment: input.amount
          }
        },
        create: {
          userId: input.userId,
          type: walletType,
          currency: input.currency,
          availableBalance: input.amount
        }
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.TOP_UP,
          status: WalletTransactionStatus.POSTED,
          amount: input.amount,
          currency: input.currency,
          direction: "credit",
          reference: makeWalletReference("TOPUP"),
          description: input.description ?? "Wallet top-up",
          postedAt: new Date()
        }
      });

      return {
        wallet,
        transaction
      };
    });
  }

  async initializePaystackTopUp(token: string, input: WalletPaystackInitializeInput) {
    if (!appConfig.paystackSecretKey) {
      throw new AppError(
        "Paystack is not configured yet. Add PAYSTACK_SECRET_KEY to the backend environment first.",
        503,
        "PAYSTACK_NOT_CONFIGURED"
      );
    }

    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenId: token
      },
      include: {
        user: {
          include: {
            passengerProfile: true,
            riderProfile: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError("Session is invalid or expired", 401, "SESSION_INVALID");
    }

    const isRiderSettlementTopUp = input.walletType === "rider_settlement";

    if (isRiderSettlementTopUp) {
      if (session.user.role !== UserRole.RIDER || !session.user.riderProfile) {
        throw new AppError("Rider access is required", 403, "RIDER_ACCESS_REQUIRED");
      }
    } else if (session.user.role !== UserRole.PASSENGER || !session.user.passengerProfile) {
      throw new AppError("Passenger access is required", 403, "PASSENGER_ACCESS_REQUIRED");
    }

    const walletType =
      input.walletType === "promo_credit"
        ? WalletType.PROMO_CREDIT
        : input.walletType === "rider_settlement"
          ? WalletType.RIDER_SETTLEMENT
          : WalletType.PASSENGER_CASHLESS;
    const currency = input.currency ?? (session.user.preferredCurrency as "GHS" | "NGN");
    const reference = makeWalletReference("PSTK");

    const wallet = await prisma.wallet.upsert({
      where: {
        userId_type_currency: {
          userId: session.user.id,
          type: walletType,
          currency
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        type: walletType,
        currency
      }
    });

    await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.TOP_UP,
          status: WalletTransactionStatus.PENDING,
          amount: input.amount,
          currency,
          direction: "credit",
          reference,
          description:
            input.description ??
            (isRiderSettlementTopUp
              ? "Paystack rider settlement top-up pending"
              : "Paystack wallet top-up pending")
        }
      });

    const customerEmail =
      session.user.email?.trim() || `passenger+${session.user.id}@okadago.local`;

    const paystackResponse = await fetch(`${appConfig.paystackBaseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appConfig.paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: String(toSubunit(input.amount)),
        currency,
        reference,
        callback_url: `${appConfig.apiPublicUrl}/v1/wallets/top-up/paystack/callback`,
        metadata: JSON.stringify({
          userId: session.user.id,
          walletId: wallet.id,
          walletTransactionReference: reference,
          walletType: input.walletType
        })
      })
    });

    if (!paystackResponse.ok) {
      const message = await paystackResponse.text();
      await prisma.walletTransaction.update({
        where: {
          reference
        },
        data: {
          status: WalletTransactionStatus.FAILED,
          description: input.description ?? "Paystack wallet top-up initialization failed"
        }
      });

      throw new AppError(
        message || "Unable to initialize Paystack payment",
        502,
        "PAYSTACK_INITIALIZE_FAILED"
      );
    }

    const payload = (await paystackResponse.json()) as PaystackInitializeResponse;

    if (!payload.status || !payload.data.authorization_url) {
      throw new AppError(
        payload.message || "Unable to initialize Paystack payment",
        502,
        "PAYSTACK_INITIALIZE_FAILED"
      );
    }

    return {
      reference,
      authorizationUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code
    };
  }

  async handlePaystackTopUpCallback(reference: string) {
    if (!appConfig.paystackSecretKey) {
      return buildWalletRedirectUrl(
        "/passenger/wallet",
        "failed",
        reference,
        "Paystack is not configured on the backend."
      );
    }

    const transaction = await prisma.walletTransaction.findUnique({
      where: {
        reference
      },
      include: {
        wallet: {
          include: {
            user: true
          }
        }
      }
    });

    const redirectPath =
      transaction?.wallet.user.role === UserRole.RIDER ? "/rider/earnings" : "/passenger/wallet";

    if (!transaction || transaction.type !== WalletTransactionType.TOP_UP) {
      return buildWalletRedirectUrl(redirectPath, "failed", reference, "Top-up reference was not found.");
    }

    if (transaction.status === WalletTransactionStatus.POSTED) {
      return buildWalletRedirectUrl(redirectPath, "success", reference);
    }

    const verifyResponse = await fetch(
      `${appConfig.paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${appConfig.paystackSecretKey}`
        }
      }
    );

    if (!verifyResponse.ok) {
      await prisma.walletTransaction.update({
        where: {
          reference
        },
        data: {
          status: WalletTransactionStatus.FAILED
        }
      });

      return buildWalletRedirectUrl(redirectPath, "failed", reference, "Unable to verify the payment.");
    }

    const payload = (await verifyResponse.json()) as PaystackVerifyResponse;
    const expectedAmount = toSubunit(Number(transaction.amount));

    if (!payload.status || payload.data.status !== "success") {
      await prisma.walletTransaction.update({
        where: {
          reference
        },
        data: {
          status: WalletTransactionStatus.FAILED
        }
      });

      return buildWalletRedirectUrl(redirectPath, "failed", reference, "The payment was not completed.");
    }

    if (payload.data.amount !== expectedAmount || payload.data.currency !== transaction.currency) {
      await prisma.walletTransaction.update({
        where: {
          reference
        },
        data: {
          status: WalletTransactionStatus.FAILED
        }
      });

      return buildWalletRedirectUrl(
        redirectPath,
        "failed",
        reference,
        "Payment verification did not match the expected amount."
      );
    }

    await prisma.$transaction(async (tx) => {
      const latestTransaction = await tx.walletTransaction.findUnique({
        where: {
          reference
        }
      });

      if (!latestTransaction || latestTransaction.status === WalletTransactionStatus.POSTED) {
        return;
      }

      await tx.wallet.update({
        where: {
          id: transaction.walletId
        },
        data: {
          availableBalance: {
            increment: transaction.amount
          }
        }
      });

      await tx.walletTransaction.update({
        where: {
          reference
        },
        data: {
          status: WalletTransactionStatus.POSTED,
          postedAt: new Date(),
          description: "Paystack wallet top-up completed"
        }
      });
    });

    return buildWalletRedirectUrl(redirectPath, "success", reference);
  }
}
