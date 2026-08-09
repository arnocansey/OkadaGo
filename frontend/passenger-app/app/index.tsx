import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrandLogo } from "@/components/BrandLogo";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

const ONBOARDING_KEY = "@okadago_passenger_onboarding";

export default function Index() {
  const { session, restoring } = useApp();
  const { colors } = useTheme();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
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

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        setHasSeenOnboarding(value === "seen");
      })
      .catch(() => {
        setHasSeenOnboarding(false);
      })
      .finally(() => {
        setOnboardingChecked(true);
      });
  }, []);

  if (restoring || !onboardingChecked) {
    return (
      <View style={styles.splash}>
        <BrandLogo variant="icon" size={72} />
        <BrandLogo variant="wordmark" size={32} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (session.user.isPhoneVerified === false) return <Redirect href="/(auth)/verify-phone" />;
  return <Redirect href="/(main)" />;
}
