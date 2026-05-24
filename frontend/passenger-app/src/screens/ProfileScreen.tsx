import { useState } from "react";
import { Text, View } from "react-native";
import { money } from "../api";
import { Card, Field, IconBadge, ListRow, Pill, PrimaryButton, SectionTitle, StatCard, styles } from "../components/ui";
import type { Delivery, Ride, SessionUser, Wallet } from "../types";

export function ProfileScreen({
  user,
  wallets,
  rides,
  deliveries,
  onSaveUser,
  onLogout,
}: {
  user: SessionUser;
  wallets: Wallet[];
  rides: Ride[];
  deliveries: Delivery[];
  onSaveUser: (user: SessionUser) => void | Promise<void>;
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

  return (
    <>
      <SectionTitle kicker="Profile" title={user.fullName} />
      <Card>
        <Pill label="Passenger account" tone="success" />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconBadge label={(user.fullName || "P").slice(0, 2).toUpperCase()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>{user.fullName}</Text>
            <Text style={styles.muted}>{user.email ?? user.phoneE164}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <StatCard label="Wallet" value={money(wallet?.availableBalance, wallet?.currency ?? user.preferredCurrency)} />
          <StatCard label="Trips" value={`${completedTrips}`} />
        </View>
        {editing ? (
          <>
            <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+233..." keyboardType="phone-pad" />
            <View style={styles.grid}>
              <PrimaryButton label="Save profile" onPress={saveProfile} />
              <PrimaryButton label="Cancel" dark onPress={() => setEditing(false)} />
            </View>
          </>
        ) : (
          <>
            <ListRow title="Phone" body={user.phoneE164} meta="Primary contact" />
            <ListRow title="Email" body={user.email ?? "No email added"} meta="Account contact" />
            <ListRow title="Currency" body={user.preferredCurrency} meta="Default wallet currency" />
            <ListRow title="Deliveries" body={`${activeDeliveries} active`} meta="Current package requests" />
            {message ? <Text style={styles.muted}>{message}</Text> : null}
            <PrimaryButton label="Edit profile" onPress={() => setEditing(true)} />
          </>
        )}
        <PrimaryButton label="Logout" onPress={onLogout} />
      </Card>
    </>
  );
}
