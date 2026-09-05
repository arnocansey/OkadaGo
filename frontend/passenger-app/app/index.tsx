import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useApp } from "@/context/AppContext";

const ONBOARDING_KEY = "@okadago_passenger_onboarding";
const LOCATION_PROMPTED_KEY = "@okadago_passenger_location_prompted";

const splashLogo = require("../assets/branding/okadago-logo-splash.png");

export default function Index() {
  const { session, restoring } = useApp();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [locationPrompted, setLocationPrompted] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        splash: {
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        },
        splashLogo: {
          width: 220,
          height: 160,
          resizeMode: "contain",
        },
      }),
    [],
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
        <Image
          source={splashLogo}
          style={styles.splashLogo}
          accessibilityLabel="OkadaGo"
        />
      </View>
    );
  }

  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!locationPrompted) return <Redirect href="/(auth)/location-permission" />;
  return <Redirect href="/(main)" />;
}
