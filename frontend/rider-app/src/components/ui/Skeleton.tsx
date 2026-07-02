import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius } from "@/theme/tokens";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  rounded?: boolean;
};

export function Skeleton({ width = "100%", height = 16, style, rounded }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, opacity, borderRadius: rounded ? radius.full : radius.sm },
        style,
      ]}
    />
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={48} height={48} rounded />
          <View style={styles.col}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border },
  list: { gap: 12 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  col: { flex: 1, gap: 8 },
});
