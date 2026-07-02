import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike } from "lucide-react-native";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import type { AuthMode } from "@/types";

export default function LoginScreen() {
  const { signIn } = useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const path = mode === "login" ? "/auth/rider/login" : "/auth/rider/signup";
      const body =
        mode === "login"
          ? { phoneE164: phoneData.phoneE164, password }
          : { fullName, phoneCountryCode: phoneData.phoneCountryCode, phoneLocal: phoneData.phoneLocal, password };

      const result = await api<AuthResponse>(path, { method: "POST", body });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      router.replace("/(main)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                <Bike size={28} color={colors.textOnPrimary} />
              </View>
            </View>
            <Text style={styles.brand}>OkadaGo Rider</Text>
            <Text style={styles.title}>{mode === "login" ? "Driver login" : "Join as rider"}</Text>
            <Text style={styles.subtitle}>Earn on rides and deliveries across Accra</Text>
          </View>

          <View style={styles.tabs}>
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabActive]}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>{m === "login" ? "Sign in" : "Sign up"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            {mode === "signup" ? (
              <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Kofi Asante" autoCapitalize="words" />
            ) : null}
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="024 123 4567" keyboardType="phone-pad" />
            <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label={mode === "login" ? "Continue" : "Create account"} variant="accent" loading={loading} onPress={submit} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xxl, gap: spacing.xxl },
  hero: { gap: spacing.sm, alignItems: "flex-start" },
  logoWrap: { marginBottom: spacing.sm },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { ...typography.label, color: colors.primary, letterSpacing: 1.5 },
  title: { ...typography.hero, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  tabs: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 4 },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center", borderRadius: radius.md },
  tabActive: { backgroundColor: colors.background, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { ...typography.bodyMedium, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  form: { gap: spacing.lg },
  error: { ...typography.caption, color: colors.danger },
});
