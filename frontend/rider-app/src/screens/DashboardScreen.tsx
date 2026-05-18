import { Text, View } from "react-native";
import { money } from "../api";
import { Card, EmptyState, MapPanel, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Ride, Session, Wallet } from "../types";

export function DashboardScreen({
  session,
  wallets,
  rides,
  online,
  onOpenActiveTrip,
  onOpenIncentives,
  onOpenDocuments,
}: {
  session: Session;
  wallets: Wallet[];
  rides: Ride[];
  online: boolean;
  onOpenActiveTrip: () => void;
  onOpenIncentives: () => void;
  onOpenDocuments: () => void;
}) {
  const settlementWallet = wallets.find((wallet) => wallet.type === "RIDER_SETTLEMENT") ?? wallets[0];
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
  const todayEarnings = rides.filter((ride) => ride.status === "COMPLETED" && new Date(ride.createdAt ?? 0).toDateString() === new Date().toDateString()).reduce((sum, ride) => sum + Number(ride.riderEarnings ?? 0), 0);
  return (
    <>
      <Text style={styles.hello}>Welcome back, {session.user.fullName.split(" ")[0] || "Rider"}</Text>
      <Text style={styles.pageTitle}>{online ? "You are online" : "You are offline"}</Text>
      <MapPanel title={activeRide ? activeRide.status.toLowerCase() : "No active trip"} subtitle={activeRide ? `${activeRide.pickupAddress} to ${activeRide.destinationAddress}` : "Go online to receive backend-assigned trips."} />
      <View style={styles.grid}>
        <StatCard label="Today" value={money(todayEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Settlement" value={money(settlementWallet?.availableBalance, settlementWallet?.currency ?? session.user.preferredCurrency)} />
      </View>
      <Card>
        <SectionTitle kicker="Current trip" title={activeRide ? "Assigned ride" : "Waiting for ride"} />
        {activeRide ? <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{activeRide.pickupAddress} to {activeRide.destinationAddress}</Text> : <EmptyState title="No active trip." body="Assigned trips will appear here once dispatch or matching selects you." />}
        <PrimaryButton label={activeRide ? "Open trip flow" : "Check trip queue"} onPress={onOpenActiveTrip} />
      </Card>
      <Card>
        <SectionTitle kicker="Operations" title="Rider tools" />
        <View style={styles.grid}>
          <PrimaryButton label="Incentives" onPress={onOpenIncentives} />
          <PrimaryButton label="Documents" onPress={onOpenDocuments} />
        </View>
      </Card>
    </>
  );
}
