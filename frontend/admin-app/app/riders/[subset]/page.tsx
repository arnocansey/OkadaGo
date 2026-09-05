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
  activity: "riderActivity",
  tracking: "riderActivity",
  "live-map": "riderActivity",
  suspensions: "riderSuspensions",
  assignment: "riderAssignment",
  assignments: "riderAssignment",
  "rider-assignment": "riderAssignment",
  dispatch: "riderAssignment"
};

const NON_ID_KEYWORDS = new Set([
  "assignment",
  "assignments",
  "rider-assignment",
  "verification",
  "documents",
  "performance",
  "earnings",
  "wallet",
  "payouts",
  "complaints",
  "activity",
  "tracking",
  "activity-tracking",
  "suspensions",
  "dispatch"
]);

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

  if (subset && subset.length >= 10 && !NON_ID_KEYWORDS.has(subset.toLowerCase())) {
    return <RiderProfileClient riderId={subset} />;
  }

  notFound();
}
