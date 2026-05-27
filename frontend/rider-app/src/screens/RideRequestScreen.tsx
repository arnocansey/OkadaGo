import { Pressable, Text, View } from "react-native";
import { MapPin, Volume2 } from "lucide-react-native";
import { api, money } from "../api";
import { EmptyState, Pill, styles } from "../components/ui";
import type { Ride, Session } from "../types";

export function RideRequestScreen({
  session,
  ride,
  onAccepted,
  onDeclined,
  onRefresh,
}: {
  session: Session;
  ride?: Ride;
  onAccepted: () => void;
  onDeclined: () => void;
  onRefresh: () => void;
}) {
  async function acceptRide() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, { method: "PATCH", body: { nextStatus: "arriving", actorRole: "rider", actorUserId: session.user.id } });
    onRefresh();
    onAccepted();
  }

  async function declineRide() {
    if (!ride) return;
    await api(`/rides/${ride.id}/status`, {
      method: "PATCH",
      body: {
        nextStatus: "cancelled",
        actorRole: "rider",
        actorUserId: session.user.id,
        cancellationReason: "Declined by rider",
      },
    });
    onRefresh();
    onDeclined();
  }

  return (
    <View style={styles.requestScreen}>
      <View style={styles.requestPulsePill}>
        <Volume2 size={19} color="#FF6B00" />
        <Text style={styles.requestPulseText}>Request Incoming</Text>
      </View>
      <View style={styles.fakeMapGrid}>
        <View style={styles.fakeRouteLine} />
        <View style={styles.fakeRouteStart} />
        <View style={styles.fakeRouteEnd} />
      </View>
      {ride ? (
        <View style={styles.requestSheet}>
          <View style={styles.requestFareRow}>
            <View>
              <Text style={styles.walletLabel}>Estimated Fare</Text>
              <Text style={styles.requestFare}>{money(ride.estimatedFare ?? ride.finalFare, ride.currency ?? "GHS")}</Text>
            </View>
            <Pill label="Cash" tone="success" />
          </View>
          <View style={styles.requestStops}>
            <View style={styles.requestStopRow}>
              <MapPin size={18} color="#FF6B00" />
              <View>
                <Text style={styles.requestStopTitle}>{ride.pickupAddress}</Text>
                <Text style={styles.requestStopMeta}>Pickup point</Text>
              </View>
            </View>
            <View style={styles.requestStopRow}>
              <MapPin size={18} color="#EF4444" />
              <View>
                <Text style={styles.requestStopTitle}>{ride.destinationAddress}</Text>
                <Text style={styles.requestStopMeta}>{ride.passenger?.user?.fullName ?? "Passenger details pending"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.requestActions}>
            <Pressable style={styles.declineButton} onPress={declineRide}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
            <Pressable style={styles.acceptButton} onPress={acceptRide}>
              <Text style={styles.acceptButtonText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <EmptyState title="No ride request." body="New assignments will appear here when dispatch selects your rider profile." />
      )}
    </View>
  );
}
