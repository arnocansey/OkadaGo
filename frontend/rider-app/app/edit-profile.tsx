import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";
import type { SessionUser } from "@/types";

type RiderSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  preferredCurrency: string;
  city: string | null;
  displayCode: string | null;
  approvalStatus: string | null;
};

type SettingsUpdateResponse = {
  user: SessionUser;
};

export default function EditProfileScreen() {
  const { session, refreshSession } = useApp();
  const { colors, typography, stackHeaderOptions } = useTheme();
  const user = session!.user;
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email ?? "");
  const [city, setCity] = useState("");
  const [phoneE164, setPhoneE164] = useState(user.phoneE164);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token) return;
    api<RiderSettings>("/auth/rider/settings", { token: session.token })
      .then((data) => {
        setFullName(data.fullName);
        setEmail(data.email ?? "");
        setCity(data.city ?? "");
        setPhoneE164(data.phoneE164);
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
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );

  async function saveProfile() {
    if (!session?.token || !fullName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api<SettingsUpdateResponse>("/auth/rider/settings", {
        method: "PATCH",
        token: session.token,
        body: {
          fullName: fullName.trim(),
          email: email.trim() || null,
          city: city.trim() || null,
        },
      });
      await refreshSession();
      Alert.alert("Profile updated", "Your rider profile was saved.", [
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
            <Input label="Service city" value={city} onChangeText={setCity} placeholder="Accra" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Save profile" loading={saving} onPress={() => void saveProfile()} fullWidth />
          </Card>
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
