import { notFound } from "next/navigation";
import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";
import AdminScreenClient from "../../[screen]/admin-screen-client";

export default async function AdminSettingsSubsetPage({
  params
}: {
  params: Promise<{ subset: string }>;
}) {
  const { subset } = await params;
  const subsets: Record<string, AdminConsoleScreen> = {
    company: "companyProfile",
    security: "accountSecurity",
    notifications: "notificationSettings"
  };
  const screen = subsets[subset];

  if (!screen) {
    notFound();
  }

  return <AdminScreenClient screen={screen} />;
}
