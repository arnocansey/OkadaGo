import { View } from "react-native";
import { compactDate, money } from "../api";
import { Card, EmptyState, ListRow, Pill, SectionTitle } from "../components/ui";
import type { Delivery, Ride } from "../types";

export function TripsScreen({ rides, deliveries }: { rides: Ride[]; deliveries: Delivery[] }) {
  const hasHistory = rides.length > 0 || deliveries.length > 0;

  return (
    <>
      <SectionTitle kicker="My trips" title="Trip and delivery history" />
      <Card>
        {hasHistory ? (
          <>
          <Pill label={`${rides.length} rides`} />
          {rides.map((ride) => (
            <ListRow
              key={ride.id}
              title={ride.pickupAddress}
              body={ride.destinationAddress}
              meta={`${ride.status} - ${compactDate(ride.createdAt)}`}
              amount={money(ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}
            />
          ))}
          <View style={{ height: 8 }} />
          <Pill label={`${deliveries.length} deliveries`} />
          {deliveries.map((delivery) => (
            <ListRow
              key={delivery.id}
              title={delivery.packageDescription}
              body={`${delivery.pickupAddress} to ${delivery.dropoffAddress}`}
              meta={`${delivery.status} - ${compactDate(delivery.createdAt)}`}
              amount={money(delivery.finalFee ?? delivery.estimatedFee, delivery.currency ?? "GHS")}
            />
          ))}
          </>
        ) : (
          <EmptyState title="No activity yet." body="Trips and deliveries will appear here after your first backend request." />
        )}
      </Card>
    </>
  );
}
