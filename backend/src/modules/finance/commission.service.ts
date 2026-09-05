import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  FinanceLedgerType,
  LedgerDirection,
  PaymentMethod,
  WalletType,
  WalletTransactionType,
  WalletTransactionStatus,
  type Prisma
} from "../../generated/prisma/client.js";
import { financeLedgerService } from "./finance-ledger.service.js";
import { roundMoney, toCents, fromCents } from "../pricing/fare.service.js";

export class CommissionService {
  /**
   * Retrieves active finance settings (or default configuration).
   */
  async getSettings() {
    let settings = await prisma.financeSetting.findFirst();
    if (!settings) {
      settings = await prisma.financeSetting.create({
        data: {
          commissionPercentage: 15.0,
          minimumCommission: 1.0,
          cashPaymentEnabled: true,
          digitalPaymentEnabled: true,
          commissionWarningThreshold: 50.0,
          commissionRestrictionThreshold: 150.0,
          minPayoutAmount: 20.0,
          maxPayoutAmountDaily: 2000.0,
          currency: "GHS"
        }
      });
    }
    return settings;
  }

  /**
   * Update platform finance settings with admin audit logging.
   */
  async updateSettings(
    adminUserId: string,
    updates: Partial<{
      commissionPercentage: number;
      minimumCommission: number;
      cashPaymentEnabled: boolean;
      digitalPaymentEnabled: boolean;
      commissionWarningThreshold: number;
      commissionRestrictionThreshold: number;
      minPayoutAmount: number;
      maxPayoutAmountDaily: number;
      currency: string;
      reason?: string;
    }>
  ) {
    const current = await this.getSettings();

    const updated = await prisma.financeSetting.update({
      where: { id: current.id },
      data: {
        commissionPercentage: updates.commissionPercentage != null ? updates.commissionPercentage : undefined,
        minimumCommission: updates.minimumCommission != null ? updates.minimumCommission : undefined,
        cashPaymentEnabled: updates.cashPaymentEnabled != null ? updates.cashPaymentEnabled : undefined,
        digitalPaymentEnabled: updates.digitalPaymentEnabled != null ? updates.digitalPaymentEnabled : undefined,
        commissionWarningThreshold: updates.commissionWarningThreshold != null ? updates.commissionWarningThreshold : undefined,
        commissionRestrictionThreshold: updates.commissionRestrictionThreshold != null ? updates.commissionRestrictionThreshold : undefined,
        minPayoutAmount: updates.minPayoutAmount != null ? updates.minPayoutAmount : undefined,
        maxPayoutAmountDaily: updates.maxPayoutAmountDaily != null ? updates.maxPayoutAmountDaily : undefined,
        currency: updates.currency ?? undefined,
        updatedByUserId: adminUserId
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: "FINANCE_SETTINGS_UPDATED",
        entityType: "FinanceSetting",
        entityId: current.id,
        changes: {
          old: current,
          new: updated,
          reason: updates.reason ?? "Settings adjusted via Admin Console"
        }
      }
    });

    return updated;
  }

  /**
   * Accrues commission liability for a CASH trip.
   * Conforms to Section 3 (CASH PAYMENT LOGIC) and Section 6 (CASH TRIP COMPLETION).
   *
   * Example:
   *   Trip Fare: GH₵ 30.00
   *   OkadaGo Commission: GH₵ 4.50
   *   Rider receives: GH₵ 30.00 in cash
   *   Liability created: GH₵ 4.50 owed by rider to OkadaGo
   */
  async accrueCashTripCommission(
    tx: Prisma.TransactionClient,
    params: {
      rideId: string;
      riderProfileId: string;
      passengerProfileId: string;
      cashAmountCollected: number;
      commissionAmount: number;
      riderEarnings: number;
      currency?: string;
    }
  ) {
    const {
      rideId,
      riderProfileId,
      passengerProfileId,
      cashAmountCollected,
      commissionAmount,
      riderEarnings,
      currency = "GHS"
    } = params;

    const settings = await this.getSettings();
    const warningThreshold = Number(settings.commissionWarningThreshold);
    const restrictionThreshold = Number(settings.commissionRestrictionThreshold);

    // 1. Record CASH_COLLECTION in financial ledger (+Cash to Rider)
    await financeLedgerService.recordEntry(tx, {
      riderId: riderProfileId,
      passengerId: passengerProfileId,
      rideId,
      amount: cashAmountCollected,
      currency,
      type: FinanceLedgerType.CASH_COLLECTION,
      direction: LedgerDirection.CREDIT,
      description: `Cash fare collected from passenger for trip #${rideId.slice(-6).toUpperCase()}`,
      paymentMethod: PaymentMethod.CASH,
      referenceId: `CASH-${rideId}`,
      idempotencyKey: `CASH-COLL-${rideId}`
    });

    // 2. Record OKADAGO_COMMISSION in financial ledger (-Commission liability owed by rider)
    await financeLedgerService.recordEntry(tx, {
      riderId: riderProfileId,
      passengerId: passengerProfileId,
      rideId,
      amount: commissionAmount,
      currency,
      type: FinanceLedgerType.OKADAGO_COMMISSION,
      direction: LedgerDirection.DEBIT,
      description: `Platform commission owed for cash trip #${rideId.slice(-6).toUpperCase()}`,
      paymentMethod: PaymentMethod.CASH,
      referenceId: `COMM-${rideId}`,
      idempotencyKey: `COMM-LIAB-${rideId}`
    });

    // 3. Record TRIP_EARNING in ledger for rider net earnings audit trail
    await financeLedgerService.recordEntry(tx, {
      riderId: riderProfileId,
      passengerId: passengerProfileId,
      rideId,
      amount: riderEarnings,
      currency,
      type: FinanceLedgerType.TRIP_EARNING,
      direction: LedgerDirection.CREDIT,
      description: `Rider net earnings on cash trip #${rideId.slice(-6).toUpperCase()}`,
      paymentMethod: PaymentMethod.CASH,
      referenceId: `EARN-${rideId}`,
      idempotencyKey: `RIDER-EARN-${rideId}`
    });

    // 4. Update RiderProfile balances: increment outstanding commission & total cash collected
    const rider = await tx.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId }
    });

    const currentDebtCents = toCents(Number(rider.outstandingCommission));
    const addCommissionCents = toCents(commissionAmount);
    const newDebt = fromCents(currentDebtCents + addCommissionCents);

    const isRestricted = newDebt >= restrictionThreshold;
    const shouldWarn = newDebt >= warningThreshold && !rider.commissionWarningIssuedAt;

    const updatedRider = await tx.riderProfile.update({
      where: { id: riderProfileId },
      data: {
        outstandingCommission: newDebt,
        totalCashCollected: { increment: cashAmountCollected },
        isCashRestricted: isRestricted,
        cashRestrictedAt: isRestricted ? (rider.cashRestrictedAt ?? new Date()) : null,
        commissionWarningIssuedAt: shouldWarn ? new Date() : rider.commissionWarningIssuedAt
      }
    });

    return {
      newDebt,
      isRestricted,
      updatedRider
    };
  }

  /**
   * Settles rider outstanding commission.
   * Conforms to Section 9 (COMMISSION SETTLEMENT).
   *
   * Supported methods:
   * - "MOBILE_MONEY": payment reference supplied (or initiated via MoMo gateway)
   * - "CARD": card payment
   * - "WALLET_BALANCE": deducts directly from rider's available settlement wallet
   * - "ADMIN_CASH": cash received physically by an authorized admin at a station
   */
  async settleCommission(input: {
    riderProfileId: string;
    amount: number;
    paymentMethod: "MOBILE_MONEY" | "CARD" | "WALLET_BALANCE" | "ADMIN_CASH";
    reference?: string;
    notes?: string;
    adminUserId?: string;
  }) {
    const {
      riderProfileId,
      amount,
      paymentMethod,
      reference = `SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      notes,
      adminUserId
    } = input;

    if (amount <= 0) {
      throw new AppError("Settlement amount must be greater than zero", 400, "INVALID_AMOUNT");
    }

    const rider = await prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId },
      include: { user: true }
    });

    const currentDebt = Number(rider.outstandingCommission);
    if (currentDebt <= 0) {
      throw new AppError("Rider has no outstanding commission balance to settle", 400, "NO_DEBT");
    }

    const settleAmount = Math.min(amount, currentDebt);
    const settings = await this.getSettings();
    const restrictionThreshold = Number(settings.commissionRestrictionThreshold);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If paying with WALLET_BALANCE, verify and deduct from rider's settlement wallet
      if (paymentMethod === "WALLET_BALANCE") {
        const wallet = await tx.wallet.findFirst({
          where: {
            userId: rider.userId,
            type: WalletType.RIDER_SETTLEMENT
          }
        });

        if (!wallet || Number(wallet.availableBalance) < settleAmount) {
          throw new AppError(
            `Insufficient wallet balance to settle commission. Available: GH₵ ${Number(wallet?.availableBalance ?? 0).toFixed(2)}`,
            409,
            "INSUFFICIENT_WALLET_BALANCE"
          );
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: { decrement: settleAmount }
          }
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.COMMISSION,
            status: WalletTransactionStatus.POSTED,
            amount: settleAmount,
            currency: "GHS",
            direction: "debit",
            reference: `COMM-WALLET-DEDUCT-${reference}`,
            description: "Commission debt payment from wallet balance",
            postedAt: new Date()
          }
        });
      }

      // 1. Create CommissionPayment record
      const commissionPayment = await tx.commissionPayment.create({
        data: {
          riderId: riderProfileId,
          amount: settleAmount,
          currency: "GHS",
          paymentMethod,
          status: "SUCCESSFUL",
          reference,
          provider: paymentMethod === "WALLET_BALANCE" ? "wallet" : paymentMethod === "ADMIN_CASH" ? "admin" : "paystack",
          notes: notes ?? (paymentMethod === "ADMIN_CASH" ? "Cash settlement recorded by admin" : "Commission settlement"),
          recordedByAdminId: adminUserId ?? null,
          settledAt: new Date()
        }
      });

      // 2. Record COMMISSION_PAYMENT in Financial Ledger (+Commission Payment to OkadaGo)
      await financeLedgerService.recordEntry(tx, {
        riderId: riderProfileId,
        amount: settleAmount,
        currency: "GHS",
        type: FinanceLedgerType.COMMISSION_PAYMENT,
        direction: LedgerDirection.CREDIT,
        description: `Commission settlement via ${paymentMethod} (Ref: ${reference})`,
        paymentMethod: paymentMethod === "MOBILE_MONEY" ? PaymentMethod.MOBILE_MONEY : paymentMethod === "CARD" ? PaymentMethod.CARD : PaymentMethod.WALLET,
        referenceId: reference,
        idempotencyKey: `COMM-SETTLE-${reference}`,
        createdBy: adminUserId ?? rider.userId
      });

      // 3. Update RiderProfile: reduce outstanding debt and increment totalCommissionPaid
      const remainingDebtCents = Math.max(0, toCents(currentDebt) - toCents(settleAmount));
      const remainingDebt = fromCents(remainingDebtCents);
      const isRestricted = remainingDebt >= restrictionThreshold;

      const updatedRider = await tx.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          outstandingCommission: remainingDebt,
          totalCommissionPaid: { increment: settleAmount },
          isCashRestricted: isRestricted,
          cashRestrictedAt: isRestricted ? rider.cashRestrictedAt : null,
          commissionWarningIssuedAt: remainingDebt >= Number(settings.commissionWarningThreshold) ? rider.commissionWarningIssuedAt : null
        }
      });

      return {
        payment: commissionPayment,
        settledAmount: settleAmount,
        remainingDebt,
        isCashRestricted: isRestricted,
        updatedRider
      };
    });
  }

  /**
   * Manually toggle or set cash trip restriction for a rider.
   */
  async setRiderCashRestriction(
    riderProfileId: string,
    restricted: boolean,
    adminUserId: string,
    reason?: string
  ) {
    const rider = await prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId }
    });

    const updated = await prisma.riderProfile.update({
      where: { id: riderProfileId },
      data: {
        isCashRestricted: restricted,
        cashRestrictedAt: restricted ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: restricted ? "RIDER_CASH_TRIPS_RESTRICTED" : "RIDER_CASH_TRIPS_RESTORED",
        entityType: "RiderProfile",
        entityId: riderProfileId,
        changes: {
          previousState: rider.isCashRestricted,
          newState: restricted,
          reason: reason ?? (restricted ? "Restricted by admin" : "Restriction lifted by admin")
        }
      }
    });

    return updated;
  }

  /**
   * Performs an authorized financial adjustment on a rider's commission or wallet balance.
   */
  async adjustRiderBalance(input: {
    riderProfileId: string;
    amount: number;
    adjustmentType: "WAIVE_COMMISSION" | "ADD_COMMISSION_DEBT" | "CREDIT_EARNINGS" | "DEBIT_EARNINGS";
    reason: string;
    adminUserId: string;
  }) {
    const { riderProfileId, amount, adjustmentType, reason, adminUserId } = input;

    if (!reason || reason.trim().length < 5) {
      throw new AppError("A detailed reason is required for financial adjustments", 400, "REASON_REQUIRED");
    }

    const rider = await prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId },
      include: { user: true }
    });

    const settings = await this.getSettings();
    const restrictionThreshold = Number(settings.commissionRestrictionThreshold);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let ledgerType: FinanceLedgerType = FinanceLedgerType.ADJUSTMENT;
      let ledgerDirection: LedgerDirection = LedgerDirection.CREDIT;

      let newDebt = Number(rider.outstandingCommission);

      if (adjustmentType === "WAIVE_COMMISSION") {
        newDebt = Math.max(0, fromCents(toCents(newDebt) - toCents(amount)));
        ledgerType = FinanceLedgerType.ADJUSTMENT;
        ledgerDirection = LedgerDirection.CREDIT;
      } else if (adjustmentType === "ADD_COMMISSION_DEBT") {
        newDebt = fromCents(toCents(newDebt) + toCents(amount));
        ledgerType = FinanceLedgerType.ADJUSTMENT;
        ledgerDirection = LedgerDirection.DEBIT;
      } else if (adjustmentType === "CREDIT_EARNINGS" || adjustmentType === "DEBIT_EARNINGS") {
        const wallet = await tx.wallet.findFirst({
          where: { userId: rider.userId, type: WalletType.RIDER_SETTLEMENT }
        });
        if (wallet) {
          if (adjustmentType === "CREDIT_EARNINGS") {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { availableBalance: { increment: amount } }
            });
            ledgerDirection = LedgerDirection.CREDIT;
          } else {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { availableBalance: { decrement: amount } }
            });
            ledgerDirection = LedgerDirection.DEBIT;
          }
        }
      }

      const isRestricted = newDebt >= restrictionThreshold;

      const updatedRider = await tx.riderProfile.update({
        where: { id: riderProfileId },
        data: {
          outstandingCommission: newDebt,
          isCashRestricted: isRestricted,
          cashRestrictedAt: isRestricted ? (rider.cashRestrictedAt ?? new Date()) : null
        }
      });

      const entry = await financeLedgerService.recordEntry(tx, {
        riderId: riderProfileId,
        amount,
        currency: "GHS",
        type: ledgerType,
        direction: ledgerDirection,
        description: `Admin adjustment (${adjustmentType}): ${reason}`,
        createdBy: adminUserId,
        metadata: { adjustmentType, reason, adminUserId }
      });

      const adjustment = await tx.financeAdjustment.create({
        data: {
          riderId: riderProfileId,
          amount,
          adjustmentType,
          reason,
          authorizedByUserId: adminUserId,
          ledgerEntryId: entry.transactionId
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "FINANCE_ADJUSTMENT_EXECUTED",
          entityType: "RiderProfile",
          entityId: riderProfileId,
          changes: {
            adjustmentType,
            amount,
            previousDebt: rider.outstandingCommission,
            newDebt,
            reason
          }
        }
      });

      return {
        adjustment,
        updatedRider,
        ledgerEntry: entry
      };
    });
  }

  /**
   * Retrieves complete financial profile for a rider conforming to Section 4 and Section 15.
   *
   * Displays all 8 key metrics:
   * 1. AVAILABLE EARNINGS (digital earnings available)
   * 2. CASH COLLECTED (total cash collected)
   * 3. DIGITAL EARNINGS (digital fare volume)
   * 4. OKADAGO COMMISSION (total commission generated)
   * 5. COMMISSION PAID (total commission paid)
   * 6. OUTSTANDING COMMISSION (commission currently owed)
   * 7. TOTAL EARNINGS (net total earnings across cash + digital)
   * 8. WITHDRAWABLE BALANCE (max(0, availableEarnings - outstandingCommission))
   */
  async getRiderFinanceProfile(riderProfileId: string) {
    const rider = await prisma.riderProfile.findUniqueOrThrow({
      where: { id: riderProfileId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneE164: true,
            avatarUrl: true,
            accountStatus: true
          }
        }
      }
    });

    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: rider.userId,
        type: WalletType.RIDER_SETTLEMENT
      }
    });

    // Aggregate digital trips
    const digitalTripAgg = await prisma.ride.aggregate({
      where: {
        riderId: riderProfileId,
        status: "COMPLETED",
        paymentMethod: { not: PaymentMethod.CASH }
      },
      _sum: {
        finalFare: true,
        riderEarnings: true,
        platformCommission: true
      }
    });

    // Aggregate cash trips
    const cashTripAgg = await prisma.ride.aggregate({
      where: {
        riderId: riderProfileId,
        status: "COMPLETED",
        paymentMethod: PaymentMethod.CASH
      },
      _sum: {
        finalFare: true,
        riderEarnings: true,
        platformCommission: true
      },
      _count: { _all: true }
    });

    // Aggregate payouts
    const payoutAgg = await prisma.payoutRequest.aggregate({
      where: {
        riderId: riderProfileId,
        status: "PAID"
      },
      _sum: { amount: true }
    });

    // Recent ledger entries
    const ledgerEntries = await prisma.financeLedgerEntry.findMany({
      where: { riderId: riderProfileId },
      orderBy: { createdAt: "desc" },
      take: 40
    });

    // Recent commission payments
    const commissionPayments = await prisma.commissionPayment.findMany({
      where: { riderId: riderProfileId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const settings = await this.getSettings();

    const availableDigitalEarnings = Number(wallet?.availableBalance ?? 0);
    const cashCollected = Number(rider.totalCashCollected);
    const digitalEarnings = Number(digitalTripAgg._sum.riderEarnings ?? 0);
    const commissionGeneratedFromCash = Number(cashTripAgg._sum.platformCommission ?? 0);
    const commissionGeneratedFromDigital = Number(digitalTripAgg._sum.platformCommission ?? 0);
    const totalCommissionGenerated = roundMoney(commissionGeneratedFromCash + commissionGeneratedFromDigital);
    const commissionPaid = Number(rider.totalCommissionPaid);
    const outstandingCommission = Number(rider.outstandingCommission);
    const totalNetEarnings = roundMoney(Number(cashTripAgg._sum.riderEarnings ?? 0) + digitalEarnings);
    const totalPayouts = Number(payoutAgg._sum.amount ?? 0);

    // Business rule: Never allow a rider to withdraw money committed to outstanding commission
    const withdrawableBalance = Math.max(0, roundMoney(availableDigitalEarnings - outstandingCommission));

    return {
      rider: {
        id: rider.id,
        userId: rider.userId,
        fullName: rider.user.fullName,
        email: rider.user.email,
        phone: rider.user.phoneE164,
        avatarUrl: rider.user.avatarUrl,
        displayCode: rider.displayCode,
        accountStatus: rider.user.accountStatus,
        onlineStatus: rider.onlineStatus,
        isCashRestricted: rider.isCashRestricted,
        cashRestrictedAt: rider.cashRestrictedAt,
        commissionPercent: Number(rider.commissionPercent)
      },
      metrics: {
        availableEarnings: availableDigitalEarnings,
        cashCollected,
        digitalEarnings,
        commissionGenerated: totalCommissionGenerated,
        commissionPaid,
        outstandingCommission,
        totalEarnings: totalNetEarnings,
        withdrawableBalance,
        totalPayouts,
        cashTripsCount: cashTripAgg._count._all
      },
      thresholds: {
        warning: Number(settings.commissionWarningThreshold),
        restriction: Number(settings.commissionRestrictionThreshold)
      },
      ledgerEntries,
      commissionPayments
    };
  }
}

export const commissionService = new CommissionService();
