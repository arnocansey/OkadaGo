import { notFound } from "next/navigation";
import { RiderPortalPage, type RiderPortalScreen } from "@/components/rider/rider-portal-page";

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

  return <RiderPortalPage screen={riderScreen} />;
}
