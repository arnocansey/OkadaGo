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
  Banknote,
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
import { hasScreenAccess } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";
import { AdminBottomNav } from "./AdminBottomNav";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { useTheme } from "@/components/providers/theme-provider";

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
  currentUser?: SessionUser | null;
  adminRoleEntries?: [string, string[]][];
  children: React.ReactNode;
};

const navGroups = [
  { label: "Operations", key: "main" as const },
  { label: "Finance & Accounts", key: "finance" as const },
  { label: "Growth & Engagement", key: "growth" as const },
  { label: "Communications", key: "communication" as const },
  { label: "Intelligence", key: "analytics" as const },
  { label: "Administration", key: "admin" as const }
];

const screenMeta: Record<AdminConsoleScreen, AdminScreenMeta> = {
  dashboard: { eyebrow: "Overview", title: "Dashboard", description: "Platform overview and real-time KPIs", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  liveOperations: { eyebrow: "Operations", title: "Active Rides", description: "Real-time fleet tracking & live dispatch map", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  rides: { eyebrow: "Operations", title: "Ride Requests", description: "Manage ride bookings and trip status", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  deliveries: { eyebrow: "Operations", title: "Deliveries", description: "Manage package delivery orders", searchLabel: "", quickActionLabel: "", quickActionHref: "/requests", quickActionNote: "" },
  riders: { eyebrow: "Fleet", title: "Riders", description: "Manage rider accounts, performance & safety", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderVerification: { eyebrow: "Fleet", title: "Verify Riders", description: "Review rider onboarding verification submissions", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/documents", quickActionNote: "" },
  riderDocuments: { eyebrow: "Fleet", title: "Documents", description: "Driver license, insurance & roadworthiness", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  riderPerformance: { eyebrow: "Fleet", title: "Performance", description: "Rider acceptance rate, completion & ratings", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/earnings", quickActionNote: "" },
  riderEarnings: { eyebrow: "Fleet", title: "Earnings", description: "Rider weekly earnings breakdown", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderWallet: { eyebrow: "Fleet", title: "Rider Wallet", description: "Individual rider balance statements", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/payouts", quickActionNote: "" },
  riderPayouts: { eyebrow: "Finance", title: "Payouts", description: "Rider withdrawal requests and settlements", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderComplaints: { eyebrow: "Fleet", title: "Cases & Complaints", description: "Rider disputes and complaints", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  riderActivity: { eyebrow: "Fleet", title: "Live Monitoring", description: "Track real-time rider GPS positions", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders", quickActionNote: "" },
  riderSuspensions: { eyebrow: "Fleet", title: "Suspensions", description: "Suspended & restricted rider accounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/verification", quickActionNote: "" },
  passengers: { eyebrow: "Community", title: "Passengers", description: "Manage passenger accounts & activity", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  payments: { eyebrow: "Finance", title: "Payments", description: "Payment processing overview", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports-analytics", quickActionNote: "" },
  revenue: { eyebrow: "Finance", title: "Finance Operations", description: "Cash collections, commissions & revenue", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  transactions: { eyebrow: "Finance", title: "Transactions", description: "Wallet transactions and payment logs", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  payouts: { eyebrow: "Finance", title: "Payouts", description: "Rider withdrawal requests and settlements", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  refunds: { eyebrow: "Finance", title: "Refunds", description: "Review and process passenger refund claims", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  pricing: { eyebrow: "Finance", title: "Pricing & Fares", description: "Base fares, per-km rates, and commission %", searchLabel: "", quickActionLabel: "", quickActionHref: "/pricing", quickActionNote: "" },
  dynamicPricing: { eyebrow: "Finance", title: "Dynamic Pricing", description: "Demand-based surge multipliers and rules", searchLabel: "", quickActionLabel: "", quickActionHref: "/dynamic-pricing", quickActionNote: "" },
  promotions: { eyebrow: "Growth", title: "Promotions", description: "Promo codes, campaigns & discounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  promoManagement: { eyebrow: "Growth", title: "Promotions", description: "Manage promo campaigns", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  referrals: { eyebrow: "Growth", title: "Referrals", description: "Referral reward program analytics", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  goPoints: { eyebrow: "Growth", title: "GoPoints", description: "Loyalty points & redemptions", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  wallet: { eyebrow: "Finance", title: "Platform Wallet", description: "Platform reserve and escrow accounts", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  zones: { eyebrow: "Operations", title: "Service Zones", description: "Operational zone boundaries & geofences", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  supportTickets: { eyebrow: "Customer", title: "Support Tickets", description: "Customer care requests & inquiries", searchLabel: "", quickActionLabel: "", quickActionHref: "/riders/complaints", quickActionNote: "" },
  messageTemplates: { eyebrow: "Customer", title: "Message Templates", description: "SMS, push & automated notification copy", searchLabel: "", quickActionLabel: "", quickActionHref: "/notifications", quickActionNote: "" },
  sosIncidents: { eyebrow: "Safety", title: "SOS Incidents", description: "Emergency alerts and safety escalations", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  safetyCenter: { eyebrow: "Safety", title: "Safety Center", description: "Incident management & escalation policies", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  escalationRules: { eyebrow: "Safety", title: "Escalations", description: "Automated trigger thresholds and rules", searchLabel: "", quickActionLabel: "", quickActionHref: "/support-tickets", quickActionNote: "" },
  analytics: { eyebrow: "Intelligence", title: "Analytics", description: "Fleet metrics, revenue trends & insights", searchLabel: "", quickActionLabel: "", quickActionHref: "/reports", quickActionNote: "" },
  notifications: { eyebrow: "Customer", title: "Notifications", description: "Broadcast messages & scheduled alerts", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  reports: { eyebrow: "Intelligence", title: "Reports", description: "Exportable operational and tax audits", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  auditLogs: { eyebrow: "Governance", title: "Audit Logs", description: "Administrative actions and immutable log", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  settings: { eyebrow: "Settings", title: "Settings", description: "Platform rules, credentials & preferences", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  companyProfile: { eyebrow: "Settings", title: "Company Profile", description: "Organization legal and contact info", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  accountSecurity: { eyebrow: "Settings", title: "Account & Security", description: "Authentication, 2FA, and session policies", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  notificationSettings: { eyebrow: "Settings", title: "Notifications", description: "Alert thresholds and recipient lists", searchLabel: "", quickActionLabel: "", quickActionHref: "/notifications", quickActionNote: "" },
  paymentMethods: { eyebrow: "Settings", title: "Payment Methods", description: "MoMo, card & cash gateway setup", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  integrations: { eyebrow: "Settings", title: "Integrations", description: "Webhooks, SMS APIs & third-party tools", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  taxesCompliance: { eyebrow: "Settings", title: "Taxes & Compliance", description: "Withholding tax and regulatory filings", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  settingsNotifications: { eyebrow: "Settings", title: "Alert Settings", description: "Internal operations notification routing", searchLabel: "", quickActionLabel: "", quickActionHref: "/promotions", quickActionNote: "" },
  admins: { eyebrow: "Governance", title: "Admin Users", description: "Administrative accounts & staff access", searchLabel: "", quickActionLabel: "", quickActionHref: "/settings", quickActionNote: "" },
  rolesPermissions: { eyebrow: "Governance", title: "Roles & Permissions", description: "RBAC privilege matrix configuration", searchLabel: "", quickActionLabel: "", quickActionHref: "/admins", quickActionNote: "" },
  ratings: { eyebrow: "Operations", title: "Ratings & Reviews", description: "Customer satisfaction and driver feedback", searchLabel: "", quickActionLabel: "", quickActionHref: "/finance", quickActionNote: "" },
  riderAssignment: { eyebrow: "Operations", title: "Rider Assignment", description: "Manual and automated dispatch console", searchLabel: "", quickActionLabel: "", quickActionHref: "/rider-assignment", quickActionNote: "" }
};

export function AdminShell({
  screen,
  onSignOut,
  badgeData,
  screenHighlights,
  dashboardToday,
  userName,
  currentUser,
  adminRoleEntries = [],
  children
}: AdminShellProps) {
  void screenHighlights;
  void dashboardToday;
  void adminRoleEntries;
  const { theme, toggleTheme, isDark } = useTheme();
  const [expandedNavSections, setExpandedNavSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [topSearch, setTopSearch] = useState("");

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
    }
  }, []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const navItems: AdminNavItem[] = useMemo(() => {
    const allItems: AdminNavItem[] = [
      // 1. Dashboard
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        screen: "dashboard",
        group: "main",
        hint: "",
        badge: `${badgeData.activeTripsCount}`
      },
      // 2. Ride Requests
      {
        label: "Ride Requests",
        href: "/requests",
        icon: Bike,
        screen: "rides",
        group: "main",
        hint: "",
        badge: `${badgeData.completedTripsCount}`,
        children: [
          { label: "All Rides", href: "/requests", screen: "rides" },
          { label: "Deliveries", href: "/deliveries", screen: "deliveries", badge: `${badgeData.deliveriesCount}` }
        ]
      },
      // 3. Active Rides
      {
        label: "Active Rides",
        href: "/live-operations",
        icon: Activity,
        screen: "liveOperations",
        group: "main",
        hint: "",
        badge: `${badgeData.activeTripsCount}`,
        children: [
          { label: "Live Fleet", href: "/live-operations", screen: "liveOperations" },
          { label: "Rider Dispatch", href: "/rider-assignment", screen: "riderAssignment" }
        ]
      },
      // 4. Riders
      {
        label: "Riders",
        href: "/riders",
        icon: User,
        screen: "riders",
        group: "main",
        hint: "",
        badge: `${badgeData.activeRidersCount}`,
        children: [
          { label: "All Riders", href: "/riders", screen: "riders", badge: `${badgeData.ridersCount}` },
          { label: "Verify Onboarding", href: "/riders/verification", screen: "riderVerification", badge: `${badgeData.riderVerificationPending + badgeData.riderVerificationUnderReview}` },
          { label: "Documents", href: "/riders/documents", screen: "riderDocuments", badge: `${badgeData.riderDocumentMissing}` },
          { label: "Performance", href: "/riders/performance", screen: "riderPerformance" },
          { label: "Earnings", href: "/riders/earnings", screen: "riderEarnings" },
          { label: "Wallet Statements", href: "/riders/wallet", screen: "riderWallet" },
          { label: "Cases & Complaints", href: "/riders/complaints", screen: "riderComplaints" },
          { label: "Live GPS Tracking", href: "/riders/activity-tracking", screen: "riderActivity" },
          { label: "Suspended", href: "/riders/suspensions", screen: "riderSuspensions", badge: `${badgeData.suspendedRidersCount}` }
        ]
      },
      // 5. Passengers
      {
        label: "Passengers",
        href: "/users",
        icon: Users,
        screen: "passengers",
        group: "main",
        hint: "",
        badge: `${badgeData.passengersCount}`
      },
      // 6. Payments
      {
        label: "Payments",
        href: "/transactions",
        icon: CreditCard,
        screen: "transactions",
        group: "finance",
        hint: "",
        children: [
          { label: "Transactions", href: "/transactions", screen: "transactions" },
          { label: "Refunds", href: "/refunds", screen: "refunds", badge: `${badgeData.pendingPayoutRequestsCount}` }
        ]
      },
      // 7. Finance
      {
        label: "Finance",
        href: "/finance",
        icon: Banknote,
        screen: "revenue",
        group: "finance",
        hint: "",
        badge: `${badgeData.pendingPayoutRequestsCount}`,
        children: [
          { label: "Operations Center", href: "/finance", screen: "revenue" },
          { label: "Pricing & Rates", href: "/pricing", screen: "pricing", badge: `${badgeData.zonesActiveCount}` },
          { label: "Dynamic Surge", href: "/dynamic-pricing", screen: "dynamicPricing" },
          { label: "Platform Wallet", href: "/wallet", screen: "wallet" }
        ]
      },
      // 8. Payouts
      {
        label: "Payouts",
        href: "/payouts",
        icon: Receipt,
        screen: "payouts",
        group: "finance",
        hint: "",
        badge: `${badgeData.riderPayoutRequestedCount}`
      },
      // 9. Promotions
      {
        label: "Promotions",
        href: "/promotions",
        icon: Tag,
        screen: "promotions",
        group: "growth",
        hint: "",
        badge: `${badgeData.promoAdjustedTripsCount}`,
        children: [
          { label: "Promo Codes", href: "/promotions", screen: "promotions" },
          { label: "Referrals", href: "/referrals", screen: "referrals" },
          { label: "GoPoints", href: "/go-points", screen: "goPoints" }
        ]
      },
      // 10. Notifications
      {
        label: "Notifications",
        href: "/notifications",
        icon: Megaphone,
        screen: "notifications",
        group: "communication",
        hint: "",
        children: [
          { label: "Broadcasts", href: "/notifications", screen: "notifications" },
          { label: "Message Templates", href: "/message-templates", screen: "messageTemplates" },
          { label: "Support Tickets", href: "/support-tickets", screen: "supportTickets", badge: `${badgeData.openSupportTicketsCount}` }
        ]
      },
      // 11. Reports & Analytics
      {
        label: "Reports & Analytics",
        href: "/analytics",
        icon: BarChart3,
        screen: "analytics",
        group: "analytics",
        hint: "",
        children: [
          { label: "Analytics", href: "/analytics", screen: "analytics" },
          { label: "Reports Center", href: "/reports", screen: "reports" },
          { label: "Safety Center", href: "/safety-center", screen: "safetyCenter" },
          { label: "SOS Incidents", href: "/incidents", screen: "sosIncidents", badge: `${badgeData.openSosCount}` }
        ]
      },
      // 12. Settings
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        screen: "settings",
        group: "admin",
        hint: "",
        children: [
          { label: "General", href: "/settings", screen: "settings" },
          { label: "Company Profile", href: "/settings/company", screen: "companyProfile" },
          { label: "Account & Security", href: "/settings/security", screen: "accountSecurity" },
          { label: "Notification Alerts", href: "/settings/notifications", screen: "notificationSettings" },
          { label: "Payment Gateways", href: "/payment-methods", screen: "paymentMethods" },
          { label: "Taxes & Compliance", href: "/taxes-compliance", screen: "taxesCompliance" },
          { label: "Integrations", href: "/integrations", screen: "integrations" }
        ]
      },
      // 13. Audit Logs
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ClipboardList,
        screen: "auditLogs",
        group: "admin",
        hint: "",
        children: [
          { label: "Audit Trail", href: "/audit-logs", screen: "auditLogs" },
          { label: "Admin Users", href: "/admins", screen: "admins", badge: `${badgeData.adminAccountsCount}` },
          { label: "Roles & Permissions", href: "/roles-permissions", screen: "rolesPermissions" }
        ]
      }
    ];

    return allItems
      .map((item) => {
        const screenAllowed = hasScreenAccess(currentUser, item.screen);
        const filteredChildren = item.children?.filter((child) =>
          hasScreenAccess(currentUser, child.screen)
        );

        if (!screenAllowed && (!filteredChildren || filteredChildren.length === 0)) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined
        };
      })
      .filter(Boolean) as AdminNavItem[];
  }, [badgeData, currentUser]);

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

      {/* ─── Mobile Slide-up Drawer Menu ─────────────────────── */}
      <AdminMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentScreen={screen}
        currentUser={currentUser}
        userName={userName}
        onSignOut={onSignOut}
        theme={theme}
        onToggleTheme={toggleTheme}
        badgeData={badgeData}
      />

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
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName.split(" ")[0] || userName}
              </strong>
              <span style={{ display: "block", fontSize: 11, color: "var(--primary, #f59e0b)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.adminTitle || (currentUser?.role === "admin" ? "Administrator" : currentUser?.role || "Staff")}
              </span>
            </div>
            <LogOut size={14} style={{ opacity: 0.6, flexShrink: 0, marginLeft: 4 }} />
          </button>
        </aside>

        <div className="exact-admin-main">
          <header className="exact-admin-topbar">
            <button
              type="button"
              className="exact-admin-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>

            <div className="exact-admin-mobile-header-meta">
              <span className="exact-admin-mobile-screen-title">{currentMeta.title}</span>
            </div>

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
                {(badgeData.openSosCount > 0 || badgeData.openSupportTicketsCount > 0) && (
                  <span className="exact-admin-top-notification-dot" />
                )}
              </a>
              <button
                type="button"
                className="exact-admin-top-profile"
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth <= 1024) {
                    setMobileDrawerOpen(true);
                  }
                }}
                title={userName}
              >
                <div className="exact-avatar">{initials || "OG"}</div>
                <div className="exact-admin-topmeta">
                  <strong className="exact-admin-top-user">{userName}</strong>
                  <span>{currentMeta.title}</span>
                </div>
              </button>
            </div>
          </header>

          <main className="exact-admin-scroll">{children}</main>

          {/* ─── Mobile Bottom Navigation Bar ────────────────── */}
          <AdminBottomNav
            currentScreen={screen}
            currentUser={currentUser}
            badgeData={{
              activeTripsCount: badgeData.activeTripsCount,
              pendingPayoutRequestsCount: badgeData.pendingPayoutRequestsCount,
              openSupportTicketsCount: badgeData.openSupportTicketsCount,
              openSosCount: badgeData.openSosCount
            }}
            onOpenMoreMenu={() => setMobileDrawerOpen(true)}
            isMoreMenuOpen={mobileDrawerOpen}
          />
        </div>
      </div>
    </ImmersivePage>
  );
}
