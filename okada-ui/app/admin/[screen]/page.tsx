import { notFound } from "next/navigation";
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
  const allowedScreens: AdminConsoleScreen[] = [
    "rides",
    "riders",
    "passengers",
    "payments",
    "ratings",
    "promotions",
    "settings",
    "admins"
  ];

  if (!allowedScreens.includes(screen as AdminConsoleScreen)) {
    notFound();
  }

  return <AdminConsolePage screen={screen as AdminConsoleScreen} />;
}
