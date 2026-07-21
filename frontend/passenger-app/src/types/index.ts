export type AuthMode = "login" | "signup";

export type PaymentMethod = "cash" | "card" | "wallet" | "mobile_money";

export type SessionUser = {
  id: string;
  role: string;
  fullName: string;
  email?: string | null;
  phoneE164: string;
  phoneLocal: string;
  preferredCurrency: "GHS" | "NGN";
  isPhoneVerified?: boolean;
  avatarUrl?: string | null;
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
  reference?: string | null;
  createdAt?: string;
};

export type ServiceZone = {
  id: string;
  name: string;
  city: string;
  countryCode?: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare?: string | number;
  perKmFee?: string | number;
  perMinuteFee?: string | number;
  minimumFare?: string | number;
  cancellationFee?: string | number;
  waitingFeePerMin?: string | number;
};

export type SavedPlace = {
  id: string;
  label: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  notes?: string | null;
};

export type LocationResult = {
  label: string;
  displayName?: string | null;
  formattedAddress?: string | null;
  shortLabel?: string | null;
  latitude: number;
  longitude: number;
};

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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
  currency?: string;
  paymentMethod?: string | null;
  promoDiscount?: string | number | null;
  scheduledFor?: string | null;
  createdAt?: string;
  completedAt?: string | null;
  passenger?: { id: string; user?: { fullName: string } };
  rider?: {
    id?: string;
    user?: { fullName: string };
    vehicle?: { plateNumber?: string | null } | null;
    currentLatitude?: number | string | null;
    currentLongitude?: number | string | null;
  } | null;
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
};

export type Delivery = {
  id: string;
  status: string;
  pickupAddress: string;
  pickupLatitude?: number | string | null;
  pickupLongitude?: number | string | null;
  dropoffAddress: string;
  dropoffLatitude?: number | string | null;
  dropoffLongitude?: number | string | null;
  recipientName: string;
  recipientPhoneE164: string;
  packageType: string;
  packageDescription: string;
  estimatedFee?: string | number | null;
  finalFee?: string | number | null;
  currency?: string;
  createdAt?: string;
  completedAt?: string;
  paymentMethod?: string;
  promoDiscount?: string | number | null;
  passenger?: { id: string; user?: { fullName: string } };
  rider?: {
    id?: string;
    user?: { fullName: string };
    vehicle?: { plateNumber?: string | null } | null;
    currentLatitude?: number | string | null;
    currentLongitude?: number | string | null;
  } | null;
};

export type HomeService = "ride" | "food" | "send";

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

/** Nearby place from Google Places with distance and delivery estimates. */
export type { NearbyRestaurant } from "@/services/nearbyPlaces";
