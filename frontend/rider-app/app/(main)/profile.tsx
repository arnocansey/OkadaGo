import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, FileText, Headphones, Pencil, PhoneCall, ShieldAlert, Settings, Star, Camera, Bell } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { spacing } from "@/theme/tokens";

type RiderSettings = {
  ratingAverage?: number;
  completedTrips?: number;
};

export default function ProfileScreen() {
  const { session, signOut, refreshSession } = useApp();
  const { colors, typography } = useTheme();
  const { t } = useTranslation();
  const user = session!.user;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [riderSettings, setRiderSettings] = useState<RiderSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
    }, [refreshSession]),
  );

  useEffect(() => {
    if (!session?.token) return;
    api<RiderSettings>("/auth/rider/settings", { token: session.token })
      .then(setRiderSettings)
      .catch(() => undefined);
  }, [session?.token]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
        header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
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
        name: { ...typography.h2 },
        phone: { ...typography.body, color: colors.textSecondary },
        status: { ...typography.captionMedium, color: colors.success },
        ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
        ratingText: { ...typography.captionMedium, color: colors.text },
        menu: { padding: 0, overflow: "hidden" },
        menuRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        menuLabel: { ...typography.bodyMedium, flex: 1, color: colors.text },
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
    Alert.alert(t("profile.changePhoto"), t("profile.choosePhotoOption"), [
      { text: t("common.takePhoto"), onPress: takePhotoAndUpload },
      { text: t("common.chooseFromLibrary"), onPress: pickAndUploadAvatar },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title={t("nav.profile")} />
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Avatar name={user.fullName} size={72} imageUri={user.avatarUrl ?? undefined} />
            <Pressable style={styles.cameraBtn} onPress={showAvatarOptions} disabled={uploadingAvatar} hitSlop={8} accessibilityLabel="Change profile photo" accessibilityRole="button">
              <Camera size={14} color={colors.textOnPrimary} />
            </Pressable>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.phone}>{user.phoneE164}</Text>
          {riderSettings?.ratingAverage != null ? (
            <View style={styles.ratingRow}>
              <Star size={14} color={colors.primary} fill={colors.primary} />
              <Text style={styles.ratingText}>
                {riderSettings.ratingAverage.toFixed(1)}
                {typeof riderSettings.completedTrips === "number" ? ` · ${riderSettings.completedTrips} trips` : ""}
              </Text>
            </View>
          ) : null}
          {user.riderApprovalStatus ? (
            <Text style={styles.status}>{t("profile.status")}: {user.riderApprovalStatus}</Text>
          ) : null}
        </View>

        {user.riderApprovalStatus && !["APPROVED", "approved", "ACTIVE", "active"].includes(user.riderApprovalStatus) ? (
          <Card elevated>
            <Text style={[styles.name, { fontSize: 16 }]}>{t("profile.verificationTitle")}</Text>
            <Text style={styles.phone}>{t("profile.verificationHint")}</Text>
            <Button
              label={t("profile.uploadDocuments")}
              variant="accent"
              fullWidth
              onPress={() => router.push("/documents")}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : null}

        <Card style={styles.menu}>
          <Pressable style={styles.menuRow} onPress={() => router.push("/notifications" as never)}>
            <Bell size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{t("profile.notifications")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => router.push("/edit-profile")}>
            <Pencil size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{t("profile.editProfile")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => router.push("/documents")}>
            <FileText size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{t("profile.documents")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => router.push("/emergency-contacts")}>
            <ShieldAlert size={20} color={colors.danger} />
            <Text style={styles.menuLabel}>{t("profile.emergencyContacts")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable style={styles.menuRow} onPress={() => router.push("/support")}>
            <Headphones size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{t("profile.supportTickets")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
          {user.isPhoneVerified === false ? (
            <Pressable style={styles.menuRow} onPress={() => router.push("/(auth)/verify-phone")}>
              <PhoneCall size={20} color={colors.text} />
              <Text style={styles.menuLabel}>{t("profile.verifyPhone")}</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => router.push("/settings")}>
            <Settings size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{t("profile.settings")}</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </Card>

        <Button
          label={t("profile.signOut")}
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
