import { notFound, redirect } from "next/navigation";
import {
  AdminConsolePage,
  type AdminConsoleScreen
} from "@/components/dashboard/admin-console-page";

export default async function AdminScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const screenAliases: Record<string, AdminConsoleScreen> = {
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
    users: "passengers",
    passengers: "passengers",
    finance: "payments",
    payments: "payments",
    support: "ratings",
    ratings: "ratings",
    promotions: "promotions",
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
    ratings: "/admin/support"
  };
  const resolvedScreen = screenAliases[screen];

  if (!resolvedScreen) {
    notFound();
  }

  const canonicalPath = canonicalPaths[resolvedScreen];

  if (canonicalPath && screen !== canonicalPath.split("/").pop()) {
    redirect(canonicalPath);
  }

  return <AdminConsolePage screen={resolvedScreen} />;
}
