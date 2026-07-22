"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  Bike,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldAlert,
  Tag,
  User,
  Users,
  TrendingUp,
  Globe,
  ClipboardList,
  Sun,
  Moon,
  X
} from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import type { AdminConsoleScreen, AdminNavItem, AdminScreenMeta, AdminHighlight } from "./types";

export type AdminShellBadgeData = {
  activeTripsCount: number;
  completedTripsCount: number;
  activeRidersCount: number;
  ridersCount: number;
  riderVerificationPending: number;
  riderVerificationUnderReview: number;
  riderDocumentMissing: number;
  topRiderPerformanceEarningsCount: number;
  riderWalletTransactionsCount: number;
  riderPayoutRequestedCount: number;
  riderIncidentsCount: number;
  ridersWithCoordsCount: number;
  suspendedRidersCount: number;
  passengersCount: number;
  pendingPayoutRequestsCount: number;
  promoAdjustedTripsCount: number;
  zonesActiveCount: number;
  adminAccountsCount: number;
  ratingsCount: number;
  openSupportTicketsCount: number;
  openSosCount: number;
  deliveriesCount: number;
  completedDeliveriesCount: number;
};

export type AdminShellProps = {
  screen: AdminConsoleScreen;
  onSignOut: () => void;
  badgeData: AdminShellBadgeData;
  screenHighlights: Record<AdminConsoleScreen, AdminHighlight[]>;
  dashboardToday: string;
  userName: string;
  adminRoleEntries?: [string, string[]][];
  children: React.ReactNode;
};

const navGroups = [
  { label: "Main", key: "main" as const },
  { label: "Finance", key: "finance" as const },
  { label: "System", key: "system" as const }
];

const screenPermissions: Partial<Record<AdminConsoleScreen, string>> = {
  dashboard: "dashboard.view",
  rides: "rides.view",
  deliveries: "deliveries.view",
  riders: "riders.view",
  riderVerification: "riders.verify",
  riderDocuments: "riders.documents",
  riderPerformance: "riders.performance",
  riderEarnings: "riders.earnings",
  riderWallet: "riders.wallet",
  riderPayouts: "riders.payouts",
  riderComplaints: "riders.complaints",
  riderActivity: "riders.activity",
  riderSuspensions: "riders.suspensions",
  passengers: "passengers.view",
  payments: "finance.view",
  ratings: "ratings.view",
  promotions: "promotions.view",
  zones: "zones.view",
  supportTickets: "support.view",
  sosIncidents: "support.view",
  escalationRules: "support.view",
  notifications: "notifications.view",
  reports: "reports.view",
  auditLogs: "audit.view",
  settings: "settings.view",
  paymentMethods: "settings.view",
  integrations: "settings.view",
  taxesCompliance: "settings.view",
  settingsNotifications: "settings.view",
  admins: "admins.view"
};

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
    title: "Request Dashboard",
    description: "Track live, completed, and cancelled ride requests from the persisted dispatch feed.",
    searchLabel: "Search ride codes, riders, or passengers...",
    quickActionLabel: "See rider supply",
    quickActionHref: "/admin/riders",
    quickActionNote: "Compare ride demand against online rider availability."
  },
  deliveries: {
    eyebrow: "Delivery operations",
    title: "Deliveries",
    description: "Monitor all package delivery requests, statuses, routes, and courier assignments.",
    searchLabel: "Search deliveries, recipients, or addresses...",
    quickActionLabel: "View all requests",
    quickActionHref: "/admin/requests",
    quickActionNote: "Cross-reference delivery feed with ride request dashboard."
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
  riderVerification: {
    eyebrow: "Riders management",
    title: "Rider Verification",
    description: "Review rider approval readiness using live profile, vehicle, zone, and account data.",
    searchLabel: "Search rider verification queue...",
    quickActionLabel: "Open rider documents",
    quickActionHref: "/admin/riders/documents",
    quickActionNote: "Verification status is derived from live rider records."
  },
  riderDocuments: {
    eyebrow: "Riders management",
    title: "Rider Documents",
    description: "Track rider document readiness and missing operational requirements from live records.",
    searchLabel: "Search rider documents...",
    quickActionLabel: "Open verification",
    quickActionHref: "/admin/riders/verification",
    quickActionNote: "Document uploads and expiry dates tracked from live rider records."
  },
  riderPerformance: {
    eyebrow: "Riders management",
    title: "Rider Performance",
    description: "Compare rider trip volume, completion load, earnings, and rating signals from live operations.",
    searchLabel: "Search rider performance...",
    quickActionLabel: "Open earnings",
    quickActionHref: "/admin/riders/earnings",
    quickActionNote: "Performance is grouped from assigned ride records and rating submissions."
  },
  riderEarnings: {
    eyebrow: "Riders management",
    title: "Rider Earnings",
    description: "Review rider earnings estimated from completed trips and platform commission.",
    searchLabel: "Search rider earnings...",
    quickActionLabel: "Open payouts",
    quickActionHref: "/admin/riders/payouts",
    quickActionNote: "Earnings are calculated from live completed ride fares minus platform commission."
  },
  riderWallet: {
    eyebrow: "Riders management",
    title: "Rider Wallet",
    description: "Inspect rider wallet movement from admin-visible wallet transactions.",
    searchLabel: "Search rider wallet records...",
    quickActionLabel: "Open payouts",
    quickActionHref: "/admin/riders/payouts",
    quickActionNote: "Wallet rows come from the admin payments ledger filtered to rider wallets."
  },
  riderPayouts: {
    eyebrow: "Riders management",
    title: "Rider Payouts",
    description: "Track rider payout requests, review states, and paid settlement history.",
    searchLabel: "Search rider payouts...",
    quickActionLabel: "Open finance",
    quickActionHref: "/admin/finance",
    quickActionNote: "Payout actions remain controlled from the finance page workflow."
  },
  riderComplaints: {
    eyebrow: "Riders management",
    title: "Complaints & Support",
    description: "Review rider-linked incidents and complaint reports from support operations.",
    searchLabel: "Search rider complaints...",
    quickActionLabel: "Open reports",
    quickActionHref: "/admin/reports-analytics",
    quickActionNote: "Complaints are pulled from support incidents that are linked to a rider."
  },
  riderActivity: {
    eyebrow: "Riders management",
    title: "Activity Tracking",
    description: "Track online state, location availability, zone coverage, and active trip load.",
    searchLabel: "Search rider activity...",
    quickActionLabel: "Open rider map",
    quickActionHref: "/admin/riders",
    quickActionNote: "Activity tracking uses live availability and coordinate fields from rider profiles."
  },
  riderSuspensions: {
    eyebrow: "Riders management",
    title: "Suspensions",
    description: "Review riders whose account status indicates blocked, suspended, or rejected access.",
    searchLabel: "Search rider suspensions...",
    quickActionLabel: "Open verification",
    quickActionHref: "/admin/riders/verification",
    quickActionNote: "Suspension controls need a dedicated backend action before this page can mutate status."
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
    quickActionLabel: "Open reports",
    quickActionHref: "/admin/reports-analytics",
    quickActionNote: "Cross-check payment records against verified rider rating submissions."
  },
  ratings: {
    eyebrow: "Quality operations",
    title: "Reports & Analytics",
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
  zones: {
    eyebrow: "Platform configuration",
    title: "Zone Management",
    description: "View and manage all service zones, pricing parameters, coverage cities, and active status.",
    searchLabel: "Search zones or cities...",
    quickActionLabel: "Open settings",
    quickActionHref: "/admin/settings",
    quickActionNote: "Zone changes affect ride pricing platform-wide."
  },
  supportTickets: {
    eyebrow: "Support operations",
    title: "Support Tickets",
    description: "Review and update support tickets submitted from the passenger and rider apps.",
    searchLabel: "Search tickets, reporters, or ride IDs...",
    quickActionLabel: "View rider complaints",
    quickActionHref: "/admin/riders/complaints",
    quickActionNote: "Cross-check app support tickets with rider-linked incident reports."
  },
  sosIncidents: {
    eyebrow: "Safety operations",
    title: "SOS & Emergencies",
    description: "Critical SOS and emergency incidents from riders and passengers.",
    searchLabel: "Search SOS incidents...",
    quickActionLabel: "Open support",
    quickActionHref: "/admin/support-tickets",
    quickActionNote: "Escalate non-critical cases to the support queue."
  },
  escalationRules: {
    eyebrow: "Support operations",
    title: "Escalation Rules",
    description: "Configure automated escalation rules for unresolved support tickets and incidents.",
    searchLabel: "Search escalation rules...",
    quickActionLabel: "View support tickets",
    quickActionHref: "/admin/support-tickets",
    quickActionNote: "Escalation rules automatically escalate unresolved tickets based on thresholds."
  },
  notifications: {
    eyebrow: "Communication",
    title: "Notifications",
    description: "Broadcast push notifications and operational alerts to riders, passengers, or all users.",
    searchLabel: "Search notification history...",
    quickActionLabel: "View promotions",
    quickActionHref: "/admin/promotions",
    quickActionNote: "Pair targeted notifications with active promotion campaigns."
  },
  reports: {
    eyebrow: "Business intelligence",
    title: "Reports",
    description: "Aggregate platform performance data across rides, revenue, riders, and passengers over time.",
    searchLabel: "Search reports...",
    quickActionLabel: "View finance",
    quickActionHref: "/admin/finance",
    quickActionNote: "Reports compile data from live operations into digestible summaries."
  },
  auditLogs: {
    eyebrow: "Compliance & audit",
    title: "Audit Logs",
    description: "Review admin actions, data mutations, and operational events with actor attribution.",
    searchLabel: "Search audit events or actors...",
    quickActionLabel: "Manage admins",
    quickActionHref: "/admin/admins",
    quickActionNote: "Audit logs track all privileged admin operations."
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
  paymentMethods: {
    eyebrow: "Platform controls",
    title: "Payment Methods",
    description: "Manage how your company receives payments and makes payouts.",
    searchLabel: "Search payment methods...",
    quickActionLabel: "View finance",
    quickActionHref: "/admin/finance",
    quickActionNote: "Review payment methods against finance records."
  },
  integrations: {
    eyebrow: "Platform controls",
    title: "Integrations",
    description: "Connect OkadaGo with third-party services and tools to automate and grow your business.",
    searchLabel: "Search integrations...",
    quickActionLabel: "View settings",
    quickActionHref: "/admin/settings",
    quickActionNote: "Manage connected services and API keys."
  },
  taxesCompliance: {
    eyebrow: "Platform controls",
    title: "Taxes & Compliance",
    description: "Manage your tax information, filings, and compliance requirements.",
    searchLabel: "Search tax records...",
    quickActionLabel: "View finance",
    quickActionHref: "/admin/finance",
    quickActionNote: "Cross-check tax obligations with finance records."
  },
  settingsNotifications: {
    eyebrow: "Platform controls",
    title: "Notifications",
    description: "Stay updated with important alerts, activities and system notifications.",
    searchLabel: "Search notifications...",
    quickActionLabel: "View promotions",
    quickActionHref: "/admin/promotions",
    quickActionNote: "Pair notifications with active campaigns."
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

export function AdminShell({
  screen,
  onSignOut,
  badgeData,
  screenHighlights,
  dashboardToday,
  userName,
  adminRoleEntries = [],
  children
}: AdminShellProps) {
  const [expandedNavSections, setExpandedNavSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("okadago.admin-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth > 1024) {
      setDesktopOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  }, []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("okadago.admin-theme", next);
      }
      return next;
    });
  }, []);

  const permittedScreens = useMemo(() => {
    if (adminRoleEntries.length === 0) return null;
    const allPerms = new Set(adminRoleEntries.flatMap(([, perms]) => perms));
    if (allPerms.has("admin.full_access") || allPerms.has("*")) return null;
    const allowed = new Set<AdminConsoleScreen>();
    for (const [screenKey, perm] of Object.entries(screenPermissions)) {
      if (allPerms.has(perm) || allPerms.has(perm.split(".")[0] + ".*")) {
        allowed.add(screenKey as AdminConsoleScreen);
      }
    }
    return allowed;
  }, [adminRoleEntries]);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const navItems: AdminNavItem[] = useMemo(() => {
    const allItems: AdminNavItem[] = [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "main",
        hint: "Overview and live pulse",
        badge: `${badgeData.activeTripsCount}`
      },
      {
        label: "Request Dashboard",
        href: "/admin/requests",
        icon: Bike,
        screen: "rides",
        group: "main",
        hint: "Ride requests and history",
        badge: `${badgeData.completedTripsCount}`
      },
      {
        label: "Deliveries",
        href: "/admin/deliveries",
        icon: Package,
        screen: "deliveries",
        group: "main",
        hint: "Package delivery orders",
        badge: `${badgeData.deliveriesCount}`
      },
      {
        label: "Riders Management",
        href: "/admin/riders",
        icon: User,
        screen: "riders",
        group: "main",
        hint: "Supply and availability",
        badge: `${badgeData.activeRidersCount}`,
        children: [
          {
            label: "All Riders",
            href: "/admin/riders",
            screen: "riders",
            badge: `${badgeData.ridersCount}`
          },
          {
            label: "Rider Verification",
            href: "/admin/riders/verification",
            screen: "riderVerification",
            badge: `${badgeData.riderVerificationPending + badgeData.riderVerificationUnderReview}`
          },
          {
            label: "Documents",
            href: "/admin/riders/documents",
            screen: "riderDocuments",
            badge: `${badgeData.riderDocumentMissing}`
          },
          {
            label: "Performance",
            href: "/admin/riders/performance",
            screen: "riderPerformance",
            badge: `${badgeData.completedTripsCount}`
          },
          {
            label: "Earnings",
            href: "/admin/riders/earnings",
            screen: "riderEarnings",
            badge: `${badgeData.topRiderPerformanceEarningsCount}`
          },
          {
            label: "Wallet",
            href: "/admin/riders/wallet",
            screen: "riderWallet",
            badge: `${badgeData.riderWalletTransactionsCount}`
          },
          {
            label: "Payouts",
            href: "/admin/riders/payouts",
            screen: "riderPayouts",
            badge: `${badgeData.riderPayoutRequestedCount}`
          },
          {
            label: "Complaints & Support",
            href: "/admin/riders/complaints",
            screen: "riderComplaints",
            badge: `${badgeData.riderIncidentsCount}`
          },
          {
            label: "Activity Tracking",
            href: "/admin/riders/activity-tracking",
            screen: "riderActivity",
            badge: `${badgeData.ridersWithCoordsCount}`
          },
          {
            label: "Suspensions",
            href: "/admin/riders/suspensions",
            screen: "riderSuspensions",
            badge: `${badgeData.suspendedRidersCount}`
          }
        ]
      },
      {
        label: "Users Management",
        href: "/admin/users",
        icon: Users,
        screen: "passengers",
        group: "main",
        hint: "Demand and retention",
        badge: `${badgeData.passengersCount}`
      },
      {
        label: "Finance",
        href: "/admin/finance",
        icon: CreditCard,
        screen: "payments",
        group: "finance",
        hint: "Wallets, payouts, ledger",
        badge: `${badgeData.pendingPayoutRequestsCount}`
      },
      {
        label: "Reports & Analytics",
        href: "/admin/reports-analytics",
        icon: FileText,
        screen: "ratings",
        group: "finance",
        hint: "Ratings and insights",
        badge: `${badgeData.ratingsCount}`
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: TrendingUp,
        screen: "reports",
        group: "finance",
        hint: "Business intelligence",
        badge: "New"
      },
      {
        label: "Promotions",
        href: "/admin/promotions",
        icon: Tag,
        screen: "promotions",
        group: "finance",
        hint: "Discounts and referrals",
        badge: `${badgeData.promoAdjustedTripsCount}`
      },
      {
        label: "Support Tickets",
        href: "/admin/support-tickets",
        icon: Headphones,
        screen: "supportTickets",
        group: "system",
        hint: "Passenger and rider cases",
        badge: `${badgeData.openSupportTicketsCount}`
      },
      {
        label: "SOS & Emergencies",
        href: "/admin/sos",
        icon: ShieldAlert,
        screen: "sosIncidents",
        group: "main",
        hint: "Critical SOS queue",
        badge: `${badgeData.openSosCount}`
      },
      {
        label: "Escalation Rules",
        href: "/admin/escalation-rules",
        icon: Headphones,
        screen: "escalationRules",
        group: "system",
        hint: "Automated incident escalation"
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        screen: "notifications",
        group: "system",
        hint: "Push alerts and broadcasts",
        badge: "New"
      },
      {
        label: "Zone Management",
        href: "/admin/zones",
        icon: Globe,
        screen: "zones",
        group: "system",
        hint: "Service zones and pricing",
        badge: `${badgeData.zonesActiveCount}`
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ClipboardList,
        screen: "auditLogs",
        group: "system",
        hint: "Admin action history",
        badge: "New"
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: MapPin,
        screen: "settings",
        group: "system",
        hint: "Zones, pricing, modules",
        badge: `${badgeData.zonesActiveCount}`,
        children: [
          { label: "General", href: "/admin/settings", screen: "settings" },
          { label: "Payment Methods", href: "/admin/payment-methods", screen: "paymentMethods" },
          { label: "Taxes & Compliance", href: "/admin/taxes-compliance", screen: "taxesCompliance" },
          { label: "Integrations", href: "/admin/integrations", screen: "integrations" },
          { label: "Notifications", href: "/admin/settings-notifications", screen: "settingsNotifications" }
        ]
      },
      {
        label: "Admins",
        href: "/admin/admins",
        icon: ShieldAlert,
        screen: "admins",
        group: "system",
        hint: "Roles and account control",
        badge: `${badgeData.adminAccountsCount}`
      }
    ];

    if (!permittedScreens) return allItems;

    const filtered = allItems
      .map((item) => {
        const screenAllowed = permittedScreens.has(item.screen);
        const filteredChildren = item.children?.filter((child) =>
          permittedScreens.has(child.screen)
        );
        if (!screenAllowed && (!filteredChildren || filteredChildren.length === 0)) return null;
        if (filteredChildren && filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren ?? item.children };
      })
      .filter(Boolean) as AdminNavItem[];

    return filtered.length > 0 ? filtered : allItems;
  }, [badgeData, permittedScreens]);

  const currentMeta = screenMeta[screen];
  const highlights = screenHighlights[screen] ?? [];

  const toggleSection = (key: string) => {
    setExpandedNavSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isChildActive = (item: AdminNavItem) =>
    item.children?.some((child) => child.screen === screen) ?? false;

  return (
    <ImmersivePage className="exact-admin-page">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="exact-admin-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className={`exact-admin-shell ${desktopOpen ? "" : "desktop-collapsed"}`} data-theme={theme}>
        {/* Sidebar */}
        <aside className={`exact-admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="exact-admin-brand">
            <strong>Okada<span>Go</span></strong>
            <small>Web Operations Portal</small>
            <button
              type="button"
              className="exact-admin-sidebar-close"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="exact-admin-nav" aria-label="Admin navigation">
            {navGroups.map((group) => {
              const groupItems = navItems.filter((item) => item.group === group.key);
              return (
                <div key={group.key} className="exact-admin-navgroup">
                  <p className="exact-admin-navlabel">{group.label}</p>
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.screen === screen || isChildActive(item);
                    const isExpanded = expandedNavSections[item.screen] ?? isChildActive(item);

                    return (
                      <div key={item.screen} className="exact-admin-navitem">
                        {item.children ? (
                          <button
                            type="button"
                            className={`exact-admin-nav-toggle ${isActive ? "active" : ""} ${isExpanded ? "is-open" : ""}`}
                            onClick={() => toggleSection(item.screen)}
                            aria-expanded={isExpanded}
                          >
                            <Icon size={16} />
                            <div className="exact-admin-navcopy">
                              <strong>{item.label}</strong>
                            </div>
                            {item.badge && item.badge !== "0" && (
                              <em>{item.badge}</em>
                            )}
                            <ChevronDown
                              size={14}
                              className="exact-admin-nav-chevron"
                            />
                          </button>
                        ) : (
                          <a
                            href={item.href}
                            className={item.screen === screen ? "active" : ""}
                            onClick={closeSidebar}
                          >
                            <Icon size={16} />
                            <div className="exact-admin-navcopy">
                              <strong>{item.label}</strong>
                            </div>
                            {item.badge && item.badge !== "0" && (
                              <em>{item.badge}</em>
                            )}
                          </a>
                        )}
                        {item.children && isExpanded && (
                          <div className="exact-admin-subnav">
                            {item.children.map((child) => (
                              <a
                                key={child.screen}
                                href={child.href}
                                className={child.screen === screen ? "active" : ""}
                                onClick={closeSidebar}
                              >
                                <span>{child.label}</span>
                                {child.badge && child.badge !== "0" && (
                                  <em>{child.badge}</em>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="exact-admin-profile" onClick={onSignOut} title="Click to Sign Out">
            <div className="exact-avatar">{initials}</div>
            <div>
              <strong>{userName}</strong>
              <span>Sign Out</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="exact-admin-main">
          {/* Top bar */}
          <header className="exact-admin-topbar">
            <button
              type="button"
              className="exact-admin-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="exact-admin-topmeta">
              <strong>{currentMeta.title}</strong>
              <span>{currentMeta.eyebrow}</span>
            </div>

            <div className="exact-admin-highlights">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="exact-admin-highlight">
                  <span>{highlight.label}</span>
                  <strong>{highlight.value}</strong>
                </div>
              ))}
            </div>

            <div className="exact-admin-top-profile">
              <button
                type="button"
                className="exact-admin-menu-button"
                onClick={toggleTheme}
                title="Toggle Theme Mode"
                style={{ marginRight: 12, opacity: 0.8 }}
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="exact-avatar">{initials}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong>{userName}</strong>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{dashboardToday}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="exact-admin-scroll">
            {children}
          </main>
        </div>
      </div>
    </ImmersivePage>
  );
}
