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
  rider?: { id: string } | null;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude?: string | number | null;
  pickupLongitude?: string | number | null;
  destinationLatitude?: string | number | null;
  destinationLongitude?: string | number | null;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  currency: string;
  createdAt: string;
  passenger: {
    user: {
      fullName: string;
      phoneE164?: string;
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

export type RiderSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  avatarUrl: string | null;
  city: string | null;
  approvalStatus?: string | null;
};

export type SettlementPreviewResponse = {
  currency: "GHS" | "NGN";
  paymentMethod: "cash" | "card" | "wallet" | "mobile_money";
  riderNetSettlement: number;
  platformNetRevenue: number;
  lineItems: Array<{ label: string; amount: number }>;
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

export const ACTIVE_RIDE_STATUSES = new Set(["assigned", "arriving", "arrived", "started"]);

export const riderDeficitWarningThreshold = 100;
export const riderDeficitOfflineThreshold = 200;

export const ACCRA_CENTER: [number, number] = [5.6037, -0.187];

export function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

export function parseCoord(value: string | number | null | undefined) {
  return parseNumber(value);
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatStatus(status: string) {
  if (!status) return "";
  return status
    .toLowerCase()
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getNextAction(activeRide: { status: string } | null) {
  const status = activeRide?.status?.toLowerCase() ?? "";

  const nextActionLabel =
    status === "assigned"
      ? "Mark arriving"
      : status === "arriving"
        ? "Mark arrived"
        : status === "arrived"
          ? "Start trip"
          : status === "started"
            ? "Complete trip"
            : null;

  const nextActionStatus =
    status === "assigned"
      ? "ARRIVING"
      : status === "arriving"
        ? "ARRIVED"
        : status === "arrived"
          ? "STARTED"
          : status === "started"
            ? "COMPLETED"
            : null;

  return { nextActionLabel, nextActionStatus };
}
