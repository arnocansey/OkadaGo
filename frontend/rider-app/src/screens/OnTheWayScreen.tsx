import { Text } from "react-native";
import { api } from "../api";
import { Card, EmptyState, MapPanel, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride, Session } from "../types";

export function OnTheWayScreen({ session, ride, onArrived, onRefresh }: { session: Session; ride?: Ride; onArrived: () => void; onRefresh: () => void }) {
  async function markArrived() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus: "arrived", actorRole: "rider", actorUserId: session.user.id } });
    onRefresh();
    onArrived();
  }

  return (
    <>
      <SectionTitle kicker="Pickup" title="On the way" />
      {ride ? (
        <>
          <MapPanel title="heading to pickup" subtitle={ride.pickupAddress} />
          <Card>
            <Text style={styles.emptyTitle}>{ride.pickupAddress}</Text>
            <Text style={styles.muted}>Contact passenger from the assigned trip details once calling support is exposed.</Text>
            <PrimaryButton label="I have arrived" onPress={markArrived} />
          </Card>
        </>
      ) : (
        <EmptyState title="No pickup in progress." body="Accepted ride pickup navigation will show here." />
      )}
    </>
  );
}
