import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Home } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand, layers } from "@/theme/design-system";

type Props = {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
  onHome?: () => void;
};

/**
 * NavigationHeader — Header with back and home buttons.
 *
 * Used on sub-screens (earnings, performance, demand, etc.)
 * to allow navigation back to the home screen.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  [←]  Earnings          [🏠]   │
 * └─────────────────────────────────┘
 */
export function NavigationHeader({ title, showBack = true, showHome = true, onBack, onHome }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: insets.top + 8,
      paddingBottom: 12,
      backgroundColor: isDark ? colors.surface : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    homeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: brand.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: brand.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  });

  return (
    <View style={s.header}>
      {showBack ? (
        <Pressable
          style={s.backBtn}
          onPress={onBack || (() => router.back())}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color={colors.text} />
        </Pressable>
      ) : (
        <View style={s.backBtn} />
      )}

      {title && <Text style={s.title}>{title}</Text>}

      {showHome && (
        <Pressable
          style={s.homeBtn}
          onPress={onHome || (() => router.push("/(main)"))}
          accessibilityLabel="Go to home"
        >
          <Home size={18} color="#000000" />
        </Pressable>
      )}
    </View>
  );
}
