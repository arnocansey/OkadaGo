export type RideItem = {
  id: string;
  status: string;
  type?: string;
  pickupAddress: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  destinationAddress: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  estimatedFare?: number | string | null;
  estimatedDistanceKm?: number | string | null;
  estimatedDurationMinutes?: number | null;
  currency?: string;
  requestedAt: string;
  assignedAt?: string | null;
  assignmentStatus: string;
  passenger: {
    id?: string;
    name: string;
    phone: string;
    userId?: string;
  } | null;
  assignedRider: {
    id: string;
    name: string;
    phone: string;
    userId?: string;
    vehicle?: {
      make: string;
      model: string;
      plateNumber: string;
      vehicleType?: string;
    } | null;
  } | null;
  [key: string]: unknown;
};

export type RiderCandidate = {
  riderId: string;
  userId: string;
  displayName: string;
  displayCode: string;
  phone: string;
  rating: number;
  acceptanceRate: number;
  cancellationRate: number;
  completedTrips: number;
  todayTrips: number;
  todayEarnings: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  distanceToPickupKm: number;
  etaMinutes: number;
  score: number;
  scoreBreakdown: {
    proximity: number;
    eta: number;
    rating: number;
    acceptance: number;
    cancellationPenalty: number;
  };
  qualificationIssues: string[];
  qualified: boolean;
  onlineStatus: boolean;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    vehicleType: string;
  } | null;
  serviceZone: string | null;
};

export type AvailableRidersResponse = {
  ride: Record<string, unknown>;
  availableRiders: RiderCandidate[];
  recommendedRiderId: string | null;
  activeRules: {
    id: string;
    name: string;
    weights: Record<string, number>;
    maxPickupRadiusKm: number;
  } | null;
};

export type AssignmentStatsData = {
  totalActive: number;
  unassigned: number;
  assigned: number;
  arriving: number;
  arrived: number;
  todayAssigned: number;
  todayAutoAssigned: number;
  todayUnassigned: number;
  rulesCount: number;
  assignmentRate: number;
};

export type AssignmentHistoryRecord = {
  id: string;
  rideId: string;
  passengerName: string;
  passengerPhone: string;
  riderName: string;
  riderPlate: string | null;
  pickupAddress: string;
  destinationAddress: string;
  assignmentMethod: "AUTO" | "MANUAL";
  assignmentTime: string;
  responseTimeSec: number;
  status: string;
  adminName: string;
  reason: string | null;
  score: number | null;
};

export type TimelineStage = {
  key: string;
  label: string;
  timestamp: string | null;
  completed: boolean;
};

export type RideTimelineData = {
  rideId: string;
  status: string;
  currency: string;
  estimatedFare: number | string | null;
  finalFare: number | string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  passenger: { name: string; phone: string } | null;
  rider: {
    name: string;
    phone: string;
    plate?: string | null;
    model?: string | null;
  } | null;
  stages: TimelineStage[];
  events: Array<{
    id: string;
    eventType: string;
    payload: unknown;
    createdAt: string;
  }>;
};

export type UseMutationResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: (vars: any, opts?: { onSuccess?: () => void }) => void;
  isPending: boolean;
};

export type AssignmentRuleItem = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  weightProximity: number;
  weightEta: number;
  weightRating: number;
  weightAcceptance: number;
  cancellationPenalty: number;
  maxPickupRadiusKm: number;
  maxEtaMinutes: number;
  minRating: number;
  minAcceptanceRate: number;
  maxCancellationRate: number;
  requireOnline: boolean;
  requireApproved: boolean;
  excludeSuspended: boolean;
  requireVehicle: boolean;
  autoAssignEnabled: boolean;
  autoAssignDelayMs: number;
  zoneId: string | null;
  zone?: { id: string; name: string; city: string } | null;
  createdAt: string;
};

