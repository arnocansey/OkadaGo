import { Pressable, Text, View } from "react-native";
import { Bell, Menu, Power, Star } from "lucide-react-native";
import { money } from "../api";
import { Card, EmptyState, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import { FloatingActionButton } from "../components/FloatingActionButton";
import type { Delivery, Ride, Session, Wallet } from "../types";

export function DashboardScreen({
  session,
  wallets,
  rides,
  deliveries,
  online,
  onToggleOnline,
  onOpenProfile,
  onRefresh,
  onOpenActiveTrip,
  onOpenIncentives,
  onOpenDocuments,
  onOpenEarnings,
  onOpenWallet,
  onSimulateRequest,
}: {
  session: Session;
  wallets: Wallet[];
  rides: Ride[];
  deliveries: Delivery[];
  online: boolean;
  onToggleOnline: () => void;
  onOpenProfile: () => void;
  onRefresh: () => void;
  onOpenActiveTrip: () => void;
  onOpenIncentives: () => void;
  onOpenDocuments: () => void;
  onOpenEarnings?: () => void;
  onOpenWallet?: () => void;
  onSimulateRequest?: () => void;
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
      <View style={styles.riderDashTop}>
        <Pressable style={styles.circleButton} onPress={onOpenProfile}>
          <Menu size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.riderBrandPill}>
          <View style={styles.logoMiniMark}><Text style={styles.logoMiniText}>O</Text></View>
          <Text style={styles.riderBrandText}>OkadaGo</Text>
        </View>
        <Pressable style={styles.circleButton} onPress={onRefresh}>
          <Bell size={20} color="#FFFFFF" />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      <View style={styles.riderGreetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Good Morning, {riderName.split(" ")[0] || "Rider"}</Text>
          <View style={styles.statusInline}>
            <View style={[styles.statusGlowDot, online ? styles.statusGlowOnline : styles.statusGlowOffline]} />
            <Text style={styles.muted}>{online ? "You are online" : "You are offline"}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: online }}
          style={[styles.riderSwitch, online && styles.riderSwitchOnline]}
          onPress={onToggleOnline}
        >
          <View style={[styles.riderSwitchKnob, online && styles.riderSwitchKnobOnline]} />
        </Pressable>
      </View>

      <Pressable onPress={onToggleOnline}>
        <Card style={[styles.goOnlineCard, online ? styles.goOnlineCardDark : styles.goOnlineCardOrange]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.goOnlineTitle, !online && styles.goOnlineTitleDark]}>{online ? "Ready for requests" : "Go Online"}</Text>
            <Text style={[styles.goOnlineSub, !online && styles.goOnlineSubDark]}>{online ? "Looking for rides nearby" : "Start accepting rides"}</Text>
          </View>
          <View style={[styles.powerButton, online ? styles.powerButtonOnline : styles.powerButtonOffline]}>
            <Power size={24} color={online ? "#EF4444" : "#FF6B00"} />
          </View>
        </Card>
      </Pressable>

      {/* Main Stats Grid */}
      <View style={styles.grid}>
        <StatCard label="Today's earnings" value={money(todayEarnings, settlementWallet?.currency ?? session.user.preferredCurrency)} />
        <StatCard label="Online time" value="3h 45m" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Completed" value={`${rides.filter((ride) => (ride.status ?? "").toLowerCase() === "completed").length} Rides`} />
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rating</Text>
          <View style={styles.ratingRow}><Text style={styles.statValue}>4.8</Text><Star size={17} color="#FF6B00" fill="#FF6B00" /></View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.statLabel, { marginHorizontal: 16, marginTop: 12, fontWeight: "900", color: "#FFFFFF" }]}>Quick Actions</Text>
      <View style={[styles.quickActionGrid, { marginHorizontal: 16 }]}>
        <Pressable style={styles.quickActionButton} onPress={onToggleOnline}>
          <Text style={styles.quickActionIcon}>{online ? "🔴" : "🟢"}</Text>
          <Text style={styles.quickActionLabel}>{online ? "Go Offline" : "Go Online"}</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={onOpenEarnings}>
          <Text style={styles.quickActionIcon}>💵</Text>
          <Text style={styles.quickActionLabel}>Earnings</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={onOpenIncentives}>
          <Text style={styles.quickActionIcon}>🎁</Text>
          <Text style={styles.quickActionLabel}>Incentives</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={onOpenWallet}>
          <Text style={styles.quickActionIcon}>💳</Text>
          <Text style={styles.quickActionLabel}>Wallet</Text>
        </Pressable>
      </View>

      {/* Weekly Performance */}
      <Card>
        <SectionTitle kicker="Performance" title="This week" />
        <View style={styles.performanceBars}>
          {[40, 60, 30, 80, 50, 90, 70].map((height, index) => (
            <View key={index} style={styles.performanceBarTrack}>
              <View style={[styles.performanceBar, { height: `${height}%` }, index === 6 && styles.performanceBarActive]} />
            </View>
          ))}
        </View>
        <View style={styles.performanceDays}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <Text key={day} style={styles.performanceDay}>{day}</Text>)}
        </View>
      </Card>

      {/* Current Work */}
      <Card>
        <SectionTitle kicker="Current work" title={activeRide ? "Assigned ride" : activeDelivery ? "Assigned delivery" : "Waiting for work"} />
        {activeRide ? (
          <Text style={styles.emptyTitle}>{activeRide.pickupAddress} to {activeRide.destinationAddress}</Text>
        ) : activeDelivery ? (
          <Text style={styles.emptyTitle}>{activeDelivery.packageDescription}: {activeDelivery.pickupAddress} to {activeDelivery.dropoffAddress}</Text>
        ) : (
          <EmptyState title="No active trip or delivery." body="Assigned trips and deliveries will appear here once dispatch or matching selects you." />
        )}
        <PrimaryButton label={activeRide || activeDelivery ? "Open work queue" : "Check queue"} onPress={onOpenActiveTrip} />
      </Card>

      {/* Dev Simulator Trigger */}
      {__DEV__ && onSimulateRequest && (
        <View style={{ marginHorizontal: 16, marginVertical: 12 }}>
          <PrimaryButton label="Simulate Incoming Request" onPress={onSimulateRequest} dark />
        </View>
      )}

      <FloatingActionButton
        icon={<Power size={24} color="#FFFFFF" />}
        onPress={onToggleOnline}
        label={online ? "Go Offline" : "Go Online"}
      />
    </>
  );
}
