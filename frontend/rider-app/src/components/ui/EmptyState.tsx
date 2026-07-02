import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.h3, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
});
