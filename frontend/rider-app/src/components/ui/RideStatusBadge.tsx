import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type RideStatus = "completed" | "in_progress" | "pending" | "cancelled" | "searching" | "assigned" | "arriving" | "started" | "arrived" | "picked_up" | "in_transit" | "delivered" | "scheduled";

type Props = {
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  cancelled: "Cancelled",
  searching: "Searching",
  assigned: "Assigned",
  arriving: "Arriving",
  started: "Started",
  arrived: "Arrived",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  scheduled: "Scheduled",
};

export function RideStatusBadge({ status }: Props) {
  const { colors, typography } = useTheme();

  const config = useMemo(() => {
    const s = status.toLowerCase();
    if (["completed", "delivered"].includes(s))
      return { bg: colors.successLight, text: colors.success, icon: "✓" };
    if (["in_progress", "started", "arrived", "picked_up", "in_transit"].includes(s))
      return { bg: colors.infoLight, text: colors.info, icon: "●" };
    if (["pending", "searching", "assigned", "arriving", "scheduled"].includes(s))
      return { bg: colors.warningLight, text: colors.warning, icon: "◷" };
    if (["cancelled", "failed", "rejected"].includes(s))
      return { bg: colors.dangerLight, text: colors.danger, icon: "✕" };
    return { bg: colors.surface, text: colors.textSecondary, icon: "·" };
  }, [status, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 1,
          borderRadius: radius.full,
          backgroundColor: config.bg,
        },
        icon: {
          fontSize: 10,
          color: config.text,
        },
        label: {
          ...typography.label,
          color: config.text,
          textTransform: "capitalize",
        },
      }),
    [config, typography],
  );

  const label = STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, " ");

  return (
    <View style={styles.badge} accessibilityRole="text" accessibilityLabel={`Status: ${label}`}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
