import { Text, View } from "react-native";
import { money } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Ride, SessionUser, Wallet } from "../types";

export function HomeScreen({
  user,
  wallets,
  rides,
  onBook,
  onTrack,
  onMenu,
}: {
  user: SessionUser;
  wallets: Wallet[];
  rides: Ride[];
  onBook: () => void;
  onTrack: () => void;
  onMenu: () => void;
}) {
  const cashWallet = wallets.find((wallet) => wallet.type === "PASSENGER_CASHLESS") ?? wallets[0];
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));

  return (
    <>
      <Text style={styles.hello}>Hello, {user.fullName.split(" ")[0] || "Passenger"}</Text>
      <Text style={styles.pageTitle}>Where are you going?</Text>
      <PrimaryButton label="Open menu" onPress={onMenu} dark />
      <Card style={styles.yellowCard}>
        <Text style={styles.heroLabel}>Active trip</Text>
        <Text style={styles.heroTitle}>{activeRide ? activeRide.status.toLowerCase() : "No active ride"}</Text>
        <Text style={styles.heroCopy}>{activeRide ? `${activeRide.pickupAddress} to ${activeRide.destinationAddress}` : "Book a ride and your live trip status will appear here."}</Text>
        <PrimaryButton label={activeRide ? "Track ride" : "Ride now"} onPress={activeRide ? onTrack : onBook} dark />
      </Card>
      <View style={styles.grid}>
        <StatCard label="Wallet" value={money(cashWallet?.availableBalance, cashWallet?.currency ?? user.preferredCurrency)} />
        <StatCard label="Trips" value={`${rides.length}`} />
      </View>
      <Card>
        <SectionTitle kicker="Services" title="Choose your ride type" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          {["Bike", "Express"].map((title) => (
            <View key={title} style={{ flex: 1, backgroundColor: "#111111", borderRadius: 22, padding: 14, gap: 8 }}>
              <View style={{ width: 38, height: 38, borderRadius: 15, backgroundColor: "#F5B800" }} />
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>{title}</Text>
              <Text style={styles.muted}>{title === "Bike" ? "Fast city movement" : "Priority pickup"}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card>
        <SectionTitle kicker="Saved places" title="Your saved pickup points" />
        <EmptyState title="No saved places yet." body="Saved places will show here once the backend exposes passenger address storage." />
      </Card>
    </>
  );
}
