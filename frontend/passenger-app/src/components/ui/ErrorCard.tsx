import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Button } from "./Button";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
};

export function ErrorCard({ title = "Something went wrong", message, onRetry, onDismiss, retryLabel = "Retry" }: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.dangerLight,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.danger,
          gap: spacing.md,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        },
        title: {
          ...typography.bodySemibold,
          color: colors.danger,
        },
        message: {
          ...typography.body,
          color: colors.text,
          opacity: 0.85,
        },
        actions: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.xs,
        },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.header}>
        <AlertTriangle size={20} color={colors.danger} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {(onRetry || onDismiss) && (
        <View style={styles.actions}>
          {onRetry && <Button label={retryLabel} variant="danger" size="md" onPress={onRetry} />}
          {onDismiss && <Button label="Dismiss" variant="ghost" size="md" onPress={onDismiss} />}
        </View>
      )}
    </View>
  );
}
