import { Text, View } from "react-native";
import { money } from "../api";
import { Card, IconBadge, ListRow, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Delivery, Ride, SessionUser, Wallet } from "../types";

export function ProfileScreen({ user, wallets, rides, deliveries, onLogout }: { user: SessionUser; wallets: Wallet[]; rides: Ride[]; deliveries: Delivery[]; onLogout: () => void }) {
  const wallet = wallets.find((item) => item.type === "PASSENGER_CASHLESS") ?? wallets[0];
  const completedTrips = rides.filter((ride) => ride.status === "COMPLETED").length;
  const activeDeliveries = deliveries.filter((delivery) => !["DELIVERED", "CANCELLED"].includes(delivery.status)).length;

  return (
    <>
      <SectionTitle kicker="Profile" title={user.fullName} />
      <Card>
        <Pill label="Passenger account" tone="success" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBadge label={(user.fullName || "P").slice(0, 2).toUpperCase()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>{user.fullName}</Text>
            <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <StatCard label="Wallet" value={money(wallet?.availableBalance, wallet?.currency ?? user.preferredCurrency)} />
          <StatCard label="Trips" value={`${completedTrips}`} />
        </View>
        <ListRow title="Phone" body={user.phoneE164} meta="Primary contact" />
        <ListRow title="Currency" body={user.preferredCurrency} meta="Default wallet currency" />
        <ListRow title="Deliveries" body={`${activeDeliveries} active`} meta="Current package requests" />
        <ListRow title="Passenger ID" body={user.passengerProfileId ?? "Not available"} meta="Backend profile" />
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
