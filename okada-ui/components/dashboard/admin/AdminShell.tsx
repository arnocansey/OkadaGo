"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  Bike,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldAlert,
  Tag,
  User,
  Users
} from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { AdminSidebarPulse } from "./AdminSidebarPulse";
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
};

export type AdminShellProps = {
  screen: AdminConsoleScreen;
  onSignOut: () => void;
  badgeData: AdminShellBadgeData;
  screenHighlights: Record<AdminConsoleScreen, AdminHighlight[]>;
  dashboardToday: string;
  currency: string;
  userName: string;
  activeTrips: number;
  activeRiders: number;
  totalRevenue: number;
  zonesCount: number;
  children: React.ReactNode;
};

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
    title: "Request Dashboard",
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
  riderVerification: {
    eyebrow: "Riders management",
    title: "Rider Verification",
    description: "Review rider approval readiness using live profile, vehicle, zone, and account data.",
    searchLabel: "Search rider verification queue...",
    quickActionLabel: "Open rider documents",
    quickActionHref: "/admin/riders/documents",
    quickActionNote: "Verification status is derived from live rider records until a dedicated KYC endpoint is added."
  },
  riderDocuments: {
    eyebrow: "Riders management",
    title: "Rider Documents",
    description: "Track rider document readiness and missing operational requirements from live records.",
    searchLabel: "Search rider documents...",
    quickActionLabel: "Open verification",
    quickActionHref: "/admin/riders/verification",
    quickActionNote: "Document uploads and expiry dates need backend support; this page currently exposes readiness gaps without dummy files."
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
  supportTickets: {
    eyebrow: "Support operations",
    title: "Support Tickets",
    description: "Review and update support tickets submitted from the passenger and rider apps.",
    searchLabel: "Search tickets, reporters, or ride IDs...",
    quickActionLabel: "View rider complaints",
    quickActionHref: "/admin/riders/complaints",
    quickActionNote: "Cross-check app support tickets with rider-linked incident reports."
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

export function AdminShell({
  screen,
  onSignOut,
  badgeData,
  screenHighlights,
  dashboardToday,
  currency,
  userName,
  activeTrips,
  activeRiders,
  totalRevenue,
  zonesCount,
  children
}: AdminShellProps) {
  const [expandedNavSections, setExpandedNavSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const navItems: AdminNavItem[] = useMemo(
    () => [
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
        label: "Settings",
        href: "/admin/settings",
        icon: MapPin,
        screen: "settings",
        group: "system",
        hint: "Zones, pricing, modules",
        badge: `${badgeData.zonesActiveCount}`
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
    ],
    [badgeData]
  );

  return (
    <ImmersivePage className="exact-admin-page">
      <div className={`exact-admin-shell admin-dark-shell ${screen === "payments" ? "admin-finance-shell" : ""}`}>
        <div
          className={`exact-admin-overlay ${sidebarOpen ? "is-visible" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <aside className={`exact-admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <div className="exact-admin-brand">
            <div>
              <strong>Okada<span>Go</span></strong>
              <small>Move - Deliver - Earn</small>
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
                    const isActive =
                      item.screen === screen || Boolean(item.children?.some((child) => child.screen === screen));
                    const hasChildren = Boolean(item.children?.length);
                    const isExpanded = hasChildren ? expandedNavSections[item.label] ?? isActive : false;

                    return (
                      <div key={item.label} className="exact-admin-navitem">
                        {hasChildren ? (
                          <button
                            type="button"
                            className={`exact-admin-nav-toggle ${isActive ? "active" : ""} ${isExpanded ? "is-open" : ""}`}
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpandedNavSections((current) => ({
                                ...current,
                                [item.label]: !(current[item.label] ?? isActive)
                              }))
                            }
                          >
                            <Icon size={18} />
                            <div className="exact-admin-navcopy">
                              <strong>{item.label}</strong>
                              <small>{item.hint}</small>
                            </div>
                            {item.badge ? <em>{item.badge}</em> : null}
                            <ChevronDown className="exact-admin-nav-chevron" size={15} />
                          </button>
                        ) : (
                          <a href={item.href} className={isActive ? "active" : ""}>
                            <Icon size={18} />
                            <div className="exact-admin-navcopy">
                              <strong>{item.label}</strong>
                              <small>{item.hint}</small>
                            </div>
                            {item.badge ? <em>{item.badge}</em> : null}
                          </a>
                        )}
                        {item.children && isExpanded ? (
                          <div className="exact-admin-subnav">
                            {item.children.map((child) => (
                              <a
                                key={child.href}
                                href={child.href}
                                className={child.screen === screen ? "active" : ""}
                              >
                                <span>{child.label}</span>
                                {child.badge ? <em>{child.badge}</em> : null}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
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
            currency={currency}
            activeTrips={activeTrips}
            activeRiders={activeRiders}
            totalRevenue={totalRevenue}
            zones={zonesCount}
          />

          <button className="exact-admin-profile" type="button" onClick={onSignOut}>
            <div className="exact-avatar">{initials}</div>
            <div>
              <strong>{userName}</strong>
              <span>Super admin workspace</span>
            </div>
            <LogOut size={16} />
          </button>
        </aside>

        <section className="exact-admin-main">
          <header className="exact-admin-topbar">
            <div className="exact-admin-topbarcopy">
              <button className="exact-admin-menu-button" type="button" aria-label="Open admin navigation" onClick={toggleSidebar}>
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
                <div className="exact-avatar">{initials}</div>
                <div>
                  <strong>{userName}</strong>
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

          <div className="exact-admin-scroll">{children}</div>
        </section>
      </div>
    </ImmersivePage>
  );
}
