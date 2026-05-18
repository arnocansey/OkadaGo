import { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { API_BASE_URL, api, phoneParts } from "../api";
import { Card, Field, PrimaryButton, styles } from "../components/ui";
import type { AuthMode, Session } from "../types";

export function AuthScreen({ onSession }: { onSession: (session: Session) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const phonePayload = phoneParts(phone);
      const payload = mode === "login"
        ? { phoneE164: phonePayload.phoneE164, phoneLocal: phonePayload.phoneLocal, password, device: { platform: "mobile" } }
        : { fullName, email: email.trim() || undefined, preferredCurrency: "GHS", password, ...phonePayload, device: { platform: "mobile" }, vehicle: vehiclePlate.trim() && vehicleMake.trim() && vehicleModel.trim() ? { make: vehicleMake.trim(), model: vehicleModel.trim(), plateNumber: vehiclePlate.trim() } : undefined };
      const session = await api<Session>(mode === "login" ? "/auth/rider/login" : "/auth/rider/signup", { method: "POST", body: payload });
      onSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 34, gap: 18 }}>
        <View style={{ minHeight: 280, justifyContent: "flex-end", gap: 12, paddingBottom: 10 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#F5B800", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#111111", fontSize: 34, fontWeight: "900" }}>O</Text></View>
          <Text style={styles.kicker}>OKADAGO RIDER</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 42, lineHeight: 44, fontWeight: "900", letterSpacing: -1.4 }}>Earn, settle, and manage every trip.</Text>
          <Text style={styles.muted}>Live rider auth, trip records, wallets, payouts, and availability.</Text>
        </View>
        <Card>
          <View style={{ flexDirection: "row", padding: 4, backgroundColor: "#111111", borderRadius: 999 }}>
            {(["login", "signup"] as const).map((item) => (
              <Text key={item} onPress={() => setMode(item)} style={{ flex: 1, paddingVertical: 11, borderRadius: 999, textAlign: "center", overflow: "hidden", backgroundColor: mode === item ? "#F5B800" : "transparent", color: mode === item ? "#111111" : "#A8ADB6", fontWeight: "900" }}>{item === "login" ? "Login" : "Join fleet"}</Text>
            ))}
          </View>
          {mode === "signup" ? (
            <>
              <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" />
              <Field label="Vehicle make" value={vehicleMake} onChangeText={setVehicleMake} placeholder="Vehicle manufacturer" />
              <Field label="Vehicle model" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Vehicle model" />
              <Field label="Vehicle plate" value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="Optional plate number" />
            </>
          ) : null}
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="0240000000" keyboardType="phone-pad" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" secureTextEntry />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <PrimaryButton label={busy ? "Please wait..." : mode === "login" ? "Login" : "Create rider account"} onPress={submit} disabled={busy} />
          <Text style={{ color: "#6F7682", fontSize: 11, textAlign: "center" }}>{API_BASE_URL}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
