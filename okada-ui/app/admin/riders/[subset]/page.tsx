import { notFound } from "next/navigation";
import type { AdminConsoleScreen } from "@/components/dashboard/admin/types";
import AdminScreenClient from "../../[screen]/admin-screen-client";

export default async function AdminRiderSubsetPage({
  params
}: {
  params: Promise<{ subset: string }>;
}) {
  const { subset } = await params;
  const subsets: Record<string, AdminConsoleScreen> = {
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
  const screen = subsets[subset];

  if (!screen) {
    notFound();
  }

  return <AdminScreenClient screen={screen} />;
}
