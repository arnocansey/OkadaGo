export type WalletRecord = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance: string | number;
};

export type RideRecord = {
  id: string;
  riderId: string | null;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  currency: string;
  createdAt: string;
  passenger: {
    user: {
      fullName: string;
    };
  };
};

export type RiderRecord = {
  id: string;
  userId: string;
  onlineStatus: boolean;
  city: string | null;
  commissionPercent: string | number;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  serviceZone: {
    id: string;
    name: string;
  } | null;
  vehicle: {
    make: string;
    model: string;
    plateNumber: string;
    color: string | null;
    year: number | null;
  } | null;
  user: {
    fullName: string;
  };
};

export type SettlementPreviewResponse = {
  currency: "GHS" | "NGN";
  paymentMethod: "cash" | "card" | "wallet" | "mobile_money";
  riderNetSettlement: number;
  platformNetRevenue: number;
  lineItems: Array<{
    label: string;
    amount: number;
  }>;
};

export type PayoutEligibilityResponse = {
  eligible: boolean;
  availableBalance: number;
  requestedAmount: number;
  remainingBalance: number;
};

export type RiderPayoutRequestRecord = {
  id: string;
  method: "BANK_ACCOUNT" | "MOBILE_MONEY";
  status: string;
  amount: string | number;
  currency: string;
  destinationLabel: string;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
};

export type RiderPortalScreen = "dashboard" | "earnings" | "trips";

export function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const riderDeficitWarningThreshold = 100;
export const riderDeficitOfflineThreshold = 200;

export function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function getNextAction(activeRide: { status: string } | null) {
  const nextActionLabel =
    activeRide?.status === "assigned"
      ? "Mark arriving"
      : activeRide?.status === "arriving"
        ? "Mark arrived"
        : activeRide?.status === "arrived"
          ? "Start trip"
          : activeRide?.status === "started"
            ? "Complete trip"
            : null;

  const nextActionStatus =
    activeRide?.status === "assigned"
      ? "arriving"
      : activeRide?.status === "arriving"
        ? "arrived"
        : activeRide?.status === "arrived"
          ? "started"
          : activeRide?.status === "started"
            ? "completed"
            : null;

  return { nextActionLabel, nextActionStatus };
}
