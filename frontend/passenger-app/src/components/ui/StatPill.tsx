import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type } from "@/theme/design-system";

type Props = {
  icon?: ReactNode;
  value: string;
  label: string;
  /** Color tint for the icon background */
  tint?: "gold" | "blue" | "green" | "orange" | "red";
  compact?: boolean;
  style?: ViewStyle;
};

const TINT_MAP = {
  gold: { bg: "rgba(250, 204, 21, 0.12)", fg: "#facc15" },
  blue: { bg: "rgba(10, 132, 255, 0.12)", fg: "#0A84FF" },
  green: { bg: "rgba(76, 217, 100, 0.12)", fg: "#4CD964" },
  orange: { bg: "rgba(255, 107, 0, 0.12)", fg: "#FF6B00" },
  red: { bg: "rgba(255, 59, 48, 0.12)", fg: "#FF3B30" },
};

/**
 * StatPill — Compact stat display with icon, value, and label.
 *
 * Used for rider stats (rating, trips, distance, time).
 * Horizontal layout: [icon circle] [value] [label]
 * Asymmetric: icon on left, text aligned left but card can offset.
 */
export function StatPill({ icon, value, label, tint = "blue", compact, style }: Props) {
  const { colors, isDark } = useTheme();
  const tintColors = TINT_MAP[tint];
  const s = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? space[2] : space[3],
          paddingVertical: compact ? space[2] : space[3],
          paddingHorizontal: compact ? space[3] : space[4],
          borderRadius: radii.md,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
        },
        iconCircle: {
          width: compact ? 32 : 38,
          height: compact ? 32 : 38,
          borderRadius: compact ? 16 : 19,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tintColors.bg,
        },
        textGroup: {
          flex: 1,
          gap: 1,
        },
        value: {
          ...type.bodyEmphasis,
          color: colors.text,
        },
        label: {
          ...type.micro,
          color: colors.textMuted,
        },
      }),
    [colors, isDark, tintColors, compact],
  );

  return (
    <View style={[s.pill, style]}>
      {icon ? <View style={s.iconCircle}>{icon}</View> : null}
      <View style={s.textGroup}>
        <Text style={s.value}>{value}</Text>
        <Text style={s.label}>{label}</Text>
      </View>
    </View>
  );
}
