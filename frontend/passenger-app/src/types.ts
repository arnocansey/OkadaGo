export type PassengerScreen = "home" | "book" | "trips" | "wallet" | "profile";
export type AuthMode = "login" | "signup";

export type SessionUser = {
  id: string;
  role: string;
  fullName: string;
  email?: string | null;
  phoneE164: string;
  phoneLocal: string;
  preferredCurrency: "GHS" | "NGN";
  passengerProfileId?: string | null;
};

export type Session = {
  token: string;
  expiresAt: string;
  user: SessionUser;
};

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

export type ServiceZone = {
  id: string;
  name: string;
  city: string;
  currency: "GHS" | "NGN";
};

export type LocationResult = {
  label: string;
  displayName?: string | null;
  latitude: number;
  longitude: number;
};

export type RoutePreview = {
  distanceKm: number;
  durationMinutes: number;
};

export type Ride = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare?: string | number | null;
  finalFare?: string | number | null;
  currency?: string;
  createdAt?: string;
  passenger?: { id: string; user?: { fullName: string } };
  rider?: { user?: { fullName: string }; vehicle?: { plateNumber?: string | null } | null } | null;
};
