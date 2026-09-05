import { prisma } from "../../common/prisma.js";
import { PaymentMethod, PaymentStatus } from "../../generated/prisma/client.js";
import { toCents, fromCents } from "../pricing/fare.service.js";

export interface ReconciliationReport {
  summary: {
    totalTripsChecked: number;
    matchedTrips: number;
    unmatchedTrips: number;
    paymentMismatches: number;
    commissionMismatches: number;
    cashDiscrepancies: number;
    totalAuditedVolumeGhs: number;
  };
  mismatches: Array<{
    rideId: string;
    tripDate: Date;
    riderId: string | null;
    riderName?: string;
    passengerName?: string;
    paymentMethod: string;
    passengerFare: number;
    riderEarnings: number;
    commission: number;
    cashCollected: number | null;
    mismatchType: "PAYMENT_MISMATCH" | "COMMISSION_MISMATCH" | "CASH_DISCREPANCY" | "UNMATCHED_PAYMENT";
    details: string;
  }>;
}

export class ReconciliationService {
  /**
   * Run automated reconciliation for completed trips within an optional date range.
   * Conforms to Section 17 (COMMISSION RECONCILIATION).
   *
   * Verifies: Passenger Fare == Rider Earnings + OkadaGo Commission
   */
  async runReconciliation(opts?: { from?: Date; to?: Date; limit?: number }): Promise<ReconciliationReport> {
    const where: any = {
      status: "COMPLETED"
    };

    if (opts?.from || opts?.to) {
      where.completedAt = {};
      if (opts.from) where.completedAt.gte = opts.from;
      if (opts.to) where.completedAt.lte = opts.to;
    }

    const completedRides = await prisma.ride.findMany({
      where,
      take: opts?.limit ?? 200,
      orderBy: { completedAt: "desc" },
      include: {
        rider: {
          include: { user: { select: { fullName: true } } }
        },
        passenger: {
          include: { user: { select: { fullName: true } } }
        },
        payment: true
      }
    });

    let matchedTrips = 0;
    let unmatchedTrips = 0;
    let paymentMismatches = 0;
    let commissionMismatches = 0;
    let cashDiscrepancies = 0;
    let totalAuditedVolumeCents = 0;

    const mismatches: ReconciliationReport["mismatches"] = [];

    for (const ride of completedRides) {
      const fare = Number(ride.finalFare ?? ride.estimatedFare ?? 0);
      const earnings = Number(ride.riderEarnings ?? 0);
      const commission = Number(ride.platformCommission ?? 0);
      const cashCollected = ride.cashCollected ? Number(ride.cashCollected) : null;
      const method = ride.paymentMethod ?? PaymentMethod.CASH;

      const fareCents = toCents(fare);
      const earningsCents = toCents(earnings);
      const commCents = toCents(commission);
      totalAuditedVolumeCents += fareCents;

      let isTripMatched = true;

      // Check 1: Fare == Earnings + Commission
      if (fareCents !== earningsCents + commCents) {
        commissionMismatches++;
        isTripMatched = false;
        mismatches.push({
          rideId: ride.id,
          tripDate: ride.completedAt ?? ride.createdAt,
          riderId: ride.riderId,
          riderName: ride.rider?.user?.fullName,
          passengerName: ride.passenger?.user?.fullName,
          paymentMethod: method,
          passengerFare: fare,
          riderEarnings: earnings,
          commission,
          cashCollected,
          mismatchType: "COMMISSION_MISMATCH",
          details: `Fare (GH₵ ${fare.toFixed(2)}) does not equal earnings (GH₵ ${earnings.toFixed(2)}) + commission (GH₵ ${commission.toFixed(2)}). Delta: GH₵ ${fromCents(fareCents - (earningsCents + commCents)).toFixed(2)}`
        });
      }

      // Check 2: Cash Discrepancy (if CASH, did cash collected match fare?)
      if (method === PaymentMethod.CASH && cashCollected != null) {
        const cashCents = toCents(cashCollected);
        if (cashCents !== fareCents) {
          cashDiscrepancies++;
          isTripMatched = false;
          mismatches.push({
            rideId: ride.id,
            tripDate: ride.completedAt ?? ride.createdAt,
            riderId: ride.riderId,
            riderName: ride.rider?.user?.fullName,
            passengerName: ride.passenger?.user?.fullName,
            paymentMethod: method,
            passengerFare: fare,
            riderEarnings: earnings,
            commission,
            cashCollected,
            mismatchType: "CASH_DISCREPANCY",
            details: `Declared cash collected (GH₵ ${cashCollected.toFixed(2)}) differs from calculated fare (GH₵ ${fare.toFixed(2)}).`
          });
        }
      }

      // Check 3: Digital Payment matching
      if (method !== PaymentMethod.CASH) {
        if (!ride.payment) {
          unmatchedTrips++;
          isTripMatched = false;
          mismatches.push({
            rideId: ride.id,
            tripDate: ride.completedAt ?? ride.createdAt,
            riderId: ride.riderId,
            riderName: ride.rider?.user?.fullName,
            passengerName: ride.passenger?.user?.fullName,
            paymentMethod: method,
            passengerFare: fare,
            riderEarnings: earnings,
            commission,
            cashCollected,
            mismatchType: "UNMATCHED_PAYMENT",
            details: `Digital ride is missing captured Payment record in database.`
          });
        } else {
          const paymentAmountCents = toCents(Number(ride.payment.amount));
          if (paymentAmountCents !== fareCents) {
            paymentMismatches++;
            isTripMatched = false;
            mismatches.push({
              rideId: ride.id,
              tripDate: ride.completedAt ?? ride.createdAt,
              riderId: ride.riderId,
              riderName: ride.rider?.user?.fullName,
              passengerName: ride.passenger?.user?.fullName,
              paymentMethod: method,
              passengerFare: fare,
              riderEarnings: earnings,
              commission,
              cashCollected,
              mismatchType: "PAYMENT_MISMATCH",
              details: `Payment record amount (GH₵ ${Number(ride.payment.amount).toFixed(2)}) does not match trip fare (GH₵ ${fare.toFixed(2)}).`
            });
          }
        }
      }

      if (isTripMatched) {
        matchedTrips++;
      }
    }

    return {
      summary: {
        totalTripsChecked: completedRides.length,
        matchedTrips,
        unmatchedTrips,
        paymentMismatches,
        commissionMismatches,
        cashDiscrepancies,
        totalAuditedVolumeGhs: fromCents(totalAuditedVolumeCents)
      },
      mismatches
    };
  }
}

export const reconciliationService = new ReconciliationService();
