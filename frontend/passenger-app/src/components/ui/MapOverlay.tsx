import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { SAFE_AREA, space, layout, layers } from "@/theme/design-system";

type Props = {
  children: ReactNode;
  /** Content alignment */
  align?: "left" | "right" | "center" | "spread";
  /** Position in the top zone */
  top?: boolean;
  /** Position in the bottom zone (thumb area) */
  bottom?: boolean;
  style?: ViewStyle;
};

/**
 * MapOverlay — Positions UI elements over the map.
 *
 * Handles safe areas and creates proper layering:
 * - Top zone: Status, navigation, search triggers
 * - Bottom zone: Actions, CTAs (thumb-reachable)
 * - Content passes through to map via pointerEvents="box-none"
 *
 * The map is always the visual foundation — overlays are lightweight.
 */
export function MapOverlay({ children, align = "left", top, bottom, style }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: bottom ? "flex-end" : top ? "flex-start" : "space-between",
          alignItems: align === "center" ? "center" : align === "right" ? "flex-end" : "stretch",
          pointerEvents: "box-none",
          zIndex: layers.mapOverlay,
        },
        inner: {
          width: "100%",
          flexDirection: align === "spread" ? "row" : "column",
          justifyContent: align === "spread" ? "space-between" : "flex-start",
          alignItems: align === "spread" ? "center" : "stretch",
        },
        topZone: {
          paddingTop: insets.top + space[2],
          paddingHorizontal: layout.marginHorizontal,
        },
        bottomZone: {
          paddingBottom: insets.bottom + space[4],
          paddingHorizontal: layout.marginHorizontal,
        },
      }),
    [insets, align, top, bottom],
  );

  return (
    <View style={[s.container, style]} pointerEvents="box-none">
      <View style={[s.inner, top && s.topZone, bottom && s.bottomZone]}>
        {children}
      </View>
    </View>
  );
}

/**
 * FloatingPill — Compact action that floats on the map.
 *
 * Used for quick actions like center-on-location, notifications, etc.
 * Positioned absolutely within the map area.
 */
type FloatingPillProps = {
  children: ReactNode;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onPress?: () => void;
  style?: ViewStyle;
};

export function FloatingPill({ children, position = "top-right", style }: FloatingPillProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const positionStyle: ViewStyle = useMemo(() => {
    const top = position.includes("top") ? insets.top + space[3] : undefined;
    const bottom = position.includes("bottom") ? undefined : undefined;
    const left = position.includes("left") ? layout.marginHorizontal : undefined;
    const right = position.includes("right") ? layout.marginHorizontal : undefined;
    return { position: "absolute" as const, top, bottom, left, right };
  }, [position, insets]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        pill: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[2],
          paddingHorizontal: space[4],
          paddingVertical: space[2],
          borderRadius: 999,
          backgroundColor: isDark ? "rgba(17, 24, 39, 0.9)" : "rgba(255, 255, 255, 0.95)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
      }),
    [isDark],
  );

  return (
    <View style={[s.pill, positionStyle, style]} pointerEvents="auto">
      {children}
    </View>
  );
}
