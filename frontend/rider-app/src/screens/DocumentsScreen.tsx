import { Text } from "react-native";
import { Card, EmptyState, ListRow, Pill, SectionTitle, styles } from "../components/ui";
import type { SessionUser } from "../types";

export function DocumentsScreen({ user }: { user: SessionUser }) {
  const approved = user.riderApprovalStatus === "APPROVED" || user.riderApprovalStatus === "approved";
  return (
    <>
      <SectionTitle kicker="Documents" title="Verification status" />
      <Card style={approved ? undefined : styles.lockedCard}>
        <Pill label={user.riderApprovalStatus ?? "Not submitted"} tone={approved ? "success" : "warning"} />
        <Text style={styles.emptyTitle}>{user.riderApprovalStatus ?? "Not submitted"}</Text>
        <ListRow title="License" body="Upload and review status will appear here." meta="Pending endpoint" />
        <ListRow title="National ID" body="Identity verification will appear here." meta="Pending endpoint" />
        <ListRow title="Vehicle document" body="Vehicle compliance will appear here." meta="Pending endpoint" />
      </Card>
      <EmptyState title="No uploaded documents." body="License, ID, and vehicle documents will be listed here from backend records." />
    </>
  );
}
