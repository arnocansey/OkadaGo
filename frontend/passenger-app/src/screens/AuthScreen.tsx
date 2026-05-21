import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { api, phoneParts } from "../api";
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <View style={styles.authHero}>
            <View style={styles.brandMarkLarge}>
              <Text style={styles.brandIconLarge}>O</Text>
            </View>
            <Text style={styles.kicker}>OKADAGO PASSENGER</Text>
            <Text style={styles.authTitle}>Book reliable rides without the clutter.</Text>
            <Text style={styles.muted}>Sign in to book, track, pay, and review your ride history.</Text>
          </View>

          <Card>
            <View style={styles.modeTabs}>
              {(["login", "signup"] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setMode(item)}
                  style={[styles.modeTab, mode === item && styles.modeTabActive]}
                >
                  <Text style={[styles.modeTabText, mode === item && styles.modeTabTextActive]}>{item === "login" ? "Login" : "Create account"}</Text>
                </Pressable>
              ))}
            </View>
            {mode === "signup" ? (
              <>
                <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
                <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" />
              </>
            ) : null}
            <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="0240000000" keyboardType="phone-pad" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" secureTextEntry />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <PrimaryButton label={busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"} onPress={submit} disabled={busy} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
