import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, ArrowLeft } from "lucide-react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, phoneParts } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

type Step = "phone" | "otp" | "newPassword";

export default function ForgotPasswordScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        flex: { flex: 1 },
        content: { padding: spacing.xxl, gap: spacing.xxl },
        hero: { gap: spacing.sm, alignItems: "flex-start" },
        logoWrap: { marginBottom: spacing.sm },
        title: { ...typography.hero, color: colors.text },
        subtitle: { ...typography.body, color: colors.textSecondary },
        form: { gap: spacing.lg },
        error: { ...typography.caption, color: colors.danger },
        success: { ...typography.caption, color: colors.primary },
        backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
        backText: { ...typography.bodyMedium, color: colors.textSecondary },
        row: { flexDirection: "row", justifyContent: "space-between" },
        phone: { ...typography.bodySemibold, color: colors.primary },
      }),
    [colors, typography],
  );

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);

  async function requestOtp() {
    setError("");
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const result = await api<{ sent: boolean; debugCode?: string }>("/auth/forgot-password", {
        method: "POST",
        body: { phoneE164: phoneData.phoneE164 },
      });
      setMessage("A 6-digit code was sent to your phone.");
      setDebugCode(result.debugCode ?? null);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const result = await api<{ verified: boolean }>("/auth/otp/verify", {
        method: "POST",
        body: { phoneE164: phoneData.phoneE164, code: code.trim() },
      });
      if (result.verified) {
        setMessage("Phone verified. Now set your new password.");
        setStep("newPassword");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      await api<{ reset: boolean }>("/auth/reset-password", {
        method: "POST",
        body: {
          phoneE164: phoneData.phoneE164,
          code: code.trim(),
          newPassword,
        },
      });
      setMessage("Password reset successful! You can now sign in.");
      setTimeout(() => router.replace("/(auth)/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password.");
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
              <BrandLogo variant="icon" size={60} />
            </View>
            <BrandLogo variant="wordmark" size={28} />
            <Text style={styles.title}>
              {step === "phone" ? "Reset your password" : step === "otp" ? "Enter code" : "New password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "phone"
                ? "Enter your phone number and we'll send you a verification code."
                : step === "otp"
                  ? `Enter the 6-digit code sent to:`
                  : "Choose a strong password for your account."}
            </Text>
            {step === "otp" && <Text style={styles.phone}>{phoneParts(phone).phoneE164}</Text>}
          </View>

          <View style={styles.form}>
            {step === "phone" && (
              <Input
                label="Phone number"
                value={phone}
                onChangeText={setPhone}
                placeholder="024 123 4567"
                keyboardType="phone-pad"
              />
            )}

            {step === "otp" && (
              <Input
                label="Verification code"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
              />
            )}

            {step === "newPassword" && (
              <>
                <Input
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />
                <Input
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                />
              </>
            )}

            {debugCode ? <Text style={styles.success}>Dev code: {debugCode}</Text> : null}
            {message && step !== "newPassword" ? <Text style={styles.success}>{message}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {step === "phone" && (
              <Button
                label="Send code"
                variant="accent"
                loading={loading}
                onPress={() => void requestOtp()}
                fullWidth
              />
            )}
            {step === "otp" && (
              <Button
                label="Verify code"
                variant="accent"
                loading={loading}
                onPress={() => void verifyOtp()}
                fullWidth
                disabled={code.trim().length !== 6}
              />
            )}
            {step === "newPassword" && (
              <Button
                label="Reset password"
                variant="accent"
                loading={loading}
                onPress={() => void resetPassword()}
                fullWidth
                disabled={newPassword.length < 8}
              />
            )}
          </View>

          <Button
            label="Back to sign in"
            variant="ghost"
            onPress={() => router.replace("/(auth)/login")}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
