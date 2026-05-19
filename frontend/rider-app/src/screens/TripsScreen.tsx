import { View } from "react-native";
import { api, compactDate, money, nextDeliveryStatus, nextRideStatus } from "../api";
import { Card, EmptyState, ListRow, Pill, PrimaryButton, SectionTitle } from "../components/ui";
import type { Delivery, Ride, Session } from "../types";

export function TripsScreen({ session, rides, deliveries, onRefresh }: { session: Session; rides: Ride[]; deliveries: Delivery[]; onRefresh: () => void }) {
  async function moveRide(ride: Ride) {
    const nextStatus = nextRideStatus(ride.status);
    if (!nextStatus) return;
    try {
      await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus, actorRole: "rider", actorUserId: session.user.id } });
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update trip.");
    }
  }
  async function moveDelivery(delivery: Delivery) {
    const isSearching = delivery.status.toLowerCase() === "searching";
    const nextStatus = isSearching ? "assigned" : nextDeliveryStatus(delivery.status);
    if (!nextStatus) return;
    try {
      await api(`/deliveries/${delivery.id}/status`, {
        method: "PATCH",
        body: {
          nextStatus,
          actorRole: "rider",
          actorUserId: session.user.id,
          riderProfileId: isSearching ? session.user.riderProfileId : undefined,
        },
      });
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update delivery.");
    }
  }

  const hasWork = rides.length > 0 || deliveries.length > 0;

  return (
    <>
      <SectionTitle kicker="Trips" title="Trip and delivery queue" />
      <Card>
        {hasWork ? (
          <>
          <Pill label={`${rides.length} ride jobs`} />
          {rides.map((ride) => (
          <View key={ride.id} style={{ gap: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 14 }}>
            <ListRow
              title={ride.pickupAddress}
              body={ride.destinationAddress}
              meta={`${ride.status} - ${compactDate(ride.createdAt)}`}
              amount={money(ride.riderEarnings ?? ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}
            />
            {nextRideStatus(ride.status) ? <PrimaryButton label={`Mark ${nextRideStatus(ride.status)}`} onPress={() => moveRide(ride)} /> : null}
          </View>
        ))}
          <View style={{ height: 8 }} />
          <Pill label={`${deliveries.length} delivery jobs`} tone="warning" />
          {deliveries.map((delivery) => {
            const isSearching = delivery.status.toLowerCase() === "searching";
            const nextStatus = isSearching ? "assigned" : nextDeliveryStatus(delivery.status);

            return (
              <View key={delivery.id} style={{ gap: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 14 }}>
                <ListRow
                  title={delivery.packageDescription}
                  body={`${delivery.pickupAddress} to ${delivery.dropoffAddress}`}
                  meta={`${delivery.status} - ${compactDate(delivery.createdAt)}`}
                  amount={money(delivery.riderEarnings ?? delivery.finalFee ?? delivery.estimatedFee, delivery.currency ?? "GHS")}
                />
                {nextStatus ? <PrimaryButton label={isSearching ? "Accept delivery" : `Mark ${nextStatus}`} onPress={() => moveDelivery(delivery)} /> : null}
              </View>
            );
          })}
          </>
        ) : <EmptyState title="No work assigned." body="Trips and deliveries assigned to your rider profile will be listed here." />}
      </Card>
    </>
  );
}
