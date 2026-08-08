import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors, typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.xl,
        },
        dialog: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.xl,
          padding: spacing.xxl,
          width: "100%",
          maxWidth: 360,
          gap: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: {
          ...typography.h3,
          color: colors.text,
        },
        message: {
          ...typography.body,
          color: colors.textSecondary,
        },
        actions: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.sm,
        },
        actionBtn: {
          flex: 1,
        },
      }),
    [colors, typography],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="outline"
              size="md"
              onPress={onCancel}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              size="md"
              onPress={onConfirm}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
