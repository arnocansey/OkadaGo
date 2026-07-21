import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
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
        tabActive: {
          backgroundColor: colors.background,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        tabText: { ...typography.bodyMedium, color: colors.textMuted },
        tabTextActive: { color: colors.primary },
        form: { gap: spacing.lg },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );
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
      const path = mode === "login" ? "/auth/passenger/login" : "/auth/passenger/signup";
      const body =
        mode === "login"
          ? { phoneE164: phoneData.phoneE164, password }
          : { fullName, phoneCountryCode: phoneData.phoneCountryCode, phoneLocal: phoneData.phoneLocal, password };

      const result = await api<AuthResponse>(path, { method: "POST", body });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      if (result.user.isPhoneVerified === false) {
        router.replace("/(auth)/verify-phone");
        return;
      }
      router.replace("/(main)");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.authFailed"));
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
            <Text style={styles.brand}>OkadaGo</Text>
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
              <Input label={t("auth.fullName")} value={fullName} onChangeText={setFullName} placeholder="Ama Mensah" autoCapitalize="words" />
            ) : null}
            <Input label={t("auth.phone")} value={phone} onChangeText={setPhone} placeholder="024 123 4567" keyboardType="phone-pad" />
            <Input label={t("auth.password")} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={mode === "login" ? t("auth.continue") : t("auth.createAccount")}
              loading={loading}
              onPress={submit}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
