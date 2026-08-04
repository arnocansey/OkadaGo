import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Tone = "default" | "success" | "warning" | "danger" | "info";

type Props = {
  label: string;
  tone?: Tone;
};

export function Badge({ label, tone = "default" }: Props) {
  const { colors, typography } = useTheme();
  const toneStyles = useMemo<Record<Tone, { bg: string; text: string }>>(
    () => ({
      default: { bg: colors.surface, text: colors.textSecondary },
      success: { bg: colors.successLight, text: colors.success },
      warning: { bg: colors.warningLight, text: colors.warning },
      danger: { bg: colors.dangerLight, text: colors.danger },
      info: { bg: colors.infoLight, text: colors.info },
    }),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          alignSelf: "flex-start",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        text: { ...typography.label, textTransform: "capitalize" },
      }),
    [typography],
  );

  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["completed", "delivered", "posted", "paid"].includes(s)) return "success";
  if (["cancelled", "failed", "rejected"].includes(s)) return "danger";
  if (["scheduled", "searching", "assigned", "arriving", "picked_up", "in_transit", "pending", "processing"].includes(s)) return "info";
  if (["started", "arrived"].includes(s)) return "warning";
  return "default";
}
