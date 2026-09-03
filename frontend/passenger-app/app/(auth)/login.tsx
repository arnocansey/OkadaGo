import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/theme/tokens";
import type { AuthMode } from "@/types";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useApp();
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
        tabs: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 4 },
        tab: { flex: 1, paddingVertical: spacing.md, alignItems: "center", borderRadius: radius.md },
        tabActive: { backgroundColor: colors.background, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        tabText: { ...typography.bodyMedium, color: colors.textMuted },
        tabTextActive: { color: colors.primary },
        form: { gap: spacing.lg },
        error: { ...typography.caption, color: colors.danger },
        forgotLink: { ...typography.captionMedium, color: colors.primary, textAlign: "right" },
        legal: { ...typography.caption, color: colors.textMuted, textAlign: "center", lineHeight: 18 },
        legalLink: { textDecorationLine: "underline", color: colors.textSecondary },
      }),
    [colors, typography],
  );

  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const path = mode === "login" ? "/auth/passenger/login" : "/auth/passenger/signup";
      const body =
        mode === "login"
          ? { phoneE164: phoneData.phoneE164, password }
          : {
              fullName,
              email: email.trim() || undefined,
              phoneCountryCode: phoneData.phoneCountryCode,
              phoneLocal: phoneData.phoneLocal,
              phoneE164: phoneData.phoneE164,
              password,
              preferredCurrency: "GHS",
            };

      const result = await api<AuthResponse>(path, { method: "POST", body });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      const prompted = await AsyncStorage.getItem("@okadago_passenger_location_prompted");
      router.replace(prompted === "seen" ? "/(main)" : "/(auth)/location-permission");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <BrandLogo variant="wordmark" size={28} />
            </View>
            <Text style={styles.title}>{mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}</Text>
            <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
          </View>

          <View style={styles.tabs}>
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabActive]}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === "login" ? t("auth.signIn") : t("auth.signUp")}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            {mode === "signup" ? (
              <Input label={t("auth.fullName")} value={fullName} onChangeText={setFullName} placeholder="Kofi Asante" autoCapitalize="words" />
            ) : null}
            <Input label={t("auth.phone")} value={phone} onChangeText={setPhone} placeholder="024 123 4567" keyboardType="phone-pad" />
            {mode === "signup" ? (
              <Input label={t("auth.email")} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            ) : null}
            <Input label={t("auth.password")} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

            {mode === "login" ? (
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <Text style={styles.forgotLink}>{t("auth.forgotPassword")}</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={mode === "login" ? t("auth.continue") : t("auth.createAccount")}
              variant="accent"
              loading={loading}
              onPress={submit}
              fullWidth
            />
          </View>

          <Text style={styles.legal}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalLink}>Terms of Service</Text> and{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
