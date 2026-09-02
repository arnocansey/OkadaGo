import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Power, TrendingUp, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

type Props = {
  online: boolean;
  todayEarnings: number;
  onlineSince?: Date | null;
  onToggle: () => void;
  loading?: boolean;
};

export function OnlineStatusControl({
  online,
  todayEarnings,
  onlineSince,
  onToggle,
  loading = false,
}: Props) {
  const { colors, isDark } = useTheme();
  const [now, setNow] = useState(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse animation when online
  useEffect(() => {
    if (online) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [online, pulseAnim]);

  // Update timer every second when online
  useEffect(() => {
    if (!online || !onlineSince) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [online, onlineSince]);

  // Calculate duration
  const duration = useMemo(() => {
    if (!online || !onlineSince) return null;
    const ms = now - new Date(onlineSince).getTime();
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [online, onlineSince, now]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        pillWrapper: {
          shadowColor: online ? brand.online : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: online ? 0.4 : 0.15,
          shadowRadius: 14,
          elevation: 8,
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: 60,
          borderRadius: 30,
          paddingHorizontal: 16,
        },
        pillOffline: {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderWidth: 1.5,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },
        pillOnline: {
          backgroundColor: brand.online,
          borderWidth: 1.5,
          borderColor: brand.online,
        },

        /* ─── Left Section (Icon + Text) ────────────────────────── */
        leftSection: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          flex: 1,
        },
        iconContainer: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
        },
        iconOffline: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6",
        },
        iconOnline: {
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        },
        textGroup: {
          gap: 1,
        },
        mainLabel: {
          fontSize: 16,
          fontWeight: "800",
          letterSpacing: 0.3,
        },
        mainLabelOffline: {
          color: colors.text,
        },
        mainLabelOnline: {
          color: "#000000",
        },
        subLabel: {
          fontSize: 11,
          fontWeight: "600",
        },
        subLabelOffline: {
          color: colors.textMuted,
        },
        subLabelOnline: {
          color: "rgba(0, 0, 0, 0.65)",
        },

        /* ─── Right Section (Duration & Status) ─────────────────── */
        rightSection: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        durationBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: "rgba(0, 0, 0, 0.12)",
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        durationDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#000000",
        },
        durationText: {
          fontSize: 12,
          fontWeight: "800",
          color: "#000000",
        },
      }),
    [colors, isDark, online],
  );

  return (
    <Animated.View style={[s.pillWrapper, { transform: [{ scale: pulseAnim }] }]}>
      <Pressable
        style={[s.pill, online ? s.pillOnline : s.pillOffline]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onToggle();
        }}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={online ? "Go offline" : "Go live"}
        accessibilityState={{ disabled: loading }}
      >
        {/* Left Section: Icon + Text */}
        <View style={s.leftSection}>
          <View style={[s.iconContainer, online ? s.iconOnline : s.iconOffline]}>
            <Power size={20} color={online ? "#000000" : colors.text} />
          </View>
          <View style={s.textGroup}>
            <Text style={[s.mainLabel, online ? s.mainLabelOnline : s.mainLabelOffline]}>
              {online ? "YOU'RE ONLINE" : "GO LIVE"}
            </Text>
            <Text style={[s.subLabel, online ? s.subLabelOnline : s.subLabelOffline]}>
              {online ? "Tap to go offline" : "Tap to receive trips"}
            </Text>
          </View>
        </View>

        {/* Right Section: Duration timer (online only) */}
        {online && duration && (
          <View style={s.rightSection}>
            <View style={s.durationBadge}>
              <View style={s.durationDot} />
              <Text style={s.durationText}>{duration}</Text>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && <ActivityIndicator size="small" color={online ? "#000000" : colors.text} />}
      </Pressable>
    </Animated.View>
  );
}
