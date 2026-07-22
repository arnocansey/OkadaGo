import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, shadows, spacing } from "@/theme/tokens";

/** Approximate visual height for map center-button inset (padding + typical content). */
export const MAP_SHEET_CENTER_INSET = 260;

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showHandle?: boolean;
};

export function MapBottomSheet({ children, style, contentStyle, showHandle = true }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: radius.xxl,
          borderTopRightRadius: radius.xxl,
          paddingHorizontal: spacing.xl,
          paddingTop: showHandle ? spacing.md : spacing.xl,
          paddingBottom: spacing.xxxl,
          ...shadows.sheet,
        },
        handle: {
          alignSelf: "center",
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginBottom: spacing.lg,
        },
        content: {
          gap: spacing.lg,
        },
      }),
    [colors, showHandle],
  );

  return (
    <View style={[styles.sheet, style]}>
      {showHandle ? <View style={styles.handle} /> : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}
