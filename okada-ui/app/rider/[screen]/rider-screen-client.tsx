"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiderPortalScreen } from "@/components/rider/rider-portal-page";

const RiderPortalPage = dynamic(
  () =>
    import("@/components/rider/rider-portal-page").then(m => ({
      default: m.RiderPortalPage
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

export default function RiderScreenClient({
  screen
}: {
  screen: RiderPortalScreen;
}) {
  return <RiderPortalPage screen={screen} />;
}
