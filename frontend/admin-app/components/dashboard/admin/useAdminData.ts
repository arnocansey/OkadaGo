"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Bike, Package, Users, CreditCard, Star, Tag, MapPin, Bell, User } from "lucide-react";

import { requestJson } from "@/lib/api";
import { parseNumber, shortDate } from "./utils";
import { useAdminToast } from "./AdminToast";
import type {
  AdminConsoleScreen,
  RideRecord,
  DeliveryRecord,
  RiderRecord,
  PassengerRecord,
  WalletTransactionRecord,
  PayoutRequestRecord,
  AdminRatingRecord,
  AdminIncidentRecord,
  AdminAccountRecord,
  ServiceZoneRecord,
  RiderFinancialRow,
  AuditLogRecord,
  AdminSupportTicketRecord,
  EscalationRuleRecord,
  OpsJobStatus,
  ScheduledBroadcastRecord,
  AdminUserStats,
  RiderDocumentRecord
} from "./types";

// ─── query key constants ──────────────────────────────────────────────────────
export const QK = {
  rides: (token?: string | null) => ["rides", token],
  deliveries: (token?: string | null) => ["deliveries", token],
  riders: (token?: string | null) => ["riders", token],
  passengers: (token?: string | null) => ["passengers", token],
  userStats: (token?: string | null) => ["admin-user-stats", token],
  walletTx: (token?: string | null) => ["admin-wallet-transactions", token],
  payoutRequests: (token?: string | null) => ["admin-payout-requests", token],
  ratings: (token?: string | null) => ["admin-ratings", token],
  incidents: (token?: string | null) => ["admin-incidents", token],
  adminAccounts: (token?: string | null) => ["admin-accounts", token],
  adminPermissions: (token?: string | null) => ["admin-permissions", token],
  adminModules: (token?: string | null) => ["admin-modules", token],
  zones: (token?: string | null) => ["service-zones", token],
  auditLogs: (token?: string | null) => ["admin-audit-logs", token],
  supportTickets: (token?: string | null) => ["admin-support-tickets", token],
  escalationRules: (token?: string | null) => ["admin-escalation-rules", token],
  scheduledBroadcasts: (token?: string | null) => ["admin-scheduled-broadcasts", token],
  opsJobStatus: (token?: string | null) => ["admin-ops-jobs-status", token],
  riderDocuments: (token?: string | null) => ["admin-rider-documents", token]
} as const;

// ─── helpers ──────────────────────────────────────────────────────────────────
function sum(values: (string | number | null | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + parseNumber(v), 0);
}

function getLast7DayKeys(): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    keys.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  return keys;
}

function getLast10DayKeys(): string[] {
  const keys: string[] = [];
  const now = Date.now();
  for (let i = 9; i >= 0; i--) {
    keys.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  return keys;
}

function getDateKeys(from?: string, to?: string, defaultDays: number = 7): string[] {
  if (from && to) {
    const keys: string[] = [];
    const start = new Date(from + "T00:00:00Z").getTime();
    const end = new Date(to + "T00:00:00Z").getTime();
    for (let t = start; t <= end; t += 86400000) {
      keys.push(new Date(t).toISOString().slice(0, 10));
    }
    return keys;
  }
  const keys: string[] = [];
  const now = Date.now();
  for (let i = defaultDays - 1; i >= 0; i--) {
    keys.push(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  return keys;
}

// ─── default currency ─────────────────────────────────────────────────────────
const DEFAULT_CURRENCY = "GHS";

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useAdminData(token: string | null | undefined, isAdmin: boolean) {
  const queryClient = useQueryClient();
  const { addToast } = useAdminToast();

  // ── local UI state ──────────────────────────────────────────────────────────
  const [requestTab, setRequestTab] = useState<"rides" | "delivery">("rides");
  const [requestStatusView, setRequestStatusView] = useState<"all" | "pending" | "accepted" | "on-trip" | "completed" | "cancelled">("all");
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  const [userTypeView, setUserTypeView] = useState<"all" | "riders" | "customers" | "vendors" | "admins">("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [ratingRiderFilter, setRatingRiderFilter] = useState("");
  const [ratingRideFilter, setRatingRideFilter] = useState("");
  const [ratingFromDateFilter, setRatingFromDateFilter] = useState("");
  const [ratingToDateFilter, setRatingToDateFilter] = useState("");
  const [payoutRejectionReasons, setPayoutRejectionReasons] = useState<Record<string, string>>({});
  const [dashboardDateRange, setDashboardDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

  const [adminForm, setAdminForm] = useState({
    fullName: "", email: "", phoneCountryCode: "+233", phoneLocal: "",
    phoneE164: "", preferredCurrency: "GHS", password: "", title: "", permissions: ""
  });
  const [promoteForm, setPromoteForm] = useState({
    passengerUserId: "", email: "", password: "", title: "", permissions: ""
  });

  // ── queries (reduced polling intervals) ─────────────────────────────────────
  const { data: ridesData, isPending: ridesPending } = useQuery<RideRecord[]>({
    queryKey: QK.rides(token),
    queryFn: () => requestJson("/rides", { token }),
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 25000
  });

  const { data: deliveriesData, isPending: deliveriesPending } = useQuery<DeliveryRecord[]>({
    queryKey: QK.deliveries(token),
    queryFn: () => requestJson("/deliveries", { token }),
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 25000
  });

  const { data: ridersResp, isPending: ridersPending } = useQuery<{ data: RiderRecord[]; total: number }>({
    queryKey: QK.riders(token),
    queryFn: () => requestJson("/bootstrap/riders?limit=200", { token }),
    enabled: isAdmin,
    refetchInterval: 45000,
    staleTime: 40000
  });
  const ridersData = ridersResp?.data;
  const ridersTotal = ridersResp?.total ?? ridersData?.length ?? 0;

  const { data: passengersResp } = useQuery<{ data: PassengerRecord[]; total: number }>({
    queryKey: QK.passengers(token),
    queryFn: () => requestJson("/bootstrap/passengers?limit=200", { token }),
    enabled: isAdmin,
    refetchInterval: 60000,
    staleTime: 55000
  });
  const passengersData = passengersResp?.data;
  const passengersTotal = passengersResp?.total ?? passengersData?.length ?? 0;

  const { data: userStats } = useQuery<AdminUserStats>({
    queryKey: QK.userStats(token),
    queryFn: () => requestJson("/admin/user-stats", { token }),
    enabled: isAdmin,
    refetchInterval: 60000,
    staleTime: 55000
  });

  const { data: walletTxData, isPending: walletTxPending } = useQuery<WalletTransactionRecord[]>({
    queryKey: QK.walletTx(token),
    queryFn: () => requestJson("/admin/payments/wallet-transactions", { token }),
    enabled: isAdmin,
    refetchInterval: 45000,
    staleTime: 40000
  });

  const { data: payoutData, isPending: payoutPending } = useQuery<PayoutRequestRecord[]>({
    queryKey: QK.payoutRequests(token),
    queryFn: () => requestJson("/admin/payments/payout-requests", { token }),
    enabled: isAdmin,
    refetchInterval: 45000,
    staleTime: 40000
  });

  const { data: ratingsData, isPending: ratingsPending } = useQuery<AdminRatingRecord[]>({
    queryKey: QK.ratings(token),
    queryFn: () => requestJson("/admin/ratings", { token }),
    enabled: isAdmin,
    refetchInterval: 60000,
    staleTime: 55000
  });

  const { data: incidentsData, isPending: incidentsPending } = useQuery<AdminIncidentRecord[]>({
    queryKey: QK.incidents(token),
    queryFn: () => requestJson("/admin/incidents", { token }),
    enabled: isAdmin,
    refetchInterval: 45000,
    staleTime: 40000
  });

  const { data: adminAccountsData } = useQuery<AdminAccountRecord[]>({
    queryKey: QK.adminAccounts(token),
    queryFn: () => requestJson("/admin/accounts", { token }),
    enabled: isAdmin,
    staleTime: 120000
  });

  const { data: adminPermissionsData } = useQuery<{ roles: Record<string, string[]> }>({
    queryKey: QK.adminPermissions(token),
    queryFn: () => requestJson("/admin/permissions", { token }),
    enabled: isAdmin,
    staleTime: 300000
  });

  const { data: adminModulesData } = useQuery<{ modules: string[] }>({
    queryKey: QK.adminModules(token),
    queryFn: () => requestJson("/admin/modules", { token }),
    enabled: isAdmin,
    staleTime: 300000
  });

  const { data: zonesData } = useQuery<ServiceZoneRecord[]>({
    queryKey: QK.zones(token),
    queryFn: () => requestJson("/bootstrap/service-zones?limit=100", { token }),
    enabled: isAdmin,
    staleTime: 120000
  });

  const { data: auditLogsData } = useQuery<AuditLogRecord[]>({
    queryKey: QK.auditLogs(token),
    queryFn: async () => {
      try {
        const rows = await requestJson<Array<{
          id: string;
          action: string;
          entityType?: string;
          entity?: string;
          entityId: string | null;
          changes?: Record<string, unknown> | null;
          details?: Record<string, unknown> | null;
          createdAt: string;
          actor?: { id: string; fullName: string; email: string | null; role?: string } | null;
        }>>("/admin/audit-logs", { token });
        return rows.map((row) => ({
          id: row.id,
          action: row.action,
          entity: row.entity ?? row.entityType ?? "Unknown",
          entityId: row.entityId,
          details: row.details ?? row.changes ?? null,
          createdAt: row.createdAt,
          actor: row.actor
            ? {
                id: row.actor.id,
                fullName: row.actor.fullName,
                email: row.actor.email,
                role: row.actor.role ?? "admin"
              }
            : null
        }));
      } catch (err) {
        console.warn("Audit logs not available in backend", err);
        return [];
      }
    },
    enabled: isAdmin,
    staleTime: 60000
  });

  const { data: supportTicketsData } = useQuery<AdminSupportTicketRecord[]>({
    queryKey: QK.supportTickets(token),
    queryFn: () => requestJson("/admin/support/tickets", { token }),
    enabled: isAdmin,
    refetchInterval: 30000,
    staleTime: 25000
  });

  const { data: escalationRulesData } = useQuery<EscalationRuleRecord[]>({
    queryKey: QK.escalationRules(token),
    queryFn: () => requestJson("/admin/escalation-rules", { token }),
    enabled: isAdmin,
    staleTime: 30000
  });

  const { data: scheduledBroadcastsData } = useQuery<ScheduledBroadcastRecord[]>({
    queryKey: QK.scheduledBroadcasts(token),
    queryFn: async () => {
      const rows = await requestJson<Array<{
        id: string;
        title: string;
        body: string;
        targetAudience: string;
        targetZoneId?: string | null;
        targetZone?: { id: string; name: string } | null;
        scheduledAt: string;
        status: string;
        sentCount?: number;
        retryCount?: number;
        lastRunAt?: string | null;
        lastError?: string | null;
        createdAt: string;
      }>>("/admin/scheduled-broadcasts", { token });
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        targetAudience: row.targetAudience.toLowerCase() as ScheduledBroadcastRecord["targetAudience"],
        targetZone: row.targetZone?.name,
        scheduledAt: row.scheduledAt,
        status: row.status.toLowerCase() as ScheduledBroadcastRecord["status"],
        sentCount: row.sentCount,
        retryCount: row.retryCount,
        lastRunAt: row.lastRunAt,
        lastError: row.lastError,
        createdAt: row.createdAt
      }));
    },
    enabled: isAdmin,
    staleTime: 20000
  });

  const { data: opsJobStatusData } = useQuery<OpsJobStatus>({
    queryKey: QK.opsJobStatus(token),
    queryFn: () => requestJson<OpsJobStatus>("/admin/ops-jobs/status", { token }),
    enabled: isAdmin,
    staleTime: 15000,
    refetchInterval: 30000
  });

  const { data: riderDocumentsData, isPending: riderDocumentsPending } = useQuery<RiderDocumentRecord[]>({
    queryKey: QK.riderDocuments(token),
    queryFn: () => requestJson<RiderDocumentRecord[]>("/admin/documents?limit=300", { token }),
    enabled: isAdmin,
    staleTime: 20000
  });

  // ── raw data ────────────────────────────────────────────────────────────────
  const rides = useMemo(() => ridesData ?? [], [ridesData]);
  const deliveries = useMemo(() => deliveriesData ?? [], [deliveriesData]);
  const riders = useMemo(() => ridersData ?? [], [ridersData]);
  const passengers = useMemo(() => passengersData ?? [], [passengersData]);
  const walletTransactions = useMemo(() => walletTxData ?? [], [walletTxData]);
  const payoutRequests = useMemo(() => payoutData ?? [], [payoutData]);
  const ratings = useMemo(() => ratingsData ?? [], [ratingsData]);
  const incidents = useMemo(() => incidentsData ?? [], [incidentsData]);
  const adminAccounts = useMemo(() => adminAccountsData ?? [], [adminAccountsData]);
  const zones = useMemo(() => zonesData ?? [], [zonesData]);
  const auditLogs = useMemo(() => auditLogsData ?? [], [auditLogsData]);
  const supportTickets = useMemo(() => supportTicketsData ?? [], [supportTicketsData]);
  const escalationRules = useMemo(() => escalationRulesData ?? [], [escalationRulesData]);
  const scheduledBroadcasts = useMemo(() => scheduledBroadcastsData ?? [], [scheduledBroadcastsData]);
  const opsJobStatus = opsJobStatusData ?? null;
  const adminRoleEntries = useMemo(
    () => Object.entries(adminPermissionsData?.roles ?? {}),
    [adminPermissionsData]
  );
  const adminModules = useMemo(() => adminModulesData?.modules ?? [], [adminModulesData]);

  // ── derived rider data ──────────────────────────────────────────────────────
  const activeRiders = useMemo(() => riders.filter((r) => r.onlineStatus), [riders]);
  const ridersWithCoords = useMemo(
    () =>
      riders.filter((r) => {
        const lat = parseNumber(r.currentLatitude);
        const lng = parseNumber(r.currentLongitude);
        return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
      }),
    [riders]
  );
  const suspendedRiders = useMemo(
    () =>
      riders.filter((r) => {
        const account = (r.user.accountStatus ?? "").toLowerCase();
        const approval = (r.approvalStatus ?? "").toUpperCase();
        return (
          account === "suspended" ||
          account === "banned" ||
          account === "blocked" ||
          approval === "SUSPENDED" ||
          Boolean(r.suspendedAt)
        );
      }),
    [riders]
  );
  const vehicleCount = useMemo(() => riders.filter((r) => r.vehicle != null).length, [riders]);

  // ── derived ride data ───────────────────────────────────────────────────────
  const completedRides = useMemo(() => rides.filter((r) => r.status.toLowerCase() === "completed"), [rides]);
  const activeRides = useMemo(
    () => rides.filter((r) => !["completed", "cancelled"].includes(r.status.toLowerCase())),
    [rides]
  );
  const completedDeliveries = useMemo(() => deliveries.filter((d) => d.status.toLowerCase() === "delivered"), [deliveries]);
  const cancelledDeliveries = useMemo(() => deliveries.filter((d) => d.status.toLowerCase() === "cancelled"), [deliveries]);
  const activeDeliveries = useMemo(
    () => deliveries.filter((d) => !["delivered", "cancelled"].includes(d.status.toLowerCase())),
    [deliveries]
  );

  // ── map markers ─────────────────────────────────────────────────────────────
  const mapMarkers = useMemo(
    () =>
      ridersWithCoords.map((rider) => ({
        id: rider.id,
        position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [number, number],
        label: rider.user.fullName,
        variant: "driver" as const
      })),
    [ridersWithCoords]
  );

  // ── currency ────────────────────────────────────────────────────────────────
  const adminCurrency = useMemo(() => {
    if (zones.length > 0) return zones[0].currency;
    if (riders.length > 0) return riders[0].user.preferredCurrency;
    if (passengers.length > 0) return passengers[0].user.preferredCurrency;
    return DEFAULT_CURRENCY;
  }, [zones, riders, passengers]);

  // ── weekly ride buckets ─────────────────────────────────────────────────────
  const weeklyRideBuckets = useMemo(() => {
    const dayKeys = getDateKeys(dashboardDateRange.from, dashboardDateRange.to, 7);
    return dayKeys.map((key) => {
      const dayRides = rides.filter((r) => r.createdAt.slice(0, 10) === key);
      const date = new Date(key);
      const label = new Intl.DateTimeFormat("en-GH", { weekday: "short" }).format(date);
      return {
        key,
        label,
        rides: dayRides.length,
        completed: dayRides.filter((r) => r.status.toLowerCase() === "completed").length
      };
    });
  }, [rides, dashboardDateRange]);

  const weeklyRideMax = useMemo(
    () => Math.max(1, ...weeklyRideBuckets.map((b) => b.rides)),
    [weeklyRideBuckets]
  );

  // ── revenue calculations ────────────────────────────────────────────────────
  const rideRevenue = useMemo(
    () => sum(completedRides.map((r) => r.platformCommission)),
    [completedRides]
  );
  const deliveryRevenue = useMemo(
    () => sum(completedDeliveries.map((d) => d.platformCommission)),
    [completedDeliveries]
  );
  const totalDashboardRevenue = rideRevenue + deliveryRevenue;
  const rideRevenuePercent = useMemo(
    () => totalDashboardRevenue === 0 ? 0 : Math.round((rideRevenue / totalDashboardRevenue) * 100),
    [rideRevenue, totalDashboardRevenue]
  );
  const deliveryRevenuePercent = 100 - rideRevenuePercent;

  // ── finance aggregations ────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => sum(completedRides.map((r) => r.finalFare ?? r.estimatedFare)) +
      sum(completedDeliveries.map((d) => d.finalFee ?? d.estimatedFee)),
    [completedRides, completedDeliveries]
  );
  const totalCommission = useMemo(
    () => sum([...completedRides.map((r) => r.platformCommission), ...completedDeliveries.map((d) => d.platformCommission)]),
    [completedRides, completedDeliveries]
  );
  const paidPayoutRequests = useMemo(
    () => payoutRequests.filter((p) => p.status.toLowerCase() === "paid"),
    [payoutRequests]
  );
  const pendingPayoutRequests = useMemo(
    () => payoutRequests.filter((p) => ["requested", "reviewing", "approved", "processing"].includes(p.status.toLowerCase())),
    [payoutRequests]
  );
  const payoutOutflow = useMemo(
    () => sum(paidPayoutRequests.map((p) => p.amount)),
    [paidPayoutRequests]
  );
  const platformNetProfit = totalCommission - payoutOutflow;
  const profitMargin = totalRevenue > 0 ? (platformNetProfit / totalRevenue) * 100 : 0;
  const pendingPayoutValue = useMemo(
    () => sum(pendingPayoutRequests.map((p) => p.amount)),
    [pendingPayoutRequests]
  );

  const postedWalletTransactions = useMemo(
    () => walletTransactions.filter((t) => t.status.toUpperCase() === "POSTED"),
    [walletTransactions]
  );
  const pendingWalletTransactions = useMemo(
    () => walletTransactions.filter((t) => t.status.toUpperCase() === "PENDING"),
    [walletTransactions]
  );
  const failedWalletTransactions = useMemo(
    () => walletTransactions.filter((t) => ["FAILED", "REVERSED"].includes(t.status.toUpperCase())),
    [walletTransactions]
  );

  const filteredWalletTransactions = useMemo(() => {
    return walletTransactions.filter((t) => {
      if (transactionStatusFilter && t.status.toUpperCase() !== transactionStatusFilter) return false;
      if (transactionTypeFilter && !t.type.toUpperCase().includes(transactionTypeFilter)) return false;
      return true;
    });
  }, [walletTransactions, transactionStatusFilter, transactionTypeFilter]);

  const filteredPayoutRequests = useMemo(() => {
    if (!payoutStatusFilter) return payoutRequests;
    return payoutRequests.filter((p) => p.status.toUpperCase() === payoutStatusFilter);
  }, [payoutRequests, payoutStatusFilter]);

  // ── finance daily buckets ───────────────────────────────────────────────────
  const financeDailyBuckets = useMemo(() => {
    const dayKeys = getDateKeys(dashboardDateRange.from, dashboardDateRange.to, 10);
    return dayKeys.map((key) => {
      const dayRides = completedRides.filter((r) => r.createdAt.slice(0, 10) === key);
      const dayDeliveries = completedDeliveries.filter((d) => d.createdAt.slice(0, 10) === key);
      const revenue = sum([...dayRides.map((r) => r.finalFare ?? r.estimatedFare), ...dayDeliveries.map((d) => d.finalFee ?? d.estimatedFee)]);
      const commission = sum([...dayRides.map((r) => r.platformCommission), ...dayDeliveries.map((d) => d.platformCommission)]);
      return { key, label: shortDate(key + "T12:00:00Z"), revenue, commission };
    });
  }, [completedRides, completedDeliveries, dashboardDateRange]);

  const financeDailyMax = useMemo(
    () => Math.max(1, ...financeDailyBuckets.map((b) => b.revenue)),
    [financeDailyBuckets]
  );

  const payoutDailyBuckets = useMemo(() => {
    const dayKeys = getDateKeys(dashboardDateRange.from, dashboardDateRange.to, 10);
    return dayKeys.map((key) => {
      const dayPayouts = paidPayoutRequests.filter((p) => p.paidAt?.slice(0, 10) === key);
      const payouts = sum(dayPayouts.map((p) => p.amount));
      return { key, label: shortDate(key + "T12:00:00Z"), payouts };
    });
  }, [paidPayoutRequests, dashboardDateRange]);

  const payoutDailyMax = useMemo(
    () => Math.max(1, ...payoutDailyBuckets.map((b) => b.payouts)),
    [payoutDailyBuckets]
  );

  const paymentMethodSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    walletTransactions.forEach((t) => {
      if (t.payment?.method) {
        map[t.payment.method] = (map[t.payment.method] ?? 0) + parseNumber(t.amount);
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [walletTransactions]);

  const paymentMethodTotal = useMemo(
    () => paymentMethodSnapshot.reduce((sum, [, v]) => sum + v, 0),
    [paymentMethodSnapshot]
  );

  // ── rider financial rows ────────────────────────────────────────────────────
  const riderFinancialRows = useMemo((): RiderFinancialRow[] => {
    return riders.map((rider) => {
      const riderRides = rides.filter((r) => r.rider?.user.fullName === rider.user.fullName);
      const completed = riderRides.filter((r) => r.status.toLowerCase() === "completed");
      const active = riderRides.filter((r) => !["completed", "cancelled"].includes(r.status.toLowerCase()));
      const revenue = sum(completed.map((r) => r.finalFare ?? r.estimatedFare));
      const commission = sum(completed.map((r) => r.platformCommission));
      const earnings = revenue - commission;

      const riderRatings = ratings.filter((rat) => rat.rated.riderProfile?.id === rider.id);
      const averageRating =
        riderRatings.length > 0
          ? riderRatings.reduce((s, r) => s + r.score, 0) / riderRatings.length
          : 0;

      const riderWalletTx = walletTransactions.filter(
        (t) => t.wallet.user.riderProfile?.id === rider.id
      );
      const walletMovement = sum(riderWalletTx.map((t) => parseNumber(t.amount)));

      const riderPayouts = payoutRequests.filter((p) => p.rider.id === rider.id);
      const payoutTotal = sum(
        riderPayouts.filter((p) => p.status.toLowerCase() === "paid").map((p) => p.amount)
      );

      return {
        rider,
        rideCount: riderRides.length,
        completedCount: completed.length,
        activeCount: active.length,
        revenue,
        earnings,
        commission,
        averageRating,
        ratingCount: riderRatings.length,
        walletMovement,
        payoutTotal
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  }, [riders, rides, ratings, walletTransactions, payoutRequests]);

  // ── rider wallet aggregations ───────────────────────────────────────────────
  const riderWalletTransactions = useMemo(
    () => walletTransactions.filter((t) => t.wallet.user.role === "rider"),
    [walletTransactions]
  );
  const riderWalletCredits = useMemo(
    () => sum(riderWalletTransactions.filter((t) => parseNumber(t.amount) > 0).map((t) => t.amount)),
    [riderWalletTransactions]
  );
  const riderWalletDebits = useMemo(
    () => sum(riderWalletTransactions.filter((t) => parseNumber(t.amount) < 0).map((t) => Math.abs(parseNumber(t.amount)))),
    [riderWalletTransactions]
  );
  const riderWalletAvailableBalance = useMemo(
    () => sum(payoutRequests.map((p) => p.wallet.availableBalance)),
    [payoutRequests]
  );
  const riderWalletLockedBalance = useMemo(
    () => sum(payoutRequests.map((p) => p.wallet.lockedBalance)),
    [payoutRequests]
  );
  const riderWalletMovementTotal = riderWalletCredits - riderWalletDebits;

  // ── finance reconciliation breakdown ────────────────────────────────────────
  const totalRideRevenue = useMemo(
    () => sum(completedRides.map((r) => r.finalFare ?? r.estimatedFare)),
    [completedRides]
  );
  const totalDeliveryRevenue = useMemo(
    () => sum(completedDeliveries.map((d) => d.finalFee ?? d.estimatedFee)),
    [completedDeliveries]
  );
  const totalRideCommission = useMemo(
    () => sum(completedRides.map((r) => r.platformCommission)),
    [completedRides]
  );
  const totalDeliveryCommission = useMemo(
    () => sum(completedDeliveries.map((d) => d.platformCommission)),
    [completedDeliveries]
  );
  const riderEarningsTotal = useMemo(
    () => sum(riderFinancialRows.map((r) => r.earnings)),
    [riderFinancialRows]
  );

  // ── rider earning buckets ───────────────────────────────────────────────────
  const riderEarningBuckets = useMemo(() => {
    const dayKeys = getDateKeys(dashboardDateRange.from, dashboardDateRange.to, 10);
    return dayKeys.map((key) => {
      const dayRides = completedRides.filter((r) => r.createdAt.slice(0, 10) === key);
      const earnings = sum(dayRides.map((r) => parseNumber(r.finalFare ?? r.estimatedFare) - parseNumber(r.platformCommission)));
      return { key, label: shortDate(key + "T12:00:00Z"), trips: dayRides.length, earnings };
    });
  }, [completedRides, dashboardDateRange]);

  const riderChartMax = useMemo(
    () => Math.max(1, ...riderEarningBuckets.map((b) => Math.max(b.trips, b.earnings))),
    [riderEarningBuckets]
  );

  const totalRiderGrossRevenue = useMemo(
    () => sum(riderFinancialRows.map((r) => r.revenue)),
    [riderFinancialRows]
  );
  const totalRiderEarnings = useMemo(
    () => sum(riderFinancialRows.map((r) => r.earnings)),
    [riderFinancialRows]
  );
  const totalRiderCommission = useMemo(
    () => sum(riderFinancialRows.map((r) => r.commission)),
    [riderFinancialRows]
  );

  // ── rider payout data ───────────────────────────────────────────────────────
  const requestedRiderPayouts = useMemo(
    () => payoutRequests.filter((p) => ["requested", "reviewing"].includes(p.status.toLowerCase())),
    [payoutRequests]
  );
  const failedRiderPayouts = useMemo(
    () => payoutRequests.filter((p) => ["rejected", "failed"].includes(p.status.toLowerCase())),
    [payoutRequests]
  );
  const totalRiderPayoutValue = useMemo(
    () => sum(payoutRequests.map((p) => p.amount)),
    [payoutRequests]
  );
  const riderPayoutMethodSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    payoutRequests.forEach((p) => {
      map[p.method] = (map[p.method] ?? 0) + parseNumber(p.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [payoutRequests]);
  const riderPayoutMethodTotal = useMemo(
    () => riderPayoutMethodSnapshot.reduce((s, [, v]) => s + v, 0),
    [riderPayoutMethodSnapshot]
  );

  // ── rider complaints ────────────────────────────────────────────────────────
  const riderIncidents = useMemo(
    () => incidents.filter((i) => i.rider != null),
    [incidents]
  );
  const riderComplaintOpen = useMemo(
    () => riderIncidents.filter((i) => ["pending", "open"].includes(i.status.toLowerCase())),
    [riderIncidents]
  );
  const riderComplaintInProgress = useMemo(
    () => riderIncidents.filter((i) => ["under_review", "actioned"].includes(i.status.toLowerCase())),
    [riderIncidents]
  );
  const riderComplaintResolved = useMemo(
    () => riderIncidents.filter((i) => ["resolved", "closed"].includes(i.status.toLowerCase())),
    [riderIncidents]
  );

  // ── support tickets ─────────────────────────────────────────────────────────
  const openTickets = useMemo(
    () => incidents.filter((i) => ["pending", "open"].includes(i.status.toLowerCase())),
    [incidents]
  );
  const inProgressTickets = useMemo(
    () => incidents.filter((i) => ["under_review", "actioned"].includes(i.status.toLowerCase())),
    [incidents]
  );
  const resolvedTickets = useMemo(
    () => incidents.filter((i) => ["resolved", "closed"].includes(i.status.toLowerCase())),
    [incidents]
  );

  const openSupportTicketRows = useMemo(
    () =>
      supportTickets.filter((t) =>
        ["open", "pending", "pending_passenger", "pending_rider"].includes(t.status.toLowerCase())
      ),
    [supportTickets]
  );
  const inProgressSupportTicketRows = useMemo(
    () =>
      supportTickets.filter((t) =>
        ["in_progress", "assigned", "under_review", "escalated"].includes(t.status.toLowerCase())
      ),
    [supportTickets]
  );
  const resolvedSupportTicketRows = useMemo(
    () => supportTickets.filter((t) => ["resolved", "closed"].includes(t.status.toLowerCase())),
    [supportTickets]
  );

  const openSosCount = useMemo(
    () =>
      incidents.filter((i) => {
        const severity = (i.severity ?? "").toUpperCase();
        const category = (i.category ?? "").toUpperCase();
        const isSos = severity === "CRITICAL" || category === "SOS" || category.includes("SOS");
        return isSos && ["pending", "open", "under_review", "actioned"].includes(i.status.toLowerCase());
      }).length,
    [incidents]
  );

  // ── ratings ─────────────────────────────────────────────────────────────────
  const filteredRatings = useMemo(() => {
    return ratings.filter((r) => {
      if (ratingRiderFilter && !r.rated.riderProfile?.id.includes(ratingRiderFilter)) return false;
      if (ratingRideFilter && !r.ride.id.includes(ratingRideFilter)) return false;
      if (ratingFromDateFilter && r.createdAt < ratingFromDateFilter) return false;
      if (ratingToDateFilter && r.createdAt > ratingToDateFilter + "T23:59:59Z") return false;
      return true;
    });
  }, [ratings, ratingRiderFilter, ratingRideFilter, ratingFromDateFilter, ratingToDateFilter]);

  const riderRatingAverage = useMemo(() => {
    const riderRatings = ratings.filter((r) => r.rated.riderProfile != null);
    if (riderRatings.length === 0) return 0;
    return riderRatings.reduce((sum, r) => sum + r.score, 0) / riderRatings.length;
  }, [ratings]);

  const riderRatingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((score) => ({
      score,
      count: ratings.filter((r) => r.score === score).length
    }));
  }, [ratings]);

  // ── verification rows ───────────────────────────────────────────────────────
  const riderVerificationRows = useMemo(() => {
    return riders.map((rider) => {
      const hasVehicle = rider.vehicle != null;
      const hasZone = rider.serviceZone != null;
      const hasContact = Boolean(rider.user.phoneE164);
      const approval = (rider.approvalStatus ?? "").toUpperCase();
      const accountStatus = (rider.user.accountStatus ?? "").toLowerCase();
      const verificationStatus =
        approval === "APPROVED" || (!approval && accountStatus === "active")
          ? "Approved"
          : approval === "REJECTED" || accountStatus === "banned" || accountStatus === "blocked"
            ? "Rejected"
            : approval === "SUSPENDED" || accountStatus === "suspended"
              ? "Rejected"
              : hasVehicle && hasZone && hasContact
                ? "Ready"
                : "Pending";
      return { rider, verificationStatus, hasVehicle, hasZone, hasContact };
    });
  }, [riders]);

  const riderVerificationStats = useMemo(() => {
    if (userStats) {
      return {
        pending: userStats.riders.pending,
        approved: userStats.riders.verified,
        rejected: userStats.riders.rejected + userStats.riders.suspended,
        underReview: Math.max(
          0,
          userStats.riders.total -
            userStats.riders.pending -
            userStats.riders.verified -
            userStats.riders.rejected -
            userStats.riders.suspended
        ),
        today: riders.filter((r) => r.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length
      };
    }
    return {
      pending: riderVerificationRows.filter((r) => r.verificationStatus === "Pending").length,
      approved: riderVerificationRows.filter((r) => r.verificationStatus === "Approved").length,
      rejected: riderVerificationRows.filter((r) => r.verificationStatus === "Rejected").length,
      underReview: riderVerificationRows.filter((r) => r.verificationStatus === "Ready").length,
      today: riders.filter((r) => r.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length
    };
  }, [userStats, riderVerificationRows, riders]);

  // ── document rows (real RiderDocument records) ──────────────────────────────
  const documentTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      NATIONAL_ID: "National ID",
      RIDER_LICENSE: "License",
      VEHICLE_REGISTRATION: "Registration",
      INSURANCE: "Insurance",
      PROFILE_PHOTO: "Profile Photo",
      OTHER: "Other"
    };
    return map[type] ?? type;
  };

  const documentUiStatus = (doc: RiderDocumentRecord) => {
    const status = (doc.status ?? "").toUpperCase();
    if (status === "APPROVED") {
      if (doc.expiresAt) {
        const days = Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / 86400000);
        if (days < 0) return "Expired";
        if (days <= 30) return "Expiring Soon";
      }
      return "Compliant";
    }
    if (status === "EXPIRED") return "Expired";
    if (status === "REJECTED") return "Missing";
    return "Pending";
  };

  const riderDocumentRows = useMemo(() => {
    const docs = riderDocumentsData ?? [];
    return docs.map((doc) => {
      const daysLeft =
        doc.expiresAt && !Number.isNaN(new Date(doc.expiresAt).getTime())
          ? String(Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / 86400000))
          : "—";
      return {
        id: doc.id,
        riderId: doc.riderId,
        riderName: doc.rider?.user.fullName ?? "Unknown rider",
        displayCode: doc.rider?.displayCode ?? "—",
        phone: doc.rider?.user.phoneE164 ?? "—",
        documentType: documentTypeLabel(doc.type),
        documentNumber: doc.notes?.trim() || doc.type,
        status: documentUiStatus(doc),
        rawStatus: doc.status,
        fileUrl: doc.fileUrl,
        expiryDate: doc.expiresAt
          ? new Date(doc.expiresAt).toLocaleDateString("en-GB", { timeZone: "Africa/Accra" })
          : "—",
        daysLeft
      };
    });
  }, [riderDocumentsData]);

  const riderDocumentStats = useMemo(() => {
    const rows = riderDocumentRows;
    return {
      total: rows.length,
      compliant: rows.filter((r) => r.status === "Compliant").length,
      expiringSoon: rows.filter((r) => r.status === "Expiring Soon").length,
      expired: rows.filter((r) => r.status === "Expired").length,
      missing: rows.filter((r) => r.status === "Missing" || r.status === "Pending").length
    };
  }, [riderDocumentRows]);

  // ── users management ────────────────────────────────────────────────────────
  const managedUsers = useMemo(() => {
    const passengerUsers = passengers.map((p) => ({
      id: p.userId,
      name: p.user.fullName,
      type: "Passenger",
      phone: p.user.phoneE164,
      email: p.user.email ?? "—",
      status: p.user.accountStatus ?? "active",
      joinedAt: p.createdAt,
      location: p.defaultServiceCity ?? "—",
      reference: p.referralCode,
      icon: User
    }));
    const riderUsers = riders.map((r) => ({
      id: r.id,
      name: r.user.fullName,
      type: "Rider",
      phone: r.user.phoneE164,
      email: r.user.email ?? "—",
      status: r.user.accountStatus ?? (r.onlineStatus ? "active" : "offline"),
      joinedAt: r.createdAt,
      location: r.city ?? r.serviceZone?.name ?? "—",
      reference: r.displayCode,
      icon: Bike
    }));
    return [...passengerUsers, ...riderUsers];
  }, [passengers, riders]);

  const searchedManagedUsers = useMemo(() => {
    const term = adminSearchTerm.toLowerCase();
    const base = userTypeView === "riders"
      ? managedUsers.filter((u) => u.type === "Rider")
      : userTypeView === "customers"
        ? managedUsers.filter((u) => u.type === "Passenger")
        : managedUsers;
    if (!term) return base;
    return base.filter((u) =>
      u.name.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.location.toLowerCase().includes(term)
    );
  }, [managedUsers, adminSearchTerm, userTypeView]);

  const blockedUsers = useMemo(
    () => managedUsers.filter((u) => ["blocked", "suspended"].includes(u.status.toLowerCase())),
    [managedUsers]
  );

  const userLocationSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    managedUsers.forEach((u) => {
      if (u.location && u.location !== "—") {
        map[u.location] = (map[u.location] ?? 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [managedUsers]);

  const userLocationMax = useMemo(
    () => Math.max(1, ...userLocationSnapshot.map(([, c]) => c)),
    [userLocationSnapshot]
  );

  const recentManagedUsers = useMemo(
    () => managedUsers
      .filter((u) => u.joinedAt)
      .sort((a, b) => Date.parse(b.joinedAt!) - Date.parse(a.joinedAt!))
      .slice(0, 5),
    [managedUsers]
  );

  // ── promotions ──────────────────────────────────────────────────────────────
  const promoAdjustedTrips = useMemo(
    () => rides.filter((r) => parseNumber(r.promoDiscount) > 0 || parseNumber(r.referralDiscount) > 0),
    [rides]
  );
  const topDiscountedRides = useMemo(
    () => promoAdjustedTrips
      .slice()
      .sort((a, b) =>
        (parseNumber(b.promoDiscount) + parseNumber(b.referralDiscount)) -
        (parseNumber(a.promoDiscount) + parseNumber(a.referralDiscount))
      )
      .slice(0, 20),
    [promoAdjustedTrips]
  );
  const promoSpend = useMemo(
    () => sum(promoAdjustedTrips.map((r) => r.promoDiscount)),
    [promoAdjustedTrips]
  );
  const referralSpend = useMemo(
    () => sum(promoAdjustedTrips.map((r) => r.referralDiscount)),
    [promoAdjustedTrips]
  );
  const promotionZoneSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    promoAdjustedTrips.forEach((r) => {
      const zone = r.serviceZone?.name ?? "Unknown";
      map[zone] = (map[zone] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [promoAdjustedTrips]);

  // ── zones ───────────────────────────────────────────────────────────────────
  const ridersPerZone = useMemo(() => {
    const map: Record<string, number> = {};
    riders.forEach((r) => {
      if (r.serviceZone?.id) {
        map[r.serviceZone.id] = (map[r.serviceZone.id] ?? 0) + 1;
      }
    });
    return map;
  }, [riders]);

  const ridesPerZone = useMemo(() => {
    const map: Record<string, number> = {};
    rides.forEach((r) => {
      if (r.serviceZone?.id) {
        map[r.serviceZone.id] = (map[r.serviceZone.id] ?? 0) + 1;
      }
    });
    return map;
  }, [rides]);

  // ── zone/city snapshots ─────────────────────────────────────────────────────
  const rideZoneSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    rides.forEach((r) => { if (r.serviceZone?.name) map[r.serviceZone.name] = (map[r.serviceZone.name] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [rides]);

  const riderCitySnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    riders.forEach((r) => { if (r.city) map[r.city] = (map[r.city] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [riders]);

  const riderZoneSnapshot = useMemo(() => {
    const map: Record<string, number> = {};
    riders.forEach((r) => {
      if (r.serviceZone?.name) map[r.serviceZone.name] = (map[r.serviceZone.name] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [riders]);

  // ── request dashboard ───────────────────────────────────────────────────────
  const rideStatusGroups = useMemo(() => ({
    all: rides.length,
    pending: rides.filter((r) => ["searching", "pending"].includes(r.status.toLowerCase())).length,
    accepted: rides.filter((r) => ["assigned", "arriving", "arrived"].includes(r.status.toLowerCase())).length,
    onTrip: rides.filter((r) => ["started", "in_progress"].includes(r.status.toLowerCase())).length,
    completed: completedRides.length,
    cancelled: rides.filter((r) => r.status.toLowerCase() === "cancelled").length
  }), [rides, completedRides]);

  const visibleRequestCards = useMemo(() => {
    const rank = (status: string) => {
      const value = status.toLowerCase();
      if (["searching", "pending"].includes(value)) return 0;
      if (["assigned", "arriving", "arrived"].includes(value)) return 1;
      if (["started", "in_progress"].includes(value)) return 2;
      if (value === "completed") return 3;
      if (value === "cancelled") return 4;
      return 5;
    };

    const sorted = [...rides].sort((a, b) => {
      const rankDiff = rank(a.status) - rank(b.status);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (requestStatusView === "all") return sorted.slice(0, 40);
    if (requestStatusView === "pending") {
      return sorted.filter((r) => ["searching", "pending"].includes(r.status.toLowerCase()));
    }
    if (requestStatusView === "accepted") {
      return sorted.filter((r) => ["assigned", "arriving", "arrived"].includes(r.status.toLowerCase()));
    }
    if (requestStatusView === "on-trip") {
      return sorted.filter((r) => ["started", "in_progress"].includes(r.status.toLowerCase()));
    }
    if (requestStatusView === "completed") return completedRides;
    if (requestStatusView === "cancelled") {
      return rides
        .filter((r) => r.status.toLowerCase() === "cancelled")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted.slice(0, 40);
  }, [rides, completedRides, requestStatusView]);

  const visibleDeliveryRequestCards = useMemo(() => {
    if (requestStatusView === "all") return deliveries.slice(0, 30);
    if (requestStatusView === "completed") return completedDeliveries;
    if (requestStatusView === "cancelled") return cancelledDeliveries;
    return deliveries.filter((d) => !["delivered", "cancelled"].includes(d.status.toLowerCase())).slice(0, 30);
  }, [deliveries, completedDeliveries, cancelledDeliveries, requestStatusView]);

  const requestPeakBuckets = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const buckets = hours.map((h) => ({
      label: `${h.toString().padStart(2, "0")}:00`,
      count: rides.filter((r) => {
        // Africa/Accra is GMT year-round (no DST)
        return new Date(r.createdAt).getUTCHours() === h;
      }).length
    }));
    const nonZero = buckets.filter((b) => b.count > 0);
    // Prefer hours with volume; otherwise show the Accra daytime window
    return (nonZero.length > 0 ? nonZero : buckets.slice(6, 22)).slice(0, 16);
  }, [rides]);

  const requestPeakMax = useMemo(
    () => Math.max(1, ...requestPeakBuckets.map((b) => b.count)),
    [requestPeakBuckets]
  );

  // ── dashboard metrics ───────────────────────────────────────────────────────
  const dashboardMetrics = useMemo(() => {
    const passengerTotal = userStats?.passengers.total ?? passengersTotal;
    const passengerPending = userStats?.passengers.pending ?? 0;
    const passengerVerified = userStats?.passengers.verified ?? 0;
    const riderTotal = userStats?.riders.total ?? ridersTotal;
    const riderPending = userStats?.riders.pending ?? 0;
    const riderVerified = userStats?.riders.verified ?? 0;

    return [
      {
        label: "Active Trips",
        value: `${activeRides.length}`,
        trend: `${completedRides.length} completed`,
        icon: Bike,
        tone: "yellow"
      },
      {
        label: "Online Riders",
        value: `${activeRiders.length}`,
        trend: `${riderTotal} registered`,
        icon: Users,
        tone: "green"
      },
      {
        label: "Passengers",
        value: `${passengerTotal}`,
        trend: `${passengerPending} pending · ${passengerVerified} verified`,
        icon: User,
        tone: "yellow"
      },
      {
        label: "Riders",
        value: `${riderTotal}`,
        trend: `${riderPending} pending · ${riderVerified} verified`,
        icon: Bike,
        tone: "green"
      },
      {
        label: "Delivery Orders",
        value: `${deliveries.length}`,
        trend: `${completedDeliveries.length} delivered`,
        icon: Package,
        tone: "yellow"
      },
      {
        label: "Platform Revenue",
        value: `${totalDashboardRevenue.toFixed(0)} ${adminCurrency}`,
        trend: "commission captured",
        icon: CreditCard,
        tone: "green"
      }
    ];
  }, [
    activeRides,
    completedRides,
    activeRiders,
    userStats,
    passengersTotal,
    ridersTotal,
    deliveries,
    completedDeliveries,
    totalDashboardRevenue,
    adminCurrency
  ]);

  // ── live activity feed ──────────────────────────────────────────────────────
  const liveActivityItems = useMemo(() => {
    const items = [
      ...completedRides.slice(-5).map((r) => ({
        id: `ride-${r.id}`,
        icon: Bike,
        title: `Ride completed`,
        body: `${r.passenger.user.fullName} → ${r.rider?.user.fullName ?? "Unassigned"}`,
        meta: r.createdAt.slice(11, 16),
        tone: "success" as const
      })),
      ...completedDeliveries.slice(-3).map((d) => ({
        id: `delivery-${d.id}`,
        icon: Package,
        title: `Delivery completed`,
        body: `${d.passenger.user.fullName} → ${d.recipientName}`,
        meta: d.createdAt.slice(11, 16),
        tone: "success" as const
      })),
      ...activeRiders.slice(-3).map((r) => ({
        id: `rider-${r.id}`,
        icon: Users,
        title: `Rider online`,
        body: r.user.fullName,
        meta: r.serviceZone?.name ?? r.city ?? "Unknown",
        tone: "warning" as const
      }))
    ];
    return items.slice(0, 10);
  }, [completedRides, completedDeliveries, activeRiders]);

  // ── admin form handlers ─────────────────────────────────────────────────────
  const eligiblePassengers = useMemo(
    () => passengers.filter((p) => p.user.role === "passenger"),
    [passengers]
  );
  const selectedPassenger = useMemo(
    () => eligiblePassengers.find((p) => p.userId === promoteForm.passengerUserId) ?? null,
    [eligiblePassengers, promoteForm.passengerUserId]
  );

  const handleAdminFormChange = useCallback((field: string, value: string) => {
    setAdminForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePromoteFormChange = useCallback((field: string, value: string) => {
    setPromoteForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── mutations ───────────────────────────────────────────────────────────────
  const incidentReviewMutation = useMutation({
    mutationFn: async ({ incidentId, status }: { incidentId: string; status: string }) =>
      requestJson(`/admin/incidents/${incidentId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.incidents(token) });
      addToast("Incident updated successfully", "success");
    }
  });

  const payoutReviewMutation = useMutation({
    mutationFn: async ({
      payoutRequestId, action, rejectionReason
    }: { payoutRequestId: string; action: string; rejectionReason?: string }) =>
      requestJson(`/admin/payments/payout-requests/${payoutRequestId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ action, rejectionReason })
      }),
    onSuccess: async (_, variables) => {
      if (variables.action === "reject") {
        setPayoutRejectionReasons((prev) => ({ ...prev, [variables.payoutRequestId]: "" }));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.payoutRequests(token) }),
        queryClient.invalidateQueries({ queryKey: QK.walletTx(token) })
      ]);
      addToast("Payout request processed", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not process payout", "error")
  });

  const rideRequestActionMutation = useMutation({
    mutationFn: async ({ rideId, action }: { rideId: string; action: "accept" | "decline" }) =>
      requestJson(`/rides/${rideId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          nextStatus: action === "accept" ? "assigned" : "cancelled",
          actorRole: "admin",
          cancellationReason: action === "decline" ? "Declined by admin" : undefined
        })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.rides(token) });
      addToast("Ride action completed", "success");
    }
  });

  const deliveryRequestActionMutation = useMutation({
    mutationFn: async ({ deliveryId, action }: { deliveryId: string; action: "accept" | "decline" }) =>
      requestJson(`/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          nextStatus: action === "accept" ? "assigned" : "cancelled",
          actorRole: "admin",
          cancellationReason: action === "decline" ? "Declined by admin" : undefined
        })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.deliveries(token) });
      addToast("Delivery action completed", "success");
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: async () =>
      requestJson("/admin/accounts/create", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...adminForm,
          permissions: adminForm.permissions.split(",").map((p) => p.trim()).filter(Boolean)
        })
      }),
    onSuccess: async () => {
      setAdminForm({ fullName: "", email: "", phoneCountryCode: "+233", phoneLocal: "", phoneE164: "", preferredCurrency: "GHS", password: "", title: "", permissions: "" });
      await queryClient.invalidateQueries({ queryKey: QK.adminAccounts(token) });
      addToast("Admin account created", "success");
    }
  });

  const promotePassengerMutation = useMutation({
    mutationFn: async () =>
      requestJson("/admin/accounts/promote", {
        method: "POST",
        token,
        body: JSON.stringify({
          ...promoteForm,
          permissions: promoteForm.permissions.split(",").map((p) => p.trim()).filter(Boolean)
        })
      }),
    onSuccess: async () => {
      setPromoteForm({ passengerUserId: "", email: "", password: "", title: "", permissions: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.adminAccounts(token) }),
        queryClient.invalidateQueries({ queryKey: QK.passengers(token) }),
        queryClient.invalidateQueries({ queryKey: QK.userStats(token) })
      ]);
      addToast("Passenger promoted to admin", "success");
    }
  });

  const riderApprovalMutation = useMutation({
    mutationFn: async ({ riderProfileId, action, reason }: { riderProfileId: string; action: "approve" | "reject"; reason?: string }) =>
      requestJson(`/admin/riders/${riderProfileId}/approval`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ action, reason })
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.riders(token) }),
        queryClient.invalidateQueries({ queryKey: QK.userStats(token) })
      ]);
      addToast("Rider approval status updated", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not update rider approval", "error")
  });

  const riderSuspensionMutation = useMutation({
    mutationFn: async ({ riderProfileId, action, reason, durationDays }: { riderProfileId: string; action: "suspend" | "reinstate" | "extend" | "warn"; reason?: string; durationDays?: number }) =>
      requestJson(`/admin/riders/${riderProfileId}/suspension`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ action, reason, durationDays })
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.riders(token) }),
        queryClient.invalidateQueries({ queryKey: QK.userStats(token) }),
        queryClient.invalidateQueries({ queryKey: QK.auditLogs(token) })
      ]);
      addToast("Rider suspension updated", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not update rider suspension", "error")
  });

  const documentReviewMutation = useMutation({
    mutationFn: async ({
      documentId,
      status,
      notes
    }: {
      documentId: string;
      status: "APPROVED" | "REJECTED" | "EXPIRED";
      notes?: string;
    }) =>
      requestJson(`/admin/documents/${documentId}/review`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status, notes })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.riderDocuments(token) });
      addToast("Document review saved", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not review document", "error")
  });

  const zoneUpdateMutation = useMutation({
    mutationFn: async ({
      zoneId,
      updates
    }: {
      zoneId: string;
      updates: Partial<Pick<ServiceZoneRecord, "isActive" | "ridesEnabled" | "deliveriesEnabled">>;
    }) =>
      requestJson(`/bootstrap/service-zones/${zoneId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(updates)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.zones(token) });
      addToast("Zone settings updated", "success");
    }
  });

  const createEscalationRuleMutation = useMutation({
    mutationFn: async (input: Omit<EscalationRuleRecord, "id">) =>
      requestJson("/admin/escalation-rules", {
        method: "POST",
        token,
        body: JSON.stringify(input)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.escalationRules(token) });
      addToast("Escalation rule created", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not create rule", "error")
  });

  const toggleEscalationRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      requestJson(`/admin/escalation-rules/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ enabled })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.escalationRules(token) });
      addToast("Escalation rule updated", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not update rule", "error")
  });

  const scheduleBroadcastMutation = useMutation({
    mutationFn: async (input: {
      title: string;
      body: string;
      targetAudience: "all" | "riders" | "passengers" | "zone";
      targetZone?: string;
      scheduledAt: string;
    }) => {
      const zoneId =
        input.targetAudience === "zone"
          ? zones.find((z) => z.name === input.targetZone)?.id
          : undefined;
      return requestJson("/admin/scheduled-broadcasts", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          targetAudience: input.targetAudience,
          targetZoneId: zoneId,
          scheduledAt: new Date(input.scheduledAt).toISOString()
        })
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.scheduledBroadcasts(token) });
      addToast("Broadcast scheduled", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not schedule broadcast", "error")
  });

  const cancelBroadcastMutation = useMutation({
    mutationFn: async (id: string) =>
      requestJson(`/admin/scheduled-broadcasts/${id}/cancel`, {
        method: "PATCH",
        token,
        body: JSON.stringify({})
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.scheduledBroadcasts(token) });
      addToast("Broadcast cancelled", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not cancel broadcast", "error")
  });

  const retryBroadcastMutation = useMutation({
    mutationFn: async (id: string) =>
      requestJson(`/admin/scheduled-broadcasts/${id}/retry`, {
        method: "POST",
        token,
        body: JSON.stringify({})
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.scheduledBroadcasts(token) }),
        queryClient.invalidateQueries({ queryKey: QK.opsJobStatus(token) })
      ]);
      addToast("Broadcast retry started", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not retry broadcast", "error")
  });

  // ── badge data ──────────────────────────────────────────────────────────────
  const badgeData = useMemo(() => ({
    activeTripsCount: activeRides.length,
    completedTripsCount: completedRides.length,
    activeRidersCount: activeRiders.length,
    ridersCount: riders.length,
    riderVerificationPending: riderVerificationStats.pending,
    riderVerificationUnderReview: riderVerificationStats.underReview,
    riderDocumentMissing: riderDocumentStats.missing,
    topRiderPerformanceEarningsCount: riderFinancialRows.filter((r) => r.earnings > 0).length,
    riderWalletTransactionsCount: riderWalletTransactions.length,
    riderPayoutRequestedCount: requestedRiderPayouts.length,
    riderIncidentsCount: riderIncidents.length,
    ridersWithCoordsCount: ridersWithCoords.length,
    suspendedRidersCount: suspendedRiders.length,
    passengersCount: passengers.length,
    pendingPayoutRequestsCount: pendingPayoutRequests.length,
    promoAdjustedTripsCount: promoAdjustedTrips.length,
    zonesActiveCount: zones.filter((z) => z.isActive).length,
    adminAccountsCount: adminAccounts.length,
    ratingsCount: ratings.length,
    openSupportTicketsCount: openSupportTicketRows.length || openTickets.length,
    openSosCount,
    deliveriesCount: deliveries.length,
    completedDeliveriesCount: completedDeliveries.length
  }), [
    activeRides, completedRides, activeRiders, riders, riderVerificationStats,
    riderDocumentStats, riderFinancialRows, riderWalletTransactions, requestedRiderPayouts,
    riderIncidents, ridersWithCoords, suspendedRiders, passengers, pendingPayoutRequests,
    promoAdjustedTrips, zones, adminAccounts, ratings, openTickets, openSupportTicketRows, openSosCount, deliveries, completedDeliveries
  ]);

  // ── screen highlights ───────────────────────────────────────────────────────
  const screenHighlights: Record<AdminConsoleScreen, Array<{ label: string; value: string }>> = useMemo(() => ({
    dashboard: [
      { label: "Active trips", value: `${activeRides.length}` },
      { label: "Riders online", value: `${activeRiders.length}` },
      { label: "Revenue", value: `${adminCurrency} ${totalDashboardRevenue.toFixed(0)}` }
    ],
    rides: [
      { label: "Total rides", value: `${rides.length}` },
      { label: "Completed", value: `${completedRides.length}` },
      { label: "Active", value: `${activeRides.length}` }
    ],
    deliveries: [
      { label: "Total", value: `${deliveries.length}` },
      { label: "Delivered", value: `${completedDeliveries.length}` },
      { label: "Active", value: `${activeDeliveries.length}` }
    ],
    riders: [
      { label: "Total riders", value: `${riders.length}` },
      { label: "Online", value: `${activeRiders.length}` },
      { label: "With vehicle", value: `${vehicleCount}` }
    ],
    riderVerification: [
      { label: "Pending", value: `${riderVerificationStats.pending}` },
      { label: "Approved", value: `${riderVerificationStats.approved}` }
    ],
    riderDocuments: [
      { label: "Total", value: `${riderDocumentStats.total}` },
      { label: "Pending / missing", value: `${riderDocumentStats.missing}` }
    ],
    riderPerformance: [
      { label: "Completed trips", value: `${completedRides.length}` },
      { label: "Avg rating", value: `${riderRatingAverage.toFixed(1)} ★` }
    ],
    riderEarnings: [
      { label: "Total earnings", value: `${adminCurrency} ${totalRiderEarnings.toFixed(0)}` },
      { label: "Commission", value: `${adminCurrency} ${totalRiderCommission.toFixed(0)}` }
    ],
    riderWallet: [
      { label: "Transactions", value: `${riderWalletTransactions.length}` },
      { label: "Credits", value: `${adminCurrency} ${riderWalletCredits.toFixed(0)}` }
    ],
    riderPayouts: [
      { label: "Pending", value: `${requestedRiderPayouts.length}` },
      { label: "Paid", value: `${paidPayoutRequests.length}` }
    ],
    riderComplaints: [
      { label: "Open", value: `${riderComplaintOpen.length}` },
      { label: "Resolved", value: `${riderComplaintResolved.length}` }
    ],
    riderActivity: [
      { label: "Online", value: `${activeRiders.length}` },
      { label: "GPS active", value: `${ridersWithCoords.length}` }
    ],
    riderSuspensions: [
      { label: "Flagged", value: `${suspendedRiders.length}` },
      { label: "Total riders", value: `${riders.length}` }
    ],
    passengers: [
      { label: "Passengers", value: `${passengers.length}` },
      { label: "Blocked", value: `${blockedUsers.length}` }
    ],
    payments: [
      { label: "Revenue", value: `${adminCurrency} ${totalRevenue.toFixed(0)}` },
      { label: "Pending payouts", value: `${pendingPayoutRequests.length}` }
    ],
    ratings: [
      { label: "Ratings", value: `${ratings.length}` },
      { label: "Avg score", value: `${riderRatingAverage.toFixed(1)} ★` }
    ],
    promotions: [
      { label: "Promo rides", value: `${promoAdjustedTrips.length}` },
      { label: "Promo spend", value: `${adminCurrency} ${promoSpend.toFixed(0)}` }
    ],
    zones: [
      { label: "Active zones", value: `${zones.filter((z) => z.isActive).length}` },
      { label: "Total zones", value: `${zones.length}` }
    ],
    supportTickets: [
      { label: "Tickets", value: `${supportTickets.length}` },
      { label: "Open incidents", value: `${openTickets.length}` }
    ],
    sosIncidents: [
      { label: "Open SOS", value: `${openSosCount}` },
      { label: "Total incidents", value: `${incidents.length}` }
    ],
    notifications: [
      { label: "Scheduled", value: `${scheduledBroadcasts.length}` },
      { label: "Pending", value: `${scheduledBroadcasts.filter((b) => b.status === "pending").length}` }
    ],
    reports: [
      { label: "Total rides", value: `${rides.length}` },
      { label: "Deliveries", value: `${deliveries.length}` }
    ],
    auditLogs: [
      { label: "Events", value: `${auditLogs.length}` },
      { label: "Admins", value: `${adminAccounts.length}` }
    ],
    settings: [
      { label: "Active zones", value: `${zones.filter((z) => z.isActive).length}` },
      { label: "Admins", value: `${adminAccounts.length}` }
    ],
    paymentMethods: [
      { label: "Finance", value: `${adminCurrency} ${totalRevenue.toFixed(0)}` }
    ],
    integrations: [
      { label: "Settings", value: `${zones.length} zones` }
    ],
    taxesCompliance: [
      { label: "Compliant", value: "100%" }
    ],
    settingsNotifications: [
      { label: "Broadcasts", value: `${scheduledBroadcasts.length}` },
      { label: "Open SOS", value: `${openSosCount}` }
    ],
    admins: [
      { label: "Admins", value: `${adminAccounts.length}` },
      { label: "Eligible passengers", value: `${eligiblePassengers.length}` }
    ],
    escalationRules: [
      { label: "Rules", value: `${escalationRules.length}` },
      { label: "Active", value: `${escalationRules.filter((r) => r.enabled).length}` }
    ]
  }), [
    activeRides, activeRiders, adminCurrency, totalDashboardRevenue, rides, completedRides,
    deliveries, completedDeliveries, activeDeliveries, riders, vehicleCount, riderVerificationStats,
    riderDocumentStats, riderRatingAverage, totalRiderEarnings, totalRiderCommission,
    riderWalletTransactions, riderWalletCredits, requestedRiderPayouts, paidPayoutRequests,
    riderComplaintOpen, riderComplaintResolved, ridersWithCoords, suspendedRiders, passengers,
    blockedUsers, totalRevenue, pendingPayoutRequests, ratings, promoAdjustedTrips, promoSpend,
    zones, openTickets, resolvedTickets, auditLogs, adminAccounts, eligiblePassengers,
    supportTickets, openSosCount, incidents, scheduledBroadcasts, escalationRules
  ]);

  const dataLoading =
    ridesPending ||
    deliveriesPending ||
    ridersPending ||
    walletTxPending ||
    payoutPending ||
    ratingsPending ||
    incidentsPending ||
    riderDocumentsPending;

  return {
    // UI state
    dataLoading,
    requestTab, setRequestTab,
    requestStatusView, setRequestStatusView,
    adminSearchTerm, setAdminSearchTerm,
    userTypeView, setUserTypeView,
    transactionStatusFilter, setTransactionStatusFilter,
    transactionTypeFilter, setTransactionTypeFilter,
    payoutStatusFilter, setPayoutStatusFilter,
    ratingRiderFilter, setRatingRiderFilter,
    ratingRideFilter, setRatingRideFilter,
    ratingFromDateFilter, setRatingFromDateFilter,
    ratingToDateFilter, setRatingToDateFilter,
    payoutRejectionReasons, setPayoutRejectionReasons,
    dashboardDateRange, setDashboardDateRange,
    adminForm, handleAdminFormChange,
    promoteForm, handlePromoteFormChange,

    // Raw data
    rides, deliveries, riders, passengers, passengersTotal, ridersTotal, userStats,
    walletTransactions, payoutRequests, ratings, incidents,
    adminAccounts, adminRoleEntries, adminModules, zones, auditLogs,
    supportTickets, escalationRules, scheduledBroadcasts, opsJobStatus,

    // Derived data
    activeRiders, ridersWithCoords, suspendedRiders, vehicleCount,
    completedRides, activeRides, completedDeliveries, cancelledDeliveries, activeDeliveries,
    mapMarkers, adminCurrency,
    weeklyRideBuckets, weeklyRideMax,
    rideRevenue, deliveryRevenue, totalDashboardRevenue, rideRevenuePercent, deliveryRevenuePercent,
    totalRevenue, totalCommission, paidPayoutRequests, pendingPayoutRequests,
    payoutOutflow, platformNetProfit, profitMargin, pendingPayoutValue,
    totalRideRevenue, totalDeliveryRevenue, totalRideCommission, totalDeliveryCommission,
    riderEarningsTotal,
    postedWalletTransactions, pendingWalletTransactions, failedWalletTransactions,
    filteredWalletTransactions, filteredPayoutRequests,
    financeDailyBuckets, financeDailyMax, payoutDailyBuckets, payoutDailyMax,
    paymentMethodSnapshot, paymentMethodTotal,
    riderFinancialRows,
    riderWalletTransactions, riderWalletCredits, riderWalletDebits,
    riderWalletAvailableBalance, riderWalletLockedBalance, riderWalletMovementTotal,
    riderEarningBuckets, riderChartMax,
    totalRiderGrossRevenue, totalRiderEarnings, totalRiderCommission,
    requestedRiderPayouts, failedRiderPayouts, totalRiderPayoutValue,
    riderPayoutMethodSnapshot, riderPayoutMethodTotal,
    riderIncidents, riderComplaintOpen, riderComplaintInProgress, riderComplaintResolved,
    openTickets, inProgressTickets, resolvedTickets,
    openSupportTicketRows, inProgressSupportTicketRows, resolvedSupportTicketRows, openSosCount,
    filteredRatings, riderRatingAverage, riderRatingDistribution,
    riderVerificationRows, riderVerificationStats,
    riderDocumentRows, riderDocumentStats,
    managedUsers, searchedManagedUsers, blockedUsers,
    userLocationSnapshot, userLocationMax, recentManagedUsers,
    promoAdjustedTrips, topDiscountedRides, promoSpend, referralSpend, promotionZoneSnapshot,
    ridersPerZone, ridesPerZone,
    rideZoneSnapshot, riderCitySnapshot, riderZoneSnapshot,
    rideStatusGroups, visibleRequestCards, visibleDeliveryRequestCards,
    requestPeakBuckets, requestPeakMax,
    dashboardMetrics, liveActivityItems,
    eligiblePassengers, selectedPassenger,

    // Badges & highlights
    badgeData, screenHighlights,

    // Mutations
    incidentReviewMutation,
    payoutReviewMutation,
    rideRequestActionMutation,
    deliveryRequestActionMutation,
    createAdminMutation,
    promotePassengerMutation,
    riderApprovalMutation,
    riderSuspensionMutation,
    documentReviewMutation,
    zoneUpdateMutation,
    createEscalationRuleMutation,
    toggleEscalationRuleMutation,
    scheduleBroadcastMutation,
    cancelBroadcastMutation,
    retryBroadcastMutation
  };
}
