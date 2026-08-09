import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii } from "@/theme/design-system";

type Props = {
  children: ReactNode;
  /** Offset the card slightly right for asymmetric feel */
  offset?: boolean;
  /** Compact variant with less padding */
  compact?: boolean;
  /** Highlighted state (selected, active) */
  highlighted?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * AsymmetricCard — OkadaGo's signature card layout.
 *
 * Instead of generic centered cards, this creates visual interest by:
 * - Slightly offsetting content left or right
 * - Using generous internal whitespace
 * - Adding subtle border-left accent for highlighted state
 *
 * Creates a distinctive, non-generic feel that sets OkadaGo apart.
 */
export function AsymmetricCard({
  children,
  offset = false,
  compact = false,
  highlighted = false,
  style,
  contentStyle,
}: Props) {
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: isDark ? colors.surfaceRaised : "#FFFFFF",
          borderRadius: radii.card,
          borderLeftWidth: highlighted ? 3 : 0,
          borderLeftColor: highlighted ? colors.primary : "transparent",
          borderWidth: 1,
          borderColor: highlighted
            ? colors.primary
            : isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          paddingHorizontal: compact ? space[4] : space[5],
          paddingVertical: compact ? space[3] : space[4],
          marginLeft: offset ? space[2] : 0,
          marginRight: offset ? -space[2] : 0,
        },
        content: {
          gap: compact ? space[2] : space[3],
        },
      }),
    [colors, isDark, highlighted, compact, offset],
  );

  return (
    <View style={[s.card, style]}>
      <View style={[s.content, contentStyle]}>{children}</View>
    </View>
  );
}
