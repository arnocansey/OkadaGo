import { Text } from "react-native";
import { api } from "../api";
import { Card, EmptyState, ListRow, MapPanel, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride, Session } from "../types";

export function TripProgressScreen({ session, ride, onCompleted, onRefresh }: { session: Session; ride?: Ride; onCompleted: () => void; onRefresh: () => void }) {
  async function completeTrip() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus: "completed", actorRole: "rider", actorUserId: session.user.id } });
    onRefresh();
    onCompleted();
  }

  return (
    <>
      <SectionTitle kicker="Active trip" title="Trip in progress" />
      {ride ? (
        <>
          <MapPanel title="en route" subtitle={ride.destinationAddress} />
          <Card>
            <Pill label="In progress" tone="success" />
            <Text style={styles.emptyTitle}>{ride.destinationAddress}</Text>
            <ListRow title="From" body={ride.pickupAddress} meta="Pickup" />
            <ListRow title="To" body={ride.destinationAddress} meta="Drop-off" />
            <Text style={styles.muted}>Complete the ride only after safely dropping off the passenger.</Text>
            <PrimaryButton label="Complete trip" onPress={completeTrip} />
          </Card>
        </>
      ) : (
        <EmptyState title="No trip in progress." body="Started rides will appear here." />
      )}
    </>
  );
}
