import { Text, View } from "react-native";
import { compactDate, money } from "../api";
import { Card, EmptyState, SectionTitle, styles } from "../components/ui";
import type { Ride } from "../types";

export function TripsScreen({ rides }: { rides: Ride[] }) {
  return (
    <>
      <SectionTitle kicker="My trips" title="Trip history" />
      <Card>
        {rides.length ? (
          rides.map((ride) => (
            <View key={ride.id} style={{ flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#2A2A2A" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "900" }}>{ride.pickupAddress}</Text>
                <Text style={{ color: "#9EA4AE", fontSize: 13, marginTop: 4 }}>{ride.destinationAddress}</Text>
                <Text style={{ color: "#9EA4AE", fontSize: 13, marginTop: 4 }}>{ride.status} - {compactDate(ride.createdAt)}</Text>
              </View>
              <Text style={{ color: "#F5B800", fontSize: 14, fontWeight: "900" }}>{money(ride.finalFare ?? ride.estimatedFare, ride.currency ?? "GHS")}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No trips yet." body="Trips will appear here after your first backend ride request." />
        )}
      </Card>
    </>
  );
}
