import { Text } from "react-native";
import { api, money } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride, Session } from "../types";

export function RideRequestScreen({ session, ride, onAccepted, onRefresh }: { session: Session; ride?: Ride; onAccepted: () => void; onRefresh: () => void }) {
  async function acceptRide() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus: "arriving", actorRole: "rider", actorUserId: session.user.id } });
    onRefresh();
    onAccepted();
  }

  return (
    <>
      <SectionTitle kicker="Ride request" title="Incoming assignment" />
      {ride ? (
        <Card>
          <Text style={styles.emptyTitle}>{ride.pickupAddress} to {ride.destinationAddress}</Text>
          <Text style={styles.muted}>Passenger: {ride.passenger?.user?.fullName ?? "Passenger details pending"}</Text>
          <Text style={styles.muted}>Fare: {money(ride.estimatedFare ?? ride.finalFare, ride.currency ?? "GHS")}</Text>
          <PrimaryButton label="Accept and head to pickup" onPress={acceptRide} />
        </Card>
      ) : (
        <EmptyState title="No ride request." body="New assignments will appear here when dispatch selects your rider profile." />
      )}
    </>
  );
}
