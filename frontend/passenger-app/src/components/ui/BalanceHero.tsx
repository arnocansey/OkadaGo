import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  amount: string;
  hint?: string;
  sub?: string;
  right?: ReactNode;
  style?: ViewStyle;
};

export function BalanceHero({ label, amount, hint, sub, right, style }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          backgroundColor: colors.primary,
          borderRadius: radius.lg,
          padding: spacing.xl,
          marginBottom: spacing.lg,
          gap: spacing.xs,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        },
        body: { flex: 1 },
        label: { ...typography.captionMedium, color: colors.textOnPrimary },
        amount: { ...typography.hero, color: colors.textOnPrimary, marginTop: spacing.sm },
        hint: { ...typography.caption, color: colors.textOnPrimary, marginTop: spacing.sm, opacity: 0.75 },
        sub: { ...typography.caption, color: colors.textOnPrimary, marginTop: spacing.sm, opacity: 0.7 },
      }),
    [colors, typography],
  );

  return (
    <View style={[styles.hero, style]}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.amount}>{amount}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}
