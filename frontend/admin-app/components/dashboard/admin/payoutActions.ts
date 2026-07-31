export type PayoutReviewAction =
  | "mark_reviewing"
  | "approve"
  | "mark_processing"
  | "mark_paid"
  | "reject"
  | "cancel";

/** Allowed admin actions for a payout status — mirrors backend canTransitionPayout. */
export function payoutActionsForStatus(status: string): PayoutReviewAction[] {
  const current = status.toUpperCase();
  if (current === "PAID" || current === "REJECTED" || current === "CANCELLED") {
    return [];
  }

  const actions: PayoutReviewAction[] = [];
  if (current === "REQUESTED") {
    actions.push("mark_reviewing", "approve", "reject");
  } else if (current === "REVIEWING") {
    actions.push("approve", "reject");
  } else if (current === "APPROVED") {
    actions.push("mark_processing", "mark_paid", "reject");
  } else if (current === "PROCESSING") {
    actions.push("mark_paid", "reject");
  } else {
    actions.push("reject");
  }
  return actions;
}

export function canPayoutAction(status: string, action: PayoutReviewAction) {
  return payoutActionsForStatus(status).includes(action);
}

export type PayoutProviderMeta = {
  provider?: string;
  transferStatus?: string;
  transferCode?: string | null;
  transferReference?: string | null;
  recipientCode?: string;
  momoBankCode?: string;
  accountNumber?: string;
  lastError?: string | null;
  initiatedAt?: string;
  settledAt?: string;
  failedAt?: string;
};

export function readPayoutProviderMeta(metadata: unknown): PayoutProviderMeta | null {
  if (!metadata || typeof metadata !== "object") return null;
  return metadata as PayoutProviderMeta;
}
