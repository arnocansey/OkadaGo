import { useMemo } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, style, ...rest }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm },
        label: { ...typography.captionMedium, color: colors.textSecondary },
        input: {
          ...typography.body,
          color: colors.text,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 52,
        },
        inputError: { borderColor: colors.danger },
        hint: { ...typography.caption, color: colors.textMuted },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        accessibilityHint={error ?? hint}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
