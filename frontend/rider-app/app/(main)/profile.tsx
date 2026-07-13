import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, FileText, Headphones, Pencil, PhoneCall, Settings, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { spacing } from "@/theme/tokens";

export default function ProfileScreen() {
  const { session, signOut, refreshSession } = useApp();
  const { colors, typography } = useTheme();
  const user = session!.user;
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshSession();
    }, [refreshSession]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg },
        header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
        avatarWrap: { position: "relative" },
        cameraBtn: {
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: colors.background,
        },
        name: { ...typography.h2 },
        phone: { ...typography.body, color: colors.textSecondary },
        status: { ...typography.captionMedium, color: colors.success },
        menu: { padding: 0, overflow: "hidden" },
        menuRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        menuLabel: { ...typography.bodyMedium, flex: 1 },
      }),
    [colors, typography],
  );

  async function pickAndUploadAvatar() {
    if (!session?.token) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar name={user.fullName} size={72} imageUri={user.avatarUrl ?? undefined} />
          <Pressable style={styles.cameraBtn} onPress={pickAndUploadAvatar} disabled={uploadingAvatar}>
            <Camera size={14} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.phone}>{user.phoneE164}</Text>
        {user.riderApprovalStatus ? (
          <Text style={styles.status}>Status: {user.riderApprovalStatus}</Text>
        ) : null}
      </View>

      <Card style={styles.menu}>
        <Pressable style={styles.menuRow} onPress={() => router.push("/edit-profile")}>
          <Pencil size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.menuRow} onPress={() => router.push("/documents")}>
          <FileText size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Documents</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.menuRow} onPress={() => router.push("/support")}>
          <Headphones size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Support tickets</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
        {user.isPhoneVerified === false ? (
          <Pressable style={styles.menuRow} onPress={() => router.push("/(auth)/verify-phone")}>
            <PhoneCall size={20} color={colors.text} />
            <Text style={styles.menuLabel}>Verify phone number</Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
        <Pressable style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => router.push("/settings")}>
          <Settings size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Settings</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
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
    </SafeAreaView>
  );
}
