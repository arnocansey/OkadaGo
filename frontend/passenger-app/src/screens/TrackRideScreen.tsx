import { Text, View } from "react-native";
import { Card, EmptyState, MapPanel, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function TrackRideScreen({ ride, onLive, onBack }: { ride?: Ride; onLive: () => void; onBack: () => void }) {
  return (
    <>
      <SectionTitle kicker="Trip status" title="Track your rider" />
      {ride ? (
        <>
          <MapPanel title={ride.status.toLowerCase()} subtitle={`${ride.pickupAddress} to ${ride.destinationAddress}`} />
          <Card>
            <Pill label={ride.status} tone="warning" />
            <Text style={styles.emptyTitle}>{ride.rider?.user?.fullName ?? "Rider not assigned yet"}</Text>
            <Text style={styles.muted}>{ride.rider?.vehicle?.plateNumber ? `Bike plate ${ride.rider.vehicle.plateNumber}` : "Vehicle details will appear after assignment."}</Text>
            <Text style={styles.listBody}>{ride.pickupAddress}</Text>
            <Text style={styles.listBody}>{ride.destinationAddress}</Text>
            <View style={styles.grid}>
              <PrimaryButton label="Live map" onPress={onLive} />
              <PrimaryButton label="Back home" onPress={onBack} dark />
            </View>
          </Card>
        </>
      ) : (
        <EmptyState title="No active ride." body="Request a ride first, then tracking will open here." />
      )}
    </>
  );
}
