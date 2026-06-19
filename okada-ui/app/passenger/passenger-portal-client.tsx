"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const PassengerPortalPage = dynamic(
  () =>
    import("@/components/passenger/passenger-portal-page").then(m => ({
      default: m.PassengerPortalPage
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

export default function PassengerPortalClient() {
  return <PassengerPortalPage />;
}
