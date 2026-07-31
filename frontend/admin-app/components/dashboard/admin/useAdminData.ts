"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Bike, Package, Users, CreditCard, Star, Tag, MapPin, Bell, User } from "lucide-react";

import { apiUrl, requestJson } from "@/lib/api";
import { parseNumber, shortDate } from "./utils";
import { useAdminToast } from "./AdminToast";
import { needsForScreen } from "./adminQueryNeeds";
import { listPageSize, requestPagedJson, type PagedResult } from "./paged";
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

function useDocumentVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

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
  riderDocuments: (token?: string | null) => ["admin-rider-documents", token],
  platformSettings: (token?: string | null) => ["admin-platform-settings", token]
} as const;

// ─── live ops stream types ────────────────────────────────────────────────────
export type LiveOpsSnapshot = {
  timestamp: string;
  riders: Array<{
    id: string;
    displayCode: string;
    name: string;
    latitude: number;
    longitude: number;
  }>;
  sos: Array<{
    id: string;
    severity: string;
    status: string;
    category: string;
    description: string;
    createdAt: string;
    reporter: { fullName: string; phoneE164: string };
  }>;
};

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
export function useAdminData(
  token: string | null | undefined,
  isAdmin: boolean,
  screen: AdminConsoleScreen
) {
  const queryClient = useQueryClient();
  const { addToast } = useAdminToast();
  const tabVisible = useDocumentVisible();
  const needs = useMemo(() => needsForScreen(screen), [screen]);
  const want = useCallback((need: Parameters<typeof needs.has>[0]) => isAdmin && needs.has(need), [isAdmin, needs]);
  const poll = useCallback(
    (ms: number, need: Parameters<typeof needs.has>[0]) =>
      tabVisible && isAdmin && needs.has(need) ? ms : false,
    [tabVisible, isAdmin, needs]
  );

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

  // Server list paging — heavier screens pull a wider first page for charts.
  const heavySample = screen === "dashboard" || screen === "reports" || screen === "promotions";
  const ridesPageSize = listPageSize(heavySample);
  const deliveriesPageSize = listPageSize(heavySample);
  const [ridesPage, setRidesPage] = useState(1);
  const [deliveriesPage, setDeliveriesPage] = useState(1);
  const [ridersPage, setRidersPage] = useState(1);
  const [passengersPage, setPassengersPage] = useState(1);
  const [walletPage, setWalletPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [documentsPage, setDocumentsPage] = useState(1);
  const LIST_PAGE = 25;

  useEffect(() => {
    setRidesPage(1);
    setDeliveriesPage(1);
    setRidersPage(1);
    setPassengersPage(1);
    setWalletPage(1);
    setPayoutPage(1);
    setRatingsPage(1);
    setIncidentsPage(1);
    setAuditPage(1);
    setTicketsPage(1);
    setDocumentsPage(1);
  }, [screen]);

  useEffect(() => {
    setWalletPage(1);
  }, [transactionStatusFilter, transactionTypeFilter]);

  useEffect(() => {
    setPayoutPage(1);
  }, [payoutStatusFilter]);

  useEffect(() => {
    setRatingsPage(1);
  }, [ratingRiderFilter, ratingRideFilter, ratingFromDateFilter, ratingToDateFilter]);

  // ── queries (screen-scoped + server-paged + visibility-aware polling) ───────
  const { data: ridesPaged, isPending: ridesPending } = useQuery<PagedResult<RideRecord>>({
    queryKey: [...QK.rides(token), ridesPage, ridesPageSize],
    queryFn: () => requestPagedJson<RideRecord>("/rides", { token, page: ridesPage, limit: ridesPageSize }),
    enabled: want("rides"),
    refetchInterval: poll(30000, "rides"),
    staleTime: 25000
  });

  const { data: deliveriesPaged, isPending: deliveriesPending } = useQuery<PagedResult<DeliveryRecord>>({
    queryKey: [...QK.deliveries(token), deliveriesPage, deliveriesPageSize],
    queryFn: () =>
      requestPagedJson<DeliveryRecord>("/deliveries", {
        token,
        page: deliveriesPage,
        limit: deliveriesPageSize
      }),
    enabled: want("deliveries"),
    refetchInterval: poll(30000, "deliveries"),
    staleTime: 25000
  });

  const { data: ridersResp, isPending: ridersPending } = useQuery<PagedResult<RiderRecord>>({
    queryKey: [...QK.riders(token), ridersPage, LIST_PAGE],
    queryFn: () =>
      requestPagedJson<RiderRecord>("/bootstrap/riders", { token, page: ridersPage, limit: LIST_PAGE }),
    enabled: want("riders"),
    refetchInterval: poll(45000, "riders"),
    staleTime: 40000
  });
  const ridersData = ridersResp?.data;
  const ridersTotal = ridersResp?.total ?? ridersData?.length ?? 0;

  const { data: passengersResp, isPending: passengersPending } = useQuery<PagedResult<PassengerRecord>>({
    queryKey: [...QK.passengers(token), passengersPage, LIST_PAGE],
    queryFn: () =>
      requestPagedJson<PassengerRecord>("/bootstrap/passengers", {
        token,
        page: passengersPage,
        limit: LIST_PAGE
      }),
    enabled: want("passengers"),
    refetchInterval: poll(60000, "passengers"),
    staleTime: 55000
  });
  const passengersData = passengersResp?.data;
  const passengersTotal = passengersResp?.total ?? passengersData?.length ?? 0;

  const { data: userStats, isPending: userStatsPending } = useQuery<AdminUserStats>({
    queryKey: QK.userStats(token),
    queryFn: () => requestJson("/admin/user-stats", { token }),
    enabled: want("userStats"),
    refetchInterval: poll(60000, "userStats"),
    staleTime: 55000
  });

  const walletTypeAllowed = new Set([
    "TOP_UP",
    "DEBIT",
    "CREDIT",
    "REFUND",
    "BONUS",
    "COMMISSION",
    "WITHDRAWAL",
    "ADJUSTMENT"
  ]);
  const walletExtra = [
    transactionStatusFilter ? `status=${encodeURIComponent(transactionStatusFilter)}` : "",
    transactionTypeFilter && walletTypeAllowed.has(transactionTypeFilter)
      ? `type=${encodeURIComponent(transactionTypeFilter)}`
      : ""
  ]
    .filter(Boolean)
    .join("&");

  const { data: walletPaged, isPending: walletTxPending } = useQuery<PagedResult<WalletTransactionRecord>>({
    queryKey: [...QK.walletTx(token), walletPage, LIST_PAGE, transactionStatusFilter, transactionTypeFilter],
    queryFn: () =>
      requestPagedJson<WalletTransactionRecord>("/admin/payments/wallet-transactions", {
        token,
        page: walletPage,
        limit: LIST_PAGE,
        extraQuery: walletExtra || undefined
      }),
    enabled: want("walletTx"),
    refetchInterval: poll(45000, "walletTx"),
    staleTime: 40000
  });

  const payoutExtra = payoutStatusFilter
    ? `status=${encodeURIComponent(payoutStatusFilter)}`
    : undefined;

  const { data: payoutPaged, isPending: payoutPending } = useQuery<PagedResult<PayoutRequestRecord>>({
    queryKey: [...QK.payoutRequests(token), payoutPage, LIST_PAGE, payoutStatusFilter],
    queryFn: () =>
      requestPagedJson<PayoutRequestRecord>("/admin/payments/payout-requests", {
        token,
        page: payoutPage,
        limit: LIST_PAGE,
        extraQuery: payoutExtra
      }),
    enabled: want("payout"),
    refetchInterval: poll(45000, "payout"),
    staleTime: 40000
  });

  const ratingsExtra = [
    ratingRiderFilter ? `riderId=${encodeURIComponent(ratingRiderFilter)}` : "",
    ratingRideFilter ? `rideId=${encodeURIComponent(ratingRideFilter)}` : "",
    ratingFromDateFilter ? `fromDate=${encodeURIComponent(ratingFromDateFilter)}` : "",
    ratingToDateFilter ? `toDate=${encodeURIComponent(ratingToDateFilter)}` : ""
  ]
    .filter(Boolean)
    .join("&");

  const { data: ratingsPaged, isPending: ratingsPending } = useQuery<PagedResult<AdminRatingRecord>>({
    queryKey: [
      ...QK.ratings(token),
      ratingsPage,
      LIST_PAGE,
      ratingRiderFilter,
      ratingRideFilter,
      ratingFromDateFilter,
      ratingToDateFilter
    ],
    queryFn: () =>
      requestPagedJson<AdminRatingRecord>("/admin/ratings", {
        token,
        page: ratingsPage,
        limit: LIST_PAGE,
        extraQuery: ratingsExtra || undefined
      }),
    enabled: want("ratings"),
    refetchInterval: poll(60000, "ratings"),
    staleTime: 55000
  });

  const { data: incidentsPaged, isPending: incidentsPending } = useQuery<PagedResult<AdminIncidentRecord>>({
    queryKey: [...QK.incidents(token), incidentsPage, LIST_PAGE],
    queryFn: () =>
      requestPagedJson<AdminIncidentRecord>("/admin/incidents", {
        token,
        page: incidentsPage,
        limit: LIST_PAGE
      }),
    enabled: want("incidents"),
    refetchInterval: poll(45000, "incidents"),
    staleTime: 40000
  });

  const { data: adminAccountsData, isPending: adminAccountsPending } = useQuery<AdminAccountRecord[]>({
    queryKey: QK.adminAccounts(token),
    queryFn: () => requestJson("/admin/accounts", { token }),
    enabled: want("adminAccounts"),
    staleTime: 120000
  });

  const { data: adminPermissionsData } = useQuery<{ roles: Record<string, string[]> }>({
    queryKey: QK.adminPermissions(token),
    queryFn: () => requestJson("/admin/permissions", { token }),
    enabled: want("adminPermissions"),
    staleTime: 300000
  });

  const { data: adminModulesData } = useQuery<{ modules: string[] }>({
    queryKey: QK.adminModules(token),
    queryFn: () => requestJson("/admin/modules", { token }),
    enabled: want("adminModules"),
    staleTime: 300000
  });

  const { data: zonesData, isPending: zonesPending } = useQuery<ServiceZoneRecord[]>({
    queryKey: QK.zones(token),
    queryFn: () => requestJson("/bootstrap/service-zones?limit=100", { token }),
    enabled: want("zones"),
    staleTime: 120000
  });

  const { data: auditLogsPaged, isPending: auditLogsPending } = useQuery<PagedResult<AuditLogRecord>>({
    queryKey: [...QK.auditLogs(token), auditPage, LIST_PAGE],
    queryFn: async () => {
      try {
        const paged = await requestPagedJson<{
          id: string;
          action: string;
          entityType?: string;
          entity?: string;
          entityId: string | null;
          changes?: Record<string, unknown> | null;
          details?: Record<string, unknown> | null;
          createdAt: string;
          actor?: { id: string; fullName: string; email: string | null; role?: string } | null;
        }>("/admin/audit-logs", { token, page: auditPage, limit: LIST_PAGE });
        return {
          ...paged,
          data: paged.data.map((row) => ({
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
          }))
        };
      } catch (err) {
        console.warn("Audit logs not available in backend", err);
        return { data: [], total: 0, page: auditPage, limit: LIST_PAGE };
      }
    },
    enabled: want("auditLogs"),
    staleTime: 60000
  });

  const { data: supportTicketsPaged, isPending: supportTicketsPending } = useQuery<
    PagedResult<AdminSupportTicketRecord>
  >({
    queryKey: [...QK.supportTickets(token), ticketsPage, LIST_PAGE],
    queryFn: () =>
      requestPagedJson<AdminSupportTicketRecord>("/admin/support/tickets", {
        token,
        page: ticketsPage,
        limit: LIST_PAGE
      }),
    enabled: want("supportTickets"),
    refetchInterval: poll(30000, "supportTickets"),
    staleTime: 25000
  });

  const { data: escalationRulesData, isPending: escalationRulesPending } = useQuery<EscalationRuleRecord[]>({
    queryKey: QK.escalationRules(token),
    queryFn: () => requestJson("/admin/escalation-rules", { token }),
    enabled: want("escalationRules"),
    staleTime: 30000
  });

  const { data: scheduledBroadcastsData, isPending: scheduledBroadcastsPending } = useQuery<ScheduledBroadcastRecord[]>({
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
    enabled: want("scheduledBroadcasts"),
    staleTime: 20000
  });

  const { data: opsJobStatusData } = useQuery<OpsJobStatus>({
    queryKey: QK.opsJobStatus(token),
    queryFn: () => requestJson<OpsJobStatus>("/admin/ops-jobs/status", { token }),
    enabled: want("opsJobStatus"),
    staleTime: 15000,
    refetchInterval: poll(30000, "opsJobStatus")
  });

  const { data: riderDocumentsPaged, isPending: riderDocumentsPending } = useQuery<
    PagedResult<RiderDocumentRecord>
  >({
    queryKey: [...QK.riderDocuments(token), documentsPage, LIST_PAGE],
    queryFn: () =>
      requestPagedJson<RiderDocumentRecord>("/admin/documents", {
        token,
        page: documentsPage,
        limit: LIST_PAGE
      }),
    enabled: want("riderDocuments"),
    staleTime: 20000
  });

  const { data: platformSettingsData, isPending: platformSettingsPending } = useQuery<{
    settings: Record<string, unknown>;
  }>({
    queryKey: QK.platformSettings(token),
    queryFn: () => requestJson("/admin/settings", { token }),
    enabled: want("platformSettings"),
    staleTime: 30000
  });
  const platformSettings = useMemo(
    () => platformSettingsData?.settings ?? {},
    [platformSettingsData]
  );

  // ── live ops stream (SSE) — map / SOS screens only ──────────────────────────
  const [liveSnapshot, setLiveSnapshot] = useState<LiveOpsSnapshot | null>(null);
  const liveStreamEnabled = want("liveStream") && tabVisible;

  useEffect(() => {
    if (!liveStreamEnabled || !token || typeof window === "undefined") {
      setLiveSnapshot(null);
      return;
    }
    const source = new EventSource(apiUrl(`/admin/stream?token=${encodeURIComponent(token)}`));
    source.onmessage = (event) => {
      try {
        setLiveSnapshot(JSON.parse(event.data) as LiveOpsSnapshot);
      } catch {
        // Malformed frame — keep the previous snapshot.
      }
    };
    return () => {
      source.close();
    };
  }, [liveStreamEnabled, token]);

  // ── raw data ────────────────────────────────────────────────────────────────
  const rides = useMemo(() => ridesPaged?.data ?? [], [ridesPaged]);
  const ridesTotal = ridesPaged?.total ?? rides.length;
  const deliveries = useMemo(() => deliveriesPaged?.data ?? [], [deliveriesPaged]);
  const deliveriesTotal = deliveriesPaged?.total ?? deliveries.length;
  /** Stable rider rows from the API — GPS overlays must not invalidate finance memos. */
  const ridersBase = useMemo(() => ridersData ?? [], [ridersData]);
  const riders = useMemo(() => {
    if (!liveSnapshot?.riders?.length) return ridersBase;
    const liveById = new Map(liveSnapshot.riders.map((r) => [r.id, r]));
    return ridersBase.map((rider) => {
      const live = liveById.get(rider.id);
      if (!live) return rider;
      return {
        ...rider,
        onlineStatus: true,
        currentLatitude: String(live.latitude),
        currentLongitude: String(live.longitude)
      };
    });
  }, [ridersBase, liveSnapshot]);
  const passengers = useMemo(() => passengersData ?? [], [passengersData]);
  const walletTransactions = useMemo(() => walletPaged?.data ?? [], [walletPaged]);
  const walletTxTotal = walletPaged?.total ?? walletTransactions.length;
  const payoutRequests = useMemo(() => payoutPaged?.data ?? [], [payoutPaged]);
  const payoutRequestsTotal = payoutPaged?.total ?? payoutRequests.length;
  const ratings = useMemo(() => ratingsPaged?.data ?? [], [ratingsPaged]);
  const ratingsTotal = ratingsPaged?.total ?? ratings.length;
  const incidents = useMemo(() => incidentsPaged?.data ?? [], [incidentsPaged]);
  const incidentsTotal = incidentsPaged?.total ?? incidents.length;
  const adminAccounts = useMemo(() => adminAccountsData ?? [], [adminAccountsData]);
  const zones = useMemo(() => zonesData ?? [], [zonesData]);
  const auditLogs = useMemo(() => auditLogsPaged?.data ?? [], [auditLogsPaged]);
  const auditTotal = auditLogsPaged?.total ?? auditLogs.length;
  const supportTickets = useMemo(() => supportTicketsPaged?.data ?? [], [supportTicketsPaged]);
  const supportTicketsTotal = supportTicketsPaged?.total ?? supportTickets.length;
  const riderDocuments = useMemo(() => riderDocumentsPaged?.data ?? [], [riderDocumentsPaged]);
  const riderDocumentsTotal = riderDocumentsPaged?.total ?? riderDocuments.length;
  const escalationRules = useMemo(() => escalationRulesData ?? [], [escalationRulesData]);
  const scheduledBroadcasts = useMemo(() => scheduledBroadcastsData ?? [], [scheduledBroadcastsData]);
  const opsJobStatus = opsJobStatusData ?? null;
  const adminRoleEntries = useMemo(
    () => Object.entries(adminPermissionsData?.roles ?? {}),
    [adminPermissionsData]
  );
  const adminModules = useMemo(() => adminModulesData?.modules ?? [], [adminModulesData]);

  // New SOS pushed over the live stream → refresh the incidents feed immediately.
  const liveSos = useMemo(() => liveSnapshot?.sos ?? [], [liveSnapshot]);
  useEffect(() => {
    if (!want("incidents") || liveSos.length === 0) return;
    const known = new Set(incidents.map((i) => i.id));
    if (liveSos.some((s) => !known.has(s.id))) {
      void queryClient.invalidateQueries({ queryKey: QK.incidents(token) });
    }
  }, [liveSos, incidents, queryClient, token, want]);

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

  // Filters are applied server-side via query params; keep aliases for screens.
  const filteredWalletTransactions = walletTransactions;
  const filteredPayoutRequests = payoutRequests;

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

  // ── rider financial rows (indexed joins; stable ridersBase — ignore live GPS) ─
  const riderFinancialRows = useMemo((): RiderFinancialRow[] => {
    const ridesByName = new Map<string, RideRecord[]>();
    for (const ride of rides) {
      const name = ride.rider?.user.fullName;
      if (!name) continue;
      const bucket = ridesByName.get(name);
      if (bucket) bucket.push(ride);
      else ridesByName.set(name, [ride]);
    }

    const ratingsByRiderId = new Map<string, AdminRatingRecord[]>();
    for (const rating of ratings) {
      const id = rating.rated.riderProfile?.id;
      if (!id) continue;
      const bucket = ratingsByRiderId.get(id);
      if (bucket) bucket.push(rating);
      else ratingsByRiderId.set(id, [rating]);
    }

    const walletByRiderId = new Map<string, WalletTransactionRecord[]>();
    for (const tx of walletTransactions) {
      const id = tx.wallet.user.riderProfile?.id;
      if (!id) continue;
      const bucket = walletByRiderId.get(id);
      if (bucket) bucket.push(tx);
      else walletByRiderId.set(id, [tx]);
    }

    const payoutsByRiderId = new Map<string, PayoutRequestRecord[]>();
    for (const payout of payoutRequests) {
      const id = payout.rider.id;
      const bucket = payoutsByRiderId.get(id);
      if (bucket) bucket.push(payout);
      else payoutsByRiderId.set(id, [payout]);
    }

    return ridersBase
      .map((rider) => {
        const riderRides = ridesByName.get(rider.user.fullName) ?? [];
        const completed = riderRides.filter((r) => r.status.toLowerCase() === "completed");
        const active = riderRides.filter((r) => !["completed", "cancelled"].includes(r.status.toLowerCase()));
        const revenue = sum(completed.map((r) => r.finalFare ?? r.estimatedFare));
        const commission = sum(completed.map((r) => r.platformCommission));
        const earnings = revenue - commission;

        const riderRatings = ratingsByRiderId.get(rider.id) ?? [];
        const averageRating =
          riderRatings.length > 0
            ? riderRatings.reduce((s, r) => s + r.score, 0) / riderRatings.length
            : 0;

        const riderWalletTx = walletByRiderId.get(rider.id) ?? [];
        const walletMovement = sum(riderWalletTx.map((t) => parseNumber(t.amount)));

        const riderPayouts = payoutsByRiderId.get(rider.id) ?? [];
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
      })
      .sort((a, b) => b.completedCount - a.completedCount);
  }, [ridersBase, rides, ratings, walletTransactions, payoutRequests]);

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
  const filteredRatings = ratings;

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
    const docs = riderDocuments;
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
  }, [riderDocuments]);

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

    // No hard cap here — the Requests screen paginates whatever segment it gets.
    if (requestStatusView === "all") return sorted;
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
    return sorted;
  }, [rides, completedRides, requestStatusView]);

  const visibleDeliveryRequestCards = useMemo(() => {
    if (requestStatusView === "all") return deliveries;
    if (requestStatusView === "completed") return completedDeliveries;
    if (requestStatusView === "cancelled") return cancelledDeliveries;
    return deliveries.filter((d) => !["delivered", "cancelled"].includes(d.status.toLowerCase()));
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
      targetAudience:
        | "all"
        | "riders"
        | "passengers"
        | "zone"
        | "inactive_riders"
        | "new_passengers";
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
    ridersCount: ridersTotal,
    riderVerificationPending: riderVerificationStats.pending,
    riderVerificationUnderReview: riderVerificationStats.underReview,
    riderDocumentMissing: riderDocumentStats.missing,
    topRiderPerformanceEarningsCount: riderFinancialRows.filter((r) => r.earnings > 0).length,
    riderWalletTransactionsCount: riderWalletTransactions.length,
    riderPayoutRequestedCount: requestedRiderPayouts.length,
    riderIncidentsCount: riderIncidents.length,
    ridersWithCoordsCount: ridersWithCoords.length,
    suspendedRidersCount: suspendedRiders.length,
    passengersCount: passengersTotal,
    pendingPayoutRequestsCount: pendingPayoutRequests.length,
    promoAdjustedTripsCount: promoAdjustedTrips.length,
    zonesActiveCount: zones.filter((z) => z.isActive).length,
    adminAccountsCount: adminAccounts.length,
    ratingsCount: ratingsTotal,
    openSupportTicketsCount: openSupportTicketRows.length || openTickets.length,
    openSosCount,
    deliveriesCount: deliveriesTotal,
    completedDeliveriesCount: completedDeliveries.length
  }), [
    activeRides, completedRides, activeRiders, ridersTotal, riderVerificationStats,
    riderDocumentStats, riderFinancialRows, riderWalletTransactions, requestedRiderPayouts,
    riderIncidents, ridersWithCoords, suspendedRiders, passengersTotal, pendingPayoutRequests,
    promoAdjustedTrips, zones, adminAccounts, ratingsTotal, openTickets, openSupportTicketRows, openSosCount, deliveriesTotal, completedDeliveries
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

  // ── platform settings persistence ───────────────────────────────────────────
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, unknown>) =>
      requestJson("/admin/settings", {
        method: "PUT",
        token,
        body: JSON.stringify({ settings })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.platformSettings(token) });
      addToast("Platform settings saved", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not save settings", "error")
  });

  // ── rider info request ──────────────────────────────────────────────────────
  const requestRiderInfoMutation = useMutation({
    mutationFn: async ({ riderProfileId, message }: { riderProfileId: string; message: string }) =>
      requestJson(`/admin/riders/${riderProfileId}/request-info`, {
        method: "POST",
        token,
        body: JSON.stringify({ message })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.auditLogs(token) });
      addToast("Info request sent to rider", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not send info request", "error")
  });

  // ── incident assignment ─────────────────────────────────────────────────────
  const incidentAssignMutation = useMutation({
    mutationFn: async ({ incidentId, assignedToId }: { incidentId: string; assignedToId: string }) =>
      requestJson(`/admin/incidents/${incidentId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ assignedToId })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.incidents(token) });
      addToast("Incident assigned", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not assign incident", "error")
  });

  // ── full-dataset CSV export from the backend ────────────────────────────────
  const downloadServerCsv = useCallback(
    async (
      entity:
        | "rides"
        | "deliveries"
        | "wallet-transactions"
        | "payout-requests"
        | "riders"
        | "audit-logs"
    ) => {
      try {
        const response = await fetch(apiUrl(`/admin/export/${entity}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!response.ok) {
          throw new Error(`Export failed with status ${response.status}`);
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        addToast(`Exported ${entity.replace(/-/g, " ")} (full dataset)`, "success");
      } catch (error) {
        addToast((error as Error).message || "Export failed", "error");
      }
    },
    [token, addToast]
  );

  const dataLoading =
    (want("rides") && ridesPending) ||
    (want("deliveries") && deliveriesPending) ||
    (want("riders") && ridersPending) ||
    (want("walletTx") && walletTxPending) ||
    (want("payout") && payoutPending) ||
    (want("ratings") && ratingsPending) ||
    (want("incidents") && incidentsPending) ||
    (want("riderDocuments") && riderDocumentsPending);

  return {
    // UI state
    dataLoading,
    passengersPending,
    userStatsPending,
    adminAccountsPending,
    zonesPending,
    auditLogsPending,
    supportTicketsPending,
    escalationRulesPending,
    scheduledBroadcastsPending,
    platformSettingsPending,
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

    // Raw data + server page totals
    rides, deliveries, riders, passengers, passengersTotal, ridersTotal, userStats,
    ridesTotal, deliveriesTotal, walletTxTotal, payoutRequestsTotal, ratingsTotal,
    incidentsTotal, auditTotal, supportTicketsTotal, riderDocumentsTotal,
    walletTransactions, payoutRequests, ratings, incidents,
    adminAccounts, adminRoleEntries, adminModules, zones, auditLogs,
    supportTickets, escalationRules, scheduledBroadcasts, opsJobStatus,
    platformSettings,
    liveSos, liveOpsConnected: Boolean(liveSnapshot), liveOpsTimestamp: liveSnapshot?.timestamp ?? null,

    // Server list paging controls
    listPageSize: LIST_PAGE,
    ridesPageSize, deliveriesPageSize,
    ridesPage, setRidesPage,
    deliveriesPage, setDeliveriesPage,
    ridersPage, setRidersPage,
    passengersPage, setPassengersPage,
    walletPage, setWalletPage,
    payoutPage, setPayoutPage,
    ratingsPage, setRatingsPage,
    incidentsPage, setIncidentsPage,
    auditPage, setAuditPage,
    ticketsPage, setTicketsPage,
    documentsPage, setDocumentsPage,

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
    retryBroadcastMutation,
    saveSettingsMutation,
    requestRiderInfoMutation,
    incidentAssignMutation,

    // Server export
    downloadServerCsv
  };
}
