import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Check, ChevronsRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  onAccept: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

const HANDLE_SIZE = 54;
const PADDING = 4;

export function SlideToAccept({
  onAccept,
  loading = false,
  disabled = false,
  label = "SLIDE TO ACCEPT",
}: Props) {
  const { colors, typography } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;

  const maxDx = Math.max(0, containerWidth - HANDLE_SIZE - PADDING * 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !loading && !submitted,
      onMoveShouldSetPanResponder: () => !disabled && !loading && !submitted,
      onPanResponderMove: (_, gestureState) => {
        if (maxDx <= 0) return;
        const nextX = Math.min(maxDx, Math.max(0, gestureState.dx));
        pan.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (maxDx <= 0) return;
        if (gestureState.dx >= maxDx * 0.7) {
          setSubmitted(true);
          Animated.timing(pan, {
            toValue: maxDx,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onAccept();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const textOpacity = pan.interpolate({
    inputRange: [0, maxDx > 0 ? maxDx * 0.5 : 1],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const fillWidth = pan.interpolate({
    inputRange: [0, maxDx > 0 ? maxDx : 1],
    outputRange: [HANDLE_SIZE + PADDING * 2, containerWidth || 100],
    extrapolate: "clamp",
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          height: HANDLE_SIZE + PADDING * 2,
          backgroundColor: colors.surface,
          borderRadius: radius.full,
          justifyContent: "center",
          padding: PADDING,
          overflow: "hidden",
          borderWidth: 1.5,
          borderColor: colors.accent,
        },
        fill: {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          backgroundColor: colors.accent,
          borderRadius: radius.full,
        },
        labelContainer: {
          position: "absolute",
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.xs,
        },
        label: {
          ...typography.bodySemibold,
          color: colors.text,
          letterSpacing: 1.2,
          fontSize: 14,
        },
        handle: {
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          borderRadius: HANDLE_SIZE / 2,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        handleSubmitted: {
          backgroundColor: colors.accent,
        },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Animated.View style={[styles.fill, { width: fillWidth }]} />

      <Animated.View style={[styles.labelContainer, { opacity: textOpacity }]}>
        <Text style={styles.label}>{label}</Text>
        <ChevronsRight size={20} color={colors.textSecondary} />
      </Animated.View>

      <Animated.View
        style={[
          styles.handle,
          (submitted || loading) && styles.handleSubmitted,
          { transform: [{ translateX: pan }] },
        ]}
        {...panResponder.panHandlers}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : submitted ? (
          <Check size={26} color={colors.textOnPrimary} />
        ) : (
          <ChevronsRight size={26} color={colors.textOnPrimary} />
        )}
      </Animated.View>
    </View>
  );
}
