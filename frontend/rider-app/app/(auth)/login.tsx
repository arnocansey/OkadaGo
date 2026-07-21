import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { registerPushToken } from "@/lib/push";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/theme/tokens";
import type { AuthMode } from "@/types";

type VehicleTypeOption = "okada" | "tricycle" | "bicycle";
type JobPreferenceOption = "rides_only" | "delivery_only" | "both";

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
        tabActive: { backgroundColor: colors.background, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
        tabText: { ...typography.bodyMedium, color: colors.textMuted },
        tabTextActive: { color: colors.primary },
        form: { gap: spacing.lg },
        error: { ...typography.caption, color: colors.danger },
        fieldGroup: { gap: spacing.sm },
        fieldLabel: { ...typography.captionMedium, color: colors.textSecondary },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
        chip: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
        chipText: { ...typography.bodyMedium, color: colors.text },
        chipTextActive: { color: colors.textOnPrimary },
        vehicleRow: { flexDirection: "row", gap: spacing.md },
        vehicleField: { flex: 1 },
      }),
    [colors, typography],
  );
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleTypeOption>("okada");
  const [jobPreference, setJobPreference] = useState<JobPreferenceOption>("both");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const vehicleTypeOptions: Array<{ id: VehicleTypeOption; label: string }> = [
    { id: "okada", label: t("auth.okada") },
    { id: "tricycle", label: t("auth.tricycle") },
    { id: "bicycle", label: t("auth.bicycle") },
  ];

  const jobPreferenceOptions: Array<{ id: JobPreferenceOption; label: string }> = [
    { id: "both", label: t("auth.jobBoth") },
    { id: "rides_only", label: t("auth.jobRidesOnly") },
    { id: "delivery_only", label: t("auth.jobDeliveryOnly") },
  ];

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const path = mode === "login" ? "/auth/rider/login" : "/auth/rider/signup";
      const hasVehicleDetails = vehicleMake.trim() && vehicleModel.trim() && vehiclePlate.trim();
      const body =
        mode === "login"
          ? { phoneE164: phoneData.phoneE164, password }
          : {
              fullName,
              phoneCountryCode: phoneData.phoneCountryCode,
              phoneLocal: phoneData.phoneLocal,
              password,
              preferredCurrency: "GHS",
              jobPreference,
              vehicle: hasVehicleDetails
                ? {
                    make: vehicleMake.trim(),
                    model: vehicleModel.trim(),
                    plateNumber: vehiclePlate.trim(),
                    vehicleType,
                  }
                : undefined,
            };

      const result = await api<AuthResponse>(path, { method: "POST", body });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      registerPushToken(result.token).catch(() => undefined);
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
            <Text style={styles.brand}>OkadaGo Rider</Text>
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
            <Input label={t("auth.password")} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

            {mode === "signup" ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("auth.vehicleType")}</Text>
                  <View style={styles.chipRow}>
                    {vehicleTypeOptions.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => setVehicleType(option.id)}
                        style={[styles.chip, vehicleType === option.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, vehicleType === option.id && styles.chipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.vehicleRow}>
                  <Input
                    style={styles.vehicleField}
                    label={t("auth.vehicleMake")}
                    value={vehicleMake}
                    onChangeText={setVehicleMake}
                    placeholder="Bajaj"
                  />
                  <Input
                    style={styles.vehicleField}
                    label={t("auth.vehicleModel")}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Boxer"
                  />
                </View>
                <Input
                  label={t("auth.plateNumber")}
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                  placeholder="GT 1234-24"
                  autoCapitalize="characters"
                />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("auth.jobPreference")}</Text>
                  <View style={styles.chipRow}>
                    {jobPreferenceOptions.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => setJobPreference(option.id)}
                        style={[styles.chip, jobPreference === option.id && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, jobPreference === option.id && styles.chipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label={mode === "login" ? t("auth.continue") : t("auth.createAccountCta")}
              variant="accent"
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
