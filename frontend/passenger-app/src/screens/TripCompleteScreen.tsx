import { Text } from "react-native";
import { compactDate, money } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function TripCompleteScreen({ ride, onDone }: { ride?: Ride; onDone: () => void }) {
  return (
    <>
      <SectionTitle kicker="Receipt" title="Trip complete" />
      {ride ? (
        <Card>
          <Text style={styles.emptyTitle}>{ride.pickupAddress} to {ride.destinationAddress}</Text>
          <Text style={styles.muted}>{compactDate(ride.createdAt)} - {money(ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}</Text>
          <Text style={styles.muted}>Ratings can be submitted when the backend exposes passenger ride rating endpoints for the mobile apps.</Text>
          <PrimaryButton label="Done" onPress={onDone} />
        </Card>
      ) : (
        <EmptyState title="No completed trip selected." body="Completed trip receipts will appear here from your trip history." />
      )}
    </>
  );
}
