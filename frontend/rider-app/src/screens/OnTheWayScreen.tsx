import { Text } from "react-native";
import { api } from "../api";
import { Card, EmptyState, ListRow, MapPanel, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
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
            <Pill label="Pickup navigation" tone="warning" />
            <Text style={styles.emptyTitle}>{ride.pickupAddress}</Text>
            <ListRow title="Passenger" body={ride.passenger?.user?.fullName ?? "Passenger details pending"} meta={ride.passenger?.user?.phoneE164 ?? "Phone unavailable"} />
            <Text style={styles.muted}>Mark arrived only when you are at the pickup point.</Text>
            <PrimaryButton label="I have arrived" onPress={markArrived} />
          </Card>
        </>
      ) : (
        <EmptyState title="No pickup in progress." body="Accepted ride pickup navigation will show here." />
      )}
    </>
  );
}
