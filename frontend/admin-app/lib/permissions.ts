import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";
import type { SessionUser } from "./auth";

export interface PermissionDefinition {
  key: string;
  label: string;
  group: string;
}

export const OKADAGO_PERMISSIONS: PermissionDefinition[] = [
  { key: "rides:read", label: "View Rides", group: "Rides & Trips" },
  { key: "rides:write", label: "Manage Rides", group: "Rides & Trips" },
  { key: "deliveries:read", label: "View Deliveries", group: "Package Deliveries" },
  { key: "deliveries:write", label: "Manage Deliveries", group: "Package Deliveries" },
  { key: "users:read", label: "View Users", group: "Passengers & Riders" },
  { key: "users:write", label: "Manage Users", group: "Passengers & Riders" },
  { key: "finance:read", label: "View Financials", group: "Finance & Payouts" },
  { key: "finance:write", label: "Manage Payouts", group: "Finance & Payouts" },
  { key: "safety:read", label: "View Incidents", group: "Safety & SOS" },
  { key: "safety:write", label: "Manage Incidents", group: "Safety & SOS" },
  { key: "promotions:read", label: "View Promos", group: "Promotions & Rates" },
  { key: "promotions:write", label: "Manage Promos", group: "Promotions & Rates" },
  { key: "admin:read", label: "View System", group: "System & Staff" },
  { key: "admin:write", label: "Manage Staff", group: "System & Staff" }
];

export const OKADAGO_ROLES = [
  {
    id: "super_admin",
    name: "Super Administrator",
    description: "Full unrestricted access to all platform operations, staff, settings, and finance",
    permissions: OKADAGO_PERMISSIONS.map((p) => p.key)
  },
  {
    id: "finance_officer",
    name: "Finance Officer",
    description: "Manages rider wallets, earnings, transactions, revenue, and payout approvals",
    permissions: [
      "finance:read",
      "finance:write",
      "rides:read",
      "deliveries:read"
    ]
  },
  {
    id: "ops_manager",
    name: "Operations Manager",
    description: "Manages trips, deliveries, riders, document verification, and safety incidents",
    permissions: [
      "rides:read",
      "rides:write",
      "deliveries:read",
      "deliveries:write",
      "users:read",
      "users:write",
      "safety:read",
      "safety:write"
    ]
  },
  {
    id: "dispatch_supervisor",
    name: "Dispatch Supervisor",
    description: "Oversees real-time ride and delivery dispatch, route monitoring, and driver assignments",
    permissions: [
      "rides:read",
      "rides:write",
      "deliveries:read",
      "deliveries:write"
    ]
  },
  {
    id: "support_lead",
    name: "Customer Support Lead",
    description: "Handles customer support tickets, rider complaints, SOS safety cases, and ratings",
    permissions: [
      "users:read",
      "safety:read",
      "safety:write",
      "rides:read",
      "deliveries:read"
    ]
  },
  {
    id: "custom",
    name: "Custom Staff",
    description: "Specify a custom role title and select permissions manually",
    permissions: []
  }
];

export const SCREEN_REQUIRED_PERMISSIONS: Record<AdminConsoleScreen, string[]> = {
  // Overview
  dashboard: ["*"],
  liveOperations: ["rides:read", "deliveries:read", "admin:read"],

  // Operations - Trips
  rides: ["rides:read"],
  deliveries: ["deliveries:read"],
  riderAssignment: ["rides:write", "deliveries:write", "admin:write"],

  // Operations - Riders & Users
  riders: ["users:read", "rides:read"],
  riderVerification: ["users:write", "admin:write"],
  riderDocuments: ["users:write", "admin:write"],
  riderPerformance: ["users:read", "rides:read", "admin:read"],
  riderEarnings: ["finance:read", "users:read"],
  riderWallet: ["finance:read", "users:read"],
  riderPayouts: ["finance:read", "finance:write"],
  riderComplaints: ["safety:read", "users:read"],
  riderActivity: ["rides:read", "users:read", "admin:read"],
  riderSuspensions: ["users:write", "safety:write", "admin:write"],
  passengers: ["users:read"],
  ratings: ["users:read", "safety:read"],

  // Finance
  revenue: ["finance:read"],
  transactions: ["finance:read"],
  payouts: ["finance:read", "finance:write"],
  refunds: ["finance:read", "finance:write"],
  pricing: ["finance:write", "admin:write"],
  dynamicPricing: ["finance:write", "admin:write"],
  wallet: ["finance:read"],
  payments: ["finance:read"],
  zones: ["finance:read", "rides:read", "admin:read"],

  // Growth
  promotions: ["promotions:read", "promotions:write"],
  promoManagement: ["promotions:read", "promotions:write"],
  referrals: ["promotions:read", "users:read"],
  goPoints: ["promotions:read", "promotions:write"],

  // Customer & Safety
  supportTickets: ["safety:read", "safety:write", "users:read"],
  messageTemplates: ["safety:write", "promotions:write", "admin:write"],
  notifications: ["promotions:write", "safety:write", "admin:write"],
  sosIncidents: ["safety:read", "safety:write"],
  safetyCenter: ["safety:read", "safety:write"],
  escalationRules: ["safety:write", "admin:write"],

  // Analytics
  analytics: ["finance:read", "rides:read", "admin:read"],
  reports: ["finance:read", "rides:read", "admin:read"],

  // Administration (Super Admin / Staff Admins only)
  admins: ["admin:read", "admin:write"],
  rolesPermissions: ["admin:read", "admin:write"],
  auditLogs: ["admin:read", "admin:write"],
  settings: ["admin:write"],
  companyProfile: ["admin:write"],
  accountSecurity: ["admin:write"],
  notificationSettings: ["admin:write"],
  paymentMethods: ["finance:write", "admin:write"],
  integrations: ["admin:write"],
  taxesCompliance: ["finance:read", "finance:write", "admin:write"],
  settingsNotifications: ["admin:write"],
  unauthorizedUsers: ["users:write", "admin:write"]
};

/**
 * Extracts and normalizes the effective permissions set for an admin user.
 */
export function getEffectivePermissions(user: SessionUser | null | undefined): Set<string> {
  if (!user) return new Set();

  const titleLower = (user.adminTitle || "").toLowerCase().trim();

  // Super Admin: grant full wildcard
  if (
    titleLower.includes("super") ||
    titleLower.includes("owner") ||
    titleLower.includes("director") ||
    titleLower === "admin"
  ) {
    return new Set(["*"]);
  }

  const perms = new Set<string>();

  // Parse permissions from session
  if (Array.isArray(user.adminPermissions)) {
    user.adminPermissions.forEach((p) => {
      if (typeof p === "string") perms.add(p.trim());
    });
  } else if (typeof user.adminPermissions === "string") {
    user.adminPermissions.split(",").forEach((p) => {
      const trimmed = p.trim();
      if (trimmed) perms.add(trimmed);
    });
  }

  // If wildcard exists in array
  if (perms.has("*") || perms.has("all") || perms.has("admin.full_access")) {
    return new Set(["*"]);
  }

  // If no explicit permissions array was stored, derive standard role permissions from title
  if (perms.size === 0) {
    if (titleLower.includes("finance") || titleLower.includes("accountant")) {
      OKADAGO_ROLES.find((r) => r.id === "finance_officer")?.permissions.forEach((p) => perms.add(p));
    } else if (titleLower.includes("dispatch")) {
      OKADAGO_ROLES.find((r) => r.id === "dispatch_supervisor")?.permissions.forEach((p) => perms.add(p));
    } else if (titleLower.includes("support") || titleLower.includes("customer")) {
      OKADAGO_ROLES.find((r) => r.id === "support_lead")?.permissions.forEach((p) => perms.add(p));
    } else if (titleLower.includes("ops") || titleLower.includes("operation")) {
      OKADAGO_ROLES.find((r) => r.id === "ops_manager")?.permissions.forEach((p) => perms.add(p));
    } else {
      // Default to Super Admin only if no title is specified
      return new Set(["*"]);
    }
  }

  return perms;
}

/**
 * Checks if the current admin session is authorized to access a given screen.
 */
export function hasScreenAccess(
  user: SessionUser | null | undefined,
  screen: AdminConsoleScreen
): boolean {
  if (!user) return false;

  const effectivePerms = getEffectivePermissions(user);

  // Full access
  if (effectivePerms.has("*")) return true;

  // Main Dashboard is accessible to all verified admin staff
  if (screen === "dashboard") return true;

  const required = SCREEN_REQUIRED_PERMISSIONS[screen];
  if (!required || required.length === 0) return true;

  // Has access if user holds at least one of the required permission keys
  return required.some(
    (req) =>
      req === "*" ||
      effectivePerms.has(req) ||
      effectivePerms.has(req.split(":")[0] + ":*")
  );
}
