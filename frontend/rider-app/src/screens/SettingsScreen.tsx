import { Text } from "react-native";
import { Card, PrimaryButton, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function SettingsScreen({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <>
      <SectionTitle kicker="Settings" title="Rider account" />
      <Card>
        <Text style={styles.emptyTitle}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
        <Text style={styles.muted}>Notification, safety, and device settings can be wired once matching backend settings endpoints exist.</Text>
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
