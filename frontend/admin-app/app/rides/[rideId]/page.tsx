import RideDetailsClient from "./ride-details-client";

export default async function RideDetailsPage({
  params
}: {
  params: Promise<{ rideId: string }>;
}) {
  const { rideId } = await params;
  return <RideDetailsClient rideId={rideId} />;
}
