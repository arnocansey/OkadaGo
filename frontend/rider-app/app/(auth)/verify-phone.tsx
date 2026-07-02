import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { spacing } from "@/theme/tokens";

export default function VerifyPhoneScreen() {
  const { session, refreshSession, signOut } = useApp();
  const { colors, typography } = useTheme();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xxl, gap: spacing.xl },
        hero: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
        icon: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
        },
        title: { ...typography.h2, color: colors.text, textAlign: "center" },
        subtitle: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
        phone: { ...typography.bodySemibold, color: colors.primary, textAlign: "center" },
        message: { ...typography.caption, color: colors.primary, textAlign: "center" },
        error: { ...typography.caption, color: colors.danger, textAlign: "center" },
      }),
    [colors, typography],
  );

  async function requestOtp() {
    if (!session) return;
    setSending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ sent: boolean; debugCode?: string }>("/auth/otp/request", {
        method: "POST",
        body: { phoneE164: session.user.phoneE164 },
      });
      setMessage("Verification code sent.");
      setDebugCode(result.debugCode ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    if (!session) return;
    setVerifying(true);
    setError("");
    try {
      await api("/auth/otp/verify", {
        method: "POST",
        body: { phoneE164: session.user.phoneE164, code: code.trim() },
      });
      await refreshSession();
      router.replace("/(main)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.icon}>
              <ShieldCheck size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>
              Confirm your number before accepting trips. We sent a 6-digit code to:
            </Text>
            <Text style={styles.phone}>{session?.user.phoneE164}</Text>
          </View>

          <Input
            label="Verification code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
          />

          {debugCode ? <Text style={styles.message}>Dev code: {debugCode}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Send code" variant="outline" loading={sending} onPress={() => void requestOtp()} fullWidth />
          <Button
            label="Verify and continue"
            loading={verifying}
            onPress={() => void verifyOtp()}
            fullWidth
            disabled={code.trim().length !== 6}
          />
          <Button
            label="Sign out"
            variant="ghost"
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/login");
            }}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
