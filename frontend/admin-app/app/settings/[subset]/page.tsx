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
    "company-profile": "companyProfile",
    security: "accountSecurity",
    "account-security": "accountSecurity",
    notifications: "notificationSettings",
    "notification-settings": "notificationSettings",
    "payment-methods": "paymentMethods",
    payments: "paymentMethods",
    taxes: "taxesCompliance",
    "taxes-compliance": "taxesCompliance",
    tax: "taxesCompliance",
    integrations: "integrations",
    admins: "admins",
    "roles-permissions": "rolesPermissions",
    roles: "rolesPermissions",
    permissions: "rolesPermissions"
  };
  const screen = subsets[subset];

  if (!screen) {
    notFound();
  }

  return <AdminScreenClient screen={screen} />;
}
