import { notFound } from "next/navigation";
import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";
import AdminScreenClient from "../../[screen]/admin-screen-client";
import { RiderProfileClient } from "@/components/dashboard/admin/RiderProfilePageClient";

const SUBSETS: Record<string, AdminConsoleScreen> = {
  verification: "riderVerification",
  documents: "riderDocuments",
  performance: "riderPerformance",
  earnings: "riderEarnings",
  wallet: "riderWallet",
  payouts: "riderPayouts",
  complaints: "riderComplaints",
  "activity-tracking": "riderActivity",
  suspensions: "riderSuspensions"
};

export default async function AdminRiderPage({
  params
}: {
  params: Promise<{ subset: string }>;
}) {
  const { subset } = await params;

  const screen = SUBSETS[subset];
  if (screen) {
    return <AdminScreenClient screen={screen} />;
  }

  if (subset && subset.length >= 10) {
    return <RiderProfileClient riderId={subset} />;
  }

  notFound();
}
