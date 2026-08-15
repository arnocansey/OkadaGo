import { PassengerProfileClient } from "./passenger-profile-client";

type Params = { params: Promise<{ passengerId: string }> };

export default async function PassengerProfilePage({ params }: Params) {
  const { passengerId } = await params;
  return <PassengerProfileClient passengerId={passengerId} />;
}
