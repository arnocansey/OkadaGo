import { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label?: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "accent" | "danger";
};

export function FloatingActionButton({ icon, label, onPress, style, variant = "primary" }: Props) {
  const { colors, typography } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const bg = useMemo(() => {
    if (variant === "accent") return colors.accent;
    if (variant === "danger") return colors.danger;
    return colors.primary;
  }, [variant, colors]);

  const textColor = variant === "primary" ? colors.textOnPrimary : colors.textOnDanger;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: "absolute",
          bottom: spacing.xxl,
          right: spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: bg,
          borderRadius: label ? radius.xl : radius.full,
          paddingHorizontal: label ? spacing.xl : spacing.lg,
          paddingVertical: spacing.lg,
          minWidth: 56,
          minHeight: 56,
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        label: {
          ...typography.bodySemibold,
          color: textColor,
        },
      }),
    [bg, textColor, label, typography],
  );

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12 }).start();
  }

  return (
    <Animated.View style={[styles.fab, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label ?? "Action button"}
      >
        {icon}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}
