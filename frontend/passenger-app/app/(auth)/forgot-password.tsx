import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/theme/tokens";

export default function ForgotPasswordScreen() {
  const { signIn } = useApp();
  const { colors, typography } = useTheme();

  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugCode, setDebugCode] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        flex: { flex: 1 },
        content: { padding: spacing.xxl, gap: spacing.xxl },
        backBtn: { marginBottom: -spacing.md },
        hero: { gap: spacing.sm, alignItems: "flex-start" },
        logoWrap: { marginBottom: spacing.sm },
        title: { ...typography.hero, color: colors.text },
        subtitle: { ...typography.body, color: colors.textSecondary },
        form: { gap: spacing.lg },
        error: { ...typography.caption, color: colors.danger },
        debugBox: {
          backgroundColor: colors.warningLight,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        debugLabel: { ...typography.captionMedium, color: colors.warning, marginBottom: spacing.xs },
        debugCode: { ...typography.h1, color: colors.text, textAlign: "center", letterSpacing: 6 },
        footer: { alignItems: "center", gap: spacing.sm },
        footerText: { ...typography.caption, color: colors.textMuted },
        footerLink: { ...typography.captionMedium, color: colors.primary },
      }),
    [colors, typography],
  );

  async function handleSendCode() {
    setError("");
    if (phone.replace(/\s/g, "").length < 9) {
      setError("Enter a valid Ghanaian phone number");
      return;
    }
    setLoading(true);
    try {
      const { phoneE164 } = phoneParts(phone);
      const res = await api<{ sent: boolean; expiresInSeconds: number; debugCode?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: { phoneE164 } },
      );
      if (res.debugCode) setDebugCode(res.debugCode);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { phoneE164 } = phoneParts(phone);
      const result = await api<AuthResponse>("/auth/reset-password", {
        method: "POST",
        body: { phoneE164, code: code.trim(), newPassword },
      });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      router.replace("/(main)");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed. Check code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backBtn} onPress={() => (step === "reset" ? setStep("phone") : router.back())}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <BrandLogo variant="wordmark" size={28} />
            </View>
            <Text style={styles.title}>{step === "phone" ? "Reset Password" : "Enter Code"}</Text>
            <Text style={styles.subtitle}>
              {step === "phone"
                ? "Enter your phone number and we'll send you a verification code."
                : "Enter the 6-digit code and your new password."}
            </Text>
          </View>

          <View style={styles.form}>
            {step === "phone" ? (
              <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="024 123 4567" keyboardType="phone-pad" />
            ) : (
              <>
                {debugCode ? (
                  <View style={styles.debugBox}>
                    <Text style={styles.debugLabel}>Development mode — OTP code:</Text>
                    <Text style={styles.debugCode}>{debugCode}</Text>
                  </View>
                ) : null}
                <Input label="Verification code" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" maxLength={6} />
                <Input label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={step === "phone" ? "Send Code" : "Reset Password"}
              variant="accent"
              loading={loading}
              onPress={step === "phone" ? handleSendCode : handleReset}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerText}>
                Back to <Text style={styles.footerLink}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
