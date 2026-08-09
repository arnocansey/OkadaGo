import type { ReactNode } from "react";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type } from "@/theme/design-system";

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  /** Variant controls visual weight */
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  style?: ViewStyle;
};

/**
 * ThumbButton — Primary CTA designed for the bottom 25% of screen.
 *
 * - Large touch target (56px height minimum)
 * - Primary variant uses accent color for maximum visibility
 * - Secondary is quieter, ghost is minimal
 * - Always within thumb reach on 390×844 viewport
 */
export function ThumbButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  variant = "primary",
  fullWidth = true,
  style,
}: Props) {
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: space[2],
          height: 56,
          paddingHorizontal: space[6],
          borderRadius: radii.lg,
          opacity: disabled ? 0.5 : 1,
        },
        primary: {
          backgroundColor: colors.primary,
        },
        secondary: {
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
          borderWidth: 1.5,
          borderColor: isDark ? colors.borderStrong : "#DEE2E6",
        },
        ghost: {
          backgroundColor: "transparent",
        },
        label: {
          ...type.bodyEmphasis,
          color: variant === "primary" ? colors.textOnPrimary : colors.text,
        },
        labelSecondary: {
          color: colors.text,
        },
        labelGhost: {
          color: colors.primary,
        },
      }),
    [colors, isDark, variant, disabled],
  );

  const variantStyle = variant === "primary" ? s.primary : variant === "secondary" ? s.secondary : s.ghost;
  const labelStyle =
    variant === "primary" ? s.label : variant === "secondary" ? [s.label, s.labelSecondary] : [s.label, s.labelGhost];

  return (
    <Pressable
      style={[s.btn, variantStyle, fullWidth && { width: "100%" }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? colors.textOnPrimary : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
