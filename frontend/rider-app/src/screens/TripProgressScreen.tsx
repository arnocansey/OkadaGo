import { Text } from "react-native";
import { api } from "../api";
import { Card, EmptyState, MapPanel, PrimaryButton, SectionTitle, styles } from "../components/ui";
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
            <Text style={styles.emptyTitle}>{ride.destinationAddress}</Text>
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
