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
  X,
  Zap,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  Heart,
  Mail,
  Star,
  Award,
  Users2,
  Shield,
  Receipt,
  DollarSign,
  ArrowUpDown,
  Ticket,
  Megaphone,
  LifeBuoy,
  FileCheck,
  ShieldCheck
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
  { label: "Overview", key: "overview" as const },
  { label: "Operations", key: "operations" as const },
  { label: "Finance", key: "finance" as const },
  { label: "Growth", key: "growth" as const },
  { label: "Customer", key: "customer" as const },
  { label: "Safety", key: "safety" as const },
  { label: "Analytics", key: "analytics" as const },
  { label: "Administration", key: "administration" as const }
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
  revenue: "finance.view",
  transactions: "finance.view",
  payouts: "finance.view",
  refunds: "finance.view",
  pricing: "zones.view",
  dynamicPricing: "zones.view",
  promotions: "promotions.view",
  promoManagement: "promotions.view",
  referrals: "promotions.view",
  goPoints: "promotions.view",
  wallet: "finance.view",
  zones: "zones.view",
  supportTickets: "support.view",
  messageTemplates: "support.view",
  sosIncidents: "support.view",
  safetyCenter: "support.view",
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
  admins: "admins.view",
  rolesPermissions: "admins.view"
};

const screenMeta: Record<AdminConsoleScreen, AdminScreenMeta> = {
  dashboard: { eyebrow: "Overview", title: "Dashboard", description: "Platform overview and KPIs", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  liveOperations: { eyebrow: "Overview", title: "Live Operations", description: "Real-time map and activity feed", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  rides: { eyebrow: "Operations", title: "Rides", description: "Manage ride requests and trips", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  deliveries: { eyebrow: "Operations", title: "Deliveries", description: "Manage delivery orders", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  riders: { eyebrow: "Operations", title: "Riders", description: "Manage rider accounts and performance", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderVerification: { eyebrow: "Operations", title: "Verify Riders", description: "Review rider verification submissions", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/documents", quickActionNote: "" },
  riderDocuments: { eyebrow: "Operations", title: "Documents", description: "Rider document management", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  riderPerformance: { eyebrow: "Operations", title: "Performance", description: "Rider performance metrics", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/earnings", quickActionNote: "" },
  riderEarnings: { eyebrow: "Operations", title: "Earnings", description: "Rider earnings breakdown", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderWallet: { eyebrow: "Operations", title: "Wallet", description: "Rider wallet balances", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderPayouts: { eyebrow: "Operations", title: "Payouts", description: "Rider payout requests", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderComplaints: { eyebrow: "Operations", title: "Cases", description: "Rider complaints and cases", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  riderActivity: { eyebrow: "Operations", title: "Live Monitoring", description: "Track rider locations in real-time", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  riderSuspensions: { eyebrow: "Operations", title: "Banned", description: "Suspended rider accounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  passengers: { eyebrow: "Operations", title: "Passengers", description: "Manage passenger accounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  payments: { eyebrow: "Finance", title: "Payments", description: "Payment overview", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  revenue: { eyebrow: "Finance", title: "Revenue", description: "Revenue dashboard and financial overview", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  transactions: { eyebrow: "Finance", title: "Transactions", description: "All wallet transactions and payment history", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  payouts: { eyebrow: "Finance", title: "Payouts", description: "Rider payout requests and processing", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  refunds: { eyebrow: "Finance", title: "Refunds", description: "Review and process passenger refund requests", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  pricing: { eyebrow: "Finance", title: "Pricing", description: "Configure fares, rates, and commissions", searchLabel: "", quickActionLabel: "", quickActionHref: "/pricing", quickActionNote: "" },
  dynamicPricing: { eyebrow: "Finance", title: "Dynamic Pricing", description: "Demand-based surge pricing rules", searchLabel: "", quickActionLabel: "", quickActionHref: "/dynamic-pricing", quickActionNote: "" },
  promotions: { eyebrow: "Growth", title: "Promotions", description: "Promo codes and campaigns", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  promoManagement: { eyebrow: "Growth", title: "Promotions", description: "Manage promo codes and campaigns", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  referrals: { eyebrow: "Growth", title: "Referrals", description: "Referral program analytics and management", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  goPoints: { eyebrow: "Growth", title: "GoPoints", description: "Loyalty points program management", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  wallet: { eyebrow: "Finance", title: "Wallet", description: "Platform wallet balances", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  zones: { eyebrow: "Finance", title: "Zones", description: "Service zone management", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  supportTickets: { eyebrow: "Customer", title: "Support", description: "Customer support tickets", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/complaints", quickActionNote: "" },
  messageTemplates: { eyebrow: "Customer", title: "Message Templates", description: "Reusable notification and message templates", searchLabel: "", quickActionLabel: "", quickActionHref: "/notifications", quickActionNote: "" },
  sosIncidents: { eyebrow: "Safety", title: "Incidents", description: "SOS incident reports and management", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  safetyCenter: { eyebrow: "Safety", title: "Safety Center", description: "Safety overview, escalation rules, and incident metrics", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  escalationRules: { eyebrow: "Safety", title: "Escalation", description: "Escalation rule configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  analytics: { eyebrow: "Analytics", title: "Analytics", description: "Platform analytics and insights", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports", quickActionNote: "" },
  notifications: { eyebrow: "Customer", title: "Notifications", description: "Scheduled broadcasts and alerts", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  reports: { eyebrow: "Analytics", title: "Reports", description: "Generated reports and exports", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  auditLogs: { eyebrow: "Administration", title: "Audit Logs", description: "Admin activity audit trail", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  settings: { eyebrow: "Administration", title: "Settings", description: "Platform configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  companyProfile: { eyebrow: "Administration", title: "Company Profile", description: "Company information", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  accountSecurity: { eyebrow: "Administration", title: "Account & Security", description: "Security settings", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  notificationSettings: { eyebrow: "Administration", title: "Notifications", description: "Alert configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/notifications", quickActionNote: "" },
  paymentMethods: { eyebrow: "Administration", title: "Payment Methods", description: "Payment gateway configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  integrations: { eyebrow: "Administration", title: "Integrations", description: "Third-party integrations", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  taxesCompliance: { eyebrow: "Administration", title: "Taxes & Compliance", description: "Tax configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  settingsNotifications: { eyebrow: "Administration", title: "Alert Settings", description: "Notification alert configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  admins: { eyebrow: "Administration", title: "Admin Users", description: "Manage admin accounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  rolesPermissions: { eyebrow: "Administration", title: "Roles & Permissions", description: "Manage admin roles and permission matrix", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  ratings: { eyebrow: "Operations", title: "Ratings", description: "Passenger and rider ratings", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" }
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
      // ── Overview ──
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "overview",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      {
        label: "Live Operations",
        href: "/live-operations",
        icon: Activity,
        screen: "liveOperations",
        group: "overview",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      // ── Operations ──
      {
        label: "Rides",
        href: "/requests",
        icon: Bike,
        screen: "rides",
        group: "operations",
        hint: "",
        badge: `${badgeData.completedTripsCount}`
      },
      {
        label: "Deliveries",
        href: "/deliveries",
        icon: Package,
        screen: "deliveries",
        group: "operations",
        hint: "",
        badge: `${badgeData.deliveriesCount}`
      },
      {
        label: "Riders",
        href: "/riders",
        icon: User,
        screen: "riders",
        group: "operations",
        hint: "",
        badge: `${badgeData.activeRidersCount}`,
        children: [
          { label: "All Riders", href: "/riders", screen: "riders", badge: `${badgeData.ridersCount}` },
          { label: "Verify", href: "/riders/verification", screen: "riderVerification", badge: `${badgeData.riderVerificationPending + badgeData.riderVerificationUnderReview}` },
          { label: "Documents", href: "/riders/documents", screen: "riderDocuments", badge: `${badgeData.riderDocumentMissing}` },
          { label: "Stats", href: "/riders/performance", screen: "riderPerformance", badge: `${badgeData.completedTripsCount}` },
          { label: "Earnings", href: "/riders/earnings", screen: "riderEarnings", badge: `${badgeData.topRiderPerformanceEarningsCount}` },
          { label: "Wallet", href: "/riders/wallet", screen: "riderWallet", badge: `${badgeData.riderWalletTransactionsCount}` },
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
        group: "operations",
        hint: "",
        badge: `${badgeData.passengersCount}`
      },
      // ── Finance ──
      {
        label: "Revenue",
        href: "/finance",
        icon: DollarSign,
        screen: "revenue",
        group: "finance",
        hint: "",
        badge: `${badgeData.pendingPayoutRequestsCount}`,
        children: [
          { label: "Overview", href: "/finance", screen: "revenue" },
          { label: "Pricing", href: "/pricing", screen: "pricing", badge: `${badgeData.zonesActiveCount}` },
          { label: "Dynamic Pricing", href: "/dynamic-pricing", screen: "dynamicPricing" }
        ]
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ArrowUpDown,
        screen: "transactions",
        group: "finance",
        hint: ""
      },
      {
        label: "Payouts",
        href: "/payouts",
        icon: Receipt,
        screen: "payouts",
        group: "finance",
        hint: "",
        badge: `${badgeData.riderPayoutRequestedCount}`
      },
      {
        label: "Refunds",
        href: "/refunds",
        icon: RotateCcw,
        screen: "refunds",
        group: "finance",
        hint: "",
        badge: `${badgeData.pendingPayoutRequestsCount}`
      },
      {
        label: "Wallet",
        href: "/wallet",
        icon: Wallet,
        screen: "wallet",
        group: "finance",
        hint: ""
      },
      // ── Growth ──
      {
        label: "Promotions",
        href: "/promotions",
        icon: Tag,
        screen: "promotions",
        group: "growth",
        hint: "",
        badge: `${badgeData.promoAdjustedTripsCount}`
      },
      {
        label: "Referrals",
        href: "/referrals",
        icon: Users2,
        screen: "referrals",
        group: "growth",
        hint: ""
      },
      {
        label: "GoPoints",
        href: "/go-points",
        icon: Award,
        screen: "goPoints",
        group: "growth",
        hint: ""
      },
      // ── Customer ──
      {
        label: "Support",
        href: "/support-tickets",
        icon: Headphones,
        screen: "supportTickets",
        group: "customer",
        hint: "",
        badge: `${badgeData.openSupportTicketsCount}`
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Megaphone,
        screen: "notifications",
        group: "customer",
        hint: ""
      },
      {
        label: "Message Templates",
        href: "/message-templates",
        icon: Mail,
        screen: "messageTemplates",
        group: "customer",
        hint: ""
      },
      // ── Safety ──
      {
        label: "Incidents",
        href: "/incidents",
        icon: AlertTriangle,
        screen: "sosIncidents",
        group: "safety",
        hint: ""
      },
      {
        label: "Safety Center",
        href: "/safety-center",
        icon: ShieldCheck,
        screen: "safetyCenter",
        group: "safety",
        hint: ""
      },
      // ── Analytics ──
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        screen: "analytics",
        group: "analytics",
        hint: ""
      },
      {
        label: "Reports",
        href: "/reports",
        icon: FileText,
        screen: "reports",
        group: "analytics",
        hint: ""
      },
      // ── Administration ──
      {
        label: "Admin Users",
        href: "/admins",
        icon: Shield,
        screen: "admins",
        group: "administration",
        hint: ""
      },
      {
        label: "Roles & Permissions",
        href: "/roles-permissions",
        icon: ShieldCheck,
        screen: "rolesPermissions",
        group: "administration",
        hint: ""
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ClipboardList,
        screen: "auditLogs",
        group: "administration",
        hint: ""
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        screen: "settings",
        group: "administration",
        hint: "",
        children: [
          { label: "General", href: "/settings", screen: "settings" },
          { label: "Company Profile", href: "/settings/company", screen: "companyProfile" },
          { label: "Account & Security", href: "/settings/security", screen: "accountSecurity" },
          { label: "Notifications", href: "/settings/notifications", screen: "notificationSettings" },
          { label: "Payment Methods", href: "/payment-methods", screen: "paymentMethods" },
          { label: "Taxes", href: "/taxes-compliance", screen: "taxesCompliance" },
          { label: "Integrations", href: "/integrations", screen: "integrations" }
        ]
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
