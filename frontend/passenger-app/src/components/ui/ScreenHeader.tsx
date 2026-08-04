import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({ title, subtitle, right, style }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          marginBottom: spacing.xl,
        },
        titles: { flex: 1, gap: spacing.xs },
        title: { ...typography.h1, color: colors.text },
        subtitle: { ...typography.caption, color: colors.textSecondary },
      }),
    [colors, typography],
  );

  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
