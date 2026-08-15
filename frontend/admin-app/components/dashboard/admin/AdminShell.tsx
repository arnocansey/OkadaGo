"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Bike,
  ChevronDown,
  CreditCard,
  ClipboardList,
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
  TrendingUp,
  User,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Sun,
  Moon,
  X
} from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { BrandMark } from "@/components/brand/BrandMark";
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
  { label: "", key: "home" as const }
];

const screenPermissions: Partial<Record<AdminConsoleScreen, string>> = {
  dashboard: "dashboard.view",
  liveOperations: "dashboard.view",
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
  pricing: "zones.view",
  promotions: "promotions.view",
  wallet: "finance.view",
  zones: "zones.view",
  supportTickets: "support.view",
  sosIncidents: "support.view",
  escalationRules: "support.view",
  analytics: "reports.view",
  notifications: "notifications.view",
  reports: "reports.view",
  auditLogs: "audit.view",
  settings: "settings.view",
  companyProfile: "settings.view",
  accountSecurity: "settings.view",
  notificationSettings: "settings.view",
  paymentMethods: "settings.view",
  integrations: "settings.view",
  taxesCompliance: "settings.view",
  settingsNotifications: "settings.view",
  admins: "admins.view"
};

const screenMeta: Record<AdminConsoleScreen, AdminScreenMeta> = {
  dashboard: { eyebrow: "", title: "Overview", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  liveOperations: { eyebrow: "", title: "Live Operations", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  rides: { eyebrow: "", title: "Rides", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  deliveries: { eyebrow: "", title: "Deliveries", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  riders: { eyebrow: "", title: "Riders", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderVerification: { eyebrow: "", title: "Verify Riders", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/documents", quickActionNote: "" },
  riderDocuments: { eyebrow: "", title: "Documents", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  riderPerformance: { eyebrow: "", title: "Performance", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/earnings", quickActionNote: "" },
  riderEarnings: { eyebrow: "", title: "Earnings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderWallet: { eyebrow: "", title: "Wallet", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderPayouts: { eyebrow: "", title: "Payouts", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderComplaints: { eyebrow: "", title: "Cases", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  riderActivity: { eyebrow: "", title: "Live Monitoring", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  riderSuspensions: { eyebrow: "", title: "Banned", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  passengers: { eyebrow: "", title: "Passengers", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  payments: { eyebrow: "", title: "Payments", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  pricing: { eyebrow: "", title: "Pricing", description: "Configure fares, rates, and commissions", searchLabel: "", quickActionLabel: "", quickActionHref: "/pricing", quickActionNote: "" },
  promotions: { eyebrow: "", title: "Promotions", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  wallet: { eyebrow: "", title: "Wallet", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  zones: { eyebrow: "", title: "Zones", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  supportTickets: { eyebrow: "", title: "Support", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/complaints", quickActionNote: "" },
  sosIncidents: { eyebrow: "", title: "SOS", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  escalationRules: { eyebrow: "", title: "Escalation", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  analytics: { eyebrow: "", title: "Analytics", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports", quickActionNote: "" },
  notifications: { eyebrow: "", title: "Alerts", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  reports: { eyebrow: "", title: "Reports", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  auditLogs: { eyebrow: "", title: "Audit Logs", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  settings: { eyebrow: "", title: "Settings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  companyProfile: { eyebrow: "", title: "Company Profile", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  accountSecurity: { eyebrow: "", title: "Account & Security", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  notificationSettings: { eyebrow: "", title: "Notifications", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/notifications", quickActionNote: "" },
  paymentMethods: { eyebrow: "", title: "Payment Methods", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  integrations: { eyebrow: "", title: "Integrations", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  taxesCompliance: { eyebrow: "", title: "Taxes & Compliance", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  settingsNotifications: { eyebrow: "", title: "Alert Settings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  admins: { eyebrow: "", title: "Staff", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  ratings: { eyebrow: "", title: "Ratings", description: "", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" }
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
  const [topSearch, setTopSearch] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("okadago.admin-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("okadago.admin-theme", theme);
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth > 1024) {
      setDesktopOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  }, []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
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
        href: "/",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "home",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      {
        label: "Live Operations",
        href: "/live-operations",
        icon: Activity,
        screen: "liveOperations",
        group: "home",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      {
        label: "Rides",
        href: "/requests",
        icon: Bike,
        screen: "rides",
        group: "home",
        hint: "",
        badge: `${badgeData.completedTripsCount}`
      },
      {
        label: "Deliveries",
        href: "/deliveries",
        icon: Package,
        screen: "deliveries",
        group: "home",
        hint: "",
        badge: `${badgeData.deliveriesCount}`
      },
      {
        label: "Riders",
        href: "/riders",
        icon: User,
        screen: "riders",
        group: "home",
        hint: "",
        badge: `${badgeData.activeRidersCount}`,
        children: [
          { label: "All Riders", href: "/riders", screen: "riders", badge: `${badgeData.ridersCount}` },
          {
            label: "Verify",
            href: "/riders/verification",
            screen: "riderVerification",
            badge: `${badgeData.riderVerificationPending + badgeData.riderVerificationUnderReview}`
          },
          { label: "Documents", href: "/riders/documents", screen: "riderDocuments", badge: `${badgeData.riderDocumentMissing}` },
          { label: "Stats", href: "/riders/performance", screen: "riderPerformance", badge: `${badgeData.completedTripsCount}` },
          { label: "Earnings", href: "/riders/earnings", screen: "riderEarnings", badge: `${badgeData.topRiderPerformanceEarningsCount}` },
          { label: "Wallet", href: "/riders/wallet", screen: "riderWallet", badge: `${badgeData.riderWalletTransactionsCount}` },
          { label: "Payouts", href: "/riders/payouts", screen: "riderPayouts", badge: `${badgeData.riderPayoutRequestedCount}` },
          { label: "Cases", href: "/riders/complaints", screen: "riderComplaints", badge: `${badgeData.riderIncidentsCount}` },
          { label: "Live Monitoring", href: "/riders/activity-tracking", screen: "riderActivity", badge: `${badgeData.ridersWithCoordsCount}` },
          { label: "Banned", href: "/riders/suspensions", screen: "riderSuspensions", badge: `${badgeData.suspendedRidersCount}` }
        ]
      },
      {
        label: "Passengers",
        href: "/users",
        icon: Users,
        screen: "passengers",
        group: "home",
        hint: "",
        badge: `${badgeData.passengersCount}`
      },
      {
        label: "Payments",
        href: "/finance",
        icon: CreditCard,
        screen: "payments",
        group: "home",
        hint: "",
        badge: `${badgeData.pendingPayoutRequestsCount}`
      },
      {
        label: "Pricing",
        href: "/pricing",
        icon: Tag,
        screen: "pricing",
        group: "home",
        hint: "",
        badge: `${badgeData.zonesActiveCount}`
      },
      {
        label: "Promotions",
        href: "/promotions",
        icon: Tag,
        screen: "promotions",
        group: "home",
        hint: "",
        badge: `${badgeData.promoAdjustedTripsCount}`
      },
      {
        label: "Wallet",
        href: "/wallet",
        icon: Wallet,
        screen: "wallet",
        group: "home",
        hint: "",
        badge: ""
      },
      {
        label: "Support",
        href: "/support-tickets",
        icon: Headphones,
        screen: "supportTickets",
        group: "home",
        hint: "",
        badge: `${badgeData.openSupportTicketsCount}`
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        screen: "analytics",
        group: "home",
        hint: "",
        badge: ""
      },
      {
        label: "Reports",
        href: "/reports",
        icon: FileText,
        screen: "reports",
        group: "home",
        hint: "",
        badge: ""
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        screen: "settings",
        group: "home",
        hint: "",
        badge: "",
        children: [
          { label: "General", href: "/settings", screen: "settings" },
          { label: "Company Profile", href: "/settings/company", screen: "companyProfile" },
          { label: "Account & Security", href: "/settings/security", screen: "accountSecurity" },
          { label: "Notifications", href: "/settings/notifications", screen: "notificationSettings" },
          { label: "Payment Methods", href: "/payment-methods", screen: "paymentMethods" },
          { label: "Taxes", href: "/taxes-compliance", screen: "taxesCompliance" },
          { label: "Integrations", href: "/integrations", screen: "integrations" }
        ]
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ClipboardList,
        screen: "auditLogs",
        group: "home",
        hint: "",
        badge: ""
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
      {sidebarOpen && (
        <div
          className="exact-admin-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className={`exact-admin-shell ${desktopOpen ? "" : "desktop-collapsed"}`}>
        <aside className={`exact-admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="exact-admin-brand">
            <div className="exact-admin-brand-copy">
              <BrandMark variant="wordmark" height={32} product="shared" />
              <small>Fleet Management</small>
            </div>
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
              if (groupItems.length === 0) return null;
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
                            <Icon size={18} />
                            <div className="exact-admin-navcopy">
                              <strong>{item.label}</strong>
                            </div>
                            {item.badge && item.badge !== "0" && item.badge !== "New" && item.badge !== "" && (
                              <em>{item.badge}</em>
                            )}
                            <ChevronDown size={14} className="exact-admin-nav-chevron" />
                          </button>
                        ) : (
                          <a
                            href={item.href}
                            className={item.screen === screen ? "active" : ""}
                            onClick={closeSidebar}
                          >
                            <Icon size={18} />
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

          <button type="button" className="exact-admin-profile" onClick={onSignOut} title="Sign out">
            <div className="exact-avatar">{initials || "OG"}</div>
            <div>
              <strong>{userName.split(" ")[0] || userName}</strong>
              <span>
                <LogOut size={12} style={{ display: "inline", marginRight: 4 }} />
                Sign out
              </span>
            </div>
          </button>
        </aside>

        <div className="exact-admin-main">
          <header className="exact-admin-topbar">
            <button
              type="button"
              className="exact-admin-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            <label className="admin-top-search">
              <Search size={16} />
              <input
                type="search"
                value={topSearch}
                onChange={(event) => setTopSearch(event.target.value)}
                placeholder="Search rides, riders, or users..."
                aria-label="Search admin console"
              />
            </label>

            <div className="exact-admin-top-actions">
              <button
                type="button"
                className="exact-admin-theme-toggle"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <a href="/notifications" className="exact-admin-notification-btn" title="Alerts" aria-label="Alerts">
                <Bell size={16} />
              </a>
              <div className="exact-admin-top-profile">
                <div className="exact-avatar">{initials || "OG"}</div>
                <div className="exact-admin-topmeta">
                  <strong className="exact-admin-top-user">{userName}</strong>
                  <span>{currentMeta.title}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="exact-admin-scroll">{children}</main>
        </div>
      </div>
    </ImmersivePage>
  );
}
