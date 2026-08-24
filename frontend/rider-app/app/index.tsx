import { Redirect } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

export default function Index() {
  const { session, restoring } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        splash: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
        },
      }),
    [colors],
  );

  if (restoring) {
    return (
      <View style={styles.splash}>
        <BrandLogo variant="icon" size={72} />
        <BrandLogo variant="wordmark" size={32} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  return <Redirect href="/(main)" />;
}
