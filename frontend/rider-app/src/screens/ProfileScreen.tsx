import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, FileText, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react-native";
import { Card, EmptyState, Field, ListRow, Pill, PrimaryButton, SectionTitle, styles } from "../components/ui";
import { BottomSheet } from "../components/BottomSheet";
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
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phoneE164);
  const [localUser, setLocalUser] = useState(user);
  const [message, setMessage] = useState("");

  function saveProfile() {
    setLocalUser({
      ...localUser,
      fullName: fullName.trim() || localUser.fullName,
      email: email.trim() || null,
      phoneE164: phone.trim() || localUser.phoneE164,
    });
    setEditing(false);
    setMessage("Profile updated locally.");
  }

  const initials = (localUser.fullName || "Rider")
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
          <Text style={styles.profileName}>{localUser.fullName}</Text>
          <Text style={styles.profilePhone}>{localUser.phoneE164}</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginTop: 4 }}>
            <Pill label={localUser.riderApprovalStatus ?? "Pending approval"} tone={localUser.riderApprovalStatus === "APPROVED" ? "success" : "warning"} />
            <Pressable style={styles.profileEditPill} onPress={() => setEditing(true)}>
              <Text style={styles.profileEditText}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Card>
        <SectionTitle kicker="Rider Details" title="Account Information" />
        <ListRow title="Phone" body={localUser.phoneE164} meta="Primary contact" />
        <ListRow title="Email" body={localUser.email ?? "Not added"} meta="Account email" />
        <ListRow title="Joined" body="April 15, 2024" meta="Registry date" />
        <ListRow title="Service area" body={zones[0] ? `${zones[0].name}, ${zones[0].city}` : "No zone loaded"} meta="Dispatch zone" />
        {message ? <Text style={styles.muted}>{message}</Text> : null}
      </Card>

      <Card>
        <SectionTitle kicker="Vehicle Details" title="Vehicle Information" />
        <ListRow title="Plate Number" body="GG 1234-20" meta="Lagos/Accra registered" />
        <ListRow title="Vehicle Type" body="Bajaj Boxer" meta="150cc motorcycle" />
      </Card>

      <BottomSheet visible={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+233..." keyboardType="phone-pad" />
        <View style={styles.grid}>
          <PrimaryButton label="Save profile" onPress={saveProfile} />
          <PrimaryButton label="Cancel" dark onPress={() => setEditing(false)} />
        </View>
      </BottomSheet>

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
            <Text style={styles.profileMenuMeta}>{localUser.preferredCurrency} settlement profile</Text>
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

