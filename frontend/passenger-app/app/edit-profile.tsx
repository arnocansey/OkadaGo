import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";
import type { PaymentMethod, SessionUser } from "@/types";

type PassengerSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  preferredCurrency: string;
  defaultServiceCity: string | null;
  preferredPayment: PaymentMethod | null;
};

type SettingsUpdateResponse = {
  user: SessionUser;
};

const PAYMENT_OPTIONS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "cash", label: "Cash" },
  { id: "wallet", label: "Wallet" },
  { id: "card", label: "Card" },
  { id: "mobile_money", label: "Mobile money" },
];

export default function EditProfileScreen() {
  const { session, refreshSession } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const user = session!.user;
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [phoneE164, setPhoneE164] = useState(user.phoneE164);
  const [defaultServiceCity, setDefaultServiceCity] = useState("");
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token) return;
    api<PassengerSettings>("/auth/passenger/settings", { token: session.token })
      .then((data) => {
        setFullName(data.fullName);
        setEmail(data.email ?? "");
        setPhoneE164(data.phoneE164);
        setDefaultServiceCity(data.defaultServiceCity ?? "");
        setPreferredPayment(data.preferredPayment ?? "cash");
      })
      .catch(() => undefined);
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        sectionHint: { ...typography.caption, color: colors.textMuted },
        readOnlyField: {
          ...typography.body,
          color: colors.textSecondary,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
        chipText: { ...typography.captionMedium, color: colors.textSecondary },
        chipTextActive: { color: colors.primary },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );

  async function saveProfile() {
    if (!session?.token || !fullName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api<SettingsUpdateResponse>("/auth/passenger/settings", {
        method: "PATCH",
        token: session.token,
        body: {
          fullName: fullName.trim(),
          email: email.trim() || null,
          defaultServiceCity: defaultServiceCity.trim() || null,
          preferredPayment,
        },
      });
      await refreshSession();
      Alert.alert("Profile updated", "Your account details were saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Edit Profile", ...stackHeaderOptions }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <SafeAreaView style={styles.screen} edges={["bottom"]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card stacked>
            <Input label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
            />
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.sectionHint}>Phone (verified via OTP)</Text>
              <Text style={styles.readOnlyField}>{phoneE164}</Text>
            </View>
            <Input
              label="Default service city"
              value={defaultServiceCity}
              onChangeText={setDefaultServiceCity}
              placeholder="Accra"
            />
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.sectionHint}>Preferred payment</Text>
              <View style={styles.chipRow}>
                {PAYMENT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[styles.chip, preferredPayment === option.id && styles.chipActive]}
                    onPress={() => setPreferredPayment(option.id)}
                  >
                    <Text style={[styles.chipText, preferredPayment === option.id && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Save profile" loading={saving} onPress={() => void saveProfile()} fullWidth />
          </Card>
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
