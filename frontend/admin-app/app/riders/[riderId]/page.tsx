import { RiderProfileClient } from "./rider-profile-client";

type Params = { params: Promise<{ riderId: string }> };

export default async function RiderProfilePage({ params }: Params) {
  const { riderId } = await params;
  return <RiderProfileClient riderId={riderId} />;
}
