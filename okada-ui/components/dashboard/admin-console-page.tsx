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

  if (["completed", "paid", "captured"].includes(normalized)) {
    return "success";
  }

  if (["searching", "assigned", "arriving", "arrived", "started", "pending"].includes(normalized)) {
    return "warning";
  }

  return "neutral";
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

  const rides = ridesQuery.data ?? [];
  const riders = ridersQuery.data ?? [];
  const passengers = passengersQuery.data ?? [];
  const zones = zonesQuery.data ?? [];

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
  const recentPassengers = passengers.slice(0, 6);
  const adminRoleEntries = Object.entries(adminPermissionsQuery.data?.roles ?? {});
  const adminModules = adminModulesQuery.data?.modules ?? [];

  const passengerCitySnapshot = Object.entries(
    passengers.reduce<Record<string, number>>((accumulator, passenger) => {
      const key = passenger.defaultServiceCity?.trim() || "No default city";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {})
  ).sort((left, right) => right[1] - left[1]);

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

  const navItems: Array<{
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    screen: AdminConsoleScreen;
    group: "main" | "finance" | "system";
  }> = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, screen: "dashboard", group: "main" },
    { label: "Rides", href: "/admin/rides", icon: Bike, screen: "rides", group: "main" },
    { label: "Riders", href: "/admin/riders", icon: User, screen: "riders", group: "main" },
    { label: "Passengers", href: "/admin/passengers", icon: Users, screen: "passengers", group: "main" },
    { label: "Payments", href: "/admin/payments", icon: CreditCard, screen: "payments", group: "finance" },
    { label: "Promotions", href: "/admin/promotions", icon: Tag, screen: "promotions", group: "finance" },
    { label: "Settings", href: "/admin/settings", icon: Settings, screen: "settings", group: "system" },
    { label: "Admins", href: "/admin/admins", icon: ShieldAlert, screen: "admins", group: "system" }
  ];

  const navGroups = [
    { label: "Main", key: "main" as const },
    { label: "Finance", key: "finance" as const },
    { label: "System", key: "system" as const }
  ];

  const screenMeta: Record<AdminConsoleScreen, { title: string; description: string; searchLabel: string }> = {
    dashboard: {
      title: "Overview",
      description: "Real-time metrics sourced from live backend rides, riders, passengers, and service zones.",
      searchLabel: "Search rides, riders, or passengers..."
    },
    rides: {
      title: "Rides",
      description: "Track live, completed, and cancelled rides from the persisted dispatch feed.",
      searchLabel: "Search ride codes, riders, or passengers..."
    },
    riders: {
      title: "Riders",
      description: "Monitor rider availability, city coverage, and live coordinate activity.",
      searchLabel: "Search riders or service zones..."
    },
    passengers: {
      title: "Passengers",
      description: "Review passenger profiles, referral codes, and city distribution from the live backend.",
      searchLabel: "Search passengers or referral codes..."
    },
    payments: {
      title: "Payments",
      description: "Review revenue flow from completed rides and active trip value moving through the platform.",
      searchLabel: "Search payment and fare records..."
    },
    promotions: {
      title: "Promotions",
      description: "Track promo-assisted trips and referral-driven discounts from live ride records.",
      searchLabel: "Search promo-adjusted rides or zones..."
    },
    settings: {
      title: "Settings",
      description: "Review service-zone pricing, admin permissions, and platform modules from live backend config.",
      searchLabel: "Search zones, modules, or permissions..."
    },
    admins: {
      title: "Admins",
      description: "Create and review admin accounts through an authenticated admin-only workflow.",
      searchLabel: "Search admin accounts..."
    }
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

  const eligiblePassengers = useMemo(
    () => passengers.filter((passenger) => passenger.user.role.toLowerCase() === "passenger"),
    [passengers]
  );

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

          <PlatformHealthCard />
        </div>

        <section className="exact-admin-card">
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
                <h3>Passenger pulse</h3>
                <p>Recent passenger accounts and the cities they are anchored to.</p>
              </div>
            </div>
            {recentPassengers.length === 0 ? (
              <EmptyCard
                title="No passenger accounts yet."
                body="Passenger signups will appear here as soon as the first accounts are created."
              />
            ) : (
              <ul className="workbench-list">
                {recentPassengers.map((passenger) => (
                  <li key={passenger.id}>
                    <span>
                      {passenger.user.fullName}
                      {passenger.defaultServiceCity ? ` - ${passenger.defaultServiceCity}` : ""}
                    </span>
                    <strong>{passenger.user.phoneE164}</strong>
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

          <section className="exact-admin-card">
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
        </div>
      </>
    ) : screen === "riders" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
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

          <section className="exact-admin-card">
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
        </div>
      </>
    ) : screen === "passengers" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
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
      </>
    ) : screen === "promotions" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
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
            {promotionZoneSnapshot.length === 0 ? (
              <EmptyCard
                title="No promotion zones yet."
                body="Promotion activity will show the most active zones here once the first discounted rides land."
              />
            ) : (
              <ul className="workbench-list">
                {promotionZoneSnapshot.map(([zone, count]) => (
                  <li key={zone}>
                    <span>{zone}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </>
    ) : screen === "settings" ? (
      <>
        <section className="exact-admin-section">
          <div className="exact-admin-heading">
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
              <ul className="workbench-list">
                {adminRoleEntries.map(([role, permissions]) => (
                  <li key={role}>
                    <span>{role}</span>
                    <strong>{permissions.length}</strong>
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
              <ul className="workbench-list">
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
              <ul className="workbench-list">
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
            <p className="exact-admin-eyebrow">Roles and permissions</p>
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
          <section className="exact-admin-card wide">
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

            <div className="admin-form-divider" />

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

          <section className="exact-admin-card">
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
              <span>Completed revenue</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", totalRevenue)}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Average completed fare</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", averageCompletedFare)}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Completed rides</span>
              <strong>{completedTrips.length}</strong>
            </article>
            <article className="exact-admin-kpi">
              <span>Active trip value</span>
              <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", activeTripValue)}</strong>
            </article>
          </div>
        </section>

        <div className="exact-admin-grid">
          <section className="exact-admin-card wide">
            <div className="exact-admin-cardhead">
              <div>
                <h3>Completed fare ledger</h3>
                <p>Revenue view assembled from the completed ride feed.</p>
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
                              {ride.status}
                            </span>
                          </td>
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
                <h3>Cashflow snapshot</h3>
                <p>High-level money movement through ride completion and live trip inventory.</p>
              </div>
            </div>
            <ul className="workbench-list">
              <li>
                <span>Completed revenue</span>
                <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", totalRevenue)}</strong>
              </li>
              <li>
                <span>Average completed fare</span>
                <strong>{formatMoney(session?.user.preferredCurrency ?? "GHS", averageCompletedFare)}</strong>
              </li>
              <li>
                <span>Trips still in flight</span>
                <strong>{activeTrips.length}</strong>
              </li>
              <li>
                <span>Estimated active value</span>
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
                        <span>{item.label}</span>
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
              <div className="exact-admin-search">
                <Search size={16} />
                <input placeholder={screenMeta[screen].searchLabel} />
              </div>
              <div className="exact-admin-topmeta">
                <strong>{screenMeta[screen].title}</strong>
                <span>{new Date().toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            <div className="exact-admin-actions">
              <a className="exact-admin-quickaction" href={screen === "payments" ? "/admin/promotions" : "/admin/rides"}>
                <ArrowUpRight size={16} />
                <span>{screen === "payments" ? "Open promotions" : "Dispatch view"}</span>
              </a>
              <button className="exact-icon-button notification" type="button">
                <Bell size={18} />
              </button>
              <button className="exact-admin-zone" type="button">
                {zonesQuery.data?.[0]?.city ?? "Live operations"}
              </button>
            </div>
          </header>

          <div className="exact-admin-scroll">{content}</div>
        </section>
      </div>
    </ImmersivePage>
  );
}
