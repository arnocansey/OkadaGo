import { Text } from "react-native";
import { money } from "../api";
import { Card, EmptyState, ListRow, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function TripCompletedScreen({ ride, onDone }: { ride?: Ride; onDone: () => void }) {
  return (
    <>
      <SectionTitle kicker="Completed" title="Trip settlement" />
      {ride ? (
        <Card>
          <Pill label="Settled" tone="success" />
          <Text style={styles.emptyTitle}>{money(ride.riderEarnings ?? 0, ride.currency ?? "GHS")}</Text>
          <ListRow title="Pickup" body={ride.pickupAddress} meta="Start point" />
          <ListRow title="Drop-off" body={ride.destinationAddress} meta="Destination" />
          <Text style={styles.muted}>Your settlement wallet updates after the trip is finalized.</Text>
          <PrimaryButton label="Back to dashboard" onPress={onDone} />
        </Card>
      ) : (
        <EmptyState title="No completed ride." body="Completed ride settlement details will appear here." />
      )}
    </>
  );
}
