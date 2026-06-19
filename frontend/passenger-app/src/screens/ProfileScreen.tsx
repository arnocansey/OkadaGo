import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ChevronRight, CreditCard, Gift, HelpCircle, List, LogOut, MapPin, Settings, ShieldAlert, Tag, Wallet as WalletIcon } from "lucide-react-native";
import { money } from "../api";
import { Card, Field, ListRow, Pill, PrimaryButton, StatCard, styles } from "../components/ui";
import { BottomSheet } from "../components/BottomSheet";
import type { Delivery, Ride, SessionUser, Wallet } from "../types";

export function ProfileScreen({
  user,
  wallets,
  rides,
  deliveries,
  onSaveUser,
  onTrips,
  onWallet,
  onBookDelivery,
  onMenu,
  onLogout,
}: {
  user: SessionUser;
  wallets: Wallet[];
  rides: Ride[];
  deliveries: Delivery[];
  onSaveUser: (user: SessionUser) => void | Promise<void>;
  onTrips: () => void;
  onWallet: () => void;
  onBookDelivery: () => void;
  onMenu: () => void;
  onLogout: () => void;
}) {
  const wallet = wallets.find((item) => item.type === "PASSENGER_CASHLESS") ?? wallets[0];
  const completedTrips = rides.filter((ride) => ride.status === "COMPLETED").length;
  const activeDeliveries = deliveries.filter((delivery) => !["DELIVERED", "CANCELLED"].includes(delivery.status)).length;
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phoneE164);
  const [message, setMessage] = useState("");

  async function saveProfile() {
    const nextUser = {
      ...user,
      fullName: fullName.trim() || user.fullName,
      email: email.trim() || null,
      phoneE164: phone.trim() || user.phoneE164,
    };

    await onSaveUser(nextUser);
    setEditing(false);
    setMessage("Profile updated on this device.");
  }

  const initials = (user.fullName || "Passenger")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const unavailable = (label: string) => Alert.alert(label, "This section is not connected to the backend yet.");
  const menuItems = [
    { label: "My Trips", icon: List, meta: `${completedTrips} completed`, action: onTrips },
    { label: "My Wallet", icon: WalletIcon, meta: money(wallet?.availableBalance, wallet?.currency ?? user.preferredCurrency), action: onWallet },
    { label: "Payment Methods", icon: CreditCard, meta: user.preferredCurrency, action: onWallet },
    { label: "Promo Codes", icon: Tag, meta: "Coming soon", action: () => unavailable("Promo Codes") },
    { label: "Saved Places", icon: MapPin, meta: "Use booking map", action: onBookDelivery },
    { label: "Refer & Earn", icon: Gift, meta: "Coming soon", action: () => unavailable("Refer & Earn") },
    { label: "Safety Center", icon: ShieldAlert, meta: "OkadaGo standards", action: onMenu },
    { label: "Help & Support", icon: HelpCircle, meta: "Account shortcuts", action: onMenu },
    { label: "Settings", icon: Settings, meta: "Account preferences", action: onMenu },
  ];

  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user.fullName}</Text>
          <Text style={styles.profilePhone}>{user.phoneE164}</Text>
          <Pressable style={styles.profileEditPill} onPress={() => setEditing(true)}>
            <Text style={styles.profileEditText}>Edit Profile</Text>
          </Pressable>
        </View>
      </View>

      <Card>
        <Pill label="Passenger account" tone="success" />
        <View style={styles.grid}>
          <StatCard label="Wallet" value={money(wallet?.availableBalance, wallet?.currency ?? user.preferredCurrency)} />
          <StatCard label="Trips" value={`${completedTrips}`} />
         </View>
        <ListRow title="Email" body={user.email ?? "No email added"} meta="Account contact" />
        <ListRow title="Deliveries" body={`${activeDeliveries} active`} meta="Current package requests" />
        {message ? <Text style={styles.muted}>{message}</Text> : null}
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable key={item.label} style={styles.profileMenuRow} onPress={item.action}>
              <View style={styles.profileMenuIcon}>
                <Icon size={20} color="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileMenuTitle}>{item.label}</Text>
                <Text style={styles.profileMenuMeta}>{item.meta}</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
          );
        })}
        <Pressable style={styles.profileMenuRow} onPress={onLogout}>
          <View style={styles.profileMenuIcon}>
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text style={styles.profileLogoutText}>Logout</Text>
        </Pressable>
      </View>
    </>
  );
}
