import { Text, View } from "react-native";
import { Card, PrimaryButton, SectionTitle } from "../components/ui";
import type { SessionUser } from "../types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: "#2A2A2A", paddingBottom: 12 }}>
      <Text style={{ color: "#9EA4AE", fontSize: 13, marginTop: 4 }}>{label}</Text>
      <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginTop: 5 }}>{value}</Text>
    </View>
  );
}

export function ProfileScreen({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <>
      <SectionTitle kicker="Profile" title={user.fullName} />
      <Card>
        <InfoRow label="Phone" value={user.phoneE164} />
        <InfoRow label="Email" value={user.email ?? "Not added"} />
        <InfoRow label="Currency" value={user.preferredCurrency} />
        <InfoRow label="Passenger ID" value={user.passengerProfileId ?? "Not available"} />
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
