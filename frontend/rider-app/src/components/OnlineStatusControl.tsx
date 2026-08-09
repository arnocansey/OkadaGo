import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Power, TrendingUp, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type Props = {
  online: boolean;
  todayEarnings: number;
  onlineSince?: Date | null;
  onToggle: () => void;
  loading?: boolean;
};

/**
 * OnlineStatusControl — OkadaGo's signature GO LIVE button.
 *
 * Design principles:
 * - Large pill shape (dominant, can't miss)
 * - High contrast for outdoor visibility
 * - Animated pulse when online
 * - Clear state transitions
 * - Earnings-per-hour when online
 * - Duration timer when online
 *
 * Visual signatures:
 * - Offline: Slate pill with "GO LIVE" text + power icon
 * - Online: Green pill with pulsing glow, duration, earnings/hr
 * - Pill shape is unique to OkadaGo (not a circle or square)
 */
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

  // Pulse animation when online
  useEffect(() => {
    if (online) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
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

  // Calculate earnings per hour
  const earningsPerHour = useMemo(() => {
    if (!online || !onlineSince || todayEarnings === 0) return null;
    const ms = now - new Date(onlineSince).getTime();
    const hours = ms / 3600000;
    if (hours < 0.1) return null; // Don't show until 6 minutes in
    return todayEarnings / hours;
  }, [online, onlineSince, todayEarnings, now]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        /* ─── Pill Container ────────────────────────────────────── */
        pillWrapper: {
          shadowColor: online ? brand.online : "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: online ? 0.5 : 0.2,
          shadowRadius: 24,
          elevation: 12,
        },
        pill: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: 88,
          borderRadius: 44,
          paddingHorizontal: 24,
        },
        pillOffline: {
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
          borderWidth: 3,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
        pillOnline: {
          backgroundColor: brand.online,
          borderWidth: 3,
          borderColor: brand.online,
        },

        /* ─── Left Section (Icon + Text) ────────────────────────── */
        leftSection: {
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        },
        iconContainer: {
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
        },
        iconOffline: {
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
          borderWidth: 2,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },
        iconOnline: {
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        },
        textGroup: {
          gap: 2,
        },
        mainLabel: {
          fontSize: 20,
          fontWeight: "800",
          letterSpacing: 0.5,
        },
        mainLabelOffline: {
          color: colors.text,
        },
        mainLabelOnline: {
          color: "#000000",
        },
        subLabel: {
          fontSize: 13,
          fontWeight: "500",
        },
        subLabelOffline: {
          color: colors.textMuted,
        },
        subLabelOnline: {
          color: "rgba(0, 0, 0, 0.6)",
        },

        /* ─── Right Section (Duration + Earnings/hr) ────────────── */
        rightSection: {
          alignItems: "flex-end",
          gap: 6,
        },
        durationBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: "rgba(0, 0, 0, 0.12)",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        durationDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#000000",
        },
        durationText: {
          fontSize: 14,
          fontWeight: "700",
          color: "#000000",
        },
        earningsPerHour: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        earningsPerHourText: {
          fontSize: 12,
          fontWeight: "600",
          color: "rgba(0, 0, 0, 0.5)",
        },
        earningsPerHourValue: {
          fontSize: 13,
          fontWeight: "700",
          color: "#000000",
        },

        /* ─── Loading State ──────────────────────────────────────── */
        loadingOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderRadius: 44,
          alignItems: "center",
          justifyContent: "center",
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
            <Power size={26} color={online ? "#000000" : colors.text} />
          </View>
          <View style={s.textGroup}>
            <Text
              style={[s.mainLabel, online ? s.mainLabelOnline : s.mainLabelOffline]}
            >
              {online ? "YOU'RE LIVE" : "GO LIVE"}
            </Text>
            <Text
              style={[s.subLabel, online ? s.subLabelOnline : s.subLabelOffline]}
            >
              {online ? "Ready for trips" : "Tap to start earning"}
            </Text>
          </View>
        </View>

        {/* Right Section: Duration + Earnings/hr (online only) */}
        {online && (
          <View style={s.rightSection}>
            {duration && (
              <View style={s.durationBadge}>
                <View style={s.durationDot} />
                <Text style={s.durationText}>{duration}</Text>
              </View>
            )}
            {earningsPerHour && (
              <View style={s.earningsPerHour}>
                <TrendingUp size={11} color="rgba(0, 0, 0, 0.5)" />
                <Text style={s.earningsPerHourText}>GH₵</Text>
                <Text style={s.earningsPerHourValue}>
                  {earningsPerHour.toFixed(0)}/hr
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={s.loadingOverlay}>
            <Text style={[s.mainLabel, s.mainLabelOffline]}>...</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
