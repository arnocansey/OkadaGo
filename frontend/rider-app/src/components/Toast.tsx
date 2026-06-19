import { View, Text, StyleSheet, Pressable } from "react-native";
import { palette } from "./ui";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ message, type = "info", onDismiss }: ToastProps) {
  return (
    <View style={[styles.toast, styles[`toast${type}`]]}>
      <Text style={styles.toastMessage}>{message}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} style={styles.toastClose} accessible={true} accessibilityRole="button" accessibilityLabel="Dismiss notification">
          <Text style={styles.toastCloseText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    gap: 12,
    zIndex: 999,
  },
  toastinfo: {
    backgroundColor: palette.panel,
    borderColor: palette.stroke,
  },
  toastsuccess: {
    backgroundColor: "#1A3A1A",
    borderColor: palette.green,
  },
  toasterror: {
    backgroundColor: "#3D1712",
    borderColor: "#A9362C",
  },
  toastMessage: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  toastClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toastCloseText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
});
