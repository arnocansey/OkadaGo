import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike } from "lucide-react-native";
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

const VEHICLE_TYPE_OPTIONS: Array<{ id: VehicleTypeOption; label: string }> = [
  { id: "okada", label: "Okada" },
  { id: "tricycle", label: "Tricycle" },
  { id: "bicycle", label: "Bicycle" }
];

const JOB_PREFERENCE_OPTIONS: Array<{ id: JobPreferenceOption; label: string }> = [
  { id: "both", label: "Rides & delivery" },
  { id: "rides_only", label: "Rides only" },
  { id: "delivery_only", label: "Delivery only" }
];

export default function LoginScreen() {
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

            {mode === "signup" ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Vehicle type</Text>
                  <View style={styles.chipRow}>
                    {VEHICLE_TYPE_OPTIONS.map((option) => (
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
                    label="Vehicle make"
                    value={vehicleMake}
                    onChangeText={setVehicleMake}
                    placeholder="Bajaj"
                  />
                  <Input
                    style={styles.vehicleField}
                    label="Model"
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Boxer"
                  />
                </View>
                <Input label="Plate number" value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="GT 1234-24" autoCapitalize="characters" />

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>What kind of jobs do you want?</Text>
                  <View style={styles.chipRow}>
                    {JOB_PREFERENCE_OPTIONS.map((option) => (
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
            <Button label={mode === "login" ? "Continue" : "Create account"} variant="accent" loading={loading} onPress={submit} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
