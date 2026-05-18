"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Bike,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Filter,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Settings,
  ShieldAlert,
  Tag,
  User,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
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
  vehicle?: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
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
      <p className="exact-admin-sidebar-card-eyebrow">OkadaGo Wallet</p>
      <h3>{formatMoney(currency, totalRevenue)}</h3>
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
      <a className="exact-admin-sidebar-action" href="/admin/finance">
        Review finance
      </a>
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
  const [requestTab, setRequestTab] = useState<"rides" | "food" | "delivery">("rides");
  const [requestStatusView, setRequestStatusView] = useState<
    "all" | "pending" | "accepted" | "on-trip" | "completed" | "cancelled"
  >("all");
  const [userTypeView, setUserTypeView] = useState<"all" | "riders" | "customers" | "vendors" | "admins">("all");
  const [adminSearchTerm, setAdminSearchTerm] = useState("");

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
  const adminCurrency = session?.user.preferredCurrency ?? "GHS";
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

  const vehicleCount = riders.filter((rider) => Boolean(rider.vehicle)).length;
  const deliveryOrderCount = 0;
  const deliveryRevenue = 0;
  const rideRevenue = totalRevenue;
  const totalDashboardRevenue = rideRevenue + deliveryRevenue;
  const rideRevenuePercent =
    totalDashboardRevenue > 0 ? Math.round((rideRevenue / totalDashboardRevenue) * 100) : 0;
  const deliveryRevenuePercent =
    totalDashboardRevenue > 0 ? Math.max(0, 100 - rideRevenuePercent) : 0;
  const dashboardToday = new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
  const shortDateFormatter = new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric"
  });
  const weeklyRideBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const dayRides = rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return !Number.isNaN(rideDate.getTime()) && rideDate.toISOString().slice(0, 10) === key;
    });

    return {
      key,
      label: shortDateFormatter.format(date),
      rides: dayRides.length,
      completed: dayRides.filter((ride) => ride.status.toLowerCase() === "completed").length
    };
  });
  const weeklyRideMax = Math.max(
    1,
    ...weeklyRideBuckets.map((bucket) => Math.max(bucket.rides, bucket.completed))
  );
  const recentRideRequests = recentRideTimeline.slice(0, 4);
  const liveActivityItems = [
    ...recentRideTimeline.slice(0, 3).map((ride) => ({
      id: `ride-${ride.id}`,
      icon: Bike,
      title: `Ride ${formatEnumLabel(ride.status)}`,
      body: `${ride.pickupAddress} to ${ride.destinationAddress}`,
      meta: formatDateTime(ride.createdAt),
      tone: statusTone(ride.status)
    })),
    ...activeRiders.slice(0, 2).map((rider) => ({
      id: `rider-${rider.id}`,
      icon: User,
      title: "Rider online",
      body: `${rider.user.fullName}${rider.city ? ` in ${rider.city}` : ""}`,
      meta: rider.serviceZone?.name ?? "No zone assigned",
      tone: "success"
    })),
    ...recentPassengers.slice(0, 2).map((passenger) => ({
      id: `passenger-${passenger.id}`,
      icon: UserPlus,
      title: "Passenger registered",
      body: passenger.user.fullName,
      meta: passenger.defaultServiceCity ?? "No default city",
      tone: "neutral"
    }))
  ].slice(0, 5);
  const postedWalletVolume = postedWalletTransactions.reduce(
    (sum, transaction) => sum + Math.abs(parseNumber(transaction.amount)),
    0
  );
  const pendingPayoutValue = pendingPayoutRequests.reduce(
    (sum, request) => sum + parseNumber(request.amount),
    0
  );
  const payoutHoldBalance = payoutRequests.reduce(
    (sum, request) => sum + parseNumber(request.wallet.lockedBalance),
    0
  );
  const platformNetProfit = Math.max(0, totalRevenue - payoutOutflow);
  const profitMargin = totalRevenue > 0 ? (platformNetProfit / totalRevenue) * 100 : 0;
  const financeDailyBuckets = Array.from({ length: 10 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (9 - index));
    const key = date.toISOString().slice(0, 10);
    const dayTrips = completedTrips.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return !Number.isNaN(rideDate.getTime()) && rideDate.toISOString().slice(0, 10) === key;
    });
    const dayRevenue = dayTrips.reduce(
      (sum, ride) => sum + parseNumber(ride.finalFare ?? ride.estimatedFare),
      0
    );
    const dayCommission = dayTrips.reduce(
      (sum, ride) => sum + parseNumber(ride.platformCommission),
      0
    );

    return {
      key,
      label: shortDateFormatter.format(date),
      revenue: dayRevenue,
      commission: dayCommission
    };
  });
  const financeDailyMax = Math.max(
    1,
    ...financeDailyBuckets.map((bucket) => Math.max(bucket.revenue, bucket.commission))
  );
  const payoutDailyBuckets = financeDailyBuckets.map((bucket) => {
    const dayPayouts = paidPayoutRequests.filter((request) => {
      const paidAt = request.paidAt ?? request.requestedAt;
      const payoutDate = new Date(paidAt);
      return !Number.isNaN(payoutDate.getTime()) && payoutDate.toISOString().slice(0, 10) === bucket.key;
    });

    return {
      ...bucket,
      payouts: dayPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0)
    };
  });
  const payoutDailyMax = Math.max(1, ...payoutDailyBuckets.map((bucket) => bucket.payouts));
  const paymentMethodSnapshot = Object.entries(
    walletTransactions.reduce<Record<string, number>>((accumulator, transaction) => {
      const key =
        transaction.payment?.method ??
        transaction.payment?.provider ??
        transaction.wallet.type ??
        transaction.type;
      accumulator[key] = (accumulator[key] ?? 0) + Math.abs(parseNumber(transaction.amount));
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);
  const paymentMethodTotal = paymentMethodSnapshot.reduce((sum, [, amount]) => sum + amount, 0);
  const recentFinanceTransactions = walletTransactions
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5);
  const requestPending = rides.filter((ride) => ["searching", "pending"].includes(ride.status.toLowerCase()));
  const requestAccepted = rides.filter((ride) =>
    ["assigned", "arriving", "arrived"].includes(ride.status.toLowerCase())
  );
  const requestOnTrip = rides.filter((ride) => ride.status.toLowerCase() === "started");
  const requestCompleted = rides.filter((ride) => ride.status.toLowerCase() === "completed");
  const requestCancelled = rides.filter((ride) => ride.status.toLowerCase() === "cancelled");
  const requestCards = rides
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 8);
  const visibleRequestCards =
    requestTab === "rides"
      ? requestCards.filter((ride) => {
          const status = ride.status.toLowerCase();

          if (requestStatusView === "pending") {
            return ["searching", "pending"].includes(status);
          }

          if (requestStatusView === "accepted") {
            return ["assigned", "arriving", "arrived"].includes(status);
          }

          if (requestStatusView === "on-trip") {
            return status === "started";
          }

          if (requestStatusView === "completed") {
            return status === "completed";
          }

          if (requestStatusView === "cancelled") {
            return status === "cancelled";
          }

          return true;
        })
      : [];
  const requestPeakBuckets = Array.from({ length: 6 }, (_, index) => {
    const startHour = index * 4;
    const endHour = startHour + 3;
    const count = rides.filter((ride) => {
      const date = new Date(ride.createdAt);
      return !Number.isNaN(date.getTime()) && date.getHours() >= startHour && date.getHours() <= endHour;
    }).length;

    return {
      label: `${String(startHour).padStart(2, "0")}:00`,
      count
    };
  });
  const requestPeakMax = Math.max(1, ...requestPeakBuckets.map((bucket) => bucket.count));
  const managedUsers = [
    ...riders.map((rider) => ({
      id: rider.id,
      name: rider.user.fullName,
      type: "Rider",
      phone: rider.user.phoneE164,
      email: rider.user.email ?? "No email",
      status: rider.user.accountStatus ?? (rider.onlineStatus ? "ACTIVE" : "OFFLINE"),
      joinedAt: rider.createdAt,
      location: rider.city ?? rider.serviceZone?.name ?? "No location",
      reference: rider.displayCode,
      icon: Bike
    })),
    ...passengers.map((passenger) => ({
      id: passenger.id,
      name: passenger.user.fullName,
      type: "Customer",
      phone: passenger.user.phoneE164,
      email: passenger.user.email ?? "No email",
      status: passenger.user.accountStatus ?? "ACTIVE",
      joinedAt: passenger.createdAt,
      location: passenger.defaultServiceCity ?? "No location",
      reference: passenger.referralCode,
      icon: User
    }))
  ].sort((left, right) => Date.parse(right.joinedAt ?? "") - Date.parse(left.joinedAt ?? ""));
  const searchedManagedUsers = managedUsers.filter((user) => {
    const searchTarget = `${user.name} ${user.type} ${user.phone} ${user.email} ${user.location} ${user.reference}`.toLowerCase();
    const matchesSearch = searchTarget.includes(adminSearchTerm.toLowerCase().trim());

    if (!matchesSearch) {
      return false;
    }

    if (userTypeView === "riders") {
      return user.type === "Rider";
    }

    if (userTypeView === "customers") {
      return user.type === "Customer";
    }

    if (userTypeView === "vendors" || userTypeView === "admins") {
      return false;
    }

    return true;
  });
  const blockedUsers = managedUsers.filter((user) => user.status.toLowerCase() === "blocked");
  const userLocationSnapshot = Object.entries(
    managedUsers.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.location] = (accumulator[user.location] ?? 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
  const userLocationMax = Math.max(1, ...userLocationSnapshot.map(([, count]) => count));
  const recentManagedUsers = managedUsers.slice(0, 5);

  const dashboardMetrics = [
    {
      label: "Total Rides",
      value: `${rides.length}`,
      trend: `${completedTrips.length} completed`,
      icon: Bike,
      tone: "green"
    },
    {
      label: "Delivery Orders",
      value: `${deliveryOrderCount}`,
      trend: "No delivery endpoint wired",
      icon: Package,
      tone: "yellow"
    },
    {
      label: "Total Users",
      value: `${passengers.length + riders.length}`,
      trend: `${passengers.length} passengers, ${riders.length} riders`,
      icon: Users,
      tone: "green"
    },
    {
      label: "Total Revenue",
      value: formatMoney(adminCurrency, totalDashboardRevenue),
      trend: `${formatMoney(adminCurrency, totalCommission)} commission`,
      icon: CreditCard,
      tone: "yellow"
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
        label: "Requests",
        href: "/admin/requests",
        icon: Bike,
        screen: "rides",
        group: "main",
        hint: "Ride requests and history",
        badge: `${completedTrips.length}`
      },
      {
        label: "Riders Management",
        href: "/admin/riders",
        icon: User,
        screen: "riders",
        group: "main",
        hint: "Supply and availability",
        badge: `${activeRiders.length}`
      },
      {
        label: "Users Management",
        href: "/admin/users",
        icon: Users,
        screen: "passengers",
        group: "main",
        hint: "Demand and retention",
        badge: `${passengers.length}`
      },
      {
        label: "Finance",
        href: "/admin/finance",
        icon: CreditCard,
        screen: "payments",
        group: "finance",
        hint: "Wallets, payouts, ledger",
        badge: `${pendingPayoutRequests.length}`
      },
      {
        label: "Support Center",
        href: "/admin/support",
        icon: Headphones,
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
        icon: MapPin,
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
      quickActionHref: "/admin/requests",
      quickActionNote: "Jump straight into operational ride flow."
    },
    rides: {
      eyebrow: "Dispatch operations",
      title: "Requests",
      description: "Track live, completed, and cancelled ride requests from the persisted dispatch feed.",
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
      quickActionHref: "/admin/finance",
      quickActionNote: "Move from supply health into rider wallet and payout operations."
    },
    passengers: {
      eyebrow: "Demand management",
      title: "Users Management",
      description: "Review passenger profiles, referral codes, and city distribution from the live backend.",
      searchLabel: "Search passengers or referral codes...",
      quickActionLabel: "Open promotions",
      quickActionHref: "/admin/promotions",
      quickActionNote: "Check what incentives are influencing passenger activity."
    },
    payments: {
      eyebrow: "Finance operations",
      title: "Finance",
      description: "Review revenue flow from completed rides and active trip value moving through the platform.",
      searchLabel: "Search payment and fare records...",
      quickActionLabel: "Open ratings",
      quickActionHref: "/admin/support",
      quickActionNote: "Cross-check payment records against verified rider rating submissions."
    },
    ratings: {
      eyebrow: "Quality operations",
      title: "Support Center",
      description: "Verify passenger rating submissions with rider, ride, and date-level filters.",
      searchLabel: "Search rider, ride, or rating records...",
      quickActionLabel: "View payments",
      quickActionHref: "/admin/finance",
      quickActionNote: "Compare rating quality signals with payout and settlement flow."
    },
    promotions: {
      eyebrow: "Growth controls",
      title: "Promotions",
      description: "Track promo-assisted trips and referral-driven discounts from live ride records.",
      searchLabel: "Search promo-adjusted rides or zones...",
      quickActionLabel: "View finance",
      quickActionHref: "/admin/finance",
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
      <div className="exact-admin-dashboard">
        <section className="admin-reference-kpis" aria-label="Admin dashboard metrics">
          {dashboardMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article key={metric.label} className="admin-reference-kpi">
                <div className={`admin-reference-kpi-icon ${metric.tone}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.trend}</small>
                </div>
              </article>
            );
          })}
        </section>

        <section className="admin-reference-grid-3">
          <article className="admin-reference-card admin-reference-overview">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Overview</h3>
                <p>Last 7 days from live ride records.</p>
              </div>
              <span>This week</span>
            </div>
            <div className="admin-reference-legend">
              <span><i className="black" /> Ride requests</span>
              <span><i className="yellow" /> Completed rides</span>
            </div>
            <div className="admin-reference-bars">
              {weeklyRideBuckets.map((bucket) => (
                <div key={bucket.key} className="admin-reference-bar-day">
                  <div className="admin-reference-bar-track">
                    <i
                      className="rides"
                      style={{
                        height: bucket.rides === 0 ? 0 : `${Math.max(8, (bucket.rides / weeklyRideMax) * 100)}%`
                      }}
                    />
                    <i
                      className="completed"
                      style={{
                        height:
                          bucket.completed === 0
                            ? 0
                            : `${Math.max(8, (bucket.completed / weeklyRideMax) * 100)}%`
                      }}
                    />
                  </div>
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-reference-card admin-reference-revenue">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Revenue Overview</h3>
                <p>{formatMoney(adminCurrency, totalDashboardRevenue)} captured.</p>
              </div>
              <span>This week</span>
            </div>
            <div className="admin-reference-revenue-body">
              <div
                className="admin-reference-donut"
                style={{
                  background:
                    totalDashboardRevenue === 0
                      ? "#eef1f5"
                      : `conic-gradient(#111827 0 ${rideRevenuePercent}%, #ffc107 ${rideRevenuePercent}% 100%)`
                }}
              >
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(adminCurrency, totalDashboardRevenue)}</strong>
                </div>
              </div>
              <ul className="admin-reference-revenue-list">
                <li>
                  <i className="black" />
                  <span>Ride Revenue</span>
                  <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
                  <small>{rideRevenuePercent}%</small>
                </li>
                <li>
                  <i className="yellow" />
                  <span>Delivery Revenue</span>
                  <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
                  <small>{deliveryRevenuePercent}%</small>
                </li>
              </ul>
            </div>
          </article>

          <article className="admin-reference-card admin-reference-map-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Live Map</h3>
                <p>{activeRiders.length} riders online.</p>
              </div>
              <a href="/admin/riders">View full map</a>
            </div>
            <div className="admin-reference-map">
              <OperationsMap
                center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                zoom={mapMarkers.length > 0 ? 11 : 6}
                markers={mapMarkers}
                emptyTitle="No live rider coordinates yet."
                emptyDescription="Online riders with coordinates will appear on this map automatically."
              />
            </div>
          </article>
        </section>

        <section className="admin-reference-lists">
          <article className="admin-reference-card admin-reference-list-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Recent Ride Requests</h3>
                <p>Newest ride records from the backend.</p>
              </div>
              <a href="/admin/requests">View all</a>
            </div>
            {recentRideRequests.length === 0 ? (
              <EmptyCard
                title="No ride requests yet."
                body="Ride requests will appear here as soon as passengers start booking."
              />
            ) : (
              <ul className="admin-reference-request-list">
                {recentRideRequests.map((ride) => (
                  <li key={ride.id}>
                    <div className="admin-reference-avatar">
                      {ride.passenger.user.fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{ride.passenger.user.fullName}</strong>
                      <span>{ride.pickupAddress} to {ride.destinationAddress}</span>
                      <small>{formatDateTime(ride.createdAt)}</small>
                    </div>
                    <div className="admin-reference-request-money">
                      <strong>{formatMoney(ride.currency, parseNumber(ride.finalFare ?? ride.estimatedFare))}</strong>
                      <span className={`status-chip ${statusTone(ride.status)}`}>{formatEnumLabel(ride.status)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card admin-reference-list-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Recent Delivery Orders</h3>
                <p>Delivery data will render here when the backend exposes it.</p>
              </div>
              <span>No endpoint</span>
            </div>
            <EmptyCard
              title="No delivery order feed is wired."
              body="The current backend exposes ride, rider, passenger, wallet, rating, and zone data, but no delivery order endpoint yet."
            />
          </article>

          <article className="admin-reference-card admin-reference-list-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Live Activity</h3>
                <p>Latest operational events from live records.</p>
              </div>
              <a href="/admin/requests">View all</a>
            </div>
            {liveActivityItems.length === 0 ? (
              <EmptyCard
                title="No activity yet."
                body="Ride, rider, and passenger activity will populate this feed automatically."
              />
            ) : (
              <ul className="admin-reference-activity-list">
                {liveActivityItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.id}>
                      <div className={`admin-reference-activity-icon ${item.tone}`}>
                        <Icon size={17} />
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <small>{item.meta}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>

        <section className="admin-reference-card admin-reference-quick-actions">
          <a href="/admin/riders">
            <UserPlus size={18} />
            <span>Add New Rider</span>
          </a>
          <a href="/admin/riders">
            <Bike size={18} />
            <span>Review Vehicles ({vehicleCount})</span>
          </a>
          <a href="/admin/promotions">
            <Tag size={18} />
            <span>Create Promo</span>
          </a>
          <a href="/admin/support">
            <Headphones size={18} />
            <span>Support Tickets</span>
          </a>
          <a href="/admin/finance">
            <CreditCard size={18} />
            <span>Finance Reports</span>
          </a>
          <a href="/admin/settings">
            <Settings size={18} />
            <span>Locations</span>
          </a>
        </section>
      </div>
    ) : screen === "rides" ? (
      <div className="admin-reference-dark admin-requests-dashboard">
        <section className="admin-request-tabs">
          <button
            className={requestTab === "rides" ? "active" : ""}
            type="button"
            onClick={() => {
              setRequestTab("rides");
              setRequestStatusView("all");
            }}
          >
            <Bike size={16} />
            <span>Ride Requests</span>
          </button>
          <button
            className={requestTab === "food" ? "active" : ""}
            type="button"
            onClick={() => {
              setRequestTab("food");
              setRequestStatusView("all");
            }}
          >
            <Package size={16} />
            <span>Food Orders</span>
          </button>
          <button
            className={requestTab === "delivery" ? "active" : ""}
            type="button"
            onClick={() => {
              setRequestTab("delivery");
              setRequestStatusView("all");
            }}
          >
            <Package size={16} />
            <span>Delivery Requests</span>
          </button>
          <div className="admin-request-actions">
            <button type="button" onClick={() => setRequestStatusView("pending")}>
              <Filter size={15} />
              <span>Show Pending</span>
            </button>
            <button
              className="primary"
              type="button"
              onClick={() => {
                const headers = ["id", "status", "passenger", "rider", "pickup", "destination", "fare", "createdAt"];
                const csv = [
                  headers.join(","),
                  ...visibleRequestCards.map((ride) =>
                    [
                      ride.id,
                      ride.status,
                      ride.passenger.user.fullName,
                      ride.rider?.user.fullName ?? "",
                      ride.pickupAddress,
                      ride.destinationAddress,
                      parseNumber(ride.finalFare ?? ride.estimatedFare).toString(),
                      ride.createdAt
                    ]
                      .map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`)
                      .join(",")
                  )
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "okadago-ride-requests.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
              disabled={visibleRequestCards.length === 0}
            >
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>
        </section>

        <section className="admin-request-filter-row">
          <button className={requestStatusView === "all" ? "active" : ""} type="button" onClick={() => setRequestStatusView("all")}>
            All Requests <strong>{rides.length}</strong>
          </button>
          <button className={requestStatusView === "pending" ? "active" : ""} type="button" onClick={() => setRequestStatusView("pending")}>
            Pending <strong>{requestPending.length}</strong>
          </button>
          <button className={requestStatusView === "accepted" ? "active" : ""} type="button" onClick={() => setRequestStatusView("accepted")}>
            Accepted <strong>{requestAccepted.length}</strong>
          </button>
          <button className={requestStatusView === "on-trip" ? "active" : ""} type="button" onClick={() => setRequestStatusView("on-trip")}>
            On Trip <strong>{requestOnTrip.length}</strong>
          </button>
          <button className={requestStatusView === "completed" ? "active" : ""} type="button" onClick={() => setRequestStatusView("completed")}>
            Completed <strong>{requestCompleted.length}</strong>
          </button>
          <button className={`danger ${requestStatusView === "cancelled" ? "active" : ""}`} type="button" onClick={() => setRequestStatusView("cancelled")}>
            Cancelled <strong>{requestCancelled.length}</strong>
          </button>
        </section>

        <section className="admin-request-layout">
          <article className="admin-dark-card admin-request-list-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>All Ride Requests ({rides.length})</h3>
                <p>Live ride requests from the backend ride service.</p>
              </div>
              <span>Sort by: Newest</span>
            </div>
            {requestTab !== "rides" ? (
              <EmptyCard
                title={`${requestTab === "food" ? "Food orders" : "Delivery requests"} are not wired yet.`}
                body="The backend currently exposes ride requests only. When this API is added, this tab can render live records."
              />
            ) : visibleRequestCards.length === 0 ? (
              <EmptyCard
                title="No ride requests match this filter."
                body="Change the selected status filter or wait for matching live ride requests."
              />
            ) : (
              <div className="admin-request-list">
                {visibleRequestCards.map((ride) => {
                  const normalizedStatus = ride.status.toLowerCase();
                  const isActionable = ["searching", "pending"].includes(normalizedStatus);

                  return (
                    <article key={ride.id} className="admin-request-card">
                      <div className="admin-request-user">
                        <span className={`status-chip ${statusTone(ride.status)}`}>
                          {formatEnumLabel(ride.status)}
                        </span>
                        <div className="admin-reference-avatar">
                          {ride.passenger.user.fullName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <strong>{ride.passenger.user.fullName}</strong>
                        <small>{ride.rider?.user.fullName ?? "Awaiting rider"}</small>
                      </div>
                      <div className="admin-request-route">
                        <span>{ride.pickupAddress}</span>
                        <span>{ride.destinationAddress}</span>
                        <small>{formatDateTime(ride.createdAt)}</small>
                      </div>
                      <div className="admin-request-fare">
                        <strong>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</strong>
                        <span>{ride.id.slice(-10).toUpperCase()}</span>
                      </div>
                      <div className="admin-request-card-actions">
                        {isActionable ? (
                          <>
                            <button type="button" disabled title="Dispatch accept endpoint is not exposed yet">
                              Accept
                            </button>
                            <button className="outline" type="button" disabled title="Dispatch decline endpoint is not exposed yet">
                              Decline
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setRequestStatusView("all")}>View Details</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </article>

          <aside className="admin-request-side">
            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>Live Requests Map</h3>
                  <p>{mapMarkers.length} live rider locations.</p>
                </div>
                <span className="live-dot">Live</span>
              </div>
              <div className="admin-request-map">
                <OperationsMap
                  center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                  zoom={mapMarkers.length > 0 ? 11 : 6}
                  markers={mapMarkers}
                  emptyTitle="No live map coordinates."
                  emptyDescription="Online riders with coordinates will appear here."
                />
              </div>
            </article>

            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>Request Statistics</h3>
                  <p>Current ride request status mix.</p>
                </div>
                <span>Today</span>
              </div>
              <div className="admin-request-stats">
                <div><Package size={16} /><span>Total Requests</span><strong>{rides.length}</strong></div>
                <div><Clock size={16} /><span>Pending</span><strong>{requestPending.length}</strong></div>
                <div><CheckCircle size={16} /><span>Accepted</span><strong>{requestAccepted.length}</strong></div>
                <div><Bike size={16} /><span>On Trip</span><strong>{requestOnTrip.length}</strong></div>
                <div><CheckCircle size={16} /><span>Completed</span><strong>{requestCompleted.length}</strong></div>
                <div><XCircle size={16} /><span>Cancelled</span><strong>{requestCancelled.length}</strong></div>
              </div>
            </article>

            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>Peak Request Time</h3>
                  <p>Requests grouped into 4-hour windows.</p>
                </div>
                <span>Today</span>
              </div>
              <div className="admin-request-peak-chart">
                {requestPeakBuckets.map((bucket) => (
                  <div key={bucket.label}>
                    <i style={{ height: bucket.count === 0 ? 0 : `${Math.max(8, (bucket.count / requestPeakMax) * 100)}%` }} />
                    <span>{bucket.label}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
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
      <div className="admin-reference-dark admin-users-dashboard">
        <section className="admin-users-kpis">
          <article className="admin-dark-kpi">
            <Users size={22} />
            <span>Total Users</span>
            <strong>{managedUsers.length}</strong>
            <small>{passengers.length} customers, {riders.length} riders</small>
          </article>
          <article className="admin-dark-kpi">
            <Bike size={22} />
            <span>Riders</span>
            <strong>{riders.length}</strong>
            <small>{activeRiders.length} online</small>
          </article>
          <article className="admin-dark-kpi">
            <User size={22} />
            <span>Customers</span>
            <strong>{passengers.length}</strong>
            <small>{recentPassengers.length} recent profiles</small>
          </article>
          <article className="admin-dark-kpi">
            <Package size={22} />
            <span>Vendors</span>
            <strong>0</strong>
            <small>No vendor endpoint wired</small>
          </article>
          <article className="admin-dark-kpi danger">
            <ShieldAlert size={22} />
            <span>Blocked Users</span>
            <strong>{blockedUsers.length}</strong>
            <small>From account status data</small>
          </article>
        </section>

        <section className="admin-users-layout">
          <article className="admin-dark-card admin-users-table-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>All Users</h3>
                <p>Riders and customers from the live backend. Vendors and admins appear when exposed by API.</p>
              </div>
              <div className="admin-users-actions">
                <button
                  type="button"
                  onClick={() => {
                    setUserTypeView("all");
                    setAdminSearchTerm("");
                  }}
                >
                  <Filter size={15} /> Reset Filters
                </button>
                <a href="/admin/riders"><UserPlus size={15} /> Add User</a>
              </div>
            </div>
            <label className="admin-users-search">
              <Search size={16} />
              <input
                type="search"
                value={adminSearchTerm}
                onChange={(event) => setAdminSearchTerm(event.target.value)}
                placeholder="Search by name, phone, email, or code"
              />
            </label>
            <div className="admin-users-segments">
              <button
                type="button"
                className={userTypeView === "all" ? "active" : ""}
                onClick={() => setUserTypeView("all")}
              >
                All ({managedUsers.length})
              </button>
              <button
                type="button"
                className={userTypeView === "riders" ? "active" : ""}
                onClick={() => setUserTypeView("riders")}
              >
                Riders ({riders.length})
              </button>
              <button
                type="button"
                className={userTypeView === "customers" ? "active" : ""}
                onClick={() => setUserTypeView("customers")}
              >
                Customers ({passengers.length})
              </button>
              <button
                type="button"
                className={userTypeView === "vendors" ? "active" : ""}
                onClick={() => setUserTypeView("vendors")}
              >
                Vendors (0)
              </button>
              <button
                type="button"
                className={userTypeView === "admins" ? "active" : ""}
                onClick={() => setUserTypeView("admins")}
              >
                Admins (0)
              </button>
            </div>
            {searchedManagedUsers.length === 0 ? (
              <EmptyCard
                title={
                  userTypeView === "vendors" || userTypeView === "admins"
                    ? `${formatEnumLabel(userTypeView)} are not wired yet.`
                    : "No users found."
                }
                body={
                  userTypeView === "vendors" || userTypeView === "admins"
                    ? "This UI is ready, but the backend does not expose this user type yet."
                    : "Try a different search term or reset the filters to see all users."
                }
              />
            ) : (
              <div className="table-wrapper admin-dark-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>User Type</th>
                      <th>Phone Number</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedManagedUsers.map((user) => {
                      const Icon = user.icon;

                      return (
                        <tr key={`${user.type}-${user.id}`}>
                          <td>
                            <div className="admin-users-person">
                              <span><Icon size={15} /></span>
                              <div>
                                <strong>{user.name}</strong>
                                <small>{user.reference}</small>
                              </div>
                            </div>
                          </td>
                          <td>{user.type}</td>
                          <td>{user.phone}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`status-chip ${statusTone(user.status)}`}>
                              {formatEnumLabel(user.status)}
                            </span>
                          </td>
                          <td>{user.joinedAt ? formatDateTime(user.joinedAt) : "Not available"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <aside className="admin-users-side">
            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>User Statistics</h3>
                  <p>Current user type split.</p>
                </div>
                <span>This month</span>
              </div>
              <div className="admin-users-donut-wrap">
                <div
                  className="admin-users-donut"
                  style={{
                    background:
                      managedUsers.length === 0
                        ? "#1f2937"
                        : `conic-gradient(#ffc107 0 ${(riders.length / Math.max(1, managedUsers.length)) * 100}%, #22c55e ${(riders.length / Math.max(1, managedUsers.length)) * 100}% 100%)`
                  }}
                >
                  <div>
                    <strong>{managedUsers.length}</strong>
                    <span>Total Users</span>
                  </div>
                </div>
                <ul className="admin-users-stat-list">
                  <li><i className="yellow" /> Riders <strong>{riders.length}</strong></li>
                  <li><i className="green" /> Customers <strong>{passengers.length}</strong></li>
                  <li><i className="blue" /> Vendors <strong>0</strong></li>
                  <li><i className="red" /> Admins <strong>0</strong></li>
                </ul>
              </div>
            </article>

            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>Recent Signups</h3>
                  <p>Newest rider and customer records.</p>
                </div>
                <span>View all</span>
              </div>
              {recentManagedUsers.length === 0 ? (
                <EmptyCard
                  title="No recent users."
                  body="New signups will appear here when records include signup timestamps."
                />
              ) : (
                <ul className="admin-users-recent-list">
                  {recentManagedUsers.map((user) => (
                    <li key={`${user.type}-recent-${user.id}`}>
                      <div className="admin-reference-avatar">{user.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.type}</span>
                      </div>
                      <small>{user.joinedAt ? formatDateTime(user.joinedAt) : "Recent"}</small>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="admin-dark-card">
              <div className="admin-dark-cardhead">
                <div>
                  <h3>User by Location</h3>
                  <p>Location distribution from rider cities and customer default cities.</p>
                </div>
                <span>View full report</span>
              </div>
              {userLocationSnapshot.length === 0 ? (
                <EmptyCard
                  title="No location data."
                  body="User location distribution will appear as profiles add city data."
                />
              ) : (
                <div className="admin-users-location-list">
                  {userLocationSnapshot.map(([location, count]) => (
                    <div key={location}>
                      <span>{location}</span>
                      <strong>{count}</strong>
                      <i style={{ width: `${Math.max(8, (count / userLocationMax) * 100)}%` }} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          </aside>
        </section>
      </div>
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
    ) : screen === "payments" ? (
      <div className="admin-finance-dashboard">
        <section className="admin-finance-kpis" aria-label="Finance metrics">
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon yellow">
              <CreditCard size={21} />
            </div>
            <span>Total Revenue</span>
            <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
            <small>{completedTrips.length} completed rides</small>
          </article>
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon yellow">
              <Bike size={21} />
            </div>
            <span>Rides Revenue</span>
            <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
            <small>{formatMoney(adminCurrency, totalCommission)} commission</small>
          </article>
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon yellow">
              <Package size={21} />
            </div>
            <span>Food Revenue</span>
            <strong>{formatMoney(adminCurrency, 0)}</strong>
            <small>No food order endpoint wired</small>
          </article>
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon yellow">
              <Package size={21} />
            </div>
            <span>Delivery Revenue</span>
            <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
            <small>No delivery endpoint wired</small>
          </article>
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon purple">
              <CreditCard size={21} />
            </div>
            <span>Total Payouts</span>
            <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
            <small>{paidPayoutRequests.length} paid requests</small>
          </article>
          <article className="admin-finance-kpi">
            <div className="admin-finance-kpi-icon green">
              <Bike size={21} />
            </div>
            <span>Net Profit</span>
            <strong>{formatMoney(adminCurrency, platformNetProfit)}</strong>
            <small>{profitMargin.toFixed(1)}% profit margin</small>
          </article>
        </section>

        <section className="admin-finance-grid-main">
          <article className="admin-finance-card admin-finance-revenue-chart">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Revenue Overview</h3>
                <p>Completed ride revenue and platform commission over the last 10 days.</p>
              </div>
              <span>This week</span>
            </div>
            <div className="admin-finance-legend">
              <span><i className="yellow" /> Total revenue</span>
              <span><i className="blue" /> Platform commission</span>
              <span><i className="green" /> Food revenue</span>
              <span><i className="purple" /> Delivery revenue</span>
            </div>
            <div className="admin-finance-chart">
              {financeDailyBuckets.map((bucket) => (
                <div key={bucket.key} className="admin-finance-chart-day">
                  <div className="admin-finance-chart-bars">
                    <i
                      className="yellow"
                      style={{
                        height:
                          bucket.revenue === 0
                            ? 0
                            : `${Math.max(8, (bucket.revenue / financeDailyMax) * 100)}%`
                      }}
                    />
                    <i
                      className="blue"
                      style={{
                        height:
                          bucket.commission === 0
                            ? 0
                            : `${Math.max(8, (bucket.commission / financeDailyMax) * 100)}%`
                      }}
                    />
                    <i className="green" style={{ height: 0 }} />
                    <i className="purple" style={{ height: 0 }} />
                  </div>
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-finance-card admin-finance-breakdown">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Revenue Breakdown</h3>
                <p>Revenue split by currently wired business line.</p>
              </div>
            </div>
            <div className="admin-finance-breakdown-body">
              <div
                className="admin-finance-donut"
                style={{
                  background:
                    totalDashboardRevenue === 0
                      ? "#1f2937"
                      : `conic-gradient(#ffc107 0 ${rideRevenuePercent}%, #22c55e ${rideRevenuePercent}% ${rideRevenuePercent}%, #6d5dfc ${rideRevenuePercent}% 100%)`
                }}
              >
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(adminCurrency, totalDashboardRevenue)}</strong>
                </div>
              </div>
              <ul className="admin-finance-breakdown-list">
                <li>
                  <i className="yellow" />
                  <span>Rides Revenue</span>
                  <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
                  <small>{rideRevenuePercent}%</small>
                </li>
                <li>
                  <i className="green" />
                  <span>Food Revenue</span>
                  <strong>{formatMoney(adminCurrency, 0)}</strong>
                  <small>0%</small>
                </li>
                <li>
                  <i className="purple" />
                  <span>Delivery Revenue</span>
                  <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
                  <small>{deliveryRevenuePercent}%</small>
                </li>
              </ul>
            </div>
          </article>

          <aside className="admin-finance-side-stack">
            <article className="admin-finance-card">
              <div className="admin-finance-cardhead">
                <div>
                  <h3>Wallet Summary</h3>
                  <p>Admin-visible wallet and payout movement.</p>
                </div>
                <a href="/admin/finance">View all</a>
              </div>
              <div className="admin-finance-wallet-main">
                <span>OkadaGo Wallet Volume</span>
                <strong>{formatMoney(adminCurrency, postedWalletVolume)}</strong>
              </div>
              <div className="admin-finance-wallet-grid">
                <div>
                  <span>Pending payouts</span>
                  <strong>{formatMoney(adminCurrency, pendingPayoutValue)}</strong>
                </div>
                <div>
                  <span>Hold balance</span>
                  <strong>{formatMoney(adminCurrency, payoutHoldBalance)}</strong>
                </div>
              </div>
            </article>

            <article className="admin-finance-card">
              <div className="admin-finance-cardhead">
                <div>
                  <h3>Recent Transactions</h3>
                  <p>Latest wallet transactions from the backend.</p>
                </div>
                <a href="#finance-ledger">View all</a>
              </div>
              {walletTransactionsQuery.isLoading ? (
                <div className="status-chip warning">Loading transactions</div>
              ) : walletTransactionsQuery.isError ? (
                <EmptyCard
                  title="Could not load transactions."
                  body={walletTransactionsQuery.error.message}
                />
              ) : recentFinanceTransactions.length === 0 ? (
                <EmptyCard
                  title="No wallet transactions yet."
                  body="Wallet top-ups, commissions, payouts, and reversals will appear here."
                />
              ) : (
                <ul className="admin-finance-transaction-list">
                  {recentFinanceTransactions.map((transaction) => (
                    <li key={transaction.id}>
                      <div>
                        <strong>{transaction.description ?? formatEnumLabel(transaction.type)}</strong>
                        <span>{transaction.wallet.user.fullName}</span>
                      </div>
                      <span className={parseNumber(transaction.amount) < 0 ? "debit" : "credit"}>
                        {formatMoney(transaction.currency, transaction.amount)}
                      </span>
                      <em className={`status-chip ${statusTone(transaction.status)}`}>
                        {formatEnumLabel(transaction.status)}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="admin-finance-card">
              <div className="admin-finance-cardhead">
                <div>
                  <h3>Expenses Summary</h3>
                  <p>Expense tracking is not exposed by the backend yet.</p>
                </div>
                <span>This month</span>
              </div>
              <EmptyCard
                title="No expenses endpoint is wired."
                body="Once expenses or invoices are added to the API, this panel can show real operational costs."
              />
            </article>
          </aside>
        </section>

        <section className="admin-finance-grid-lower">
          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Payout Overview</h3>
                <p>Paid payout volume over the same 10-day window.</p>
              </div>
              <span>This week</span>
            </div>
            <div className="admin-finance-payout-bars">
              {payoutDailyBuckets.map((bucket) => (
                <div key={bucket.key}>
                  <i
                    style={{
                      height:
                        bucket.payouts === 0
                          ? 0
                          : `${Math.max(8, (bucket.payouts / payoutDailyMax) * 100)}%`
                    }}
                  />
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
            <div className="admin-finance-progress-list">
              <div>
                <span>Paid payouts</span>
                <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
              </div>
              <div>
                <span>Pending payout queue</span>
                <strong>{formatMoney(adminCurrency, pendingPayoutValue)}</strong>
              </div>
            </div>
          </article>

          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Payment Methods</h3>
                <p>Grouped from linked payment and wallet transaction data.</p>
              </div>
              <a href="#finance-ledger">View all</a>
            </div>
            {paymentMethodSnapshot.length === 0 ? (
              <EmptyCard
                title="No payment method volume yet."
                body="Payment method totals will appear after wallet transactions are recorded."
              />
            ) : (
              <div className="table-wrapper admin-finance-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Revenue</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethodSnapshot.map(([method, amount]) => (
                      <tr key={method}>
                        <td>{formatEnumLabel(method)}</td>
                        <td>{formatMoney(adminCurrency, amount)}</td>
                        <td>
                          {paymentMethodTotal > 0
                            ? `${((amount / paymentMethodTotal) * 100).toFixed(1)}%`
                            : "0%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td>{formatMoney(adminCurrency, paymentMethodTotal)}</td>
                      <td>100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </article>
        </section>

        <section className="admin-finance-card admin-finance-controls">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Finance Filters</h3>
              <p>Filter wallet movement, payout requests, and rating verification records.</p>
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

        <section id="finance-ledger" className="admin-finance-grid-ledgers">
          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Wallet Transaction Ledger</h3>
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
              <div className="table-wrapper admin-finance-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Wallet</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Reference</th>
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
                          <td>{formatEnumLabel(transaction.wallet.type)}</td>
                          <td>{formatEnumLabel(transaction.type)}</td>
                          <td>
                            <span className={`status-chip ${statusTone(transaction.status)}`}>
                              {formatEnumLabel(transaction.status)}
                            </span>
                          </td>
                          <td>{formatMoney(transaction.currency, transaction.amount)}</td>
                          <td>{transaction.reference}</td>
                          <td>{formatDateTime(transaction.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Payout Review Queue</h3>
                <p>Approve, process, pay, or reject rider payout requests.</p>
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
                        <span>{request.rider.displayCode} - {request.destinationLabel}</span>
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
          </article>
        </section>

        <section className="admin-finance-card">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Finance Summary</h3>
              <p>Combined view of ride revenue, payouts, expenses, and margin.</p>
            </div>
          </div>
          <div className="admin-finance-summary-strip">
            <div>
              <span>Total Revenue</span>
              <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
            </div>
            <div>
              <span>Total Payouts</span>
              <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
            </div>
            <div>
              <span>Total Expenses</span>
              <strong>{formatMoney(adminCurrency, 0)}</strong>
            </div>
            <div>
              <span>Net Profit</span>
              <strong>{formatMoney(adminCurrency, platformNetProfit)}</strong>
            </div>
            <div>
              <span>Profit Margin</span>
              <strong>{profitMargin.toFixed(1)}%</strong>
            </div>
          </div>
        </section>
      </div>
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
      <div
        className={`exact-admin-shell ${
          ["payments", "rides", "passengers"].includes(screen) ? "admin-finance-shell" : ""
        }`}
      >
        <aside className="exact-admin-sidebar">
          <div className="exact-admin-brand">
            <div>
              <strong>Okada<span>Go</span></strong>
              <small>Move - Deliver</small>
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
              <button className="exact-admin-menu-button" type="button" aria-label="Open admin navigation">
                <Menu size={21} />
              </button>
              <div className="exact-admin-pageintro">
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
              <button className="exact-icon-button notification" type="button">
                <Bell size={18} />
              </button>
              <button className="exact-admin-zone" type="button">
                <CalendarDays size={15} />
                <span>{dashboardToday}</span>
                <ChevronDown size={15} />
              </button>
              <div className="exact-admin-top-profile">
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
                  <span>Super Admin</span>
                </div>
                <ChevronDown size={15} />
              </div>
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
