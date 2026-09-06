import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle, FileText, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  destinationAddress: string;
  fare: string;
  onRate: () => void;
  onReceipt: () => void;
};

/**
 * TripCompletedSheet — Destination arrival celebration
 *
 * ┌──────────────────────────────────────┐
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
 * │                                      │
 * │           ✓                          │  ← Animated checkmark (scales in)
 * │                                      │
 * │     You have arrived                  │  ← Bold heading
 * │                                      │
 * │  📍 Osu Oxford Street               │  ← Destination
 * │     GHS 45.00                        │  ← Fare (gold)
 * │                                      │
 * │  ┌──────────────────────────────┐    │
 * │  │     ⭐ Rate your ride        │    │  ← Primary CTA (gold)
 * │  └──────────────────────────────┘    │
 * │                                      │
 * │  ┌──────────────────────────────┐    │
 * │  │     📄 View receipt          │    │  ← Secondary CTA (outline)
 * │  └──────────────────────────────┘    │
 * └──────────────────────────────────────┘
 */
export function TripCompletedSheet({
  destinationAddress,
  fare,
  onRate,
  onReceipt,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  /* ─── Entrance animation ──────────────────────────── */
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, slideAnim]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.1,
          shadowRadius: 20,
          elevation: 12,
          paddingBottom: insets.bottom || 16,
          paddingTop: 8,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginTop: 8,
          marginBottom: 4,
        },
        inner: {
          paddingHorizontal: 20,
          alignItems: "center",
        },

        /* ─── Check Animation ──────────────────────────── */
        checkWrap: {
          marginBottom: 12,
        },
        checkCircle: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Text ─────────────────────────────────────── */
        heading: {
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 12,
          textAlign: "center",
        },
        destRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 4,
        },
        destText: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textSecondary,
        },
        fareText: {
          fontSize: 28,
          fontWeight: "800",
          color: colors.primary,
          marginBottom: 20,
        },

        /* ─── Buttons ──────────────────────────────────── */
        primaryBtn: {
          width: "100%",
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 10,
        },
        primaryText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.background,
        },
        secondaryBtn: {
          width: "100%",
          height: 52,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 4,
        },
        secondaryText: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <View style={s.inner}>
        {/* ─── Animated Checkmark ──────────────────────── */}
        <Animated.View
          style={[
            s.checkWrap,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={s.checkCircle}>
            <CheckCircle size={36} color={colors.success} />
          </View>
        </Animated.View>

        {/* ─── Heading + Fare ──────────────────────────── */}
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
          }}
        >
          <Text style={s.heading}>You have arrived</Text>

          <View style={s.destRow}>
            <Text style={s.destText} numberOfLines={1}>
              {destinationAddress}
            </Text>
          </View>

          <Text style={s.fareText}>{fare}</Text>
        </Animated.View>

        {/* ─── Actions ─────────────────────────────────── */}
        <Pressable style={s.primaryBtn} onPress={onRate} accessibilityRole="button">
          <Star size={18} color={colors.background} fill={colors.background} />
          <Text style={s.primaryText}>Rate your ride</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={onReceipt} accessibilityRole="button">
          <FileText size={18} color={colors.textSecondary} />
          <Text style={s.secondaryText}>View receipt</Text>
        </Pressable>
      </View>
    </View>
  );
}
