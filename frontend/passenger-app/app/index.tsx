import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrandLogo } from "@/components/BrandLogo";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

const ONBOARDING_KEY = "@okadago_passenger_onboarding";
const LOCATION_PROMPTED_KEY = "@okadago_passenger_location_prompted";

export default function Index() {
  const { session, restoring } = useApp();
  const { colors } = useTheme();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [locationPrompted, setLocationPrompted] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
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
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY).catch(() => null),
      AsyncStorage.getItem(LOCATION_PROMPTED_KEY).catch(() => null),
    ])
      .then(([onboardingValue, locationValue]) => {
        setHasSeenOnboarding(onboardingValue === "seen");
        setLocationPrompted(locationValue === "seen");
      })
      .catch(() => {
        setHasSeenOnboarding(false);
        setLocationPrompted(false);
      })
      .finally(() => {
        setOnboardingChecked(true);
        setLocationChecked(true);
      });
  }, []);

  if (restoring || !onboardingChecked || !locationChecked) {
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
  if (!locationPrompted) return <Redirect href="/(auth)/location-permission" />;
  return <Redirect href="/(main)" />;
}
