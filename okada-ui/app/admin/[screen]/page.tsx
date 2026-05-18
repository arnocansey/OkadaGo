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
