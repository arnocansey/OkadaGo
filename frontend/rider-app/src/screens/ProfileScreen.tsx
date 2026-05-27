import { Pressable, Text, View } from "react-native";
import { ChevronRight, FileText, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react-native";
import { Card, EmptyState, ListRow, Pill, SectionTitle, styles } from "../components/ui";
import type { ServiceZone, SessionUser } from "../types";

export function ProfileScreen({
  user,
  zones,
  onDocuments,
  onSettings,
  onWallet,
  onLogout,
}: {
  user: SessionUser;
  zones: ServiceZone[];
  onDocuments: () => void;
  onSettings: () => void;
  onWallet: () => void;
  onLogout: () => void;
}) {
  const initials = (user.fullName || "Rider")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user.fullName}</Text>
          <Text style={styles.profilePhone}>{user.phoneE164}</Text>
          <Pill label={user.riderApprovalStatus ?? "Pending approval"} tone={user.riderApprovalStatus === "APPROVED" ? "success" : "warning"} />
        </View>
      </View>

      <Card>
        <ListRow title="Phone" body={user.phoneE164} meta="Primary contact" />
        <ListRow title="Email" body={user.email ?? "Not added"} meta="Account email" />
        <ListRow title="Service area" body={zones[0] ? `${zones[0].name}, ${zones[0].city}` : "No zone loaded"} meta="Dispatch zone" />
      </Card>

      <View style={styles.profileMenu}>
        <Pressable style={styles.profileMenuRow} onPress={onDocuments}>
          <View style={styles.profileMenuIcon}><FileText size={20} color="#9CA3AF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileMenuTitle}>Documents</Text>
            <Text style={styles.profileMenuMeta}>License, insurance and vehicle records</Text>
          </View>
          <ChevronRight size={20} color="#6B7280" />
        </Pressable>
        <Pressable style={styles.profileMenuRow} onPress={onSettings}>
          <View style={styles.profileMenuIcon}><Settings size={20} color="#9CA3AF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileMenuTitle}>Settings</Text>
            <Text style={styles.profileMenuMeta}>Notifications and account preferences</Text>
          </View>
          <ChevronRight size={20} color="#6B7280" />
        </Pressable>
        <Pressable style={styles.profileMenuRow} onPress={onSettings}>
          <View style={styles.profileMenuIcon}><ShieldCheck size={20} color="#9CA3AF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileMenuTitle}>Safety Center</Text>
            <Text style={styles.profileMenuMeta}>Emergency and trip safety controls</Text>
          </View>
          <ChevronRight size={20} color="#6B7280" />
        </Pressable>
        <Pressable style={styles.profileMenuRow} onPress={onWallet}>
          <View style={styles.profileMenuIcon}><UserRound size={20} color="#9CA3AF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileMenuTitle}>Rider Account</Text>
            <Text style={styles.profileMenuMeta}>{user.preferredCurrency} settlement profile</Text>
          </View>
          <ChevronRight size={20} color="#6B7280" />
        </Pressable>
        <Pressable style={styles.profileMenuRow} onPress={onLogout}>
          <View style={styles.profileMenuIcon}><LogOut size={20} color="#EF4444" /></View>
          <Text style={styles.profileLogoutText}>Logout</Text>
        </Pressable>
      </View>

      <Card>
        <SectionTitle kicker="Documents" title="Compliance status" />
        <EmptyState title="No document records yet." body="Your upload and approval status will appear here." />
      </Card>
    </>
  );
}
