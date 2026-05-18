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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const phonePayload = phoneParts(phone);
      const payload =
        mode === "login"
          ? { phoneE164: phonePayload.phoneE164, phoneLocal: phonePayload.phoneLocal, password, device: { platform: "mobile" } }
          : { fullName, email: email.trim() || undefined, preferredCurrency: "GHS", password, ...phonePayload, device: { platform: "mobile" } };
      const session = await api<Session>(mode === "login" ? "/auth/passenger/login" : "/auth/passenger/signup", { method: "POST", body: payload });
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
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#F5B800", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#111111", fontSize: 34, fontWeight: "900" }}>O</Text>
          </View>
          <Text style={styles.kicker}>OKADAGO PASSENGER</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 42, lineHeight: 44, fontWeight: "900", letterSpacing: -1.4 }}>Book reliable rides without the clutter.</Text>
          <Text style={styles.muted}>Sign in to book, track, pay, and review your real ride history.</Text>
        </View>

        <Card>
          <View style={{ flexDirection: "row", padding: 4, backgroundColor: "#111111", borderRadius: 999 }}>
            {(["login", "signup"] as const).map((item) => (
              <Text
                key={item}
                onPress={() => setMode(item)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 999,
                  textAlign: "center",
                  overflow: "hidden",
                  backgroundColor: mode === item ? "#F5B800" : "transparent",
                  color: mode === item ? "#111111" : "#A8ADB6",
                  fontWeight: "900",
                }}
              >
                {item === "login" ? "Login" : "Create account"}
              </Text>
            ))}
          </View>
          {mode === "signup" ? (
            <>
              <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" />
            </>
          ) : null}
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="0240000000" keyboardType="phone-pad" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" secureTextEntry />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <PrimaryButton label={busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"} onPress={submit} disabled={busy} />
          <Text style={{ color: "#6F7682", fontSize: 11, textAlign: "center" }}>{API_BASE_URL}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
