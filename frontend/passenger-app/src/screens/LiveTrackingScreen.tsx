import { Text } from "react-native";
import { Card, EmptyState, MapPanel, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function LiveTrackingScreen({ ride, onComplete, onBack }: { ride?: Ride; onComplete: () => void; onBack: () => void }) {
  return (
    <>
      <SectionTitle kicker="Live map" title="Ride progress" />
      {ride ? (
        <>
          <MapPanel title={ride.status.toLowerCase()} subtitle={`${ride.pickupAddress} to ${ride.destinationAddress}`} />
          <Card>
            <Pill label={ride.status} tone={ride.status === "COMPLETED" ? "success" : "warning"} />
            <Text style={styles.emptyTitle}>Current status: {ride.status}</Text>
            <Text style={styles.muted}>Live GPS positions will appear here as your trip updates.</Text>
            <PrimaryButton label={ride.status === "COMPLETED" ? "View receipt" : "Back to dashboard"} onPress={ride.status === "COMPLETED" ? onComplete : onBack} />
          </Card>
        </>
      ) : (
        <EmptyState title="No live trip." body="Your live ride map will show here after a rider accepts the request." />
      )}
    </>
  );
}
