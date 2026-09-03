"use client";

import { useMemo } from "react";
import {
  LayoutDashboard,
  Activity,
  Banknote,
  ShieldAlert,
  Headphones,
  Menu,
  Sparkles,
  Users,
  Grid
} from "lucide-react";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import type { AdminConsoleScreen } from "./types";
import { hasScreenAccess } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";

export type AdminBottomNavProps = {
  currentScreen: AdminConsoleScreen;
  currentUser?: SessionUser | null;
  badgeData: {
    activeTripsCount: number;
    pendingPayoutRequestsCount: number;
    openSupportTicketsCount: number;
    openSosCount: number;
  };
  onOpenMoreMenu: () => void;
  isMoreMenuOpen?: boolean;
};

type BottomTabItem = {
  id: string;
  label: string;
  href: string;
  screen?: AdminConsoleScreen;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: number | string;
  badgeTone?: "default" | "danger" | "warning";
  isAction?: boolean;
  onClick?: () => void;
};

export function AdminBottomNav({
  currentScreen,
  currentUser,
  badgeData,
  onOpenMoreMenu,
  isMoreMenuOpen = false
}: AdminBottomNavProps) {
  const tabs = useMemo(() => {
    const list: BottomTabItem[] = [];

    // 1. Dashboard / Overview
    list.push({
      id: "dashboard",
      label: "Overview",
      href: "/",
      screen: "dashboard",
      icon: LayoutDashboard
    });

    // 2. Operations / Live Trips
    if (hasScreenAccess(currentUser, "liveOperations") || hasScreenAccess(currentUser, "rides")) {
      list.push({
        id: "operations",
        label: "Live Ops",
        href: "/live-operations",
        screen: "liveOperations",
        icon: Activity,
        badge: badgeData.activeTripsCount > 0 ? badgeData.activeTripsCount : undefined
      });
    }

    // 3. Finance / Payouts
    if (hasScreenAccess(currentUser, "revenue") || hasScreenAccess(currentUser, "payouts") || hasScreenAccess(currentUser, "transactions")) {
      list.push({
        id: "finance",
        label: "Finance",
        href: "/finance",
        screen: "revenue",
        icon: Banknote,
        badge: badgeData.pendingPayoutRequestsCount > 0 ? badgeData.pendingPayoutRequestsCount : undefined,
        badgeTone: "warning"
      });
    }

    // 4. Safety / Support / Customers
    if (hasScreenAccess(currentUser, "sosIncidents") || hasScreenAccess(currentUser, "safetyCenter")) {
      const sosCount = badgeData.openSosCount;
      list.push({
        id: "safety",
        label: "Safety",
        href: "/incidents",
        screen: "sosIncidents",
        icon: ShieldAlert,
        badge: sosCount > 0 ? sosCount : undefined,
        badgeTone: "danger"
      });
    } else if (hasScreenAccess(currentUser, "supportTickets")) {
      list.push({
        id: "support",
        label: "Support",
        href: "/support-tickets",
        screen: "supportTickets",
        icon: Headphones,
        badge: badgeData.openSupportTicketsCount > 0 ? badgeData.openSupportTicketsCount : undefined
      });
    } else if (hasScreenAccess(currentUser, "passengers") || hasScreenAccess(currentUser, "riders")) {
      list.push({
        id: "users",
        label: "Users",
        href: "/riders",
        screen: "riders",
        icon: Users
      });
    }

    // 5. More / Full Menu button
    list.push({
      id: "more",
      label: "More",
      href: "#",
      icon: Grid,
      isAction: true,
      onClick: onOpenMoreMenu
    });

    return list;
  }, [currentUser, badgeData, onOpenMoreMenu]);

  return (
    <nav className="exact-admin-bottom-nav" aria-label="Mobile Navigation">
      <div className="exact-admin-bottom-nav-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.isAction
              ? isMoreMenuOpen
              : tab.screen === currentScreen ||
                (tab.id === "operations" && (currentScreen === "liveOperations" || currentScreen === "rides")) ||
                (tab.id === "finance" && (currentScreen === "revenue" || currentScreen === "payouts" || currentScreen === "transactions" || currentScreen === "wallet" || currentScreen === "pricing")) ||
                (tab.id === "safety" && (currentScreen === "sosIncidents" || currentScreen === "safetyCenter" || currentScreen === "escalationRules"));

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                type="button"
                className={`exact-admin-bottom-tab ${isActive ? "active" : ""}`}
                onClick={tab.onClick}
                aria-label={tab.label}
              >
                <div className="exact-admin-bottom-tab-icon-wrap">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="exact-admin-bottom-tab-label">{tab.label}</span>
              </button>
            );
          }

          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`exact-admin-bottom-tab ${isActive ? "active" : ""}`}
              aria-label={tab.label}
            >
              <div className="exact-admin-bottom-tab-icon-wrap">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge !== undefined && tab.badge !== 0 && (
                  <span
                    className={`exact-admin-bottom-badge ${tab.badgeTone ? `tone-${tab.badgeTone}` : ""}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="exact-admin-bottom-tab-label">{tab.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
