import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "accent";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  size?: "md" | "lg";
};

export function Button({
  label,
  variant = "primary",
  loading,
  icon,
  fullWidth,
  size = "lg",
  disabled,
  onPress,
  style,
  ...rest
}: Props) {
  const { colors, typography } = useTheme();

  const variantStyles = useMemo<Record<Variant, { container: ViewStyle; text: TextStyle }>>(
    () => ({
      primary: {
        container: { backgroundColor: colors.primary },
        text: { color: colors.textOnPrimary },
      },
      secondary: {
        container: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.primary },
        text: { color: colors.primary },
      },
      ghost: {
        container: { backgroundColor: "transparent" },
        text: { color: colors.text },
      },
      danger: {
        container: { backgroundColor: colors.danger },
        text: { color: colors.textOnDanger },
      },
      accent: {
        container: { backgroundColor: colors.accent },
        text: { color: colors.textOnPrimary },
      },
      outline: {
        container: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.borderStrong },
        text: { color: colors.text },
      },
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: 56,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.xl,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        },
        md: {
          minHeight: 44,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
        },
        fullWidth: { alignSelf: "stretch" },
        pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
        disabled: { opacity: 0.5 },
        label: { ...typography.bodySemibold },
        labelWithIcon: { marginLeft: spacing.xs },
      }),
    [typography],
  );

  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      onPress={(e) => {
        if (!isDisabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        size === "md" && styles.md,
        v.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, v.text, icon ? styles.labelWithIcon : null]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
