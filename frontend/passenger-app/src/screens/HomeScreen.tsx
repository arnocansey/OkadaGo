import { Pressable, Text, View } from "react-native";
import { Bell, Bike, ChevronDown, Grid3X3, MapPin, Package, Plus, Utensils, WalletCards } from "lucide-react-native";
import { money } from "../api";
import { Card, EmptyState, PrimaryButton, styles } from "../components/ui";
import type { Ride, SessionUser, Wallet } from "../types";

export function HomeScreen({
  user,
  wallets,
  rides,
  onBook,
  onBookDelivery,
  onTrack,
  onWallet,
  onMenu,
}: {
  user: SessionUser;
  wallets: Wallet[];
  rides: Ride[];
  onBook: () => void;
  onBookDelivery: () => void;
  onTrack: () => void;
  onWallet: () => void;
  onMenu: () => void;
}) {
  const cashWallet = wallets.find((wallet) => wallet.type === "PASSENGER_CASHLESS") ?? wallets[0];
  const activeRide = rides.find((ride) => !["COMPLETED", "CANCELLED"].includes(ride.status));
  const firstName = user.fullName.split(" ")[0] || "Passenger";

  return (
    <>
      <View style={styles.homeTopRow}>
        <View style={styles.locationCluster}>
          <MapPin size={20} color="#FF6B00" />
          <Text style={styles.locationText}>Accra</Text>
          <ChevronDown size={18} color="#9CA3AF" />
        </View>
        <Pressable style={styles.circleButton}>
          <Bell size={20} color="#FFFFFF" />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      <Text style={styles.hello}>Hello, {firstName}</Text>
      <Card style={styles.orangeHeroCard}>
        <View style={styles.heroShape} />
        <Text style={styles.orangeHeroTitle}>Quick rides. Safe rides. Better rides.</Text>
        <PrimaryButton label={activeRide ? "Track ride" : "Book a ride"} onPress={activeRide ? onTrack : onBook} dark />
      </Card>

      <Card style={styles.compactWalletCard}>
        <View style={styles.walletIconShell}>
          <WalletCards size={22} color="#FF6B00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>{money(cashWallet?.availableBalance, cashWallet?.currency ?? user.preferredCurrency)}</Text>
        </View>
        <PrimaryButton label="Top Up" onPress={onWallet} />
      </Card>

      <View style={styles.blockHeaderRow}>
        <Text style={styles.blockTitle}>Explore</Text>
      </View>
      <View style={styles.serviceGridFour}>
        {[
          { label: "Ride", Icon: Bike, action: onBook },
          { label: "Food", Icon: Utensils, action: onMenu },
          { label: "Delivery", Icon: Package, action: onBookDelivery },
          { label: "More", Icon: Grid3X3, action: onMenu },
        ].map(({ label, Icon, action }) => (
          <Pressable key={label} style={styles.serviceIconTile} onPress={action}>
            <View style={styles.serviceIconBox}>
              <Icon size={26} color="#FF6B00" />
            </View>
            <Text style={styles.serviceIconLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.blockHeaderRow}>
        <Text style={styles.blockTitle}>Where to?</Text>
      </View>
      <Card style={styles.placeListCard}>
        {activeRide ? (
          <Pressable style={styles.placeRow} onPress={onTrack}>
            <View style={styles.placeIcon}><MapPin size={18} color="#FFFFFF" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeTitle}>Active ride</Text>
              <Text style={styles.placeSubtitle}>{activeRide.pickupAddress} to {activeRide.destinationAddress}</Text>
            </View>
          </Pressable>
        ) : (
          <EmptyState title="No active ride." body="Book a ride and your live trip status will appear here." />
        )}
        <Pressable style={styles.placeRow} onPress={onBook}>
          <View style={styles.placeIcon}><Plus size={18} color="#FF6B00" /></View>
          <Text style={styles.addPlaceText}>Add New Place</Text>
        </Pressable>
      </Card>
    </>
  );
}
