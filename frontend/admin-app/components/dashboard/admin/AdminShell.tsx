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
  { label: "", key: "main" as const },
  { label: "", key: "finance" as const },
  { label: "", key: "system" as const }
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
  dashboard: { eyebrow: "", title: "Home", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  rides: { eyebrow: "", title: "Requests", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  deliveries: { eyebrow: "", title: "Deliveries", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  riders: { eyebrow: "", title: "Riders", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderVerification: { eyebrow: "", title: "Verify", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/documents", quickActionNote: "" },
  riderDocuments: { eyebrow: "", title: "Docs", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  riderPerformance: { eyebrow: "", title: "Stats", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/earnings", quickActionNote: "" },
  riderEarnings: { eyebrow: "", title: "Earn", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderWallet: { eyebrow: "", title: "Wallet", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderPayouts: { eyebrow: "", title: "Payouts", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderComplaints: { eyebrow: "", title: "Cases", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  riderActivity: { eyebrow: "", title: "Live", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  riderSuspensions: { eyebrow: "", title: "Banned", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  passengers: { eyebrow: "", title: "Users", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  payments: { eyebrow: "", title: "Finance", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  ratings: { eyebrow: "", title: "Ratings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  promotions: { eyebrow: "", title: "Promos", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  zones: { eyebrow: "", title: "Zones", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  supportTickets: { eyebrow: "", title: "Support", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/complaints", quickActionNote: "" },
  sosIncidents: { eyebrow: "", title: "SOS", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  escalationRules: { eyebrow: "", title: "Escalate", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  notifications: { eyebrow: "", title: "Alerts", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  reports: { eyebrow: "", title: "Reports", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  auditLogs: { eyebrow: "", title: "Audit", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  settings: { eyebrow: "", title: "Settings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  paymentMethods: { eyebrow: "", title: "Payments", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  integrations: { eyebrow: "", title: "APIs", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  taxesCompliance: { eyebrow: "", title: "Tax", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  settingsNotifications: { eyebrow: "", title: "Alerts", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  admins: { eyebrow: "", title: "Staff", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" }
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
  void screenHighlights;
  void dashboardToday;
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
        label: "Home",
        href: "/",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "main",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      {
        label: "Requests",
        href: "/requests",
        icon: Bike,
        screen: "rides",
        group: "main",
        hint: "",
        badge: `${badgeData.completedTripsCount}`
      },
      {
        label: "Deliveries",
        href: "/deliveries",
        icon: Package,
        screen: "deliveries",
        group: "main",
        hint: "",
        badge: `${badgeData.deliveriesCount}`
      },
      {
        label: "Riders",
        href: "/riders",
        icon: User,
        screen: "riders",
        group: "main",
        hint: "",
        badge: `${badgeData.activeRidersCount}`,
        children: [
          {
            label: "All",
            href: "/riders",
            screen: "riders",
            badge: `${badgeData.ridersCount}`
          },
          {
            label: "Verify",
            href: "/riders/verification",
            screen: "riderVerification",
            badge: `${badgeData.riderVerificationPending + badgeData.riderVerificationUnderReview}`
          },
          {
            label: "Docs",
            href: "/riders/documents",
            screen: "riderDocuments",
            badge: `${badgeData.riderDocumentMissing}`
          },
          {
            label: "Stats",
            href: "/riders/performance",
            screen: "riderPerformance",
            badge: `${badgeData.completedTripsCount}`
          },
          {
            label: "Earn",
            href: "/riders/earnings",
            screen: "riderEarnings",
            badge: `${badgeData.topRiderPerformanceEarningsCount}`
          },
          {
            label: "Wallet",
            href: "/riders/wallet",
            screen: "riderWallet",
            badge: `${badgeData.riderWalletTransactionsCount}`
          },
          {
            label: "Payouts",
            href: "/riders/payouts",
            screen: "riderPayouts",
            badge: `${badgeData.riderPayoutRequestedCount}`
          },
          {
            label: "Cases",
            href: "/riders/complaints",
            screen: "riderComplaints",
            badge: `${badgeData.riderIncidentsCount}`
          },
          {
            label: "Live",
            href: "/riders/activity-tracking",
            screen: "riderActivity",
            badge: `${badgeData.ridersWithCoordsCount}`
          },
          {
            label: "Banned",
            href: "/riders/suspensions",
            screen: "riderSuspensions",
            badge: `${badgeData.suspendedRidersCount}`
          }
        ]
      },
      {
        label: "Users",
        href: "/users",
        icon: Users,
        screen: "passengers",
        group: "main",
        hint: "",
        badge: `${badgeData.passengersCount}`
      },
      {
        label: "Finance",
        href: "/finance",
        icon: CreditCard,
        screen: "payments",
        group: "finance",
        hint: "",
        badge: `${badgeData.pendingPayoutRequestsCount}`
      },
      {
        label: "Ratings",
        href: "/reports-analytics",
        icon: FileText,
        screen: "ratings",
        group: "finance",
        hint: "",
        badge: `${badgeData.ratingsCount}`
      },
      {
        label: "Reports",
        href: "/reports",
        icon: TrendingUp,
        screen: "reports",
        group: "finance",
        hint: "",
        badge: ""
      },
      {
        label: "Promos",
        href: "/promotions",
        icon: Tag,
        screen: "promotions",
        group: "finance",
        hint: "",
        badge: `${badgeData.promoAdjustedTripsCount}`
      },
      {
        label: "Support",
        href: "/support-tickets",
        icon: Headphones,
        screen: "supportTickets",
        group: "system",
        hint: "",
        badge: `${badgeData.openSupportTicketsCount}`
      },
      {
        label: "SOS",
        href: "/sos",
        icon: ShieldAlert,
        screen: "sosIncidents",
        group: "main",
        hint: "",
        badge: `${badgeData.openSosCount}`
      },
      {
        label: "Escalate",
        href: "/escalation-rules",
        icon: Headphones,
        screen: "escalationRules",
        group: "system",
        hint: ""
      },
      {
        label: "Alerts",
        href: "/notifications",
        icon: Bell,
        screen: "notifications",
        group: "system",
        hint: "",
        badge: ""
      },
      {
        label: "Zones",
        href: "/zones",
        icon: Globe,
        screen: "zones",
        group: "system",
        hint: "",
        badge: `${badgeData.zonesActiveCount}`
      },
      {
        label: "Audit",
        href: "/audit-logs",
        icon: ClipboardList,
        screen: "auditLogs",
        group: "system",
        hint: "",
        badge: ""
      },
      {
        label: "Settings",
        href: "/settings",
        icon: MapPin,
        screen: "settings",
        group: "system",
        hint: "",
        badge: `${badgeData.zonesActiveCount}`,
        children: [
          { label: "General", href: "/settings", screen: "settings" },
          { label: "Payments", href: "/payment-methods", screen: "paymentMethods" },
          { label: "Tax", href: "/taxes-compliance", screen: "taxesCompliance" },
          { label: "APIs", href: "/integrations", screen: "integrations" },
          { label: "Alerts", href: "/settings-notifications", screen: "settingsNotifications" }
        ]
      },
      {
        label: "Staff",
        href: "/admins",
        icon: ShieldAlert,
        screen: "admins",
        group: "system",
        hint: "",
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

  const toggleSection = (key: string) => {
    setExpandedNavSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isChildActive = (item: AdminNavItem) =>
    item.children?.some((child) => child.screen === screen) ?? false;

  return (
    <ImmersivePage className="exact-admin-page" data-theme={theme}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="exact-admin-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className={`exact-admin-shell ${desktopOpen ? "" : "desktop-collapsed"}`}>
        {/* Sidebar */}
        <aside className={`exact-admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="exact-admin-brand">
            <strong>Okada<span>Go</span></strong>
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
                  {group.label ? <p className="exact-admin-navlabel">{group.label}</p> : null}
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
                            {item.badge && item.badge !== "0" && item.badge !== "New" && item.badge !== "" && (
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
                            {item.badge && item.badge !== "0" && item.badge !== "New" && item.badge !== "" && (
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
                                {child.badge && child.badge !== "0" && child.badge !== "New" && child.badge !== "" && (
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

          <div className="exact-admin-profile" onClick={onSignOut} title="Sign out">
            <div className="exact-avatar">{initials}</div>
            <div>
              <strong>{userName.split(" ")[0] || userName}</strong>
              <span>Out</span>
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
            </div>

            <div className="exact-admin-top-profile">
              <button
                type="button"
                className="exact-admin-menu-button"
                onClick={toggleTheme}
                title="Toggle Theme Mode"
                style={{ marginRight: 8, opacity: 0.8 }}
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="exact-avatar">{initials}</div>
              <strong className="exact-admin-top-user">{userName}</strong>
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
