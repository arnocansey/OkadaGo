import { notFound } from "next/navigation";
import type { RiderPortalScreen } from "@/components/rider/rider-portal-page";
import RiderScreenClient from "./rider-screen-client";

export default async function RiderScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;

  const normalizedScreen = screen.toLowerCase();
  const allowedScreens: Record<string, RiderPortalScreen> = {
    dashboard: "dashboard",
    earnings: "earnings",
    trips: "trips"
  };

  const riderScreen = allowedScreens[normalizedScreen];

  if (!riderScreen) {
    notFound();
  }

  return <RiderScreenClient screen={riderScreen} />;
}
