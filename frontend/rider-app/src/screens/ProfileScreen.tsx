import { Text, View } from "react-native";
import { Card, EmptyState, PrimaryButton, SectionTitle } from "../components/ui";
import type { ServiceZone, SessionUser } from "../types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 12 }}>
      <Text style={{ color: "#9EA4AE", fontSize: 13, marginTop: 4 }}>{label}</Text>
      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginTop: 5 }}>{value}</Text>
    </View>
  );
}

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
        <InfoRow label="Phone" value={user.phoneE164} />
        <InfoRow label="Email" value={user.email ?? "Not added"} />
        <InfoRow label="Approval" value={user.riderApprovalStatus ?? "Pending"} />
        <InfoRow label="Rider ID" value={user.riderProfileId ?? "Not available"} />
        <InfoRow label="Service area" value={zones[0] ? `${zones[0].name}, ${zones[0].city}` : "No zone loaded"} />
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
