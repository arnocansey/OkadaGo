import { LayoutDashboard } from "lucide-react";

export type AdminConsoleScreen =
  | "dashboard"
  | "liveOperations"
  | "rides"
  | "deliveries"
  | "riders"
  | "riderVerification"
  | "riderDocuments"
  | "riderPerformance"
  | "riderEarnings"
  | "riderWallet"
  | "riderPayouts"
  | "riderComplaints"
  | "riderActivity"
  | "riderSuspensions"
  | "passengers"
  | "payments"
  | "pricing"
  | "dynamicPricing"
  | "promotions"
  | "wallet"
  | "zones"
  | "supportTickets"
  | "sosIncidents"
  | "analytics"
  | "reports"
  | "notifications"
  | "settings"
  | "companyProfile"
  | "accountSecurity"
  | "notificationSettings"
  | "paymentMethods"
  | "integrations"
  | "taxesCompliance"
  | "settingsNotifications"
  | "auditLogs"
  | "admins"
  | "escalationRules"
  | "ratings";

export type RideRecord = {
  id: string;
  status: string;
  paymentMethod?: string | null;
  cancellationParty?: string | null;
  cancellationReason?: string | null;
  scheduledFor?: string | null;
  requestedAt?: string;
  assignedAt?: string | null;
  riderArrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  pickupAddress: string;
  pickupLatitude?: string | number | null;
  pickupLongitude?: string | number | null;
  destinationAddress: string;
  destinationLatitude?: string | number | null;
  destinationLongitude?: string | number | null;
  estimatedDistanceKm?: string | number | null;
  actualDistanceKm?: string | number | null;
  estimatedDurationMinutes?: number | null;
  actualDurationMinutes?: number | null;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  promoDiscount: string | number | null;
  referralDiscount: string | number | null;
  surgeAmount: string | number | null;
  waitingAmount: string | number | null;
  cancellationFee: string | number | null;
  riderEarnings: string | number | null;
  platformCommission: string | number | null;
  currency: string;
  notes?: string | null;
  createdAt: string;
  passenger: {
    id?: string;
    user: {
      fullName: string;
      phoneE164?: string;
      email?: string | null;
    };
  };
  rider: {
    id?: string;
    displayCode?: string;
    user: {
      fullName: string;
    };
    vehicle?: {
      make: string;
      model: string;
      plateNumber: string;
      vehicleType?: string;
    } | null;
    serviceZone?: {
      name: string;
    } | null;
  } | null;
  serviceZone?: {
    id: string;
    name: string;
  } | null;
};

export type DeliveryRecord = {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  recipientName: string;
  recipientPhoneE164: string;
  packageType: string;
  packageDescription: string;
  currency: string;
  estimatedFee: string | number | null;
  finalFee: string | number | null;
  riderEarnings: string | number | null;
  platformCommission: string | number | null;
  createdAt: string;
  requestedAt: string;
  passenger: {
    user: {
      fullName: string;
    };
  };
  rider: {
    user: {
      fullName: string;
    };
  } | null;
  serviceZone?: {
    id: string;
    name: string;
  } | null;
};

export type PassengerRecord = {
  id: string;
  userId: string;
  referralCode: string;
  defaultServiceCity: string | null;
  preferredPayment: string | null;
  createdAt?: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
    preferredCurrency: string;
    role: string;
    accountStatus?: string;
    isPhoneVerified?: boolean;
  };
};

export type RiderRecord = {
  id: string;
  displayCode: string;
  onlineStatus: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | string;
  city: string | null;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  lastLocationMocked?: boolean;
  lastLocationMockedAt?: string | null;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  suspensionEndsAt?: string | null;
  ratingAverage?: number | string | null;
  completedTrips?: number | null;
  acceptanceRate?: number | string | null;
  cancellationRate?: number | string | null;
  totalEarnings?: number | string | null;
  commissionPercent?: number | string | null;
  serviceZone: {
    id: string;
    name: string;
  } | null;
  jobPreference?: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
    vehicleType?: string;
    status: string;
  } | null;
  user: {
    fullName: string;
    email?: string | null;
    phoneE164: string;
    preferredCurrency: string;
    accountStatus?: string;
  };
  createdAt?: string;
};

export type RiderDocumentRecord = {
  id: string;
  riderId: string;
  type: string;
  status: string;
  fileUrl: string;
  notes?: string | null;
  expiresAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  rider?: {
    id: string;
    displayCode: string;
    user: {
      fullName: string;
      phoneE164: string;
    };
  };
};

export type AdminUserStats = {
  passengers: {
    total: number;
    pending: number;
    verified: number;
  };
  riders: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    suspended: number;
  };
  totals: {
    users: number;
  };
};

export type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  currency: string;
  isActive: boolean;
  ridesEnabled?: boolean;
  deliveriesEnabled?: boolean;
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

export type AdminAccountRecord = {
  id: string;
  title: string | null;
  permissions: string[];
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
    preferredCurrency: string;
    accountStatus: string;
  };
};

export type AdminPermissionsRecord = {
  roles: Record<string, string[]>;
};

export type AdminModulesRecord = {
  modules: string[];
};

export type AdminNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  screen: AdminConsoleScreen;
  group: "home" | "operations" | "people" | "management" | "system" | "main" | "finance" | string;
  hint: string;
  badge?: string;
  children?: Array<{
    label: string;
    href: string;
    screen: AdminConsoleScreen;
    badge?: string;
  }>;
};

export type AdminScreenMeta = {
  title: string;
  eyebrow: string;
  description: string;
  searchLabel: string;
  quickActionLabel: string;
  quickActionHref: string;
  quickActionNote: string;
};

export type AdminHighlight = {
  label: string;
  value: string;
};

export type WalletTransactionRecord = {
  id: string;
  type: string;
  status: string;
  amount: string | number;
  currency: string;
  direction: string;
  reference: string;
  description: string | null;
  createdAt: string;
  postedAt: string | null;
  wallet: {
    id: string;
    type: string;
    currency: string;
    user: {
      id: string;
      fullName: string;
      email: string | null;
      phoneE164: string;
      role: string;
      preferredCurrency: string;
      riderProfile?: {
        id: string;
        displayCode: string;
      } | null;
      passengerProfile?: {
        id: string;
        referralCode: string;
      } | null;
    };
  };
  ride: {
    id: string;
    status: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
  payment: {
    id: string;
    method: string;
    status: string;
    provider: string | null;
    providerReference: string | null;
  } | null;
  payoutRequest: {
    id: string;
    status: string;
    destinationLabel: string;
  } | null;
};

export type PayoutRequestRecord = {
  id: string;
  method: string;
  status: string;
  amount: string | number;
  currency: string;
  destinationLabel: string;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  metadata?: Record<string, unknown> | null;
  rider: {
    id: string;
    displayCode: string;
    user: {
      id: string;
      fullName: string;
      phoneE164: string;
      preferredCurrency: string;
    };
  };
  reviewer: {
    id: string;
    fullName: string;
    email: string | null;
  } | null;
  wallet: {
    id: string;
    availableBalance: string | number;
    lockedBalance: string | number;
    currency: string;
  };
};

export type AdminRatingRecord = {
  id: string;
  score: number;
  category: string | null;
  createdAt: string;
  ride: {
    id: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    pickupAddress: string;
    destinationAddress: string;
  };
  rater: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
  };
  rated: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
    riderProfile: {
      id: string;
      displayCode: string;
    } | null;
  };
  review: {
    id: string;
    body: string;
  } | null;
};

export type AdminIncidentRecord = {
  id: string;
  severity: string;
  status: string;
  category: string;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
  reporter: {
    id: string;
    fullName: string;
    phoneE164: string;
  };
  rider: {
    id: string;
    displayCode: string;
    user: {
      fullName: string;
      phoneE164: string;
    };
  } | null;
  assignedTo: {
    id: string;
    fullName: string;
    email: string | null;
  } | null;
  ride: {
    id: string;
    status: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
  } | null;
};

export type RiderFinancialRow = {
  rider: RiderRecord;
  rideCount: number;
  completedCount: number;
  activeCount: number;
  revenue: number;
  earnings: number;
  commission: number;
  averageRating: number;
  ratingCount: number;
  walletMovement: number;
  payoutTotal: number;
};

export type AdminSupportTicketRecord = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  createdBy?: {
    id: string;
    fullName: string;
    phoneE164?: string | null;
    email?: string | null;
  } | null;
  assignedTo?: {
    id: string;
    fullName: string;
    email?: string | null;
  } | null;
  ride?: {
    id: string;
    status: string;
  } | null;
};

export type EscalationRuleRecord = {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  thresholdHours: number;
  action: string;
  targetRole: string;
  enabled: boolean;
  lastRunAt?: string | null;
  lastActionCount?: number;
};

export type ScheduledBroadcastRecord = {
  id: string;
  title: string;
  body: string;
  targetAudience: "all" | "riders" | "passengers" | "zone" | "inactive_riders" | "new_passengers";
  targetZone?: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentCount?: number;
  retryCount?: number;
  lastRunAt?: string | null;
  lastError?: string | null;
  createdAt: string;
};

export type OpsJobStatus = {
  broadcasts: {
    id?: string;
    lastStartedAt?: string | null;
    lastFinishedAt?: string | null;
    lastError?: string | null;
    lastStats?: { processed?: number; sent?: number; failed?: number } | null;
    pendingDue?: number;
    failed?: number;
  } | null;
  escalations: {
    id?: string;
    lastStartedAt?: string | null;
    lastFinishedAt?: string | null;
    lastError?: string | null;
    lastStats?: { rules?: number; actions?: number } | null;
  } | null;
};
