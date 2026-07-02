import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, shadows, spacing } from "@/theme/tokens";

type Props = ViewProps & {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
};

export function Card({ children, padded = true, elevated, onPress, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        padded: { padding: spacing.lg },
        pressed: { opacity: 0.92 },
      }),
    [colors],
  );

  const content = (
    <View
      {...rest}
      style={[styles.card, elevated && shadows.md, padded && styles.padded, style as ViewStyle]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}
