import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

/**
 * NetworkBanner — Displays a prominent "No Internet" banner when the device
 * is offline. Uses a simple fetch-based connectivity check since
 * @react-native-community/netinfo may not be installed.
 */
export function NetworkBanner() {
  const { colors, typography } = useTheme();
  const [offline, setOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch("https://clients3.google.com/generate_204", {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (active) setOffline(false);
      } catch {
        if (active) setOffline(true);
      }
    }

    check();
    const interval = setInterval(check, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: offline ? 0 : -60,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [offline, slideAnim]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
        banner: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          backgroundColor: colors.danger,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderBottomLeftRadius: radius.md,
          borderBottomRightRadius: radius.md,
        },
        text: {
          ...typography.captionMedium,
          color: "#FFFFFF",
          fontWeight: "600",
        },
      }),
    [colors, typography],
  );

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel="No internet connection"
    >
      <View style={styles.banner}>
        <WifiOff size={14} color="#FFFFFF" />
        <Text style={styles.text}>No internet connection</Text>
      </View>
    </Animated.View>
  );
}
