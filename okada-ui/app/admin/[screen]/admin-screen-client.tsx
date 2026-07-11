"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminToastProvider } from "@/components/dashboard/admin/AdminToast";
import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";

const AdminConsolePage = dynamic(
  () =>
    import("@/components/dashboard/AdminConsolePage").then(m => ({
      default: m.AdminConsolePage
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
);

export default function AdminScreenClient({
  screen
}: {
  screen: AdminConsoleScreen;
}) {
  return (
    <AdminToastProvider>
      <AdminConsolePage screen={screen} />
    </AdminToastProvider>
  );
}
