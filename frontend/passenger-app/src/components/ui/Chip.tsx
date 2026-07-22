import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function Chip({ label, selected = false, onPress, icon, style }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipActive: {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
          borderWidth: 1.5,
        },
        text: { ...typography.captionMedium, color: colors.textSecondary },
        textActive: { color: colors.primary },
      }),
    [colors, typography],
  );

  const content = (
    <View style={[styles.chip, selected && styles.chipActive, style]}>
      {icon}
      <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
        {content}
      </Pressable>
    );
  }

  return content;
}
