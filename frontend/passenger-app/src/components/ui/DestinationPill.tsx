import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type, layers } from "@/theme/design-system";

type Props = {
  placeholder?: string;
  icon?: ReactNode;
  onPress?: () => void;
  /** Show as active/focused state */
  active?: boolean;
  style?: ViewStyle;
};

/**
 * DestinationPill — The "Where to?" trigger on the home screen.
 *
 * Asymmetric design: left-aligned with generous padding.
 * Lives at the bottom of the map (thumb zone) in the bottom sheet.
 * Tapping opens the full search overlay.
 *
 * Design choice: Not a full-width bar, but a slightly inset pill
 * that floats above the sheet content — distinctive, not generic.
 */
export function DestinationPill({ placeholder = "Where to?", icon, onPress, active, style }: Props) {
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
          backgroundColor: isDark
            ? active
              ? "rgba(250, 204, 21, 0.08)"
              : colors.surfaceOverlay
            : active
              ? "rgba(250, 204, 21, 0.06)"
              : "#F1F3F5",
          borderWidth: 1.5,
          borderColor: active ? colors.primary : "transparent",
          borderRadius: radii.lg,
          paddingHorizontal: space[5],
          paddingVertical: space[4],
          minHeight: 56,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: active ? colors.primary : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
          alignItems: "center",
          justifyContent: "center",
        },
        text: {
          ...type.body,
          color: active ? colors.text : colors.textMuted,
          flex: 1,
        },
        chevron: {
          ...type.body,
          color: colors.textMuted,
        },
      }),
    [colors, isDark, active, placeholder],
  );

  return (
    <Pressable
      style={[s.pill, style]}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
    >
      <View style={s.iconWrap}>{icon}</View>
      <Text style={s.text}>{placeholder}</Text>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}
