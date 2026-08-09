import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, layout } from "@/theme/design-system";

type Props = {
  children: ReactNode;
  /** Padding override — defaults to layout.sheetPadding */
  padding?: number;
  /** No horizontal padding */
  flush?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * OkadaSheet — The primary action container.
 *
 * Sits at the bottom of the map, sliding up for interactions.
 * Asymmetric by default: slightly more padding on the left than right
 * to create visual interest and match reading direction.
 *
 * Layout: Map dominates 62% → Sheet occupies bottom 38%
 */
export function OkadaSheet({ children, padding, flush, style, contentStyle }: Props) {
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: radii.sheet,
          borderTopRightRadius: radii.sheet,
          paddingHorizontal: flush ? 0 : (padding ?? layout.sheetPadding),
          paddingTop: space[3],
          paddingBottom: space[8],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 12,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginBottom: space[4],
        },
        content: {
          gap: space[4],
        },
      }),
    [colors, isDark, padding, flush],
  );

  return (
    <View style={[s.wrap, style]}>
      <View style={s.handle} />
      <View style={[s.content, contentStyle]}>{children}</View>
    </View>
  );
}
