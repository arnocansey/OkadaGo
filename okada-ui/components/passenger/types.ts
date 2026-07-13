export type ServiceZone = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
};

export type Wallet = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance: string | number;
};

export type WalletTransaction = {
  id: string;
  walletId: string;
  type: string;
  status: string;
  amount: string | number;
  currency: string;
  direction: string;
  reference: string;
  description: string | null;
  createdAt: string;
  ride: {
    id: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
};

export type Ride = {
  id: string;
  status: string;
  passengerId: string;
  riderId: string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: string | number;
  pickupLongitude: string | number;
  destinationLatitude: string | number;
  destinationLongitude: string | number;
  estimatedDistanceKm: string | number | null;
  estimatedDurationMinutes: number | null;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  currency: string;
  createdAt: string;
  rider: {
    currentLatitude: string | number | null;
    currentLongitude: string | number | null;
    user: { fullName: string; phoneE164: string };
  } | null;
};

export type RiderPin = {
  id: string;
  serviceZoneId: string | null;
  onlineStatus: boolean;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  user: { fullName: string };
};

export type RoutePreview = {
  provider: "mapbox" | "osrm";
  distanceKm: number;
  durationMinutes: number;
  route: Array<[number, number]>;
};

export type FareEstimate = {
  pricing: { totalFare: number; riderEarnings: number; platformCommission: number };
};

export type PassengerSettings = {
  fullName: string;
  email: string | null;
  phoneCountryCode: string;
  phoneLocal: string;
  phoneE164: string;
  preferredCurrency: string;
  avatarUrl: string | null;
  defaultServiceCity: string | null;
  preferredPayment: "cash" | "card" | "wallet" | "mobile_money" | null;
  referralCode: string | null;
};

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  channel: string;
  status: string;
  title: string;
  body: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
};

export type SafetyContact = {
  id: string;
  name: string;
  phoneE164: string;
  relationship: string | null;
  isPrimary: boolean;
  isVerified?: boolean;
};

export type SafetyOverview = {
  contacts: SafetyContact[];
  incidents: Array<{
    id: string;
    severity: string;
    category: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  activeRide: {
    id: string;
    status: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
};

export type PaymentMethod = "cash" | "card" | "wallet" | "mobile_money";

export type LocationPoint = { lat: number; lng: number; label: string };

export type RideType = "standard" | "express";

export function parseCoord(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const ACTIVE_RIDE_STATUSES = new Set([
  "REQUESTED",
  "SEARCHING",
  "ACCEPTED",
  "RIDER_EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS"
]);

export const ghanaCenters: Record<string, [number, number]> = {
  accra: [5.6037, -0.187],
  kumasi: [6.6885, -1.6244],
  takoradi: [4.8845, -1.7554],
  tamale: [9.4034, -0.8424]
};
