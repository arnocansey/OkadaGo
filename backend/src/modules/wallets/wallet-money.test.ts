import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pure money-path helpers mirroring the wallet settlement math used by
 * WalletService. Kept free of Prisma so CI can run without a database.
 */

function settlementPreview(input: {
  totalFare: number;
  platformCommissionPercent: number;
  gatewayFee?: number;
  riderBonus?: number;
  refundAmount?: number;
}) {
  const gatewayFee = input.gatewayFee ?? 0;
  const riderBonus = input.riderBonus ?? 0;
  const refundAmount = input.refundAmount ?? 0;
  const commission = Number(((input.totalFare * input.platformCommissionPercent) / 100).toFixed(2));
  const riderEarnings = Number(
    (input.totalFare - commission - gatewayFee + riderBonus - refundAmount).toFixed(2)
  );
  return {
    commission,
    riderEarnings,
    platformNet: Number((commission - riderBonus).toFixed(2))
  };
}

function canTransitionPayout(
  current: "REQUESTED" | "REVIEWING" | "APPROVED" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED",
  action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject" | "cancel"
) {
  const finalStates = new Set(["PAID", "REJECTED", "CANCELLED"]);
  if (finalStates.has(current)) return false;

  const next: Record<typeof action, string> = {
    mark_reviewing: "REVIEWING",
    approve: "APPROVED",
    mark_processing: "PROCESSING",
    mark_paid: "PAID",
    reject: "REJECTED",
    cancel: "CANCELLED"
  };

  if (action === "mark_reviewing") return current === "REQUESTED";
  if (action === "approve") return current === "REQUESTED" || current === "REVIEWING";
  if (action === "mark_processing") return current === "APPROVED";
  if (action === "mark_paid") return current === "APPROVED" || current === "PROCESSING";
  if (action === "reject" || action === "cancel") return !finalStates.has(current);
  return Boolean(next[action]);
}

describe("wallet settlement math", () => {
  it("splits commission and rider earnings from a fare", () => {
    const result = settlementPreview({ totalFare: 100, platformCommissionPercent: 12 });
    assert.equal(result.commission, 12);
    assert.equal(result.riderEarnings, 88);
    assert.equal(result.platformNet, 12);
  });

  it("accounts for gateway fee and rider bonus", () => {
    const result = settlementPreview({
      totalFare: 50,
      platformCommissionPercent: 10,
      gatewayFee: 1.5,
      riderBonus: 2
    });
    assert.equal(result.commission, 5);
    assert.equal(result.riderEarnings, 45.5);
    assert.equal(result.platformNet, 3);
  });
});

describe("payout review transitions", () => {
  it("allows the happy path REQUESTED → REVIEWING → APPROVED → PROCESSING → PAID", () => {
    assert.equal(canTransitionPayout("REQUESTED", "mark_reviewing"), true);
    assert.equal(canTransitionPayout("REVIEWING", "approve"), true);
    assert.equal(canTransitionPayout("APPROVED", "mark_processing"), true);
    assert.equal(canTransitionPayout("PROCESSING", "mark_paid"), true);
  });

  it("blocks mutations once a payout is final", () => {
    assert.equal(canTransitionPayout("PAID", "approve"), false);
    assert.equal(canTransitionPayout("REJECTED", "mark_paid"), false);
    assert.equal(canTransitionPayout("CANCELLED", "reject"), false);
  });

  it("rejects illegal mid-flow jumps", () => {
    assert.equal(canTransitionPayout("REQUESTED", "mark_processing"), false);
    assert.equal(canTransitionPayout("APPROVED", "mark_reviewing"), false);
  });
});
