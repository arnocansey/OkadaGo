import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";
import {
  PaymentDisputeType,
  PaymentDisputeStatus,
  FinanceLedgerType,
  LedgerDirection,
  type Prisma
} from "../../generated/prisma/client.js";
import { financeLedgerService } from "./finance-ledger.service.js";

export class PaymentDisputeService {
  /**
   * Files a payment dispute from passenger, rider, or ops.
   * Conforms to Section 7 and Section 19.
   *
   * Note: Filing a dispute does NOT automatically remove the rider's commission liability.
   * It flags the transaction for admin review.
   */
  async fileDispute(params: {
    rideId: string;
    reporterUserId: string;
    disputeType: PaymentDisputeType;
    amountDisputed?: number;
    description: string;
    evidence?: Record<string, unknown>;
  }) {
    const { rideId, reporterUserId, disputeType, amountDisputed, description, evidence } = params;

    const ride = await prisma.ride.findUniqueOrThrow({
      where: { id: rideId },
      include: {
        rider: true,
        passenger: true
      }
    });

    const dispute = await prisma.paymentDispute.create({
      data: {
        rideId,
        reporterUserId,
        riderId: ride.riderId,
        passengerId: ride.passengerId,
        disputeType,
        amountDisputed: amountDisputed ?? ride.finalFare ?? ride.estimatedFare ?? null,
        status: PaymentDisputeStatus.OPEN,
        description,
        evidence: evidence ? (evidence as Prisma.InputJsonValue) : undefined
      },
      include: {
        ride: true,
        reporter: {
          select: { fullName: true, phoneE164: true, role: true }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: reporterUserId,
        action: "PAYMENT_DISPUTE_FILED",
        entityType: "PaymentDispute",
        entityId: dispute.id,
        changes: {
          rideId,
          disputeType,
          amountDisputed,
          description
        }
      }
    });

    return dispute;
  }

  /**
   * Lists payment disputes with filtering.
   */
  async listDisputes(filters: {
    status?: PaymentDisputeStatus;
    disputeType?: PaymentDisputeType;
    riderId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.PaymentDisputeWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.disputeType) where.disputeType = filters.disputeType;
    if (filters.riderId) where.riderId = filters.riderId;

    const [disputes, total] = await Promise.all([
      prisma.paymentDispute.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
        include: {
          ride: {
            select: {
              id: true,
              pickupAddress: true,
              destinationAddress: true,
              paymentMethod: true,
              finalFare: true,
              estimatedFare: true,
              commissionLiability: true,
              cashCollected: true,
              status: true
            }
          },
          reporter: {
            select: { id: true, fullName: true, phoneE164: true, role: true }
          },
          rider: {
            include: {
              user: { select: { fullName: true, phoneE164: true } }
            }
          },
          passenger: {
            include: {
              user: { select: { fullName: true, phoneE164: true } }
            }
          }
        }
      }),
      prisma.paymentDispute.count({ where })
    ]);

    return { disputes, total };
  }

  /**
   * Resolves a payment dispute with audit trail and optional financial corrections.
   */
  async resolveDispute(
    disputeId: string,
    adminUserId: string,
    resolution: {
      status: PaymentDisputeStatus;
      resolutionNotes: string;
      waiveCommission?: boolean;
      refundAmount?: number;
    }
  ) {
    const dispute = await prisma.paymentDispute.findUniqueOrThrow({
      where: { id: disputeId },
      include: { ride: true, rider: true }
    });

    if (dispute.status === PaymentDisputeStatus.RESOLVED || dispute.status === PaymentDisputeStatus.REJECTED) {
      throw new AppError("Dispute has already been finalized", 409, "DISPUTE_FINALIZED");
    }

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If commission is waived for a cash ride, reduce the rider's commission liability
      if (resolution.waiveCommission && dispute.riderId && dispute.ride.commissionLiability) {
        const commLiability = Number(dispute.ride.commissionLiability);
        await tx.riderProfile.update({
          where: { id: dispute.riderId },
          data: {
            outstandingCommission: { decrement: commLiability }
          }
        });

        await financeLedgerService.recordEntry(tx, {
          riderId: dispute.riderId,
          rideId: dispute.rideId,
          amount: commLiability,
          currency: "GHS",
          type: FinanceLedgerType.ADJUSTMENT,
          direction: LedgerDirection.CREDIT,
          description: `Commission waived via dispute resolution #${dispute.id.slice(-6)}: ${resolution.resolutionNotes}`,
          createdBy: adminUserId,
          metadata: { disputeId, reason: resolution.resolutionNotes }
        });
      }

      // If refund is issued
      if (resolution.refundAmount && resolution.refundAmount > 0) {
        await financeLedgerService.recordEntry(tx, {
          passengerId: dispute.passengerId,
          rideId: dispute.rideId,
          amount: resolution.refundAmount,
          currency: "GHS",
          type: FinanceLedgerType.REFUND,
          direction: LedgerDirection.CREDIT,
          description: `Refund issued via dispute #${dispute.id.slice(-6)}: ${resolution.resolutionNotes}`,
          createdBy: adminUserId,
          metadata: { disputeId, reason: resolution.resolutionNotes }
        });
      }

      const updatedDispute = await tx.paymentDispute.update({
        where: { id: disputeId },
        data: {
          status: resolution.status,
          resolutionNotes: resolution.resolutionNotes,
          resolvedByUserId: adminUserId,
          resolvedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "PAYMENT_DISPUTE_RESOLVED",
          entityType: "PaymentDispute",
          entityId: disputeId,
          changes: {
            disputeId,
            status: resolution.status,
            resolutionNotes: resolution.resolutionNotes,
            waiveCommission: resolution.waiveCommission,
            refundAmount: resolution.refundAmount
          }
        }
      });

      return updatedDispute;
    });
  }
}

export const paymentDisputeService = new PaymentDisputeService();
