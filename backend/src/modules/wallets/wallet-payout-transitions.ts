export type PayoutStatusName =
  | "REQUESTED"
  | "REVIEWING"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "REJECTED"
  | "CANCELLED";

export type PayoutReviewAction =
  | "mark_reviewing"
  | "approve"
  | "mark_processing"
  | "mark_paid"
  | "reject"
  | "cancel";

const FINAL_STATUSES = new Set<PayoutStatusName>(["PAID", "REJECTED", "CANCELLED"]);

export const payoutStatusAfterAction: Record<PayoutReviewAction, PayoutStatusName> = {
  mark_reviewing: "REVIEWING",
  approve: "APPROVED",
  mark_processing: "PROCESSING",
  mark_paid: "PAID",
  reject: "REJECTED",
  cancel: "CANCELLED"
};

/** Whether an admin review action is legal from the current payout status. */
export function canTransitionPayout(current: PayoutStatusName, action: PayoutReviewAction) {
  if (FINAL_STATUSES.has(current)) return false;

  if (action === "mark_reviewing") return current === "REQUESTED";
  if (action === "approve") return current === "REQUESTED" || current === "REVIEWING";
  if (action === "mark_processing") return current === "APPROVED";
  if (action === "mark_paid") return current === "APPROVED" || current === "PROCESSING";
  if (action === "reject" || action === "cancel") return !FINAL_STATUSES.has(current);
  return false;
}

export function isFinalPayoutStatus(status: PayoutStatusName) {
  return FINAL_STATUSES.has(status);
}
