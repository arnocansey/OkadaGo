import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, style, secureTextEntry, ...rest }: Props) {
  const { colors, typography } = useTheme();
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { gap: spacing.sm },
        label: { ...typography.captionMedium, color: colors.textSecondary },
        inputRow: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
        inputError: { borderColor: colors.danger },
        input: {
          flex: 1,
          ...typography.body,
          color: colors.text,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: 52,
        },
        eyeBtn: { paddingRight: spacing.md },
        hint: { ...typography.caption, color: colors.textMuted },
        error: { ...typography.caption, color: colors.danger },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputError : null, style as ViewStyle]}>
        <TextInput
          {...rest}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          secureTextEntry={hidden}
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable style={styles.eyeBtn} onPress={() => setHidden(!hidden)}>
            {hidden ? <EyeOff size={20} color={colors.textMuted} /> : <Eye size={20} color={colors.textMuted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
