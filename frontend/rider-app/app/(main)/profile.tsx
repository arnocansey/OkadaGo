import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, FileText, Headphones, PhoneCall, Settings } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

export default function ProfileScreen() {
  const { session, signOut } = useApp();
  const { colors, typography } = useTheme();
  const user = session!.user;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg },
        header: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Avatar name={user.fullName} size={72} />
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.phone}>{user.phoneE164}</Text>
        {user.riderApprovalStatus ? (
          <Text style={styles.status}>Status: {user.riderApprovalStatus}</Text>
        ) : null}
      </View>

      <Card style={styles.menu}>
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
