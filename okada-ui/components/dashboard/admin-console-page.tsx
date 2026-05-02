"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  Bike,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  Tag,
  User,
  Users
} from "lucide-react";
import { LiveOperationsTable } from "@/components/dashboard/live-operations-table";
import { PlatformHealthCard } from "@/components/dashboard/platform-health-card";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { OperationsMap } from "@/components/maps/operations-map";
import { fetchJson, requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import type { LiveRideRecord } from "@/lib/contracts";

export type AdminConsoleScreen =
  | "dashboard"
  | "rides"
  | "riders"
  | "passengers"
  | "payments"
  | "ratings"
  | "promotions"
  | "settings"
  | "admins";

type RideRecord = {
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

type PassengerRecord = {
  id: string;
  userId: string;
  referralCode: string;
  defaultServiceCity: string | null;
  preferredPayment: string | null;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
    preferredCurrency: string;
    role: string;
  };
};

type RiderRecord = {
  id: string;
  displayCode: string;
  onlineStatus: boolean;
  city: string | null;
  currentLatitude: string | number | null;
  currentLongitude: string | number | null;
  serviceZone: {
    id: string;
    name: string;
  } | null;
  user: {
    fullName: string;
    phoneE164: string;
    preferredCurrency: string;
  };
};

type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  currency: string;
  isActive: boolean;
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

type AdminAccountRecord = {
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

type AdminPermissionsRecord = {
  roles: Record<string, string[]>;
};

type AdminModulesRecord = {
  modules: string[];
};

type AdminNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  screen: AdminConsoleScreen;
  group: "main" | "finance" | "system";
  hint: string;
  badge?: string;
};

type AdminScreenMeta = {
  title: string;
  eyebrow: string;
  description: string;
  searchLabel: string;
  quickActionLabel: string;
  quickActionHref: string;
  quickActionNote: string;
};

type AdminHighlight = {
  label: string;
  value: string;
};

type WalletTransactionRecord = {
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

type PayoutRequestRecord = {
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

type AdminRatingRecord = {
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

type AdminIncidentRecord = {
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

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();

  if (["completed", "paid", "captured", "posted", "approved"].includes(normalized)) {
    return "success";
  }

  if (
    ["searching", "assigned", "arriving", "arrived", "started", "pending", "requested", "reviewing", "processing"].includes(
      normalized
    )
  ) {
    return "warning";
  }

  if (["failed", "rejected", "cancelled", "reversed"].includes(normalized)) {
    return "danger";
  }

  return "neutral";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function withQueryString(path: string, entries: Record<string, string>) {
  const searchParams = new URLSearchParams();

  Object.entries(entries).forEach(([key, value]) => {
    if (value.trim()) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function AccessState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <ImmersivePage className="exact-admin-page">
      <div className="flow-auth-wall">
        <div className="flow-auth-wall-card">
          <p className="workspace-tag">admin access</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="button-row">
            <a href={actionHref} className="button">
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </ImmersivePage>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function AdminSectionIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="exact-admin-section">
      <div className="exact-admin-heading">
        <p className="exact-admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

function AdminSidebarPulse({
  currency,
  activeTrips,
  activeRiders,
  totalRevenue,
  zones
}: {
  currency: string;
  activeTrips: number;
  activeRiders: number;
  totalRevenue: number;
  zones: number;
}) {
  return (
    <section className="exact-admin-sidebar-card">
      <p className="exact-admin-sidebar-card-eyebrow">Platform pulse</p>
      <h3>Live network snapshot</h3>
      <div className="exact-admin-sidebar-metrics">
        <div>
          <span>Trips in motion</span>
          <strong>{activeTrips}</strong>
        </div>
        <div>
          <span>Riders online</span>
          <strong>{activeRiders}</strong>
        </div>
        <div>
          <span>Revenue captured</span>
          <strong>{formatMoney(currency, totalRevenue)}</strong>
        </div>
        <div>
          <span>Service zones</span>
          <strong>{zones}</strong>
        </div>
      </div>
    </section>
  );
}

export function AdminConsolePage({
  screen = "dashboard"
}: {
  screen?: AdminConsoleScreen;
}) {
  const { session, status, signOut } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = session?.user.role === "admin";
  const [adminForm, setAdminForm] = useState({
    fullName: "",
    email: "",
    phoneCountryCode: "+233",
    phoneLocal: "",
    phoneE164: "",
    preferredCurrency: "GHS",
    password: "",
    title: "",
    permissions: ""
  });
  const [promoteForm, setPromoteForm] = useState({
    passengerUserId: "",
    email: "",
    password: "",
    title: "",
    permissions: ""
  });
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [ratingRiderFilter, setRatingRiderFilter] = useState("");
  const [ratingRideFilter, setRatingRideFilter] = useState("");
  const [ratingFromDateFilter, setRatingFromDateFilter] = useState("");
  const [ratingToDateFilter, setRatingToDateFilter] = useState("");
  const [payoutRejectionReasons, setPayoutRejectionReasons] = useState<Record<string, string>>({});
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("");
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("");

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: status === "authenticated",
    refetchInterval: 10_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: status === "authenticated",
    refetchInterval: 10_000
  });

  const passengersQuery = useQuery({
    queryKey: ["passengers"],
    queryFn: () => fetchJson<PassengerRecord[]>("/bootstrap/passengers?limit=100"),
    enabled: status === "authenticated",
    refetchInterval: 15_000
  });

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZoneRecord[]>("/bootstrap/service-zones?limit=100"),
    enabled: status === "authenticated"
  });

  const adminAccountsQuery = useQuery({
    queryKey: ["admin-accounts", session?.token],
    queryFn: () =>
      requestJson<AdminAccountRecord[]>("/admin/accounts", {
        token: session?.token
      }),
    enabled:
      status === "authenticated" &&
      isAdmin &&
      (screen === "admins" || screen === "settings")
  });

  const adminPermissionsQuery = useQuery({
    queryKey: ["admin-permissions", session?.token],
    queryFn: () =>
      requestJson<AdminPermissionsRecord>("/admin/permissions", {
        token: session?.token
      }),
    enabled: status === "authenticated" && isAdmin && screen === "settings"
  });

  const adminModulesQuery = useQuery({
    queryKey: ["admin-modules", session?.token],
    queryFn: () =>
      requestJson<AdminModulesRecord>("/admin/modules", {
        token: session?.token
      }),
    enabled: status === "authenticated" && isAdmin && screen === "settings"
  });

  const walletTransactionsPath = useMemo(
    () =>
      withQueryString("/admin/payments/wallet-transactions", {
        status: transactionStatusFilter,
        type: transactionTypeFilter
      }),
    [transactionStatusFilter, transactionTypeFilter]
  );

  const payoutRequestsPath = useMemo(
    () =>
      withQueryString("/admin/payments/payout-requests", {
        status: payoutStatusFilter
      }),
    [payoutStatusFilter]
  );

  const ratingsPath = useMemo(
    () =>
      withQueryString("/admin/ratings", {
        riderId: ratingRiderFilter,
        rideId: ratingRideFilter,
        fromDate: ratingFromDateFilter,
        toDate: ratingToDateFilter
      }),
    [ratingFromDateFilter, ratingRideFilter, ratingRiderFilter, ratingToDateFilter]
  );

  const incidentsPath = useMemo(
    () =>
      withQueryString("/admin/incidents", {
        status: incidentStatusFilter,
        severity: incidentSeverityFilter
      }),
    [incidentSeverityFilter, incidentStatusFilter]
  );

  const walletTransactionsQuery = useQuery({
    queryKey: ["admin-wallet-transactions", session?.token, transactionStatusFilter, transactionTypeFilter],
    queryFn: () =>
      requestJson<WalletTransactionRecord[]>(walletTransactionsPath, {
        token: session?.token
      }),
    enabled: status === "authenticated" && isAdmin && screen === "payments"
  });

  const payoutRequestsQuery = useQuery({
    queryKey: ["admin-payout-requests", session?.token, payoutStatusFilter],
    queryFn: () =>
      requestJson<PayoutRequestRecord[]>(payoutRequestsPath, {
        token: session?.token
      }),
    enabled: status === "authenticated" && isAdmin && screen === "payments"
  });

  const ratingsQuery = useQuery({
    queryKey: [
      "admin-ratings",
      session?.token,
      ratingRiderFilter,
      ratingRideFilter,
      ratingFromDateFilter,
      ratingToDateFilter
    ],
    queryFn: () =>
      requestJson<AdminRatingRecord[]>(ratingsPath, {
        token: session?.token
      }),
    enabled:
      status === "authenticated" &&
      isAdmin &&
      (screen === "payments" || screen === "ratings")
  });

  const incidentsQuery = useQuery({
    queryKey: ["admin-incidents", session?.token, incidentStatusFilter, incidentSeverityFilter],
    queryFn: () =>
      requestJson<AdminIncidentRecord[]>(incidentsPath, {
        token: session?.token
      }),
    enabled: status === "authenticated" && isAdmin && screen === "ratings"
  });

  const rides = ridesQuery.data ?? [];
  const riders = ridersQuery.data ?? [];
  const passengers = passengersQuery.data ?? [];
  const zones = zonesQuery.data ?? [];
  const walletTransactions = walletTransactionsQuery.data ?? [];
  const payoutRequests = payoutRequestsQuery.data ?? [];
  const ratings = ratingsQuery.data ?? [];
  const incidents = incidentsQuery.data ?? [];

  const rows = useMemo<LiveRideRecord[]>(
    () =>
      rides.map((ride) => ({
        id: ride.id,
        code: ride.id.slice(-6).toUpperCase(),
        riderName: ride.rider?.user.fullName ?? "Unassigned",
        passengerName: ride.passenger.user.fullName,
        status: ride.status as LiveRideRecord["status"],
        pickupLabel: ride.pickupAddress,
        destinationLabel: ride.destinationAddress,
        requestedAt: ride.createdAt
      })),
    [rides]
  );

  const activeTrips = rides.filter((ride) =>
    ["searching", "assigned", "arriving", "arrived", "started"].includes(ride.status)
  );
  const completedTrips = rides.filter((ride) => ride.status === "completed");
  const cancelledTrips = rides.filter((ride) => ride.status === "cancelled");
  const activeRiders = riders.filter((rider) => rider.onlineStatus);
  const ridersWithCoords = riders.filter(
    (rider) => rider.currentLatitude !== null && rider.currentLongitude !== null
  );
  const totalRevenue = completedTrips.reduce(
    (sum, ride) => sum + parseNumber(ride.finalFare ?? ride.estimatedFare),
    0
  );
  const activeTripValue = activeTrips.reduce(
    (sum, ride) => sum + parseNumber(ride.estimatedFare ?? ride.finalFare),
    0
  );
  const averageCompletedFare =
    completedTrips.length === 0 ? 0 : totalRevenue / completedTrips.length;
  const totalCommission = completedTrips.reduce(
    (sum, ride) => sum + parseNumber(ride.platformCommission),
    0
  );
  const promoAdjustedTrips = rides.filter(
    (ride) => parseNumber(ride.promoDiscount) > 0 || parseNumber(ride.referralDiscount) > 0
  );
  const promoSpend = rides.reduce((sum, ride) => sum + parseNumber(ride.promoDiscount), 0);
  const referralSpend = rides.reduce((sum, ride) => sum + parseNumber(ride.referralDiscount), 0);
  const postedWalletTransactions = walletTransactions.filter((transaction) => transaction.status === "POSTED");
  const pendingWalletTransactions = walletTransactions.filter((transaction) => transaction.status === "PENDING");
  const failedWalletTransactions = walletTransactions.filter(
    (transaction) => transaction.status === "FAILED" || transaction.status === "REVERSED"
  );
  const ridesNeedingDispatch = rides.filter((ride) => ["searching", "assigned"].includes(ride.status));
  const ridesAwaitingPickup = rides.filter((ride) => ["arriving", "arrived"].includes(ride.status));
  const ridesInProgress = rides.filter((ride) => ride.status === "started");
  const pendingPayoutRequests = payoutRequests.filter((request) =>
    ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"].includes(request.status)
  );
  const paidPayoutRequests = payoutRequests.filter((request) => request.status === "PAID");
  const payoutOutflow = paidPayoutRequests.reduce(
    (sum, request) => sum + parseNumber(request.amount),
    0
  );
  const zonesWithActiveRiders = zones.map((zone) => ({
    ...zone,
    activeRiderCount: riders.filter(
      (rider) => rider.onlineStatus && rider.serviceZone?.id === zone.id
    ).length
  }));
  const promotionZoneSnapshot = Object.entries(
    promoAdjustedTrips.reduce<Record<string, number>>((accumulator, ride) => {
      const key = ride.serviceZone?.name ?? "Unassigned zone";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const topDiscountedRides = promoAdjustedTrips
    .slice()
    .sort(
      (left, right) =>
        parseNumber(right.promoDiscount) +
        parseNumber(right.referralDiscount) -
        (parseNumber(left.promoDiscount) + parseNumber(left.referralDiscount))
    )
    .slice(0, 6);
  const rideZoneSnapshot = Object.entries(
    rides.reduce<Record<string, number>>((accumulator, ride) => {
      const key = ride.serviceZone?.name ?? "Unassigned zone";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
  const recentPassengers = passengers.slice(0, 6);
  const adminRoleEntries = Object.entries(adminPermissionsQuery.data?.roles ?? {});
  const adminModules = adminModulesQuery.data?.modules ?? [];
  const rolePermissionSnapshot = adminRoleEntries
    .slice()
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 6);
  const adminTitleSnapshot = Object.entries(
    (adminAccountsQuery.data ?? []).reduce<Record<string, number>>((accumulator, admin) => {
      const title = admin.title?.trim() || "Untitled admin";
      accumulator[title] = (accumulator[title] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
  const recentRideTimeline = rides
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 6);

  const passengerCitySnapshot = Object.entries(
    passengers.reduce<Record<string, number>>((accumulator, passenger) => {
      const key = passenger.defaultServiceCity?.trim() || "No default city";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const riderCitySnapshot = Object.entries(
    riders.reduce<Record<string, number>>((accumulator, rider) => {
      const key = rider.city?.trim() || "No city";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const riderZoneSnapshot = Object.entries(
    riders.reduce<Record<string, number>>((accumulator, rider) => {
      const key = rider.serviceZone?.name ?? "No zone";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const riderRideLoadSnapshot = Object.entries(
    rides.reduce<Record<string, number>>((accumulator, ride) => {
      const key = ride.rider?.user.fullName ?? "Unassigned";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .filter(([name]) => name !== "Unassigned")
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
  const passengerDemandSnapshot = Object.entries(
    rides.reduce<Record<string, number>>((accumulator, ride) => {
      const key = ride.passenger.user.fullName;
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);

  const mapMarkers = activeRiders
    .filter((rider) => rider.currentLatitude !== null && rider.currentLongitude !== null)
    .map((rider) => ({
      id: rider.id,
      position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [
        number,
        number
      ],
      label: rider.user.fullName,
      variant: "driver" as const
    }));

  const dashboardMetrics = [
    {
      label: "Total trips",
      value: `${rides.length}`,
      trend: `${completedTrips.length} completed`
    },
    {
      label: "Active rides",
      value: `${activeTrips.length}`,
      trend: `${cancelledTrips.length} cancelled`
    },
    {
      label: "Active riders",
      value: `${activeRiders.length}`,
      trend: `${riders.length - activeRiders.length} offline`
    },
    {
      label: "Revenue today",
      value: formatMoney(session?.user.preferredCurrency ?? "GHS", totalRevenue),
      trend: formatMoney(session?.user.preferredCurrency ?? "GHS", totalCommission) + " commission"
    },
    {
      label: "Promo-assisted rides",
      value: `${promoAdjustedTrips.length}`,
      trend: formatMoney(session?.user.preferredCurrency ?? "GHS", promoSpend + referralSpend) + " discount"
    },
    {
      label: "Service zones",
      value: `${zones.length}`,
      trend: `${zones.filter((zone) => zone.isActive).length} active zones`
    }
  ];

  const navItems: AdminNavItem[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "main",
        hint: "Overview and live pulse",
        badge: `${activeTrips.length}`
      },
      {
        label: "Rides",
        href: "/admin/rides",
        icon: Bike,
        screen: "rides",
        group: "main",
        hint: "Trip dispatch and history",
        badge: `${completedTrips.length}`
      },
      {
        label: "Riders",
        href: "/admin/riders",
        icon: User,
        screen: "riders",
        group: "main",
        hint: "Supply and availability",
        badge: `${activeRiders.length}`
      },
      {
        label: "Passengers",
        href: "/admin/passengers",
        icon: Users,
        screen: "passengers",
        group: "main",
        hint: "Demand and retention",
        badge: `${passengers.length}`
      },
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        screen: "payments",
        group: "finance",
        hint: "Wallets, payouts, ledger",
        badge: `${pendingPayoutRequests.length}`
      },
      {
        label: "Ratings",
        href: "/admin/ratings",
        icon: FileText,
        screen: "ratings",
        group: "finance",
        hint: "Submission verification",
        badge: `${ratings.length}`
      },
      {
        label: "Promotions",
        href: "/admin/promotions",
        icon: Tag,
        screen: "promotions",
        group: "finance",
        hint: "Discounts and referrals",
        badge: `${promoAdjustedTrips.length}`
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        screen: "settings",
        group: "system",
        hint: "Zones, pricing, modules",
        badge: `${zones.filter((zone) => zone.isActive).length}`
      },
      {
        label: "Admins",
        href: "/admin/admins",
        icon: ShieldAlert,
        screen: "admins",
        group: "system",
        hint: "Roles and account control",
        badge: `${adminAccountsQuery.data?.length ?? 0}`
      }
    ],
    [
      activeRiders.length,
      activeTrips.length,
      adminAccountsQuery.data?.length,
      completedTrips.length,
      passengers.length,
      pendingPayoutRequests.length,
      promoAdjustedTrips.length,
      ratings.length,
      zones
    ]
  );

  const navGroups = [
    { label: "Main", key: "main" as const },
    { label: "Finance", key: "finance" as const },
    { label: "System", key: "system" as const }
  ];

  const screenMeta: Record<AdminConsoleScreen, AdminScreenMeta> = {
    dashboard: {
      eyebrow: "Admin dashboard",
      title: "Overview",
      description: "Real-time metrics sourced from live backend rides, riders, passengers, and service zones.",
      searchLabel: "Search rides, riders, or passengers...",
      quickActionLabel: "Open dispatch board",
      quickActionHref: "/admin/rides",
      quickActionNote: "Jump straight into operational ride flow."
    },
    rides: {
      eyebrow: "Dispatch operations",
      title: "Rides",
      description: "Track live, completed, and cancelled rides from the persisted dispatch feed.",
      searchLabel: "Search ride codes, riders, or passengers...",
      quickActionLabel: "See rider supply",
      quickActionHref: "/admin/riders",
      quickActionNote: "Compare ride demand against online rider availability."
    },
    riders: {
      eyebrow: "Supply management",
      title: "Riders",
      description: "Monitor rider availability, city coverage, and live coordinate activity.",
      searchLabel: "Search riders or service zones...",
      quickActionLabel: "Review payouts",
      quickActionHref: "/admin/payments",
      quickActionNote: "Move from supply health into rider wallet and payout operations."
    },
    passengers: {
      eyebrow: "Demand management",
      title: "Passengers",
      description: "Review passenger profiles, referral codes, and city distribution from the live backend.",
      searchLabel: "Search passengers or referral codes...",
      quickActionLabel: "Open promotions",
      quickActionHref: "/admin/promotions",
      quickActionNote: "Check what incentives are influencing passenger activity."
    },
    payments: {
      eyebrow: "Finance operations",
      title: "Payments",
      description: "Review revenue flow from completed rides and active trip value moving through the platform.",
      searchLabel: "Search payment and fare records...",
      quickActionLabel: "Open ratings",
      quickActionHref: "/admin/ratings",
      quickActionNote: "Cross-check payment records against verified rider rating submissions."
    },
    ratings: {
      eyebrow: "Quality operations",
      title: "Ratings",
      description: "Verify passenger rating submissions with rider, ride, and date-level filters.",
      searchLabel: "Search rider, ride, or rating records...",
      quickActionLabel: "View payments",
      quickActionHref: "/admin/payments",
      quickActionNote: "Compare rating quality signals with payout and settlement flow."
    },
    promotions: {
      eyebrow: "Growth controls",
      title: "Promotions",
      description: "Track promo-assisted trips and referral-driven discounts from live ride records.",
      searchLabel: "Search promo-adjusted rides or zones...",
      quickActionLabel: "View finance",
      quickActionHref: "/admin/payments",
      quickActionNote: "See how incentives are affecting platform cashflow."
    },
    settings: {
      eyebrow: "Platform controls",
      title: "Settings",
      description: "Review service-zone pricing, admin permissions, and platform modules from live backend config.",
      searchLabel: "Search zones, modules, or permissions...",
      quickActionLabel: "Manage admin roles",
      quickActionHref: "/admin/admins",
      quickActionNote: "Update the people who can operate platform controls."
    },
    admins: {
      eyebrow: "Access control",
      title: "Admins",
      description: "Create and review admin accounts through an authenticated admin-only workflow.",
      searchLabel: "Search admin accounts...",
      quickActionLabel: "Open settings",
      quickActionHref: "/admin/settings",
      quickActionNote: "Go from account permissions into platform-level configuration."
    }
  };

  const eligiblePassengers = useMemo(
    () => passengers.filter((passenger) => passenger.user.role.toLowerCase() === "passenger"),
    [passengers]
  );

  const screenHighlights: Record<AdminConsoleScreen, AdminHighlight[]> = {
    dashboard: [
      { label: "Live rides", value: `${activeTrips.length}` },
      { label: "Riders online", value: `${activeRiders.length}` },
      { label: "Revenue", value: formatMoney(session?.user.preferredCurrency ?? "GHS", totalRevenue) }
    ],
    rides: [
      { label: "Active", value: `${activeTrips.length}` },
      { label: "Completed", value: `${completedTrips.length}` },
      { label: "Cancelled", value: `${cancelledTrips.length}` }
    ],
    riders: [
      { label: "Online", value: `${activeRiders.length}` },
      { label: "Mapped", value: `${ridersWithCoords.length}` },
      { label: "Zones covered", value: `${zonesWithActiveRiders.filter((zone) => zone.activeRiderCount > 0).length}` }
    ],
    passengers: [
      { label: "Passenger base", value: `${passengers.length}` },
      { label: "Cities tracked", value: `${passengerCitySnapshot.length}` },
      { label: "Recent profiles", value: `${recentPassengers.length}` }
    ],
    payments: [
      { label: "Pending payouts", value: `${pendingPayoutRequests.length}` },
      { label: "Failed items", value: `${failedWalletTransactions.length}` },
      { label: "Posted volume", value: formatMoney(session?.user.preferredCurrency ?? "GHS", postedWalletTransactions.reduce((sum, transaction) => sum + parseNumber(transaction.amount), 0)) }
    ],
    ratings: [
      { label: "Total ratings", value: `${ratings.length}` },
      { label: "Average score", value: ratings.length === 0 ? "0.0" : (ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(1) },
      { label: "With review text", value: `${ratings.filter((rating) => Boolean(rating.review?.body)).length}` }
    ],
    promotions: [
      { label: "Promo rides", value: `${promoAdjustedTrips.length}` },
      { label: "Promo spend", value: formatMoney(session?.user.preferredCurrency ?? "GHS", promoSpend) },
      { label: "Referral spend", value: formatMoney(session?.user.preferredCurrency ?? "GHS", referralSpend) }
    ],
    settings: [
      { label: "Active zones", value: `${zones.filter((zone) => zone.isActive).length}` },
      { label: "Role templates", value: `${adminRoleEntries.length}` },
      { label: "Modules", value: `${adminModules.length}` }
    ],
    admins: [
      { label: "Admin accounts", value: `${adminAccountsQuery.data?.length ?? 0}` },
      { label: "Eligible passengers", value: `${eligiblePassengers.length}` },
      { label: "Permission families", value: `${adminRoleEntries.length}` }
    ]
  };

  const createAdminMutation = useMutation({
    mutationFn: async () =>
      requestJson("/admin/accounts", {
        method: "POST",
        token: session?.token,
        body: JSON.stringify({
          ...adminForm,
          permissions: adminForm.permissions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      }),
    onSuccess: async () => {
      setAdminForm({
        fullName: "",
        email: "",
        phoneCountryCode: "+233",
        phoneLocal: "",
        phoneE164: "",
        preferredCurrency: "GHS",
        password: "",
        title: "",
        permissions: ""
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-accounts", session?.token] });
    }
  });

  const selectedPassenger =
    eligiblePassengers.find((passenger) => passenger.userId === promoteForm.passengerUserId) ?? null;

  const promotePassengerMutation = useMutation({
    mutationFn: async () =>
      requestJson("/admin/accounts/promote", {
        method: "POST",
        token: session?.token,
        body: JSON.stringify({
          ...promoteForm,
          permissions: promoteForm.permissions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        })
      }),
    onSuccess: async () => {
      setPromoteForm({
        passengerUserId: "",
        email: "",
        password: "",
        title: "",
        permissions: ""
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-accounts", session?.token] }),
        queryClient.invalidateQueries({ queryKey: ["passengers"] })
      ]);
    }
  });

  const payoutReviewMutation = useMutation({
    mutationFn: async ({
      payoutRequestId,
      action,
      rejectionReason
    }: {
      payoutRequestId: string;
      action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject";
      rejectionReason?: string;
    }) =>
      requestJson(`/admin/payments/payout-requests/${payoutRequestId}`, {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({
          action,
          rejectionReason
        })
      }),
    onSuccess: async (_, variables) => {
      if (variables.action === "reject") {
        setPayoutRejectionReasons((current) => ({
          ...current,
          [variables.payoutRequestId]: ""
        }));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-payout-requests", session?.token] }),
        queryClient.invalidateQueries({ queryKey: ["admin-wallet-transactions", session?.token] })
      ]);
    }
  });

  const incidentReviewMutation = useMutation({
    mutationFn: async ({
      incidentId,
      status
    }: {
      incidentId: string;
      status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED";
    }) =>
      requestJson(`/admin/incidents/${incidentId}`, {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({
          status
        })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-incidents", session?.token] });
    }
  });

  if (status === "loading") {
    return (
      <AccessState
        title="Loading admin workspace"
        body="Checking your admin session before opening live operations."
        actionLabel="Go to admin login"
        actionHref="/admin/login"
      />
    );
  }

  if (status !== "authenticated" || !isAdmin) {
    return (
      <AccessState
        title="Admin sign in required"
        body="Use an admin account to access the live operations console."
        actionLabel="Go to admin login"
        actionHref="/admin/login"
      />
    );
  }

  const content =
    screen === "dashboard" ? (
      <>
        <AdminSectionIntro
          eyebrow="Admin dashboard"
          title={screenMeta.dashboard.title}
          description={screenMeta.dashboard.description}
        />

        <section className="exact-admin-section">
          <div className="exact-admin-kpis exact-admin-kpis-expanded">
            {dashboardMetrics.map((metric) => (
              <article key={metric.label} className="exact-admin-kpi">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.trend}</small>
              </article>
            ))}
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Operations canvas</h3>
                  <p>Live rider coordinates from the backend availability feed.</p>
                </div>
              </div>
              <div className="exact-admin-map">
                <OperationsMap
                  center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                  zoom={mapMarkers.length > 0 ? 11 : 6}
                  markers={mapMarkers}
                  emptyTitle="No live rider coordinates yet."
                  emptyDescription="Use the rider availability controls to bring riders online with coordinates across Accra."
                />
              </div>
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Dispatch priorities</h3>
                  <p>Where the operations team should focus right now.</p>
                </div>
              </div>
              <div className="exact-admin-priority-grid">
                <article className="exact-admin-priority-card">
                  <span>Needs dispatch</span>
                  <strong>{ridesNeedingDispatch.length}</strong>
                  <small>Searching or newly assigned rides still waiting for smooth handoff.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Awaiting pickup</span>
                  <strong>{ridesAwaitingPickup.length}</strong>
                  <small>Riders are approaching or already at pickup points.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Trips in progress</span>
                  <strong>{ridesInProgress.length}</strong>
                  <small>Active journeys already moving through the network.</small>
                </article>
              </div>
            </section>

            <PlatformHealthCard />
          </div>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Live trips</h3>
                <p>Trips currently in flight across the dispatch network.</p>
              </div>
            </div>
            <LiveOperationsTable
              rows={rows.filter((row) =>
                ["searching", "assigned", "arriving", "arrived", "started"].includes(row.status)
              )}
            />
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Ride status mix</h3>
                <p>Quick pressure read across dispatch lanes.</p>
              </div>
            </div>
            <ul className="workbench-list exact-admin-status-list">
              <li>
                <span>Searching or assigned</span>
                <strong>{ridesNeedingDispatch.length}</strong>
              </li>
              <li>
                <span>Arriving or arrived</span>
                <strong>{ridesAwaitingPickup.length}</strong>
              </li>
              <li>
                <span>Started rides</span>
                <strong>{ridesInProgress.length}</strong>
              </li>
              <li>
                <span>Completed rides</span>
                <strong>{completedTrips.length}</strong>
              </li>
            </ul>
          </section>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Service zone coverage</h3>
                <p>Live zones, current pricing, and the riders currently online inside each zone.</p>
              </div>
            </div>
            {zonesWithActiveRiders.length === 0 ? (
              <EmptyCard
                title="No service zones found."
                body="Create or sync service zones and they will appear here with live rider coverage."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>City</th>
                      <th>Currency</th>
                      <th>Base fare</th>
                      <th>Min fare</th>
                      <th>Online riders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zonesWithActiveRiders.map((zone) => (
                      <tr key={zone.id}>
                        <td>{zone.name}</td>
                        <td>{zone.city}</td>
                        <td>{zone.currency}</td>
                        <td>{formatMoney(zone.currency, zone.baseFare)}</td>
                        <td>{formatMoney(zone.currency, zone.minimumFare)}</td>
                        <td>{zone.activeRiderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Zone demand pattern</h3>
                <p>Where ride activity is currently concentrating by service zone.</p>
              </div>
            </div>
            {rideZoneSnapshot.length === 0 ? (
              <EmptyCard
                title="No ride activity yet."
                body="Zone demand will appear here as soon as rides start flowing through the backend."
              />
            ) : (
              <ul className="workbench-list">
                {rideZoneSnapshot.map(([zoneName, rideCount]) => (
                  <li key={zoneName}>
                    <span>{zoneName}</span>
                    <strong>{rideCount}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    ) : screen === "rides" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.rides.eyebrow}</p>
            <h1>{screenMeta.rides.title}</h1>
            <p>{screenMeta.rides.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total rides</span>
              <strong>{rides.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Live rides</span>
              <strong>{activeTrips.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Completed rides</span>
              <strong>{completedTrips.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Cancelled rides</span>
              <strong>{cancelledTrips.length}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Ride timeline</h3>
                <p>All persisted rides flowing through the backend ride service.</p>
              </div>
            </div>
            <LiveOperationsTable rows={rows} />
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Dispatch queue</h3>
                  <p>Operational lanes that need attention first.</p>
                </div>
              </div>
              <div className="exact-admin-priority-grid">
                <article className="exact-admin-priority-card">
                  <span>Searching queue</span>
                  <strong>{rides.filter((ride) => ride.status === "searching").length}</strong>
                  <small>Passengers still waiting for rider discovery.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Assigned queue</span>
                  <strong>{rides.filter((ride) => ride.status === "assigned").length}</strong>
                  <small>Rides that have a rider but still need dispatch confidence.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Arrival queue</span>
                  <strong>{ridesAwaitingPickup.length}</strong>
                  <small>Trips close to pickup completion and likely to flip into live travel soon.</small>
                </article>
              </div>
            </section>

            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Recent ride activity</h3>
                  <p>The freshest ride records entering the system.</p>
                </div>
              </div>
              {recentRideTimeline.length === 0 ? (
                <EmptyCard
                  title="No rides recorded yet."
                  body="The latest ride activity will start appearing here once ride creation begins."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {recentRideTimeline.map((ride) => (
                    <li key={ride.id}>
                      <span>
                        {ride.passenger.user.fullName}
                        {ride.rider?.user.fullName ? ` with ${ride.rider.user.fullName}` : " awaiting rider"}
                      </span>
                      <strong>{formatEnumLabel(ride.status)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Ride pressure snapshot</h3>
                <p>Operational state split for quick dispatch triage.</p>
              </div>
            </div>
            <ul className="workbench-list">
              <li>
                <span>Searching or unassigned</span>
                <strong>{rides.filter((ride) => ["searching", "assigned"].includes(ride.status)).length}</strong>
              </li>
              <li>
                <span>Arriving or arrived</span>
                <strong>{rides.filter((ride) => ["arriving", "arrived"].includes(ride.status)).length}</strong>
              </li>
              <li>
                <span>Started trips</span>
                <strong>{rides.filter((ride) => ride.status === "started").length}</strong>
              </li>
              <li>
                <span>Completed today snapshot</span>
                <strong>{completedTrips.length}</strong>
              </li>
            </ul>
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Zone trip concentration</h3>
                <p>Top zones currently driving ride volume.</p>
              </div>
            </div>
            {rideZoneSnapshot.length === 0 ? (
              <EmptyCard
                title="No zones with rides yet."
                body="Ride concentration by service zone will show up here as soon as trips are persisted."
              />
            ) : (
              <ul className="workbench-list">
                {rideZoneSnapshot.map(([zoneName, rideCount]) => (
                  <li key={zoneName}>
                    <span>{zoneName}</span>
                    <strong>{rideCount}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    ) : screen === "riders" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.riders.eyebrow}</p>
            <h1>{screenMeta.riders.title}</h1>
            <p>{screenMeta.riders.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total riders</span>
              <strong>{riders.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Online riders</span>
              <strong>{activeRiders.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Offline riders</span>
              <strong>{Math.max(0, riders.length - activeRiders.length)}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Live coordinates</span>
              <strong>{ridersWithCoords.length}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Rider map</h3>
                <p>Online riders with coordinates plotted from the live availability feed.</p>
              </div>
            </div>
            <div className="exact-admin-map">
              <OperationsMap
                center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                zoom={mapMarkers.length > 0 ? 11 : 6}
                markers={mapMarkers}
                emptyTitle="No rider coordinates yet."
                emptyDescription="Riders appear here after their availability feed starts sending coordinates."
              />
            </div>
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Supply pressure</h3>
                  <p>Quick read on rider readiness across the network.</p>
                </div>
              </div>
              <div className="exact-admin-priority-grid">
                <article className="exact-admin-priority-card">
                  <span>Online supply</span>
                  <strong>{activeRiders.length}</strong>
                  <small>Riders currently ready to take work.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Mapped riders</span>
                  <strong>{ridersWithCoords.length}</strong>
                  <small>Profiles already sending usable location coordinates.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Unassigned zones</span>
                  <strong>{riders.filter((rider) => !rider.serviceZone?.id).length}</strong>
                  <small>Riders that still need clearer zone alignment for dispatch.</small>
                </article>
              </div>
            </section>

            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>City coverage</h3>
                  <p>How rider supply is clustering by city.</p>
                </div>
              </div>
              {riderCitySnapshot.length === 0 ? (
                <EmptyCard
                  title="No rider city data yet."
                  body="Rider city coverage will appear here as soon as rider profiles are created."
                />
              ) : (
                <ul className="workbench-list">
                  {riderCitySnapshot.slice(0, 6).map(([city, count]) => (
                    <li key={city}>
                      <span>{city}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Rider roster</h3>
                <p>Availability, zone assignment, and contact context.</p>
              </div>
            </div>
            {riders.length === 0 ? (
              <EmptyCard
                title="No riders created yet."
                body="Create riders in the operations lab and they will appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rider</th>
                      <th>Status</th>
                      <th>City</th>
                      <th>Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.map((rider) => (
                      <tr key={rider.id}>
                        <td>
                          <strong>{rider.user.fullName}</strong>
                          <div>{rider.displayCode}</div>
                        </td>
                        <td>
                          <span className={`status-chip ${rider.onlineStatus ? "success" : "neutral"}`}>
                            {rider.onlineStatus ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td>{rider.city ?? "No city"}</td>
                        <td>{rider.serviceZone?.name ?? "No zone"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Zone rider distribution</h3>
                  <p>Where rider headcount is currently concentrated.</p>
                </div>
              </div>
              {riderZoneSnapshot.length === 0 ? (
                <EmptyCard
                  title="No rider zones yet."
                  body="Zone assignment counts will show up here once rider profiles are distributed."
                />
              ) : (
                <ul className="workbench-list">
                  {riderZoneSnapshot.slice(0, 6).map(([zone, count]) => (
                    <li key={zone}>
                      <span>{zone}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Rider trip load</h3>
                  <p>Which riders are carrying the most trip volume so far.</p>
                </div>
              </div>
              {riderRideLoadSnapshot.length === 0 ? (
                <EmptyCard
                  title="No rider trip load yet."
                  body="Trip volume per rider will appear after rides start getting assigned."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {riderRideLoadSnapshot.map(([name, count]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <strong>{count} rides</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </>
    ) : screen === "passengers" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.passengers.eyebrow}</p>
            <h1>{screenMeta.passengers.title}</h1>
            <p>{screenMeta.passengers.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total passengers</span>
              <strong>{passengers.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>With default city</span>
              <strong>{passengers.filter((passenger) => Boolean(passenger.defaultServiceCity)).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Referred accounts</span>
              <strong>{passengers.filter((passenger) => Boolean(passenger.referralCode)).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Passenger-linked rides</span>
              <strong>{new Set(rides.map((ride) => ride.passenger.user.fullName)).size}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Passenger directory</h3>
                <p>Passenger profiles currently persisted in the live backend.</p>
              </div>
            </div>
            {passengers.length === 0 ? (
              <EmptyCard
                title="No passengers found."
                body="Passenger signups or operations-lab provisioning will populate this directory."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Phone</th>
                      <th>Referral</th>
                      <th>Default city</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((passenger) => (
                      <tr key={passenger.id}>
                        <td>{passenger.user.fullName}</td>
                        <td>{passenger.user.phoneE164}</td>
                        <td>{passenger.referralCode}</td>
                        <td>{passenger.defaultServiceCity ?? "Not set"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Demand signals</h3>
                  <p>Quick passenger-side indicators for growth and engagement.</p>
                </div>
              </div>
              <div className="exact-admin-priority-grid">
                <article className="exact-admin-priority-card">
                  <span>Default city set</span>
                  <strong>{passengers.filter((passenger) => Boolean(passenger.defaultServiceCity)).length}</strong>
                  <small>Accounts with enough profile detail for more tailored dispatch experiences.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Referral-coded</span>
                  <strong>{passengers.filter((passenger) => Boolean(passenger.referralCode)).length}</strong>
                  <small>Passenger accounts already participating in referral loops.</small>
                </article>
                <article className="exact-admin-priority-card">
                  <span>Ride-linked passengers</span>
                  <strong>{new Set(rides.map((ride) => ride.passenger.user.fullName)).size}</strong>
                  <small>Passengers with actual ride activity in the current system.</small>
                </article>
              </div>
            </section>

            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>City distribution</h3>
                  <p>Where passengers are currently biased in the saved profile data.</p>
                </div>
              </div>
              {passengerCitySnapshot.length === 0 ? (
                <EmptyCard
                  title="No passenger city data yet."
                  body="Passenger profile cities will show up here once accounts are created."
                />
              ) : (
                <ul className="workbench-list">
                  {passengerCitySnapshot.map(([city, count]) => (
                    <li key={city}>
                      <span>{city}</span>
                      <strong>{count}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Recent passenger activity</h3>
                <p>The newest passenger profiles and where they are anchored.</p>
              </div>
            </div>
            {recentPassengers.length === 0 ? (
              <EmptyCard
                title="No recent passenger profiles yet."
                body="Recent passenger signups will appear here as soon as the first accounts are created."
              />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {recentPassengers.map((passenger) => (
                  <li key={passenger.id}>
                    <span>
                      {passenger.user.fullName}
                      {passenger.defaultServiceCity ? ` - ${passenger.defaultServiceCity}` : " - no city set"}
                    </span>
                    <strong>{passenger.user.phoneE164}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="exact-admin-stack">
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Highest ride demand</h3>
                  <p>Passengers currently showing the strongest ride usage footprint.</p>
                </div>
              </div>
              {passengerDemandSnapshot.length === 0 ? (
                <EmptyCard
                  title="No passenger demand yet."
                  body="Ride demand by passenger will show up here once ride records accumulate."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {passengerDemandSnapshot.map(([name, count]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <strong>{count} rides</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Recent rider-side pairings</h3>
                  <p>A quick look at how current passengers are connecting to supply.</p>
                </div>
              </div>
              {recentRideTimeline.length === 0 ? (
                <EmptyCard
                  title="No ride pairings yet."
                  body="Passenger-to-rider pairings will surface here once trips are being created."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {recentRideTimeline.map((ride) => (
                    <li key={ride.id}>
                      <span>{ride.passenger.user.fullName}</span>
                      <strong>{ride.rider?.user.fullName ?? "Awaiting rider"}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </>
    ) : screen === "ratings" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.ratings.eyebrow}</p>
            <h1>{screenMeta.ratings.title}</h1>
            <p>{screenMeta.ratings.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total ratings</span>
              <strong>{ratings.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Average score</span>
              <strong>
                {ratings.length === 0
                  ? "0.0"
                  : (ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(1)}
              </strong>
            </article>
            <article className="exact-admin-kpi">
              <span>With text review</span>
              <strong>{ratings.filter((rating) => Boolean(rating.review?.body)).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Distinct riders rated</span>
              <strong>{new Set(ratings.map((rating) => rating.rated.id)).size}</strong>
            </article>
          </div>
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Rating filters</h3>
              <p>Filter submissions by rider profile, ride, and date window for operational verification.</p>
            </div>
          </div>
          <div className="exact-admin-payment-filters">
            <div className="field-group">
              <label className="field-label">Rider profile ID</label>
              <input
                className="input"
                value={ratingRiderFilter}
                onChange={(event) => setRatingRiderFilter(event.target.value)}
                placeholder="Filter by rider profile CUID"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Ride ID</label>
              <input
                className="input"
                value={ratingRideFilter}
                onChange={(event) => setRatingRideFilter(event.target.value)}
                placeholder="Filter by ride CUID"
              />
            </div>
            <div className="field-group">
              <label className="field-label">From date</label>
              <input
                className="input"
                type="date"
                value={ratingFromDateFilter}
                onChange={(event) => setRatingFromDateFilter(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="field-label">To date</label>
              <input
                className="input"
                type="date"
                value={ratingToDateFilter}
                onChange={(event) => setRatingToDateFilter(event.target.value)}
              />
            </div>
          </div>
          <div className="exact-admin-payment-filters">
            <div className="field-group">
              <label className="field-label">Incident status</label>
              <select
                className="select"
                value={incidentStatusFilter}
                onChange={(event) => setIncidentStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="ACTIONED">Actioned</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Incident severity</label>
              <select
                className="select"
                value={incidentSeverityFilter}
                onChange={(event) => setIncidentSeverityFilter(event.target.value)}
              >
                <option value="">All severities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </section>

        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Ratings verification ledger</h3>
              <p>Passenger submissions with linked rider and ride records.</p>
            </div>
          </div>
          {ratingsQuery.isLoading ? (
            <div className="status-chip warning">Loading ratings</div>
          ) : ratingsQuery.isError ? (
            <EmptyCard title="Ratings could not be loaded." body={ratingsQuery.error.message} />
          ) : ratings.length === 0 ? (
            <EmptyCard
              title="No ratings matched the current filters."
              body="Passenger rating submissions will appear here after completed rides are rated."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rated rider</th>
                    <th>Ride ID</th>
                    <th>Score</th>
                    <th>Category</th>
                    <th>Review</th>
                    <th>Submitted by</th>
                    <th>Submitted at</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((rating) => (
                    <tr key={rating.id}>
                      <td>
                        <div className="exact-admin-transaction-user">
                          <strong>{rating.rated.fullName}</strong>
                          <span>{rating.rated.riderProfile?.displayCode ?? "No rider code"}</span>
                        </div>
                      </td>
                      <td>{rating.ride.id}</td>
                      <td>{rating.score}/5</td>
                      <td>{rating.category ?? "General"}</td>
                      <td>{rating.review?.body ?? "No written review"}</td>
                      <td>
                        <div className="exact-admin-transaction-user">
                          <strong>{rating.rater.fullName}</strong>
                          <span>{rating.rater.phoneE164}</span>
                        </div>
                      </td>
                      <td>{formatDateTime(rating.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="exact-admin-card wide">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Incident moderation queue</h3>
              <p>Review and action SOS and safety incident submissions from riders and passengers.</p>
            </div>
          </div>
          {incidentsQuery.isLoading ? (
            <div className="status-chip warning">Loading incidents</div>
          ) : incidentsQuery.isError ? (
            <EmptyCard title="Incidents could not be loaded." body={incidentsQuery.error.message} />
          ) : incidents.length === 0 ? (
            <EmptyCard
              title="No incidents matched the current filters."
              body="Incident reports will appear here when users submit SOS or safety reports."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reporter</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Ride</th>
                    <th>Assigned</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>
                        <div className="exact-admin-transaction-user">
                          <strong>{incident.reporter.fullName}</strong>
                          <span>{incident.reporter.phoneE164}</span>
                        </div>
                      </td>
                      <td>{formatEnumLabel(incident.severity)}</td>
                      <td>
                        <span className={`status-chip ${statusTone(incident.status)}`}>
                          {formatEnumLabel(incident.status)}
                        </span>
                      </td>
                      <td>{incident.category}</td>
                      <td>{incident.description}</td>
                      <td>{incident.ride?.id ?? "No ride linked"}</td>
                      <td>{incident.assignedTo?.fullName ?? "Unassigned"}</td>
                      <td>
                        <div className="button-row">
                          {incident.status === "OPEN" ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              disabled={incidentReviewMutation.isPending}
                              onClick={() =>
                                incidentReviewMutation.mutate({
                                  incidentId: incident.id,
                                  status: "UNDER_REVIEW"
                                })
                              }
                            >
                              Review
                            </button>
                          ) : null}
                          {["OPEN", "UNDER_REVIEW"].includes(incident.status) ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              disabled={incidentReviewMutation.isPending}
                              onClick={() =>
                                incidentReviewMutation.mutate({
                                  incidentId: incident.id,
                                  status: "ACTIONED"
                                })
                              }
                            >
                              Actioned
                            </button>
                          ) : null}
                          {["ACTIONED", "UNDER_REVIEW", "OPEN"].includes(incident.status) ? (
                            <button
                              className="button"
                              type="button"
                              disabled={incidentReviewMutation.isPending}
                              onClick={() =>
                                incidentReviewMutation.mutate({
                                  incidentId: incident.id,
                                  status: "RESOLVED"
                                })
                              }
                            >
                              Resolve
                            </button>
                          ) : null}
                          {incident.status !== "CLOSED" ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              disabled={incidentReviewMutation.isPending}
                              onClick={() =>
                                incidentReviewMutation.mutate({
                                  incidentId: incident.id,
                                  status: "CLOSED"
                                })
                              }
                            >
                              Close
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    ) : screen === "promotions" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.promotions.eyebrow}</p>
            <h1>{screenMeta.promotions.title}</h1>
            <p>{screenMeta.promotions.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Promo-assisted rides</span>
              <strong>{promoAdjustedTrips.filter((ride) => parseNumber(ride.promoDiscount) > 0).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Referral-assisted rides</span>
              <strong>{promoAdjustedTrips.filter((ride) => parseNumber(ride.referralDiscount) > 0).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Total promo spend</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", promoSpend)}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Total referral spend</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", referralSpend)}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Growth pressure</h3>
                <p>How discounts are currently influencing demand and where that pressure is landing.</p>
              </div>
            </div>
            <div className="exact-admin-priority-grid">
              <article className="exact-admin-priority-card">
                <span>Discount penetration</span>
                <strong>
                  {rides.length === 0 ? "0%" : `${Math.round((promoAdjustedTrips.length / rides.length) * 100)}%`}
                </strong>
                <small>Share of all rides currently carrying either promo or referral support.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Average discount per ride</span>
                <strong>
                  {formatMoney(
                    session?.user.preferredCurrency ?? "GHS",
                    promoAdjustedTrips.length === 0
                      ? 0
                      : (promoSpend + referralSpend) / promoAdjustedTrips.length
                  )}
                </strong>
                <small>Blended incentive cost applied each time a discounted ride is posted.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Largest single discount</span>
                <strong>
                  {formatMoney(
                    session?.user.preferredCurrency ?? "GHS",
                    topDiscountedRides.length === 0
                      ? 0
                      : parseNumber(topDiscountedRides[0]?.promoDiscount) +
                          parseNumber(topDiscountedRides[0]?.referralDiscount)
                  )}
                </strong>
                <small>
                  Highest combined promo and referral value currently recorded on one ride.
                </small>
              </article>
            </div>
          </section>

          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Promo and referral ride ledger</h3>
                <p>Completed and live rides where discounts are actually being applied in the live system.</p>
              </div>
            </div>
            {promoAdjustedTrips.length === 0 ? (
              <EmptyCard
                title="No promo-adjusted rides yet."
                body="Once promo or referral discounts are applied to rides, they will show up here automatically."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Rider</th>
                      <th>Zone</th>
                      <th>Promo</th>
                      <th>Referral</th>
                      <th>Fare</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoAdjustedTrips
                      .slice()
                      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                      .map((ride) => (
                        <tr key={ride.id}>
                          <td>{ride.passenger.user.fullName}</td>
                          <td>{ride.rider?.user.fullName ?? "Unassigned"}</td>
                          <td>{ride.serviceZone?.name ?? "No zone"}</td>
                          <td>{formatMoney(ride.currency, ride.promoDiscount)}</td>
                          <td>{formatMoney(ride.currency, ride.referralDiscount)}</td>
                          <td>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</td>
                          <td>{formatDateTime(ride.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Discount signals</h3>
                <p>Where promotion activity is currently clustering.</p>
              </div>
            </div>
            <div className="exact-admin-stack">
              {promotionZoneSnapshot.length === 0 ? (
                <EmptyCard
                  title="No promotion zones yet."
                  body="Promotion activity will show the most active zones here once the first discounted rides land."
                />
              ) : (
                <ul className="workbench-list exact-admin-ride-feed">
                  {promotionZoneSnapshot.slice(0, 6).map(([zone, count]) => (
                    <li key={zone}>
                      <span>{zone}</span>
                      <strong>{count} rides</strong>
                    </li>
                  ))}
                </ul>
              )}

              <section className="exact-admin-card exact-admin-card-inset">
                <div className="exact-admin-cardhead">
                  <div>
                    <h3>Top discounted rides</h3>
                    <p>The passenger-side rides consuming the most incentive value right now.</p>
                  </div>
                </div>
                {topDiscountedRides.length === 0 ? (
                  <EmptyCard
                    title="No discounted rides yet."
                    body="The highest-value discounted trips will appear here once promotions are in use."
                  />
                ) : (
                  <ul className="workbench-list exact-admin-ride-feed">
                    {topDiscountedRides.map((ride) => (
                      <li key={ride.id}>
                        <span>{ride.passenger.user.fullName}</span>
                        <strong>
                          {formatMoney(
                            ride.currency,
                            parseNumber(ride.promoDiscount) + parseNumber(ride.referralDiscount)
                          )}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </section>
        </div>
      </>
    ) : screen === "settings" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.settings.eyebrow}</p>
            <h1>{screenMeta.settings.title}</h1>
            <p>{screenMeta.settings.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total zones</span>
              <strong>{zones.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Active zones</span>
              <strong>{zones.filter((zone) => zone.isActive).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Role permissions</span>
              <strong>{adminRoleEntries.reduce((sum, [, permissions]) => sum + permissions.length, 0)}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Platform modules</span>
              <strong>{adminModules.length}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Control priorities</h3>
                <p>Platform rules that need the fastest admin attention across pricing, supply, and access.</p>
              </div>
            </div>
            <div className="exact-admin-priority-grid">
              <article className="exact-admin-priority-card">
                <span>Inactive zones</span>
                <strong>{zones.filter((zone) => !zone.isActive).length}</strong>
                <small>Service zones that are currently out of rotation and may need review.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Average base fare</span>
                <strong>
                  {formatMoney(
                    session?.user.preferredCurrency ?? "GHS",
                    zones.length === 0
                      ? 0
                      : zones.reduce((sum, zone) => sum + parseNumber(zone.baseFare), 0) / zones.length
                  )}
                </strong>
                <small>The current average launch price across all configured service zones.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Largest permission set</span>
                <strong>{rolePermissionSnapshot[0]?.[1].length ?? 0}</strong>
                <small>
                  Most expansive role currently exposed by the backend permission service.
                </small>
              </article>
            </div>
          </section>

          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Service zone pricing</h3>
                <p>Live pricing and service configuration coming directly from backend service zones.</p>
              </div>
            </div>
            {zones.length === 0 ? (
              <EmptyCard
                title="No service zones configured."
                body="Once service zones exist, their pricing and operating status will appear here."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Status</th>
                      <th>Base fare</th>
                      <th>Per km</th>
                      <th>Per min</th>
                      <th>Min fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => (
                      <tr key={zone.id}>
                        <td>
                          <strong>{zone.name}</strong>
                          <div>{zone.city}</div>
                        </td>
                        <td>
                          <span className={`status-chip ${zone.isActive ? "success" : "neutral"}`}>
                            {zone.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{formatMoney(zone.currency, zone.baseFare)}</td>
                        <td>{formatMoney(zone.currency, zone.perKmFee)}</td>
                        <td>{formatMoney(zone.currency, zone.perMinuteFee)}</td>
                        <td>{formatMoney(zone.currency, zone.minimumFare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Role permissions</h3>
                <p>Current permission groups exposed by the backend admin service.</p>
              </div>
            </div>
            {adminPermissionsQuery.isLoading ? (
              <div className="status-chip warning">Loading permissions</div>
            ) : adminPermissionsQuery.isError ? (
              <EmptyCard title="Could not load permissions." body={adminPermissionsQuery.error.message} />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {rolePermissionSnapshot.map(([role, permissions]) => (
                  <li key={role}>
                    <span>{role}</span>
                    <strong>{permissions.length} permissions</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Platform modules</h3>
                <p>Backend-declared operational modules available to the admin workspace.</p>
              </div>
            </div>
            {adminModulesQuery.isLoading ? (
              <div className="status-chip warning">Loading modules</div>
            ) : adminModulesQuery.isError ? (
              <EmptyCard title="Could not load modules." body={adminModulesQuery.error.message} />
            ) : adminModules.length === 0 ? (
              <EmptyCard title="No modules reported." body="The backend did not return any platform modules." />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {adminModules.map((module) => (
                  <li key={module}>
                    <span>{module.replaceAll("-", " ")}</span>
                    <strong>Live</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Admin access model</h3>
                <p>The active admin accounts currently controlling this workspace.</p>
              </div>
            </div>
            {adminAccountsQuery.isLoading ? (
              <div className="status-chip warning">Loading admin accounts</div>
            ) : adminAccountsQuery.isError ? (
              <EmptyCard title="Could not load admin accounts." body={adminAccountsQuery.error.message} />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {(adminAccountsQuery.data ?? []).slice(0, 6).map((admin) => (
                  <li key={admin.id}>
                    <span>
                      {admin.user.fullName}
                      {admin.title ? ` - ${admin.title}` : ""}
                    </span>
                    <strong>{admin.user.accountStatus}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    ) : screen === "admins" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">{screenMeta.admins.eyebrow}</p>
            <h1>{screenMeta.admins.title}</h1>
            <p>{screenMeta.admins.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Total admins</span>
              <strong>{adminAccountsQuery.data?.length ?? 0}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Named titles</span>
              <strong>{(adminAccountsQuery.data ?? []).filter((admin) => Boolean(admin.title)).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>With email</span>
              <strong>{(adminAccountsQuery.data ?? []).filter((admin) => Boolean(admin.user.email)).length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Active accounts</span>
              <strong>
                {(adminAccountsQuery.data ?? []).filter(
                  (admin) => admin.user.accountStatus === "active"
                ).length}
              </strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Access governance</h3>
                <p>Who currently holds operational access and how broadly those permissions are distributed.</p>
              </div>
            </div>
            <div className="exact-admin-priority-grid">
              <article className="exact-admin-priority-card">
                <span>Eligible passenger pool</span>
                <strong>{eligiblePassengers.length}</strong>
                <small>Passenger accounts that can still be promoted into admin operators.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Permission families</span>
                <strong>{adminRoleEntries.length}</strong>
                <small>Distinct role families currently emitted by the backend access model.</small>
              </article>
              <article className="exact-admin-priority-card">
                <span>Most common admin title</span>
                <strong>{adminTitleSnapshot[0]?.[0] ?? "No titles yet"}</strong>
                <small>
                  The title appearing most often across active admin accounts in this workspace.
                </small>
              </article>
            </div>
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Role footprint</h3>
                <p>Quick view of which permission families currently carry the heaviest access load.</p>
              </div>
            </div>
            {adminPermissionsQuery.isLoading ? (
              <div className="status-chip warning">Loading permissions</div>
            ) : adminPermissionsQuery.isError ? (
              <EmptyCard title="Could not load permissions." body={adminPermissionsQuery.error.message} />
            ) : rolePermissionSnapshot.length === 0 ? (
              <EmptyCard
                title="No permission families found."
                body="Permission families will surface here once the backend reports them."
              />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {rolePermissionSnapshot.map(([role, permissions]) => (
                  <li key={role}>
                    <span>{role}</span>
                    <strong>{permissions.length} permissions</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Create admin account</h3>
                <p>Only authenticated admins can create another admin from this page.</p>
              </div>
            </div>

            <div className="two-up">
              <div className="field-group">
                <label className="field-label">Full name</label>
                <input
                  className="input"
                  value={adminForm.fullName}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  placeholder="Admin full name"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Email</label>
                <input
                  className="input"
                  value={adminForm.email}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@okadago.com"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Phone country code</label>
                <input
                  className="input"
                  value={adminForm.phoneCountryCode}
                  onChange={(event) =>
                    setAdminForm((current) => ({
                      ...current,
                      phoneCountryCode: event.target.value
                    }))
                  }
                  placeholder="+233"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Phone local</label>
                <input
                  className="input"
                  value={adminForm.phoneLocal}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, phoneLocal: event.target.value }))
                  }
                  placeholder="24XXXXXXX"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Phone E.164</label>
                <input
                  className="input"
                  value={adminForm.phoneE164}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, phoneE164: event.target.value }))
                  }
                  placeholder="+23324XXXXXXX"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Preferred currency</label>
                <select
                  className="select"
                  value={adminForm.preferredCurrency}
                  onChange={(event) =>
                    setAdminForm((current) => ({
                      ...current,
                      preferredCurrency: event.target.value
                    }))
                  }
                >
                  <option value="GHS">GHS</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Title</label>
                <input
                  className="input"
                  value={adminForm.title}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Operations Lead"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={adminForm.password}
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Create a strong password"
                />
              </div>
            </div>

            <div className="field-group admin-form-block">
              <label className="field-label">Permissions</label>
              <textarea
                className="textarea"
                value={adminForm.permissions}
                onChange={(event) =>
                  setAdminForm((current) => ({ ...current, permissions: event.target.value }))
                }
                placeholder="users:manage:any, analytics:read:any"
              />
            </div>

            <div className="button-row admin-form-actions">
              <button
                className="button"
                type="button"
                onClick={() => createAdminMutation.mutate()}
                disabled={createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? "Creating..." : "Create admin"}
              </button>
            </div>

            {createAdminMutation.isError ? (
              <div className="empty-state admin-form-feedback">
                <strong>Admin creation failed.</strong>
                <p>{createAdminMutation.error.message}</p>
              </div>
            ) : null}

            {createAdminMutation.isSuccess ? (
              <div className="status-chip success admin-form-feedback-chip">Admin account created</div>
            ) : null}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Promote passenger to admin</h3>
                <p>Upgrade an existing passenger account and keep the same person record in the system.</p>
              </div>
            </div>

            <div className="two-up">
              <div className="field-group">
                <label className="field-label">Passenger account</label>
                <select
                  className="select"
                  value={promoteForm.passengerUserId}
                  onChange={(event) => {
                    const passenger =
                      eligiblePassengers.find((item) => item.userId === event.target.value) ?? null;

                    setPromoteForm((current) => ({
                      ...current,
                      passengerUserId: event.target.value,
                      email: passenger?.user.email ?? current.email,
                      title: current.title
                    }));
                  }}
                >
                  <option value="">Select passenger</option>
                  {eligiblePassengers.map((passenger) => (
                    <option key={passenger.userId} value={passenger.userId}>
                      {passenger.user.fullName} - {passenger.user.phoneE164}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Admin email</label>
                <input
                  className="input"
                  value={promoteForm.email}
                  onChange={(event) =>
                    setPromoteForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@okadago.com"
                />
              </div>

              <div className="field-group">
                <label className="field-label">New admin password</label>
                <input
                  className="input"
                  type="password"
                  value={promoteForm.password}
                  onChange={(event) =>
                    setPromoteForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Set a fresh admin password"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Admin title</label>
                <input
                  className="input"
                  value={promoteForm.title}
                  onChange={(event) =>
                    setPromoteForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Support Supervisor"
                />
              </div>
            </div>

            {selectedPassenger ? (
              <div className="admin-promote-summary">
                <strong>{selectedPassenger.user.fullName}</strong>
                <span>{selectedPassenger.user.phoneE164}</span>
                <span>{selectedPassenger.defaultServiceCity ?? "No default city"}</span>
                <span>{selectedPassenger.referralCode}</span>
              </div>
            ) : null}

            <div className="field-group admin-form-block">
              <label className="field-label">Permissions</label>
              <textarea
                className="textarea"
                value={promoteForm.permissions}
                onChange={(event) =>
                  setPromoteForm((current) => ({ ...current, permissions: event.target.value }))
                }
                placeholder="users:manage:any, analytics:read:any"
              />
            </div>

            <div className="button-row admin-form-actions">
              <button
                className="button"
                type="button"
                onClick={() => promotePassengerMutation.mutate()}
                disabled={promotePassengerMutation.isPending || !promoteForm.passengerUserId}
              >
                {promotePassengerMutation.isPending ? "Promoting..." : "Promote passenger"}
              </button>
            </div>

            {promotePassengerMutation.isError ? (
              <div className="empty-state admin-form-feedback">
                <strong>Passenger promotion failed.</strong>
                <p>{promotePassengerMutation.error.message}</p>
              </div>
            ) : null}

            {promotePassengerMutation.isSuccess ? (
              <div className="status-chip success admin-form-feedback-chip">
                Passenger promoted to admin
              </div>
            ) : null}
          </section>
        </div>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Existing admins</h3>
                <p>Admin accounts currently available in the workspace.</p>
              </div>
            </div>
            {adminAccountsQuery.isLoading ? (
              <div className="status-chip warning">Loading admin accounts</div>
            ) : adminAccountsQuery.isError ? (
              <EmptyCard
                title="Could not load admins."
                body={adminAccountsQuery.error.message}
              />
            ) : (adminAccountsQuery.data ?? []).length === 0 ? (
              <EmptyCard
                title="No admin accounts found."
                body="Create the next admin account from the form on this page."
              />
            ) : (
                <ul className="workbench-list">
                  {(adminAccountsQuery.data ?? []).map((admin) => (
                    <li key={admin.id}>
                      <span>
                        {admin.user.fullName}
                      {admin.title ? ` - ${admin.title}` : ""}
                    </span>
                    <strong>{admin.user.email ?? admin.user.phoneE164}</strong>
                  </li>
                  ))}
                </ul>
              )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Admin title mix</h3>
                <p>Titles in use across the current operator base.</p>
              </div>
            </div>
            {adminAccountsQuery.isLoading ? (
              <div className="status-chip warning">Loading title mix</div>
            ) : adminAccountsQuery.isError ? (
              <EmptyCard title="Could not load title mix." body={adminAccountsQuery.error.message} />
            ) : adminTitleSnapshot.length === 0 ? (
              <EmptyCard
                title="No admin titles yet."
                body="Admin titles will be grouped here once accounts are created with role labels."
              />
            ) : (
              <ul className="workbench-list exact-admin-ride-feed">
                {adminTitleSnapshot.map(([title, count]) => (
                  <li key={title}>
                    <span>{title}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    ) : (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
            <p className="exact-admin-eyebrow">Finance operations</p>
            <h1>{screenMeta.payments.title}</h1>
            <p>{screenMeta.payments.description}</p>
          </div>

          <div className="exact-admin-kpis">
            <article className="exact-admin-kpi">
              <span>Posted wallet volume</span>
              <strong>
                {formatMoney(
                  session?.user.preferredCurrency ?? "GHS",
                  postedWalletTransactions.reduce((sum, transaction) => sum + parseNumber(transaction.amount), 0)
                )}
              </strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Wallet transactions</span>
              <strong>{walletTransactions.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Pending payouts</span>
              <strong>{pendingPayoutRequests.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Paid out</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", payoutOutflow)}</strong>
            </article>
          </div>
        </section>

        <section className="exact-admin-card">
          <div className="exact-admin-cardhead">
            <div>
              <h3>Payment controls</h3>
              <p>Filter wallet movement and payout requests without leaving the admin finance screen.</p>
            </div>
          </div>
          <div className="exact-admin-payment-filters">
            <div className="field-group">
              <label className="field-label">Wallet transaction status</label>
              <select
                className="select"
                value={transactionStatusFilter}
                onChange={(event) => setTransactionStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="POSTED">Posted</option>
                <option value="REVERSED">Reversed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Wallet transaction type</label>
              <select
                className="select"
                value={transactionTypeFilter}
                onChange={(event) => setTransactionTypeFilter(event.target.value)}
              >
                <option value="">All types</option>
                <option value="TOP_UP">Top up</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="COMMISSION">Commission</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
                <option value="REFUND">Refund</option>
                <option value="BONUS">Bonus</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Payout request status</label>
              <select
                className="select"
                value={payoutStatusFilter}
                onChange={(event) => setPayoutStatusFilter(event.target.value)}
              >
                <option value="">All payout statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="APPROVED">Approved</option>
                <option value="PROCESSING">Processing</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Rating rider profile ID</label>
              <input
                className="input"
                value={ratingRiderFilter}
                onChange={(event) => setRatingRiderFilter(event.target.value)}
                placeholder="Filter by rider profile CUID"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Rating ride ID</label>
              <input
                className="input"
                value={ratingRideFilter}
                onChange={(event) => setRatingRideFilter(event.target.value)}
                placeholder="Filter by ride CUID"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Ratings from date</label>
              <input
                className="input"
                type="date"
                value={ratingFromDateFilter}
                onChange={(event) => setRatingFromDateFilter(event.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Ratings to date</label>
              <input
                className="input"
                type="date"
                value={ratingToDateFilter}
                onChange={(event) => setRatingToDateFilter(event.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="exact-admin-grid admin-payments-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Ratings verification ledger</h3>
                <p>Operational view of submitted passenger ratings with rider, ride, and date filters.</p>
              </div>
            </div>
            {ratingsQuery.isLoading ? (
              <div className="status-chip warning">Loading ratings</div>
            ) : ratingsQuery.isError ? (
              <EmptyCard title="Ratings could not be loaded." body={ratingsQuery.error.message} />
            ) : ratings.length === 0 ? (
              <EmptyCard
                title="No ratings matched the current filters."
                body="Passenger rating submissions will appear here after completed rides are rated."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rated rider</th>
                      <th>Ride ID</th>
                      <th>Score</th>
                      <th>Category</th>
                      <th>Review</th>
                      <th>Submitted by</th>
                      <th>Submitted at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map((rating) => (
                      <tr key={rating.id}>
                        <td>
                          <div className="exact-admin-transaction-user">
                            <strong>{rating.rated.fullName}</strong>
                            <span>{rating.rated.riderProfile?.displayCode ?? "No rider code"}</span>
                          </div>
                        </td>
                        <td>{rating.ride.id}</td>
                        <td>{rating.score}/5</td>
                        <td>{rating.category ?? "General"}</td>
                        <td>{rating.review?.body ?? "No written review"}</td>
                        <td>
                          <div className="exact-admin-transaction-user">
                            <strong>{rating.rater.fullName}</strong>
                            <span>{rating.rater.phoneE164}</span>
                          </div>
                        </td>
                        <td>{formatDateTime(rating.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Wallet transaction ledger</h3>
                <p>Live wallet movement across top-ups, commissions, withdrawals, and reversals.</p>
              </div>
            </div>
            {walletTransactionsQuery.isLoading ? (
              <div className="status-chip warning">Loading wallet transactions</div>
            ) : walletTransactionsQuery.isError ? (
              <EmptyCard
                title="Wallet transactions could not be loaded."
                body={walletTransactionsQuery.error.message}
              />
            ) : walletTransactions.length === 0 ? (
              <EmptyCard
                title="No wallet transactions found."
                body="Top-ups, payouts, and settlement movement will appear here as soon as they happen."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Wallet</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Linked record</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTransactions
                      .slice()
                      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                      .map((transaction) => (
                        <tr key={transaction.id}>
                          <td>
                            <div className="exact-admin-transaction-user">
                              <strong>{transaction.wallet.user.fullName}</strong>
                              <span>{transaction.wallet.user.phoneE164}</span>
                            </div>
                          </td>
                          <td>
                            <div className="exact-admin-transaction-user">
                              <strong>{formatEnumLabel(transaction.wallet.type)}</strong>
                              <span>{formatEnumLabel(transaction.wallet.user.role)}</span>
                            </div>
                          </td>
                          <td>{formatEnumLabel(transaction.type)}</td>
                          <td>
                            <span className={`status-chip ${statusTone(transaction.status)}`}>
                              {formatEnumLabel(transaction.status)}
                            </span>
                          </td>
                          <td>{formatMoney(transaction.currency, transaction.amount)}</td>
                          <td>{transaction.reference}</td>
                          <td>
                            <div className="exact-admin-transaction-user">
                              <strong>
                                {transaction.payoutRequest
                                  ? `Payout ${formatEnumLabel(transaction.payoutRequest.status)}`
                                  : transaction.payment
                                    ? `Payment ${formatEnumLabel(transaction.payment.status)}`
                                    : transaction.ride
                                      ? `Ride ${formatEnumLabel(transaction.ride.status)}`
                                      : "Wallet movement"}
                              </strong>
                              <span>
                                {transaction.payoutRequest?.destinationLabel ??
                                  transaction.payment?.provider ??
                                  transaction.ride?.destinationAddress ??
                                  transaction.description ??
                                  "No linked description"}
                              </span>
                            </div>
                          </td>
                          <td>{formatDateTime(transaction.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Payout review queue</h3>
                <p>Approve, process, pay, or reject rider payout requests from one queue.</p>
              </div>
            </div>
            {payoutRequestsQuery.isLoading ? (
              <div className="status-chip warning">Loading payout requests</div>
            ) : payoutRequestsQuery.isError ? (
              <EmptyCard
                title="Payout requests could not be loaded."
                body={payoutRequestsQuery.error.message}
              />
            ) : payoutRequests.length === 0 ? (
              <EmptyCard
                title="No payout requests yet."
                body="Rider withdrawals will appear here once riders start requesting payouts."
              />
            ) : (
              <div className="exact-admin-payout-list">
                {payoutRequests.map((request) => (
                  <article key={request.id} className="exact-admin-payout-card">
                    <div className="exact-admin-payout-head">
                      <div>
                        <strong>{request.rider.user.fullName}</strong>
                        <span>
                          {request.rider.displayCode} - {request.destinationLabel}
                        </span>
                      </div>
                      <span className={`status-chip ${statusTone(request.status)}`}>
                        {formatEnumLabel(request.status)}
                      </span>
                    </div>

                    <div className="exact-admin-payout-metrics">
                      <span>{formatMoney(request.currency, request.amount)}</span>
                      <span>{formatEnumLabel(request.method)}</span>
                      <span>{formatDateTime(request.requestedAt)}</span>
                    </div>

                    <div className="exact-admin-payout-metadata">
                      <span>
                        Wallet available: {formatMoney(request.wallet.currency, request.wallet.availableBalance)}
                      </span>
                      <span>
                        Locked: {formatMoney(request.wallet.currency, request.wallet.lockedBalance)}
                      </span>
                      <span>
                        Reviewer: {request.reviewer?.fullName ?? "Not reviewed yet"}
                      </span>
                    </div>

                    {request.rejectionReason ? (
                      <div className="empty-state exact-admin-payout-note">
                        <strong>Review note</strong>
                        <p>{request.rejectionReason}</p>
                      </div>
                    ) : null}

                    {["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"].includes(request.status) ? (
                      <>
                        <div className="field-group exact-admin-payout-reason">
                          <label className="field-label">Rejection note</label>
                          <input
                            className="input"
                            value={payoutRejectionReasons[request.id] ?? ""}
                            onChange={(event) =>
                              setPayoutRejectionReasons((current) => ({
                                ...current,
                                [request.id]: event.target.value
                              }))
                            }
                            placeholder="Optional reason if you reject this payout"
                          />
                        </div>

                        <div className="button-row exact-admin-payout-actions">
                          {request.status === "REQUESTED" ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              disabled={payoutReviewMutation.isPending}
                              onClick={() =>
                                payoutReviewMutation.mutate({
                                  payoutRequestId: request.id,
                                  action: "mark_reviewing"
                                })
                              }
                            >
                              Review
                            </button>
                          ) : null}

                          {["REQUESTED", "REVIEWING"].includes(request.status) ? (
                            <button
                              className="button"
                              type="button"
                              disabled={payoutReviewMutation.isPending}
                              onClick={() =>
                                payoutReviewMutation.mutate({
                                  payoutRequestId: request.id,
                                  action: "approve"
                                })
                              }
                            >
                              Approve
                            </button>
                          ) : null}

                          {request.status === "APPROVED" ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              disabled={payoutReviewMutation.isPending}
                              onClick={() =>
                                payoutReviewMutation.mutate({
                                  payoutRequestId: request.id,
                                  action: "mark_processing"
                                })
                              }
                            >
                              Mark processing
                            </button>
                          ) : null}

                          {["APPROVED", "PROCESSING"].includes(request.status) ? (
                            <button
                              className="button"
                              type="button"
                              disabled={payoutReviewMutation.isPending}
                              onClick={() =>
                                payoutReviewMutation.mutate({
                                  payoutRequestId: request.id,
                                  action: "mark_paid"
                                })
                              }
                            >
                              Mark paid
                            </button>
                          ) : null}

                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={payoutReviewMutation.isPending}
                            onClick={() =>
                              payoutReviewMutation.mutate({
                                payoutRequestId: request.id,
                                action: "reject",
                                rejectionReason: payoutRejectionReasons[request.id]
                              })
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            {payoutReviewMutation.isError ? (
              <div className="empty-state exact-admin-payout-feedback">
                <strong>Payout review failed.</strong>
                <p>{payoutReviewMutation.error.message}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="exact-admin-grid admin-payments-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Completed fare ledger</h3>
                <p>Completed rides still provide the platform-level revenue context beneath wallet flow.</p>
              </div>
            </div>
            {completedTrips.length === 0 ? (
              <EmptyCard
                title="No completed payments yet."
                body="Complete rides to populate the live revenue ledger."
              />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Rider</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Commission</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTrips
                      .slice()
                      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                      .map((ride) => (
                        <tr key={ride.id}>
                          <td>{ride.passenger.user.fullName}</td>
                          <td>{ride.rider?.user.fullName ?? "Unassigned"}</td>
                          <td>
                            <span className={`status-chip ${statusTone(ride.status)}`}>
                              {formatEnumLabel(ride.status)}
                            </span>
                          </td>
                          <td>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</td>
                          <td>{formatMoney(ride.currency, ride.platformCommission)}</td>
                          <td>{formatDateTime(ride.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exact-admin-card">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Cashflow snapshot</h3>
                <p>A combined view of ride revenue, wallet movement, and payout execution.</p>
              </div>
            </div>
            <ul className="workbench-list">
              <li>
                <span>Completed ride revenue</span>
                <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", totalRevenue)}</strong>
              </li>
              <li>
                <span>Average completed fare</span>
                <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", averageCompletedFare)}</strong>
              </li>
              <li>
                <span>Pending wallet items</span>
                <strong>{pendingWalletTransactions.length}</strong>
              </li>
              <li>
                <span>Failed or reversed items</span>
                <strong>{failedWalletTransactions.length}</strong>
              </li>
              <li>
                <span>Paid payout requests</span>
                <strong>{paidPayoutRequests.length}</strong>
              </li>
              <li>
                <span>Estimated active trip value</span>
                <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", activeTripValue)}</strong>
              </li>
            </ul>
          </section>
        </div>
      </>
    );

  return (
    <ImmersivePage className="exact-admin-page">
      <div className="exact-admin-shell">
        <aside className="exact-admin-sidebar">
          <div className="exact-admin-brand">
            <div className="exact-admin-brandmark">O</div>
            <div>
              <strong>OKADAGO</strong>
              <span>Operations console</span>
            </div>
          </div>

          <nav className="exact-admin-nav">
            {navGroups.map((group) => (
              <div key={group.key} className="exact-admin-navgroup">
                <p className="exact-admin-navlabel">{group.label}</p>
                {navItems
                  .filter((item) => item.group === group.key)
                  .map((item) => {
                    const Icon = item.icon;

                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        className={item.screen === screen ? "active" : ""}
                      >
                        <Icon size={18} />
                        <div className="exact-admin-navcopy">
                          <strong>{item.label}</strong>
                          <small>{item.hint}</small>
                        </div>
                        {item.badge ? <em>{item.badge}</em> : null}
                      </a>
                    );
                  })}
              </div>
            ))}
            <div className="exact-admin-navgroup exact-admin-navgroup-quiet">
              <p className="exact-admin-navlabel">Reference</p>
              <a href="/admin/settings">
                <FileText size={18} />
                <span>Platform controls</span>
              </a>
            </div>
          </nav>

          <AdminSidebarPulse
            currency={session.user.preferredCurrency}
            activeTrips={activeTrips.length}
            activeRiders={activeRiders.length}
            totalRevenue={totalRevenue}
            zones={zones.length}
          />

          <button
            className="exact-admin-profile"
            type="button"
            onClick={() => {
              void signOut().then(() => {
                window.location.href = "/admin/login";
              });
            }}
          >
            <div className="exact-avatar">
              {session.user.fullName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <strong>{session.user.fullName}</strong>
              <span>Super admin workspace</span>
            </div>
            <LogOut size={16} />
          </button>
        </aside>

        <section className="exact-admin-main">
          <header className="exact-admin-topbar">
            <div className="exact-admin-topbarcopy">
              <div className="exact-admin-pageintro">
                <p className="exact-admin-pageeyebrow">{screenMeta[screen].eyebrow}</p>
                <div className="exact-admin-topmeta">
                  <strong>{screenMeta[screen].title}</strong>
                  <span>{screenMeta[screen].description}</span>
                </div>
              </div>
              <div className="exact-admin-search">
                <Search size={16} />
                <input placeholder={screenMeta[screen].searchLabel} />
              </div>
            </div>

            <div className="exact-admin-actions">
              <a className="exact-admin-quickaction" href={screenMeta[screen].quickActionHref}>
                <ArrowUpRight size={16} />
                <span>{screenMeta[screen].quickActionLabel}</span>
              </a>
              <button className="exact-icon-button notification" type="button">
                <Bell size={18} />
              </button>
              <button className="exact-admin-zone" type="button">
                {new Date().toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
              </button>
            </div>
          </header>

          <div className="exact-admin-subbar">
            <div className="exact-admin-highlights">
              {screenHighlights[screen].map((item) => (
                <div key={item.label} className="exact-admin-highlight">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <p className="exact-admin-subnote">{screenMeta[screen].quickActionNote}</p>
          </div>

          <div className="exact-admin-scroll">{content}</div>
        </section>
      </div>
    </ImmersivePage>
  );
}
