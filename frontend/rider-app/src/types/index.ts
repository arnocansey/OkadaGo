export type AuthMode = "login" | "signup";

export type SessionUser = {
  id: string;
  role: string;
  accountStatus?: string;
  fullName: string;
  email?: string | null;
  phoneE164: string;
  phoneLocal: string;
  preferredCurrency: "GHS" | "NGN";
  isPhoneVerified?: boolean;
  avatarUrl?: string | null;
  riderProfileId?: string | null;
  riderApprovalStatus?: string | null;
};

export type Session = { token: string; expiresAt: string; user: SessionUser };

export type Wallet = {
  id: string;
  type: string;
  currency: string;
  availableBalance: string | number;
  lockedBalance?: string | number;
};

export type WalletTransaction = {
  id: string;
  type: string;
  status: string;
  amount: string | number;
  currency: string;
  direction: string;
  description?: string | null;
  createdAt?: string;
};

export type ServiceZone = { id: string; name: string; city: string; currency: "GHS" | "NGN" };

export type PayoutRequest = {
  id: string;
  method: string;
  status: string;
  amount: string | number;
  currency: string;
  destinationLabel: string;
  requestedAt?: string;
  rejectionReason?: string | null;
};

export type PayoutAccount = {
  id: string;
  method: string;
  destinationLabel: string;
  label: string | null;
  provider: string | null;
  isDefault: boolean;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RoutePreview = {
  distanceKm: number;
  durationMinutes: number;
  provider?: string;
  route?: Array<[number, number]>;
};

export type Ride = {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLatitude?: number | string | null;
  pickupLongitude?: number | string | null;
  pickupLandmark?: string | null;
  destinationAddress: string;
  destinationLatitude?: number | string | null;
  destinationLongitude?: number | string | null;
  destinationLandmark?: string | null;
  estimatedFare?: string | number | null;
  finalFare?: string | number | null;
  riderEarnings?: string | number | null;
  currency?: string;
  createdAt?: string;
  rider?: {
    id: string;
    user?: { fullName: string };
    vehicle?: { plateNumber?: string | null } | null;
    currentLatitude?: number | string | null;
    currentLongitude?: number | string | null;
  } | null;
  passenger?: { user?: { fullName: string; phoneE164?: string } };
};

export type Delivery = {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLatitude?: number | string | null;
  pickupLongitude?: number | string | null;
  pickupLandmark?: string | null;
  dropoffAddress: string;
  dropoffLatitude?: number | string | null;
  dropoffLongitude?: number | string | null;
  dropoffLandmark?: string | null;
  recipientName: string;
  recipientPhoneE164: string;
  packageType: string;
  packageDescription: string;
  estimatedFee?: string | number | null;
  finalFee?: string | number | null;
  riderEarnings?: string | number | null;
  currency?: string;
  createdAt?: string;
  rider?: {
    id: string;
    user?: { fullName: string };
    vehicle?: { plateNumber?: string | null } | null;
    currentLatitude?: number | string | null;
    currentLongitude?: number | string | null;
  } | null;
  passenger?: { user?: { fullName: string; phoneE164?: string } };
};

export type DeliveryStop = {
  id: string;
  deliveryId: string;
  sequence: number;
  type: "PICKUP" | "DROPOFF";
  status: "PENDING" | "ARRIVED" | "COMPLETED" | "SKIPPED";
  address: string;
  latitude: number | string;
  longitude: number | string;
  landmark?: string | null;
  recipientName?: string | null;
  recipientPhoneE164?: string | null;
  instructions?: string | null;
  proofPhotoUrl?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
};

export type TripKind = "ride" | "delivery";

export type ActiveTrip = {
  kind: TripKind;
  ride?: Ride;
  delivery?: Delivery;
};
