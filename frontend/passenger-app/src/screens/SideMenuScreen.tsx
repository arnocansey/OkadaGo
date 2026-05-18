import { Text } from "react-native";
import { Card, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function SideMenuScreen({ user, onTrips, onWallet, onProfile, onLogout }: { user: SessionUser; onTrips: () => void; onWallet: () => void; onProfile: () => void; onLogout: () => void }) {
  return (
    <>
      <SectionTitle kicker="Menu" title="Account shortcuts" />
      <Card>
        <Text style={styles.emptyTitle}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
        <PrimaryButton label="Trip history" onPress={onTrips} />
        <PrimaryButton label="Wallet" onPress={onWallet} />
        <PrimaryButton label="Profile" onPress={onProfile} />
        <PrimaryButton label="Logout" onPress={onLogout} dark />
      </Card>
    </>
  );
}
