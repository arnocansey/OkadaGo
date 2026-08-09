import type { ReactNode } from "react";
import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { space, radii, type, layers } from "@/theme/design-system";

type Props = {
  children: ReactNode;
  title?: string;
  onBack?: () => void;
  style?: ViewStyle;
};

/**
 * SearchOverlay — Full-screen search experience.
 *
 * Covers the map completely with a solid background.
 * Header: Back arrow + title (asymmetric left-aligned)
 * Body: Scrollable content (autocomplete, suggestions, saved places)
 *
 * Design: Left-aligned header creates asymmetric feel vs generic centered headers.
 */
export function SearchOverlay({ children, title = "Where to?", onBack, style }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? colors.bg : "#FFFFFF",
          zIndex: layers.sheet + 10,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: space[3],
          paddingTop: insets.top + space[2],
          paddingHorizontal: space[5],
          paddingBottom: space[4],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? colors.surfaceOverlay : "#F1F3F5",
        },
        backArrow: {
          ...type.bodyEmphasis,
          color: colors.text,
        },
        title: {
          ...type.headline,
          color: colors.text,
          flex: 1,
        },
        body: {
          flex: 1,
        },
      }),
    [insets, colors, isDark, title],
  );

  return (
    <View style={[s.overlay, style]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <Text style={s.title}>{title}</Text>
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}
