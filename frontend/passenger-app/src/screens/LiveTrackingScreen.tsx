import { Text } from "react-native";
import { Card, EmptyState, MapPanel, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function LiveTrackingScreen({ ride, onComplete, onBack }: { ride?: Ride; onComplete: () => void; onBack: () => void }) {
  return (
    <>
      <SectionTitle kicker="Live map" title="Ride progress" />
      {ride ? (
        <>
          <MapPanel title={ride.status.toLowerCase()} subtitle={`${ride.pickupAddress} to ${ride.destinationAddress}`} />
          <Card>
            <Text style={styles.emptyTitle}>Current status: {ride.status}</Text>
            <Text style={styles.muted}>Live GPS positions will replace this route preview when the backend exposes ride location streaming.</Text>
            <PrimaryButton label={ride.status === "COMPLETED" ? "View receipt" : "Back to dashboard"} onPress={ride.status === "COMPLETED" ? onComplete : onBack} />
          </Card>
        </>
      ) : (
        <EmptyState title="No live trip." body="Your live ride map will show here after a rider accepts the request." />
      )}
    </>
  );
}
