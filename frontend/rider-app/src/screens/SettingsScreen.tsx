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
        <ListRow title="Notifications" body="Ride, delivery, payout, and settlement alerts." meta="Coming soon" />
        <ListRow title="Safety" body="Emergency and document controls will live here." meta="Coming soon" />
        <ListRow title="Device" body="Session and device management can be managed here." meta="Coming soon" />
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
