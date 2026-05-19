import { Text } from "react-native";
import { Card, ListRow, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function SideMenuScreen({ user, onTrips, onWallet, onProfile, onLogout }: { user: SessionUser; onTrips: () => void; onWallet: () => void; onProfile: () => void; onLogout: () => void }) {
  return (
    <>
      <SectionTitle kicker="Menu" title="Account shortcuts" />
      <Card>
        <Pill label="Passenger account" tone="success" />
        <Text style={styles.emptyTitle}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
        <ListRow title="Trips and deliveries" body="Review every ride and package request linked to your profile." meta="Live records" />
        <ListRow title="Wallet" body="Top up with Paystack and track wallet transactions." meta="Payments" />
        <PrimaryButton label="Trip history" onPress={onTrips} />
        <PrimaryButton label="Wallet" onPress={onWallet} />
        <PrimaryButton label="Profile" onPress={onProfile} />
        <PrimaryButton label="Logout" onPress={onLogout} dark />
      </Card>
    </>
  );
}
