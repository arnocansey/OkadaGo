import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { MapPin, MessageCircle, Phone, Shield } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";

type RiderData = {
  name: string;
  avatarUrl?: string | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
  } | null;
};

type Props = {
  rider: RiderData;
  destinationAddress: string;
  /** ETA in minutes */
  etaMinutes?: number;
  /** Distance remaining in km */
  distanceKm?: number;
  /** Progress 0–1 (rider distance traveled / total) */
  progress?: number;
  onCall: () => void;
  onChat: () => void;
  onSafety: () => void;
};

/**
 * ActiveTripSheet — Compact bottom sheet during active ride
 *
 * ┌──────────────────────────────────────┐
 * │  ┌─┐  Kwame Asante                  │  ← Rider identity (compact)
 * │  │ │  Honda CB125 · GR-1234-24       │
 * │  └─┘                                │
 * │  ─────────────────────────────────── │  ← Thin divider
 * │  📍 Osu Oxford Street               │  ← Destination (truncated)
 * │  ━━━━━━━━━━━━━━━━━━━░░░░░  8 min    │  ← Progress bar + ETA
 * │  1.2 km remaining                   │  ← Distance
 * │  ─────────────────────────────────── │  ← Thin divider
 * │  [📞]  [💬]  [🛡]                   │  ← Compact icon-only actions
 * └──────────────────────────────────────┘
 *
 * Sheet height: ~180px — leaves ~70% of map visible.
 */
export function ActiveTripSheet({
  rider,
  destinationAddress,
  etaMinutes,
  distanceKm,
  progress = 0,
  onCall,
  onChat,
  onSafety,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const etaText = etaMinutes != null ? `${Math.round(etaMinutes)} min` : null;
  const distText = distanceKm != null ? `${distanceKm.toFixed(1)} km` : null;

  const vehicleSummary = useMemo(() => {
    if (!rider.vehicle) return null;
    const parts = [rider.vehicle.make, rider.vehicle.model].filter(Boolean);
    const desc = parts.length > 0 ? parts.join(" ") : null;
    const plate = rider.vehicle.plateNumber;
    if (desc && plate) return `${desc} · ${plate}`;
    return desc ?? plate ?? null;
  }, [rider.vehicle]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 16,
          elevation: 10,
          paddingBottom: insets.bottom || 12,
          paddingTop: 8,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 6,
          marginBottom: 6,
        },
        inner: {
          paddingHorizontal: 18,
          gap: 10,
        },

        /* ─── Divider ──────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },

        /* ─── Rider Row ────────────────────────────────── */
        riderRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        riderInfo: {
          flex: 1,
        },
        riderName: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        vehicleText: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 1,
        },

        /* ─── Destination Row ──────────────────────────── */
        destRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        destText: {
          flex: 1,
          fontSize: 13,
          fontWeight: "500",
          color: colors.text,
          flexShrink: 1,
        },

        /* ─── Progress Bar ─────────────────────────────── */
        progressRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        progressTrack: {
          flex: 1,
          height: 6,
          borderRadius: 3,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          borderRadius: 3,
          backgroundColor: colors.primary,
        },
        progressEnd: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: isDark ? colors.surface : "#FFFFFF",
        },
        etaText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.primary,
          minWidth: 44,
          textAlign: "right",
        },
        distText: {
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "right",
        },

        /* ─── Actions (icon-only, compact) ─────────────── */
        actionsRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 16,
        },
        actionBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        safetyBtn: {
          borderColor: colors.danger,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <View style={s.inner}>
        {/* ─── Rider Row ────────────────────────────────── */}
        <View style={s.riderRow}>
          <Avatar name={rider.name} size={40} imageUri={rider.avatarUrl ?? undefined} />
          <View style={s.riderInfo}>
            <Text style={s.riderName} numberOfLines={1}>
              {rider.name}
            </Text>
            {vehicleSummary ? (
              <Text style={s.vehicleText} numberOfLines={1}>
                {vehicleSummary}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* ─── Destination ──────────────────────────────── */}
        <View style={s.destRow}>
          <MapPin size={14} color={colors.danger} />
          <Text style={s.destText} numberOfLines={1}>
            {destinationAddress}
          </Text>
        </View>

        {/* ─── Progress Bar + ETA ───────────────────────── */}
        <View style={s.progressRow}>
          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${clampedProgress * 100}%` },
              ]}
            />
          </View>
          <View style={s.progressEnd} />
          {etaText ? <Text style={s.etaText}>{etaText}</Text> : null}
        </View>
        {distText ? <Text style={s.distText}>{distText} remaining</Text> : null}

        <View style={s.divider} />

        {/* ─── Actions (icon-only) ──────────────────────── */}
        <View style={s.actionsRow}>
          <Pressable
            style={s.actionBtn}
            onPress={onCall}
            accessibilityRole="button"
            accessibilityLabel="Call rider"
          >
            <Phone size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={s.actionBtn}
            onPress={onChat}
            accessibilityRole="button"
            accessibilityLabel="Chat with rider"
          >
            <MessageCircle size={18} color={colors.text} />
          </Pressable>
          <Pressable
            style={[s.actionBtn, s.safetyBtn]}
            onPress={onSafety}
            accessibilityRole="button"
            accessibilityLabel="Safety options"
          >
            <Shield size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
