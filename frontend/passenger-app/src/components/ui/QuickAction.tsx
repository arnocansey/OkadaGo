import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type } from "@/theme/design-system";

type Props = {
  icon: ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  /** Offset for asymmetric layout */
  offset?: boolean;
  style?: ViewStyle;
};

/**
 * QuickAction — Compact saved place / quick access item.
 *
 * Asymmetric: icon on left with slight offset, text right-aligned.
 * Used for Home, Work, recent destinations.
 * Compact enough to show 3-4 in a row within the bottom sheet.
 */
export function QuickAction({ icon, label, subtitle, onPress, offset, style }: Props) {
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        action: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
          paddingVertical: space[3],
          paddingHorizontal: space[4],
          borderRadius: radii.md,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          marginLeft: offset ? space[2] : 0,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
          alignItems: "center",
          justifyContent: "center",
        },
        textGroup: {
          flex: 1,
          gap: 1,
        },
        label: {
          ...type.captionEmphasis,
          color: colors.text,
        },
        subtitle: {
          ...type.micro,
          color: colors.textMuted,
        },
      }),
    [colors, isDark, offset],
  );

  return (
    <Pressable
      style={[s.action, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.iconWrap}>{icon}</View>
      <View style={s.textGroup}>
        <Text style={s.label}>{label}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}
