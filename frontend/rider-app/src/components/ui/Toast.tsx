import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

export type ToastType = "success" | "error" | "info";

export type ToastProps = {
  message: string;
  type?: ToastType;
  durationMs?: number;
  onDismiss: () => void;
};

export function Toast({ message, type = "info", durationMs = 3000, onDismiss }: ToastProps) {
  const { colors, typography } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const toneMap = useMemo<Record<ToastType, { bg: string; accent: string; icon: typeof Info }>>(
    () => ({
      success: { bg: colors.successLight, accent: colors.success, icon: CheckCircle },
      error: { bg: colors.dangerLight, accent: colors.danger, icon: AlertTriangle },
      info: { bg: colors.infoLight, accent: colors.info, icon: Info },
    }),
    [colors],
  );

  const tone = toneMap[type];
  const Icon = tone.icon;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onDismiss, opacity, translateY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          top: 60,
          left: spacing.lg,
          right: spacing.lg,
          zIndex: 999,
        },
        container: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: tone.bg,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: tone.accent,
          borderLeftWidth: 4,
        },
        message: {
          ...typography.bodyMedium,
          color: colors.text,
          flex: 1,
        },
        dismiss: {
          padding: spacing.xs,
        },
      }),
    [colors, typography, tone],
  );

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY }], opacity }]}>
      <View style={styles.container}>
        <Icon size={20} color={tone.accent} />
        <Text style={styles.message} numberOfLines={3}>{message}</Text>
        <Pressable style={styles.dismiss} onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss" accessibilityRole="button">
          <X size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
