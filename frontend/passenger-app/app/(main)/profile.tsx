import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Moon, Sun, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";

type PassengerSettings = {
  fullName: string;
  email: string | null;
  phoneE164: string;
  preferredCurrency: string;
  defaultServiceCity: string | null;
  referralCode?: string | null;
};

export default function ProfileScreen() {
  const { session, signOut, zones, refreshSession } = useApp();
  const { colors, typography, isDark, setTheme } = useTheme();
  const user = session!.user;
  const [settings, setSettings] = useState<PassengerSettings | null>(null);
  const [friendCode, setFriendCode] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
    }, [refreshSession]),
  );

  useEffect(() => {
    if (!session?.token) return;
    api<PassengerSettings>("/auth/passenger/settings", { token: session.token })
      .then(setSettings)
      .catch(() => setSettings(null));
  }, [session?.token, session?.user.fullName, session?.user.email]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        header: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
        name: { ...typography.h2 },
        phone: { ...typography.body, color: colors.textSecondary },
        infoCard: { padding: 0, overflow: "hidden" },
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        noBorder: { borderBottomWidth: 0 },
        infoLabel: { ...typography.caption, color: colors.textMuted },
        infoValue: { ...typography.bodySemibold, color: colors.text },
        sectionTitle: { ...typography.bodySemibold, color: colors.text },
        sectionHint: { ...typography.caption, color: colors.textMuted },
        themeCard: { padding: 0, overflow: "hidden" },
        themeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          padding: spacing.lg,
        },
        themeIcon: {
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
        },
        lightIconBg: { backgroundColor: colors.accentLight },
        darkIconBg: { backgroundColor: colors.borderStrong },
        themeLabel: { ...typography.bodySemibold, color: colors.text },
        themeHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        avatarWrap: { position: "relative" },
        cameraBtn: {
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.background,
        },
      }),
    [colors, typography],
  );

  async function pickAndUploadAvatar() {
    if (!session?.token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const data = await api<{ token: string; expiresAt: string; user: typeof session.user }>("/auth/avatar", {
        method: "POST",
        token: session.token,
        body: { imageBase64: base64 },
      });
      refreshSession();
      Alert.alert("Photo updated", "Your profile photo was saved.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not update photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function takePhotoAndUpload() {
    if (!session?.token) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take a profile photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      await api("/auth/avatar", {
        method: "POST",
        token: session.token,
        body: { imageBase64: base64 },
      });
      refreshSession();
      Alert.alert("Photo updated", "Your profile photo was saved.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not update photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function showAvatarOptions() {
    Alert.alert("Change photo", "Choose an option", [
      { text: "Take photo", onPress: takePhotoAndUpload },
      { text: "Choose from library", onPress: pickAndUploadAvatar },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function applyReferral() {
    if (!session || !friendCode.trim()) return;
    setApplyingReferral(true);
    try {
      await api("/referrals/apply", {
        method: "POST",
        token: session.token,
        body: { referralCode: friendCode.trim() },
      });
      Alert.alert("Referral applied", "Your referral code was linked successfully.");
      setFriendCode("");
    } catch (e) {
      Alert.alert("Referral failed", e instanceof Error ? e.message : "Could not apply referral code.");
    } finally {
      setApplyingReferral(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Avatar name={user.fullName} size={80} imageUri={user.avatarUrl ?? undefined} />
            <Pressable style={styles.cameraBtn} onPress={showAvatarOptions} disabled={uploadingAvatar} hitSlop={8} accessibilityLabel="Change profile photo" accessibilityRole="button">
              <Camera size={14} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.phone}>{user.phoneE164}</Text>
        </View>

        <Card style={styles.infoCard} padded={false}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Preferred currency</Text>
            <Text style={styles.infoValue}>{user.preferredCurrency}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service zone</Text>
            <Text style={styles.infoValue}>{zones[0]?.name ?? "Accra"}</Text>
          </View>
          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={styles.infoLabel}>Your referral code</Text>
            <Text style={styles.infoValue}>{settings?.referralCode ?? "—"}</Text>
          </View>
        </Card>

        <Card stacked>
          <Text style={styles.sectionTitle}>Safety & account</Text>
          <Button label="Edit Profile" variant="outline" fullWidth onPress={() => router.push("/edit-profile")} />
          <Button label="Emergency contacts" variant="outline" fullWidth onPress={() => router.push("/emergency-contacts")} />
          <Button label="Saved places" variant="outline" fullWidth onPress={() => router.push("/saved-places")} />
          <Button label="Support tickets" variant="outline" fullWidth onPress={() => router.push("/support")} />
          {user.isPhoneVerified === false ? (
            <Button label="Verify phone number" fullWidth onPress={() => router.push("/(auth)/verify-phone")} />
          ) : null}
        </Card>

        <Card stacked>
          <Text style={styles.sectionTitle}>Have a friend's code?</Text>
          <Text style={styles.sectionHint}>Enter a referral code to unlock rewards.</Text>
          <Input label="Referral code" value={friendCode} onChangeText={setFriendCode} autoCapitalize="characters" />
          <Button label="Apply referral" loading={applyingReferral} onPress={applyReferral} fullWidth />
        </Card>

        <Card style={styles.themeCard} padded={false}>
          <View style={styles.themeRow}>
            <View style={[styles.themeIcon, isDark ? styles.darkIconBg : styles.lightIconBg]}>
              {isDark ? <Moon size={18} color={colors.text} /> : <Sun size={18} color={colors.primary} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.themeLabel}>{isDark ? "Dark mode" : "Light mode"}</Text>
              <Text style={styles.themeHint}>Toggle app appearance</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(enabled) => setTheme(enabled ? "dark" : "light")}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={isDark ? colors.primary : colors.surface}
            />
          </View>
        </Card>

        <Button
          label="Sign out"
          variant="outline"
          fullWidth
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
