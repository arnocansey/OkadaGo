import { Redirect } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

export default function Index() {
  const { session, restoring } = useApp();
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        splash: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        },
        logo: {
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        logoText: { ...typography.hero, color: colors.textOnPrimary },
        title: { ...typography.h2, marginTop: spacing.lg, color: colors.text },
      }),
    [colors, typography],
  );

  if (restoring) {
    return (
      <View style={styles.splash}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>O</Text>
        </View>
        <Text style={styles.title}>OkadaGo Rider</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.user.isPhoneVerified === false) return <Redirect href="/(auth)/verify-phone" />;
  return <Redirect href="/(main)" />;
}
