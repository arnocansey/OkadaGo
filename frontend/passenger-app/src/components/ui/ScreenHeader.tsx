import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: ViewStyle;
  /** Show a back button that calls this callback */
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, right, style, onBack }: Props) {
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
        leftRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          flex: 1,
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceOverlay,
        },
        titles: { flex: 1, gap: spacing.xs },
        title: { ...typography.h1, color: colors.text },
        subtitle: { ...typography.caption, color: colors.textSecondary },
      }),
    [colors, typography],
  );

  return (
    <View style={[styles.row, style]}>
      <View style={styles.leftRow}>
        {onBack && (
          <Pressable style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
