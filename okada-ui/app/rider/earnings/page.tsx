import { Suspense } from "react";
import { EarningsView } from "@/components/rider/pages/earnings-view";
import { EarningsSkeleton } from "@/components/rider/ui/skeletons";

export const metadata = {
  title: "OkadaGo | Rider Earnings"
};

export default function RiderEarningsPage() {
  return (
    <Suspense
      fallback={
        <div className="rdr-app min-h-dvh p-6">
          <EarningsSkeleton />
        </div>
      }
    >
      <EarningsView />
    </Suspense>
  );
}
