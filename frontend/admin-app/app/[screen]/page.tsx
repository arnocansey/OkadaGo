import { notFound, redirect } from "next/navigation";
import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";
import AdminScreenClient from "./admin-screen-client";

export default async function AdminScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;

  const screenAliases: Record<string, AdminConsoleScreen> = {
    dashboard: "dashboard",
    "live-operations": "liveOperations",
    liveops: "liveOperations",
    "live-ops": "liveOperations",
    "request-dashboard": "rides",
    requests: "rides",
    rides: "rides",
    deliveries: "deliveries",
    "delivery-orders": "deliveries",
    riders: "riders",
    "rider-verification": "riderVerification",
    "rider-documents": "riderDocuments",
    "rider-performance": "riderPerformance",
    "rider-earnings": "riderEarnings",
    "rider-wallet": "riderWallet",
    "rider-payouts": "riderPayouts",
    "rider-complaints": "riderComplaints",
    "rider-activity": "riderActivity",
    "rider-suspensions": "riderSuspensions",
    "rider-assignment": "riderAssignment",
    riderassignment: "riderAssignment",
    "rider-assignments": "riderAssignment",
    assignment: "riderAssignment",
    assignments: "riderAssignment",
    "rider-dispatch": "riderAssignment",
    dispatch: "riderAssignment",
    documents: "riderDocuments",
    "users-management": "passengers",
    users: "passengers",
    passengers: "passengers",
    finance: "revenue",
    revenue: "revenue",
    "earnings-payouts": "revenue",
    payments: "revenue",
    pricing: "pricing",
    fares: "pricing",
    rates: "pricing",
    "dynamic-pricing": "dynamicPricing",
    surge: "dynamicPricing",
    transactions: "transactions",
    payouts: "payouts",
    refunds: "refunds",
    wallet: "wallet",
    "reports-analytics": "ratings",
    ratings: "ratings",
    reviews: "ratings",
    promotions: "promotions",
    "promo-management": "promoManagement",
    referrals: "referrals",
    "go-points": "goPoints",
    gopoints: "goPoints",
    "support-tickets": "supportTickets",
    support: "supportTickets",
    tickets: "supportTickets",
    "message-templates": "messageTemplates",
    templates: "messageTemplates",
    sos: "sosIncidents",
    emergencies: "sosIncidents",
    "sos-incidents": "sosIncidents",
    incidents: "sosIncidents",
    "safety-center": "safetyCenter",
    safety: "safetyCenter",
    "escalation-rules": "escalationRules",
    escalation: "escalationRules",
    settings: "settings",
    "company-profile": "companyProfile",
    company: "companyProfile",
    "account-security": "accountSecurity",
    security: "accountSecurity",
    "notification-settings": "notificationSettings",
    locations: "settings",
    "payment-methods": "paymentMethods",
    paymentmethods: "paymentMethods",
    "taxes-compliance": "taxesCompliance",
    taxes: "taxesCompliance",
    tax: "taxesCompliance",
    integrations: "integrations",
    "settings-notifications": "settingsNotifications",
    "admin-settings-notifications": "settingsNotifications",
    admins: "admins",
    "admin-users": "admins",
    "roles-permissions": "rolesPermissions",
    roles: "rolesPermissions",
    permissions: "rolesPermissions",
    zones: "zones",
    "zone-management": "zones",
    notifications: "notifications",
    broadcasts: "notifications",
    broadcast: "notifications",
    alerts: "notifications",
    reports: "reports",
    analytics: "analytics",
    "audit-logs": "auditLogs",
    audit: "auditLogs"
  };

  const canonicalPaths: Partial<Record<AdminConsoleScreen, string>> = {
    liveOperations: "/live-operations",
    rides: "/requests",
    deliveries: "/deliveries",
    passengers: "/users",
    riderVerification: "/riders/verification",
    riderDocuments: "/riders/documents",
    riderPerformance: "/riders/performance",
    riderEarnings: "/riders/earnings",
    riderWallet: "/riders/wallet",
    riderPayouts: "/riders/payouts",
    riderComplaints: "/riders/complaints",
    riderActivity: "/riders/activity-tracking",
    riderSuspensions: "/riders/suspensions",
    riderAssignment: "/rider-assignment",
    revenue: "/finance",
    payments: "/finance",
    pricing: "/pricing",
    dynamicPricing: "/dynamic-pricing",
    transactions: "/transactions",
    payouts: "/payouts",
    refunds: "/refunds",
    wallet: "/wallet",
    ratings: "/ratings",
    referrals: "/referrals",
    goPoints: "/go-points",
    supportTickets: "/support-tickets",
    messageTemplates: "/message-templates",
    sosIncidents: "/incidents",
    safetyCenter: "/safety-center",
    escalationRules: "/escalation-rules",
    zones: "/zones",
    notifications: "/notifications",
    reports: "/reports",
    analytics: "/analytics",
    auditLogs: "/audit-logs",
    paymentMethods: "/payment-methods",
    taxesCompliance: "/taxes-compliance",
    integrations: "/integrations",
    settingsNotifications: "/settings-notifications",
    rolesPermissions: "/roles-permissions"
  };

  const resolvedScreen = screenAliases[screen];

  if (!resolvedScreen) {
    notFound();
  }

  const canonicalPath = canonicalPaths[resolvedScreen];

  if (canonicalPath && screen !== canonicalPath.split("/").pop()) {
    redirect(canonicalPath);
  }

  return <AdminScreenClient screen={resolvedScreen} />;
}
