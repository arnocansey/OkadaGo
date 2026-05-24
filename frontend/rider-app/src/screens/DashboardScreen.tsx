import { Text, View } from "react-native";
import { money } from "../api";
import { Card, EmptyState, MapPanel, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Delivery, Ride, Session, Wallet } from "../types";

export function DashboardScreen({
  session,
  wallets,
  rides,
  deliveries,
  online,
  onOpenActiveTrip,
  onOpenIncentives,
  onOpenDocuments,
}: {
  session: Session;
  wallets: Wallet[];
  rides: Ride[];
  deliveries: Delivery[];
  online: boolean;
  onOpenActiveTrip: () => void;
  onOpenIncentives: () => void;
  onOpenDocuments: () => void;
}) {
  const settlementWallet = wallets.find((wallet) => wallet.type === "RIDER_SETTLEMENT") ?? wallets[0];
  const activeRide = rides.find((ride) => !["completed", "cancelled"].includes((ride.status ?? "").toLowerCase()));
  const activeDelivery = deliveries.find(
    (delivery) =>
      delivery.rider?.id === session.user.riderProfileId &&
      !["delivered", "cancelled"].includes((delivery.status ?? "").toLowerCase())
  );
  const openDeliveryCount = deliveries.filter((delivery) => (delivery.status ?? "").toLowerCase() === "searching").length;
  const todayEarnings = rides
    .filter((ride) => (ride.status ?? "").toLowerCase() === "completed" && new Date(ride.createdAt ?? 0).toDateString() === new Date().toDateString())
    .reduce((sum, ride) => sum + Number(ride.riderEarnings ?? 0), 0);
  const riderName = session.user.fullName || "Rider";

  return (
    <>
      <Text style={styles.hello}>Welcome back, {riderName.split(" ")[0] || "Rider"}</Text>
      <Text style={styles.pageTitle}>{online ? "Ready for work" : "Go online to earn"}</Text>
      <Pill label={online ? "Online" : "Offline"} tone={online ? "success" : "danger"} />
      <MapPanel
        title={activeRide ? activeRide.status.toLowerCase() : activeDelivery ? activeDelivery.status.toLowerCase() : "No active trip"}
        subtitle={
          activeRide
            ? `${activeRide.pickupAddress} to ${activeRide.destinationAddress}`
            : activeDelivery
              ? `${activeDelivery.packageDescription}: ${activeDelivery.pickupAddress} to ${activeDelivery.dropoffAddress}`
              : "Go online to receive trips and deliveries."
        }
      />
      <View style={styles.grid}>
        <StatCard label="Today" value={money(todayEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Open delivery" value={`${openDeliveryCount}`} />
      </View>
      <View style={styles.grid}>
        <StatCard label="Settlement" value={money(settlementWallet?.availableBalance, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Queue" value={`${rides.length + deliveries.length}`} />
      </View>
      <Card>
        <SectionTitle kicker="Current work" title={activeRide ? "Assigned ride" : activeDelivery ? "Assigned delivery" : "Waiting for work"} />
        {activeRide ? (
          <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{activeRide.pickupAddress} to {activeRide.destinationAddress}</Text>
        ) : activeDelivery ? (
          <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{activeDelivery.packageDescription}: {activeDelivery.pickupAddress} to {activeDelivery.dropoffAddress}</Text>
        ) : (
          <EmptyState title="No active trip or delivery." body="Assigned trips and deliveries will appear here once dispatch or matching selects you." />
        )}
        <PrimaryButton label={activeRide || activeDelivery ? "Open work queue" : "Check queue"} onPress={onOpenActiveTrip} />
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
