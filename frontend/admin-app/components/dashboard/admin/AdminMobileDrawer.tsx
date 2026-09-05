"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Activity,
  Bike,
  Package,
  User,
  Users,
  Banknote,
  ArrowUpDown,
  Receipt,
  RotateCcw,
  Wallet,
  Tag,
  Users2,
  Award,
  Headphones,
  Megaphone,
  Mail,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ClipboardList,
  Settings,
  Star,
  Zap,
  Sparkles,
  UserX
} from "lucide-react";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import { BrandMark } from "@/components/brand/BrandMark";
import type { AdminConsoleScreen } from "./types";
import { hasScreenAccess } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";

export type AdminMobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: AdminConsoleScreen;
  currentUser?: SessionUser | null;
  userName: string;
  onSignOut: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  badgeData: {
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

type MobileDrawerItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  screen: AdminConsoleScreen;
  group: string;
  badge?: string;
  badgeTone?: "default" | "danger" | "warning";
};

export function AdminMobileDrawer({
  isOpen,
  onClose,
  currentScreen,
  currentUser,
  userName,
  onSignOut,
  theme,
  onToggleTheme,
  badgeData
}: AdminMobileDrawerProps) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const allNavItems: MobileDrawerItem[] = useMemo(
    () => [
      // ── Overview ──
      { label: "Dashboard", href: "/", icon: LayoutDashboard, screen: "dashboard", group: "overview" },
      { label: "Live Operations", href: "/live-operations", icon: Activity, screen: "liveOperations", group: "overview", badge: `${badgeData.activeTripsCount}` },

      // ── Operations ──
      { label: "Rides", href: "/requests", icon: Bike, screen: "rides", group: "operations", badge: `${badgeData.completedTripsCount}` },
      { label: "Deliveries", href: "/deliveries", icon: Package, screen: "deliveries", group: "operations", badge: `${badgeData.deliveriesCount}` },
      { label: "Riders Fleet", href: "/riders", icon: User, screen: "riders", group: "operations", badge: `${badgeData.activeRidersCount}` },
      { label: "Verify Riders", href: "/riders/verification", icon: ShieldCheck, screen: "riderVerification", group: "operations", badge: `${badgeData.riderVerificationPending}`, badgeTone: "warning" },
      { label: "Rider Documents", href: "/riders/documents", icon: ClipboardList, screen: "riderDocuments", group: "operations", badge: `${badgeData.riderDocumentMissing}` },
      { label: "Rider Performance", href: "/riders/performance", icon: Star, screen: "riderPerformance", group: "operations" },
      { label: "Rider Earnings", href: "/riders/earnings", icon: Banknote, screen: "riderEarnings", group: "operations" },
      { label: "Rider Wallets", href: "/riders/wallet", icon: Wallet, screen: "riderWallet", group: "operations" },
      { label: "Rider Live Map", href: "/riders/activity-tracking", icon: Activity, screen: "riderActivity", group: "operations", badge: `${badgeData.ridersWithCoordsCount}` },
      { label: "Passengers", href: "/users", icon: Users, screen: "passengers", group: "operations", badge: `${badgeData.passengersCount}` },
      { label: "Ratings & Reviews", href: "/ratings", icon: Star, screen: "ratings", group: "operations", badge: `${badgeData.ratingsCount}` },

      // ── Finance ──
      { label: "Revenue Overview", href: "/finance", icon: Banknote, screen: "revenue", group: "finance" },
      { label: "Transactions", href: "/transactions", icon: ArrowUpDown, screen: "transactions", group: "finance" },
      { label: "Payout Requests", href: "/payouts", icon: Receipt, screen: "payouts", group: "finance", badge: `${badgeData.riderPayoutRequestedCount}`, badgeTone: "warning" },
      { label: "Refunds", href: "/refunds", icon: RotateCcw, screen: "refunds", group: "finance" },
      { label: "Base Pricing", href: "/pricing", icon: Banknote, screen: "pricing", group: "finance" },
      { label: "Dynamic Surge Pricing", href: "/dynamic-pricing", icon: Zap, screen: "dynamicPricing", group: "finance" },
      { label: "Taxes & Compliance", href: "/taxes-compliance", icon: ShieldCheck, screen: "taxesCompliance", group: "finance" },
      { label: "Platform Wallet", href: "/wallet", icon: Wallet, screen: "wallet", group: "finance" },

      // ── Growth ──
      { label: "Promotions & Codes", href: "/promotions", icon: Tag, screen: "promotions", group: "growth", badge: `${badgeData.promoAdjustedTripsCount}` },
      { label: "Referral Program", href: "/referrals", icon: Users2, screen: "referrals", group: "growth" },
      { label: "GoPoints Loyalty", href: "/go-points", icon: Award, screen: "goPoints", group: "growth" },

      // ── Customer ──
      { label: "Support Tickets", href: "/support-tickets", icon: Headphones, screen: "supportTickets", group: "customer", badge: `${badgeData.openSupportTicketsCount}` },
      { label: "Notifications & Broadcasts", href: "/notifications", icon: Megaphone, screen: "notifications", group: "customer" },
      { label: "Message Templates", href: "/message-templates", icon: Mail, screen: "messageTemplates", group: "customer" },

      // ── Safety ──
      { label: "SOS Incidents", href: "/incidents", icon: AlertTriangle, screen: "sosIncidents", group: "safety", badge: `${badgeData.openSosCount}`, badgeTone: "danger" },
      { label: "Safety Center", href: "/safety-center", icon: Shield, screen: "safetyCenter", group: "safety" },

      // ── Analytics ──
      { label: "Analytics & Trends", href: "/analytics", icon: Activity, screen: "analytics", group: "analytics" },
      { label: "Export Reports", href: "/reports", icon: FileText, screen: "reports", group: "analytics" },

      // ── Administration ──
      { label: "Admin Staff", href: "/admins", icon: Shield, screen: "admins", group: "administration", badge: `${badgeData.adminAccountsCount}` },
      { label: "Roles & Permissions", href: "/roles-permissions", icon: ShieldCheck, screen: "rolesPermissions", group: "administration" },
      { label: "Audit Trail", href: "/audit-logs", icon: ClipboardList, screen: "auditLogs", group: "administration" },
      { label: "Unauthorized Users", href: "/unauthorized-users", icon: UserX, screen: "unauthorizedUsers", group: "administration", badgeTone: "danger" },
      { label: "Company Profile", href: "/settings/company", icon: Settings, screen: "companyProfile", group: "administration" },
      { label: "Account Security", href: "/settings/security", screen: "accountSecurity", icon: Shield, group: "administration" },
      { label: "Integrations & API", href: "/integrations", screen: "integrations", icon: Settings, group: "administration" }
    ],
    [badgeData]
  );

  // Filter based on user permissions
  const permittedItems = useMemo(() => {
    return allNavItems.filter((item) => hasScreenAccess(currentUser, item.screen));
  }, [allNavItems, currentUser]);

  // Filter based on category pill & search query
  const filteredItems = useMemo(() => {
    let list = permittedItems;
    if (selectedGroup !== "all") {
      list = list.filter((item) => item.group === selectedGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
      );
    }
    return list;
  }, [permittedItems, selectedGroup, search]);

  // Permitted group tabs
  const availableGroups = useMemo(() => {
    const presentGroupKeys = new Set(permittedItems.map((item) => item.group));
    return navGroups.filter((g) => presentGroupKeys.has(g.key));
  }, [permittedItems]);

  if (!isOpen) return null;

  return (
    <div className="exact-admin-mobile-drawer-backdrop" onClick={onClose}>
      <div
        className="exact-admin-mobile-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Admin Navigation Menu"
      >
        {/* Drawer Drag Handle */}
        <div className="exact-admin-mobile-drawer-handle" />

        {/* Drawer Header */}
        <div className="exact-admin-mobile-drawer-header">
          <div className="exact-admin-mobile-drawer-user">
            <div className="exact-avatar">{initials || "OG"}</div>
            <div>
              <strong>{userName}</strong>
              <span className="exact-admin-mobile-role-pill">
                {currentUser?.adminTitle || (currentUser?.role === "admin" ? "Administrator" : "Staff")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="exact-admin-drawer-theme-btn"
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              type="button"
              className="exact-admin-mobile-drawer-close"
              onClick={onClose}
              aria-label="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="exact-admin-mobile-drawer-search">
          <Search size={15} color="var(--muted-foreground, #94a3b8)" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu (Rides, Payouts, Promos...)"
            autoFocus={false}
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} className="search-clear-btn" aria-label="Clear Search">
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="exact-admin-mobile-category-chips">
          <button
            type="button"
            className={`exact-admin-mobile-chip ${selectedGroup === "all" ? "active" : ""}`}
            onClick={() => setSelectedGroup("all")}
          >
            All
          </button>
          {availableGroups.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`exact-admin-mobile-chip ${selectedGroup === g.key ? "active" : ""}`}
              onClick={() => setSelectedGroup(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Navigation Groups List */}
        <div className="exact-admin-mobile-drawer-body">
          {navGroups.map((group) => {
            const groupItems = filteredItems.filter((item) => item.group === group.key);
            if (groupItems.length === 0) return null;

            return (
              <div key={group.key} className="exact-admin-mobile-group">
                <span className="exact-admin-mobile-group-title">{group.label}</span>
                <div className="exact-admin-mobile-group-items">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.screen === currentScreen;

                    return (
                      <a
                        key={item.screen}
                        href={item.href}
                        className={`exact-admin-mobile-link ${isActive ? "active" : ""}`}
                        onClick={onClose}
                      >
                        <div className="exact-admin-mobile-link-left">
                          <div className={`exact-admin-mobile-link-icon ${isActive ? "active" : ""}`}>
                            <Icon size={18} />
                          </div>
                          <span className="exact-admin-mobile-link-text">{item.label}</span>
                        </div>
                        <div className="exact-admin-mobile-link-right">
                          {item.badge && item.badge !== "0" && item.badge !== "" ? (
                            <span
                              className={`exact-admin-mobile-badge ${item.badgeTone ? `tone-${item.badgeTone}` : ""}`}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                          <ChevronRight size={15} className="chevron" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="exact-admin-mobile-empty">
              <p>No matching sections found for "{search}"</p>
            </div>
          )}
        </div>

        {/* Drawer Footer with Sign Out */}
        <div className="exact-admin-mobile-drawer-footer">
          <button
            type="button"
            className="exact-admin-mobile-signout-btn"
            onClick={() => {
              onClose();
              onSignOut();
            }}
          >
            <LogOut size={16} /> Sign out from Admin Console
          </button>
        </div>
      </div>
    </div>
  );
}
