import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { colors, spacing, typography } from "@/theme/tokens";

export default function Index() {
  const { session, restoring } = useApp();

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
  return <Redirect href="/(main)" />;
}

const styles = StyleSheet.create({
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
  title: { ...typography.h2, marginTop: spacing.lg },
});
