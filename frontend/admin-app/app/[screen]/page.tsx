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
    documents: "riderDocuments",
    "users-management": "passengers",
    users: "passengers",
    passengers: "passengers",
    finance: "payments",
    "earnings-payouts": "payments",
    payments: "payments",
    "reports-analytics": "ratings",
    ratings: "ratings",
    promotions: "promotions",
    "support-tickets": "supportTickets",
    support: "supportTickets",
    sos: "sosIncidents",
    emergencies: "sosIncidents",
    "sos-incidents": "sosIncidents",
    "escalation-rules": "escalationRules",
    escalation: "escalationRules",
    settings: "settings",
    locations: "settings",
    "payment-methods": "paymentMethods",
    "taxes-compliance": "taxesCompliance",
    taxes: "taxesCompliance",
    integrations: "integrations",
    "settings-notifications": "settingsNotifications",
    "admin-settings-notifications": "settingsNotifications",
    admins: "admins",
    zones: "zones",
    "zone-management": "zones",
    notifications: "notifications",
    broadcasts: "notifications",
    reports: "reports",
    analytics: "reports",
    "audit-logs": "auditLogs",
    audit: "auditLogs"
  };

  const canonicalPaths: Partial<Record<AdminConsoleScreen, string>> = {
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
    payments: "/finance",
    ratings: "/reports-analytics",
    supportTickets: "/support-tickets",
    sosIncidents: "/sos",
    escalationRules: "/escalation-rules",
    zones: "/zones",
    notifications: "/notifications",
    reports: "/reports",
    auditLogs: "/audit-logs",
    paymentMethods: "/payment-methods",
    taxesCompliance: "/taxes-compliance",
    integrations: "/integrations",
    settingsNotifications: "/settings-notifications"
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
