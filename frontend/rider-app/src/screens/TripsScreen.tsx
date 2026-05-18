import { Text, View } from "react-native";
import { api, compactDate, money, nextRideStatus } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle } from "../components/ui";
import type { Ride, Session } from "../types";

export function TripsScreen({ session, rides, onRefresh }: { session: Session; rides: Ride[]; onRefresh: () => void }) {
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
  return (
    <>
      <SectionTitle kicker="Trips" title="Trip queue" />
      <Card>
        {rides.length ? rides.map((ride) => (
          <View key={ride.id} style={{ gap: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 14 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{ride.pickupAddress} to {ride.destinationAddress}</Text>
            <Text style={{ color: "#9EA4AE" }}>{ride.status} - {compactDate(ride.createdAt)} - {money(ride.riderEarnings ?? ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}</Text>
            {nextRideStatus(ride.status) ? <PrimaryButton label={`Mark ${nextRideStatus(ride.status)}`} onPress={() => moveRide(ride)} /> : null}
          </View>
        )) : <EmptyState title="No trips assigned." body="Trips assigned to your rider profile will be listed here." />}
      </Card>
    </>
  );
}
