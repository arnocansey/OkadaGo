import { Text } from "react-native";
import { Card, ListRow, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function SettingsScreen({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <>
      <SectionTitle kicker="Settings" title="Rider account" />
      <Card>
        <Pill label="Account controls" tone="warning" />
        <Text style={styles.emptyTitle}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
        <ListRow title="Notifications" body="Ride, delivery, payout, and settlement alerts." meta="Pending backend endpoint" />
        <ListRow title="Safety" body="Emergency and document controls will live here." meta="Pending backend endpoint" />
        <ListRow title="Device" body="Session and device management can be wired here." meta="Pending backend endpoint" />
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
