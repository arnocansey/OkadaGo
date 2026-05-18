export type RiderScreen = "dashboard" | "earnings" | "trips" | "wallet" | "profile";
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
  riderProfileId?: string | null;
  riderApprovalStatus?: string | null;
};

export type Session = { token: string; expiresAt: string; user: SessionUser };
export type Wallet = { id: string; type: string; currency: string; availableBalance: string | number; lockedBalance?: string | number };
export type WalletTransaction = { id: string; type: string; status: string; amount: string | number; currency: string; direction: string; description?: string | null; createdAt?: string };
export type ServiceZone = { id: string; name: string; city: string; currency: "GHS" | "NGN" };
export type PayoutRequest = { id: string; method: string; status: string; amount: string | number; currency: string; destinationLabel: string; requestedAt?: string; rejectionReason?: string | null };
export type Ride = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare?: string | number | null;
  finalFare?: string | number | null;
  riderEarnings?: string | number | null;
  currency?: string;
  createdAt?: string;
  rider?: { id: string; user?: { fullName: string }; vehicle?: { plateNumber?: string | null } | null } | null;
  passenger?: { user?: { fullName: string; phoneE164?: string } };
};
