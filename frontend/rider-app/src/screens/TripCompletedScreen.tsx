import { Text } from "react-native";
import { money } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function TripCompletedScreen({ ride, onDone }: { ride?: Ride; onDone: () => void }) {
  return (
    <>
      <SectionTitle kicker="Completed" title="Trip settlement" />
      {ride ? (
        <Card>
          <Text style={styles.emptyTitle}>{ride.pickupAddress} to {ride.destinationAddress}</Text>
          <Text style={styles.muted}>Rider earnings: {money(ride.riderEarnings ?? 0, ride.currency ?? "GHS")}</Text>
          <Text style={styles.muted}>The settlement wallet updates from the backend after the trip is finalized.</Text>
          <PrimaryButton label="Back to dashboard" onPress={onDone} />
        </Card>
      ) : (
        <EmptyState title="No completed ride." body="Completed ride settlement details will appear here." />
      )}
    </>
  );
}
