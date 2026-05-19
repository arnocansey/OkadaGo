import { Card, EmptyState, ListRow, Pill, PrimaryButton, SectionTitle } from "../components/ui";
import type { ServiceZone, SessionUser } from "../types";

export function ProfileScreen({
  user,
  zones,
  onDocuments,
  onSettings,
  onLogout,
}: {
  user: SessionUser;
  zones: ServiceZone[];
  onDocuments: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <SectionTitle kicker="Profile" title={user.fullName} />
      <Card>
        <Pill label={user.riderApprovalStatus ?? "Pending approval"} tone={user.riderApprovalStatus === "APPROVED" ? "success" : "warning"} />
        <ListRow title="Phone" body={user.phoneE164} meta="Primary contact" />
        <ListRow title="Email" body={user.email ?? "Not added"} meta="Account email" />
        <ListRow title="Rider ID" body={user.riderProfileId ?? "Not available"} meta="Backend profile" />
        <ListRow title="Service area" body={zones[0] ? `${zones[0].name}, ${zones[0].city}` : "No zone loaded"} meta="Dispatch zone" />
        <PrimaryButton label="Documents" onPress={onDocuments} />
        <PrimaryButton label="Settings" onPress={onSettings} />
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
      <Card>
        <SectionTitle kicker="Documents" title="Compliance status" />
        <EmptyState title="No document records exposed yet." body="When backend document endpoints are available, this screen can show upload and approval status here." />
      </Card>
    </>
  );
}
