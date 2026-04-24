export const userRoles = ["passenger", "rider", "admin", "dispatcher"] as const;
export type UserRole = (typeof userRoles)[number];

export const rideStatuses = [
  "searching",
  "assigned",
  "arriving",
  "arrived",
  "started",
  "completed",
  "cancelled"
] as const;
export type RideStatus = (typeof rideStatuses)[number];

export interface LiveRideRecord {
  id: string;
  code: string;
  riderName: string;
  passengerName: string;
  status: RideStatus;
  pickupLabel: string;
  destinationLabel: string;
  requestedAt: string;
}

export interface QueueSnapshot {
  pendingBookings: number | null;
  activeRiders: number | null;
  activeTrips: number | null;
  incidentAlerts: number | null;
}

export interface OperatingCity {
  name: string;
  country: "Ghana" | "Nigeria";
  currency: "GHS" | "NGN";
  focus: string;
}

export const launchCities: OperatingCity[] = [
  {
    name: "Accra",
    country: "Ghana",
    currency: "GHS",
    focus: "Airport corridors, CBD commutes, and residential feeder trips"
  },
  {
    name: "Kumasi",
    country: "Ghana",
    currency: "GHS",
    focus: "Dense market access and university mobility"
  },
  {
    name: "Lagos",
    country: "Nigeria",
    currency: "NGN",
    focus: "High-volume urban commute and last-mile traffic bypass"
  },
  {
    name: "Abuja",
    country: "Nigeria",
    currency: "NGN",
    focus: "Government district, airport axis, and suburban links"
  }
];

export const passengerModules = [
  "Phone-first auth and OTP verification",
  "Map booking, fare estimate, and ride timeline",
  "Wallet, card, cash, and mobile money selection",
  "Trip sharing, SOS, incident reporting, and support"
];

export const riderModules = [
  "Document onboarding and approval state tracking",
  "Online/offline shift management with dispatch queue",
  "Turn-by-turn pickup and trip execution flow",
  "Earnings, payouts, incentives, and support"
];

export const adminModules = [
  "Rider approval operations and compliance review",
  "Live trip supervision with dispatch intervention",
  "Pricing, payouts, promotions, and wallet controls",
  "Analytics, incidents, audit logs, and CMS settings"
];
