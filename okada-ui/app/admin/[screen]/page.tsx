import { notFound, redirect } from "next/navigation";
import {
  type AdminConsoleScreen
} from "@/components/dashboard/admin-console-page";
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
    settings: "settings",
    locations: "settings",
    admins: "admins"
  };
  const canonicalPaths: Partial<Record<AdminConsoleScreen, string>> = {
    rides: "/admin/requests",
    passengers: "/admin/users",
    riderVerification: "/admin/riders/verification",
    riderDocuments: "/admin/riders/documents",
    riderPerformance: "/admin/riders/performance",
    riderEarnings: "/admin/riders/earnings",
    riderWallet: "/admin/riders/wallet",
    riderPayouts: "/admin/riders/payouts",
    riderComplaints: "/admin/riders/complaints",
    riderActivity: "/admin/riders/activity-tracking",
    riderSuspensions: "/admin/riders/suspensions",
    payments: "/admin/finance",
    ratings: "/admin/reports-analytics",
    supportTickets: "/admin/support-tickets"
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
