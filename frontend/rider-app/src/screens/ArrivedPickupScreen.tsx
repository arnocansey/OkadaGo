import { Text } from "react-native";
import { api } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride, Session } from "../types";

export function ArrivedPickupScreen({ session, ride, onStarted, onRefresh }: { session: Session; ride?: Ride; onStarted: () => void; onRefresh: () => void }) {
  async function startTrip() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus: "started", actorRole: "rider", actorUserId: session.user.id } });
    onRefresh();
    onStarted();
  }

  return (
    <>
      <SectionTitle kicker="Passenger pickup" title="Arrived" />
      {ride ? (
        <Card>
          <Text style={styles.emptyTitle}>{ride.passenger?.user?.fullName ?? "Passenger"}</Text>
          <Text style={styles.muted}>{ride.passenger?.user?.phoneE164 ?? "Passenger phone unavailable"}</Text>
          <Text style={styles.muted}>Confirm the passenger is on board before starting the trip.</Text>
          <PrimaryButton label="Start trip" onPress={startTrip} />
        </Card>
      ) : (
        <EmptyState title="No passenger pickup." body="Arrived pickup confirmation will show here." />
      )}
    </>
  );
}
