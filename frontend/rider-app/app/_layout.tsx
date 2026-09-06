import { Image, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WhiteSplashScreen } from "@/components/WhiteSplashScreen";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { brand } from "@/theme/tokens";
import "@/i18n";

import { AudioBridge } from "@/components/AudioBridge";
import { WebContainer } from "@/components/WebContainer";

// Dismiss any native window splash screen immediately so in-app WhiteSplashScreen takes over
SplashScreen.hideAsync().catch(() => undefined);

const splashLogo = require("../assets/branding/okadago-icon-yellow.png");

type SplashStage = "white" | "motorcycle" | "done";

function RootNavigator() {
  const { isDark, stackHeaderOptions, ready } = useTheme();
  const [splashStage, setSplashStage] = useState<SplashStage>("white");

  if (!ready) {
    return (
      <View style={layoutStyles.splashFallback}>
        <Image
          source={splashLogo}
          style={layoutStyles.splashLogo}
          accessibilityLabel="OkadaGo"
        />
      </View>
    );
  }

  return (
    <WebContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AudioBridge />
      <Stack screenOptions={{ headerShown: false, ...stackHeaderOptions }} />
      {splashStage === "white" ? (
        <WhiteSplashScreen onFinish={() => setSplashStage("motorcycle")} />
      ) : splashStage === "motorcycle" ? (
        <AnimatedSplash onFinish={() => setSplashStage("done")} />
      ) : null}
    </WebContainer>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Immediately dismiss any pre-compiled native window splash
    SplashScreen.hideAsync().catch(() => undefined);

    async function prepare() {
      try {
        if (!__DEV__ && Updates.isEnabled) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
          }
        }
      } catch {
        // OTA check failures should not block launch
      }
    }
    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

declare const __DEV__: boolean;

const layoutStyles = StyleSheet.create({
  splashFallback: {
    flex: 1,
    backgroundColor: brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
  },
});
