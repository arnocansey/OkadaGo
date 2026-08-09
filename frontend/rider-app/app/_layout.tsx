import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import "@/i18n";

import { WebContainer } from "@/components/WebContainer";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { isDark, stackHeaderOptions, ready } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  if (!ready) {
    return null;
  }

  return (
    <WebContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, ...stackHeaderOptions }} />
      {!splashDone ? <AnimatedSplash onFinish={() => setSplashDone(true)} /> : null}
    </WebContainer>
  );
}

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        if (!__DEV__ && Updates.isEnabled) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch {
        // OTA check failures should not block launch
      } finally {
        await SplashScreen.hideAsync();
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
