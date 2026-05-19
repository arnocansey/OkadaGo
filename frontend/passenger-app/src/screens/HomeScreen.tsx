import { Text, View } from "react-native";
import { money } from "../api";
import { Card, EmptyState, IconBadge, Pill, PrimaryButton, SectionTitle, ServiceTile, StatCard, styles } from "../components/ui";
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
  const completedTrips = rides.filter((ride) => ride.status === "COMPLETED").length;

  return (
    <>
      <Text style={styles.hello}>Hello, {user.fullName.split(" ")[0] || "Passenger"}</Text>
      <Text style={styles.pageTitle}>Move fast across the city.</Text>
      <Card style={styles.yellowCard}>
        <Pill label={activeRide ? activeRide.status : "Ready"} tone="warning" />
        <IconBadge label="GO" tone="dark" />
        <Text style={styles.heroLabel}>Active trip</Text>
        <Text style={styles.heroTitle}>{activeRide ? activeRide.status.toLowerCase() : "No active ride"}</Text>
        <Text style={styles.heroCopy}>{activeRide ? `${activeRide.pickupAddress} to ${activeRide.destinationAddress}` : "Book a ride and your live trip status will appear here."}</Text>
        <PrimaryButton label={activeRide ? "Track ride" : "Ride now"} onPress={activeRide ? onTrack : onBook} dark />
      </Card>
      <View style={styles.grid}>
        <StatCard label="Wallet" value={money(cashWallet?.availableBalance, cashWallet?.currency ?? user.preferredCurrency)} />
        <StatCard label="Completed" value={`${completedTrips}`} />
      </View>
      <Card>
        <SectionTitle kicker="Services" title="What do you need today?" />
        <View style={styles.grid}>
          <ServiceTile icon="BIKE" title="Bike" body="Fast city movement" />
          <ServiceTile icon="SEND" title="Delivery" body="Send parcels door to door" />
        </View>
        <PrimaryButton label="Book ride or delivery" onPress={onBook} />
      </Card>
      <Card>
        <SectionTitle kicker="Saved places" title="Your saved pickup points" />
        <EmptyState title="No saved places yet." body="Saved places will show here once the backend exposes passenger address storage." />
        <PrimaryButton label="Open menu" onPress={onMenu} dark />
      </Card>
    </>
  );
}
