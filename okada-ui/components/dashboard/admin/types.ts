import { LayoutDashboard } from "lucide-react";

export type AdminConsoleScreen =
  | "dashboard"
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
  | "ratings"
  | "promotions"
  | "zones"
  | "supportTickets"
  | "sosIncidents"
  | "notifications"
  | "reports"
  | "auditLogs"
  | "settings"
  | "paymentMethods"
  | "integrations"
  | "taxesCompliance"
  | "settingsNotifications"
  | "admins"
  | "escalationRules";

export type RideRecord = {
  id: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  currency: string;
  estimatedFare: string | number | null;
  finalFare: string | number | null;
  promoDiscount: string | number | null;
  referralDiscount: string | number | null;
  platformCommission: string | number | null;
  createdAt: string;
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
  };
};

export type RiderRecord = {
  id: string;
  displayCode: string;
  onlineStatus: boolean;
  city: string | null;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  lastLocationMocked?: boolean;
  lastLocationMockedAt?: string | null;
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
  group: "main" | "finance" | "system";
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
};

export type ScheduledBroadcastRecord = {
  id: string;
  title: string;
  body: string;
  targetAudience: "all" | "riders" | "passengers" | "zone";
  targetZone?: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentCount?: number;
  createdAt: string;
};
