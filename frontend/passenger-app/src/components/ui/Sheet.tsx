import type { ReactNode } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useEffect, useRef } from "react";
import { colors, radius, shadows, spacing } from "@/theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number;
  style?: ViewStyle;
};

export function Sheet({ visible, onClose, children, snapHeight = 420, style }: Props) {
  const translateY = useRef(new Animated.Value(snapHeight)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : snapHeight,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
    }).start();
  }, [visible, snapHeight, translateY]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[styles.sheet, shadows.sheet, { transform: [{ translateY }] }, style]}
        {...pan.panHandlers}
      >
        <View style={styles.handle} />
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingBottom: spacing.xxxl,
    maxHeight: "92%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  content: { paddingHorizontal: spacing.xl },
});
