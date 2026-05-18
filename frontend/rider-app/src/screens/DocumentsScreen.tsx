import { Text } from "react-native";
import { Card, EmptyState, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function DocumentsScreen({ user }: { user: SessionUser }) {
  return (
    <>
      <SectionTitle kicker="Documents" title="Verification status" />
      <Card style={user.riderApprovalStatus === "approved" ? undefined : styles.lockedCard}>
        <Text style={styles.emptyTitle}>{user.riderApprovalStatus ?? "Not submitted"}</Text>
        <Text style={styles.muted}>Document upload and review history will appear here when the backend exposes rider document endpoints.</Text>
      </Card>
      <EmptyState title="No uploaded documents." body="License, ID, and vehicle documents will be listed here from backend records." />
    </>
  );
}
