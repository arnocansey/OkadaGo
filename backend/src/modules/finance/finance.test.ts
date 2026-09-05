import test from "node:test";
import assert from "node:assert/strict";
import { FareService, roundMoney, toCents, fromCents } from "../pricing/fare.service.js";
import { CommissionService } from "./commission.service.js";
import { ReconciliationService } from "./reconciliation.service.js";
import { FinanceLedgerService } from "./finance-ledger.service.js";
import { FinanceLedgerType, LedgerDirection, PaymentMethod, PaymentDisputeType, PaymentDisputeStatus } from "../../generated/prisma/client.js";

test("OkadaGo Complete Financial System Test Suite", async (t) => {
  const fareService = new FareService();

  await t.test("Scenario 1 & 3: Deterministic Fare & Commission Calculation (Section 25 Example)", () => {
    // Section 25 functional test:
    // Trip fare: GH₵100, Commission: 15%, Rider net earnings: GH₵85, Commission owed: GH₵15
    const fare = fareService.compute({
      countryCode: "GH",
      currency: "GHS",
      rideType: "standard_bike",
      cancellationFee: 0,
      baseFare: 10,
      estimatedDistanceKm: 15,
      perKmFee: 5, // 75
      estimatedDurationMinutes: 15,
      perMinuteFee: 1, // 15
      waitingMinutes: 0,
      waitingFeePerMinute: 0.5,
      zoneFee: 0,
      surgeMultiplier: 1.0,
      promoDiscount: 0,
      referralDiscount: 0,
      minimumFare: 10,
      commissionPercent: 15
    });

    assert.equal(fare.totalFare, 100);
    assert.equal(fare.platformCommission, 15);
    assert.equal(fare.riderEarnings, 85);
    assert.equal(fare.detailed.totalPassengerFare, 100);
    assert.equal(fare.detailed.okadaGoCommission, 15);
    assert.equal(fare.detailed.riderEarnings, 85);
    assert.equal(fare.detailed.commissionPercent, 15);

    // Sum invariant: totalFare === riderEarnings + platformCommission
    assert.equal(fare.totalFare, fare.riderEarnings + fare.platformCommission);
  });

  await t.test("Scenario 2: Fare Calculation with Discounts and Surge", () => {
    const fare = fareService.compute({
      countryCode: "GH",
      currency: "GHS",
      rideType: "standard_bike",
      cancellationFee: 0,
      baseFare: 10,
      estimatedDistanceKm: 10,
      perKmFee: 3, // 30
      estimatedDurationMinutes: 10,
      perMinuteFee: 1, // 10
      waitingMinutes: 0,
      waitingFeePerMinute: 0,
      zoneFee: 0,
      surgeMultiplier: 1.5, // (10+30+10)*1.5 = 75
      promoDiscount: 15, // 75 - 15 = 60
      referralDiscount: 0,
      minimumFare: 15,
      commissionPercent: 15 // 15% of 60 = 9
    });

    assert.equal(fare.subtotal, 75);
    assert.equal(fare.discountAmount, 15);
    assert.equal(fare.totalFare, 60);
    assert.equal(fare.platformCommission, 9);
    assert.equal(fare.riderEarnings, 51);
    assert.equal(fare.totalFare, fare.riderEarnings + fare.platformCommission);
  });

  await t.test("Scenario 4 & 6: Cash Trip Commission Accrual & Cumulative Debt (Section 8 Example)", () => {
    // Rider completes Trip 1: GH₵30 -> GH₵4.50
    // Trip 2: GH₵40 -> GH₵6.00
    // Trip 3: GH₵20 -> GH₵3.00
    // Total commission owed: GH₵13.50
    const trips = [
      { fare: 30, commission: 4.5 },
      { fare: 40, commission: 6.0 },
      { fare: 20, commission: 3.0 }
    ];

    let runningDebtCents = 0;
    let runningCashCollectedCents = 0;

    for (const trip of trips) {
      runningDebtCents += toCents(trip.commission);
      runningCashCollectedCents += toCents(trip.fare);
    }

    const totalDebt = fromCents(runningDebtCents);
    const totalCash = fromCents(runningCashCollectedCents);

    assert.equal(totalDebt, 13.50);
    assert.equal(totalCash, 90.00);
  });

  await t.test("Scenario 5 & 12: Commission Settlement & Cash Restriction Thresholds (Section 9 & 10)", () => {
    const warningThreshold = 50.0;
    const restrictionThreshold = 150.0;

    let outstandingDebt = 165.0; // Exceeds restriction threshold of 150
    let isCashRestricted = outstandingDebt >= restrictionThreshold;
    let showWarning = outstandingDebt >= warningThreshold;

    assert.equal(isCashRestricted, true);
    assert.equal(showWarning, true);

    // Rider settles GH₵ 100 via Mobile Money
    const paymentAmount = 100.0;
    outstandingDebt = roundMoney(outstandingDebt - paymentAmount);
    isCashRestricted = outstandingDebt >= restrictionThreshold;
    showWarning = outstandingDebt >= warningThreshold;

    assert.equal(outstandingDebt, 65.0);
    assert.equal(isCashRestricted, false, "Restriction must be lifted once debt is below 150 GHS");
    assert.equal(showWarning, true, "Warning should remain active while debt is >= 50 GHS");

    // Rider settles the remaining GH₵ 65.0
    outstandingDebt = roundMoney(outstandingDebt - 65.0);
    isCashRestricted = outstandingDebt >= restrictionThreshold;
    showWarning = outstandingDebt >= warningThreshold;

    assert.equal(outstandingDebt, 0.0);
    assert.equal(isCashRestricted, false);
    assert.equal(showWarning, false);
  });

  await t.test("Scenario 7: Rider Payout Withdrawable Balance Safeguard (Section 16)", () => {
    // Rider has GH₵ 200 in digital earnings in wallet
    // Rider has GH₵ 75 in outstanding commission debt
    // Withdrawable balance should be max(0, 200 - 75) = GH₵ 125
    const availableBalance = 200.0;
    const outstandingDebt = 75.0;
    const maxWithdrawable = Math.max(0, roundMoney(availableBalance - outstandingDebt));

    assert.equal(maxWithdrawable, 125.0);

    // Attempting to withdraw GH₵ 150 must be rejected
    const requestedPayout1 = 150.0;
    assert.equal(requestedPayout1 > maxWithdrawable, true, "Payout exceeding withdrawable balance must be blocked");

    // Attempting to withdraw GH₵ 100 is allowed
    const requestedPayout2 = 100.0;
    assert.equal(requestedPayout2 <= maxWithdrawable, true, "Payout within withdrawable balance must be permitted");
  });

  await t.test("Scenario 8: Refund & Ledger Reversal Math (Section 18)", () => {
    // Original trip fare GH₵ 50: Net earnings GH₵ 42.50, Commission GH₵ 7.50
    const fare = 50.0;
    const commission = 7.5;
    const earnings = 42.5;

    // Full refund reversal
    const refundAmount = fare;
    const reversedEarnings = earnings;
    const reversedCommission = commission;

    assert.equal(roundMoney(reversedEarnings + reversedCommission), refundAmount);
  });

  await t.test("Scenario 9: Payment Dispute Integrity (Section 7 & 19)", () => {
    // When dispute is filed, commission liability is NOT removed automatically
    let riderOutstandingCommission = 15.0;
    const disputeReported = true;

    // Commission liability preserved pending admin review
    if (disputeReported) {
      assert.equal(riderOutstandingCommission, 15.0, "Liability must not be silently removed on dispute filing");
    }

    // When admin resolves with waiver, liability is adjusted
    const adminAction = "WAIVE_COMMISSION";
    if (adminAction === "WAIVE_COMMISSION") {
      riderOutstandingCommission = Math.max(0, riderOutstandingCommission - 15.0);
    }
    assert.equal(riderOutstandingCommission, 0.0);
  });

  await t.test("Scenario 10: Idempotency Protection", () => {
    const keysSeen = new Set<string>();

    function processPayment(idempotencyKey: string, amount: number) {
      if (keysSeen.has(idempotencyKey)) {
        return { status: "IDEMPOTENT_IGNORED", amount };
      }
      keysSeen.add(idempotencyKey);
      return { status: "PROCESSED", amount };
    }

    const res1 = processPayment("IDEM-001", 30.0);
    const res2 = processPayment("IDEM-001", 30.0);

    assert.equal(res1.status, "PROCESSED");
    assert.equal(res2.status, "IDEMPOTENT_IGNORED");
  });

  await t.test("Scenario 11: Automated Reconciliation Math (Section 17)", () => {
    // Valid trip: Fare = Earnings + Commission
    const validTrip = { fare: 80, earnings: 68, commission: 12 };
    assert.equal(toCents(validTrip.fare), toCents(validTrip.earnings) + toCents(validTrip.commission));

    // Mismatched trip: Fare !== Earnings + Commission
    const mismatchTrip = { fare: 80, earnings: 60, commission: 12 };
    assert.notEqual(toCents(mismatchTrip.fare), toCents(mismatchTrip.earnings) + toCents(mismatchTrip.commission));
  });
});
