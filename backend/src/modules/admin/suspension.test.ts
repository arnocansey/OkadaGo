import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Suspension lifecycle rules used by AdminRiderService.suspendRider.
 * Pure helpers so the money/ops path can be regression-tested without DB.
 */

type SuspensionInput = {
  action: "suspend" | "reinstate" | "extend" | "warn";
  reason?: string;
  durationDays?: number;
};

type RiderState = {
  suspendedAt: Date | null;
  suspensionReason: string | null;
  suspensionEndsAt: Date | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
};

function applySuspension(rider: RiderState, input: SuspensionInput, now = new Date()): RiderState {
  if (input.action === "warn") {
    return { ...rider };
  }

  if (input.action === "reinstate") {
    return {
      ...rider,
      suspendedAt: null,
      suspensionReason: null,
      suspensionEndsAt: null,
      approvalStatus: "APPROVED"
    };
  }

  if (input.action === "suspend") {
    const endsAt =
      input.durationDays != null
        ? new Date(now.getTime() + input.durationDays * 86_400_000)
        : null;
    return {
      ...rider,
      suspendedAt: now,
      suspensionReason: input.reason ?? "Suspended by admin",
      suspensionEndsAt: endsAt,
      approvalStatus: "SUSPENDED"
    };
  }

  // extend
  const days = input.durationDays ?? 7;
  const base = rider.suspensionEndsAt && rider.suspensionEndsAt > now ? rider.suspensionEndsAt : now;
  return {
    ...rider,
    suspendedAt: rider.suspendedAt ?? now,
    suspensionReason: input.reason ?? rider.suspensionReason,
    suspensionEndsAt: new Date(base.getTime() + days * 86_400_000),
    approvalStatus: "SUSPENDED"
  };
}

function isActivelySuspended(rider: RiderState, now = new Date()) {
  if (!rider.suspendedAt && rider.approvalStatus !== "SUSPENDED") return false;
  if (rider.suspensionEndsAt && rider.suspensionEndsAt <= now) return false;
  return rider.approvalStatus === "SUSPENDED" || Boolean(rider.suspendedAt);
}

describe("rider suspension lifecycle", () => {
  const clean: RiderState = {
    suspendedAt: null,
    suspensionReason: null,
    suspensionEndsAt: null,
    approvalStatus: "APPROVED"
  };

  it("suspends indefinitely when no duration is provided", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    const next = applySuspension(clean, { action: "suspend", reason: "Safety review" }, now);
    assert.equal(next.approvalStatus, "SUSPENDED");
    assert.equal(next.suspensionReason, "Safety review");
    assert.equal(next.suspendedAt?.toISOString(), now.toISOString());
    assert.equal(next.suspensionEndsAt, null);
    assert.equal(isActivelySuspended(next, now), true);
  });

  it("suspends for a timed window", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    const next = applySuspension(clean, { action: "suspend", durationDays: 7 }, now);
    assert.ok(next.suspensionEndsAt);
    assert.equal(
      next.suspensionEndsAt?.toISOString(),
      new Date("2026-08-06T12:00:00.000Z").toISOString()
    );
    assert.equal(isActivelySuspended(next, now), true);
    assert.equal(isActivelySuspended(next, new Date("2026-08-07T12:00:00.000Z")), false);
  });

  it("extends from the later of now or the existing end date", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    const suspended = applySuspension(clean, { action: "suspend", durationDays: 7 }, now);
    const extended = applySuspension(suspended, { action: "extend", durationDays: 7 }, now);
    assert.equal(
      extended.suspensionEndsAt?.toISOString(),
      new Date("2026-08-13T12:00:00.000Z").toISOString()
    );
  });

  it("reinstates clears suspension fields", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    const suspended = applySuspension(clean, { action: "suspend", reason: "Abuse" }, now);
    const reinstated = applySuspension(suspended, { action: "reinstate" }, now);
    assert.equal(reinstated.approvalStatus, "APPROVED");
    assert.equal(reinstated.suspendedAt, null);
    assert.equal(reinstated.suspensionReason, null);
    assert.equal(reinstated.suspensionEndsAt, null);
    assert.equal(isActivelySuspended(reinstated, now), false);
  });

  it("warn does not change suspension state", () => {
    const next = applySuspension(clean, { action: "warn", reason: "Be polite" });
    assert.deepEqual(next, clean);
  });
});
