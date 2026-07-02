import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  default: { bg: colors.surface, text: colors.textSecondary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.infoLight, text: colors.info },
};

type Props = { label: string; tone?: Tone };

export function Badge({ label, tone = "default" }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["completed", "delivered"].includes(s)) return "success";
  if (["cancelled", "failed"].includes(s)) return "danger";
  if (["searching", "assigned", "arriving", "picked_up", "in_transit"].includes(s)) return "info";
  if (["started", "arrived"].includes(s)) return "warning";
  return "default";
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  text: { ...typography.label, textTransform: "capitalize" },
});
