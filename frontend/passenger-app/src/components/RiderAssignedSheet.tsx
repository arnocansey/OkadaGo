import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Info, MessageCircle, Phone, Shield, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";

type RiderData = {
  name: string;
  avatarUrl?: string | null;
  rating?: number | null;
  completedTrips?: number | null;
  phoneE164?: string | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
};

type Props = {
  rider: RiderData;
  /** Trip verification PIN if available */
  tripPin?: string | null;
  /** ETA text e.g. "3 min" */
  eta?: string;
  onCall: () => void;
  onChat: () => void;
  onSafety: () => void;
  onRiderPress?: () => void;
};

/**
 * RiderAssignedSheet — Bottom sheet for assigned/arriving state
 *
 * Map occupies ~65-70% of viewport. This sheet floats at the bottom.
 *
 * ┌──────────────────────────────────────┐
 * │  ┌─────┐                             │
 * │  │     │  Kwame Asante               │  ← Avatar overlaps card top
 * │  │ IMG │  ⭐ 4.8 · 342 trips         │
 * │  └─────┘                             │
 * │  ┌──────────────────────────┐        │
 * │  │  🏍 Honda CB125 · Red    │        │  ← Vehicle info
 * │  │  ⚫  GR-1234-24           │        │  ← Plate number
 * │  └──────────────────────────┘        │
 * │                                      │
 * │  ┌─────┐  PIN                        │
 * │  │ 4 8 │  ← Compact PIN display     │
 * │  └─────┘                             │
 * │                                      │
 * │  [📞 Call]  [💬 Chat]  [🛡 Safety]   │  ← Actions
 * └──────────────────────────────────────┘
 */
export function RiderAssignedSheet({
  rider,
  tripPin,
  eta,
  onCall,
  onChat,
  onSafety,
  onRiderPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const vehicleDescription = useMemo(() => {
    if (!rider.vehicle) return null;
    const parts = [rider.vehicle.make, rider.vehicle.model].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
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
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.12,
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
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 8,
          marginBottom: 4,
        },
        inner: {
          paddingHorizontal: 20,
        },

        /* ─── Rider Profile ──────────────────────────────── */
        profileRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
        },
        avatarWrap: {
          marginTop: -20,
        },
        riderInfo: {
          flex: 1,
        },
        riderName: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        riderMeta: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 3,
        },
        ratingBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
        },
        ratingText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
        },
        metaDot: {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.textMuted,
        },
        tripsText: {
          fontSize: 13,
          color: colors.textSecondary,
        },
        etaBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          backgroundColor: colors.successLight,
        },
        etaText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.success,
        },

        /* ─── Vehicle Card ───────────────────────────────── */
        vehicleCard: {
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          borderRadius: 14,
          padding: 12,
          marginBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        vehicleLeft: {
          flex: 1,
        },
        vehicleDesc: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text,
        },
        vehicleColor: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 2,
        },
        plateBadge: {
          backgroundColor: isDark ? "rgba(250,204,21,0.1)" : "rgba(250,204,21,0.08)",
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        plateText: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.primary,
          letterSpacing: 0.5,
        },

        /* ─── Trip PIN ──────────────────────────────────── */
        pinRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        },
        pinLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        pinDigits: {
          flexDirection: "row",
          gap: 6,
        },
        pinDigit: {
          width: 36,
          height: 40,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.12)",
          alignItems: "center",
          justifyContent: "center",
        },
        pinDigitText: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.primary,
        },

        /* ─── Action Buttons ─────────────────────────────── */
        actionsRow: {
          flexDirection: "row",
          gap: 10,
        },
        actionBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 48,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        actionBtnPrimary: {
          flex: 1.5,
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
        actionText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        actionTextPrimary: {
          color: colors.primary,
        },
        safetyBtn: {
          borderColor: colors.danger,
        },
        safetyText: {
          color: colors.danger,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <View style={s.inner}>
        {/* ─── Rider Profile ──────────────────────────────── */}
        <Pressable
          style={s.profileRow}
          onPress={onRiderPress}
          accessibilityRole="button"
          accessibilityLabel="View rider profile and details"
        >
          <View style={s.avatarWrap}>
            <Avatar name={rider.name} size={60} imageUri={rider.avatarUrl ?? undefined} />
          </View>
          <View style={s.riderInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={s.riderName}>{rider.name}</Text>
              {onRiderPress ? <Info size={16} color={colors.primary} /> : null}
            </View>
            <View style={s.riderMeta}>
              {rider.rating != null ? (
                <View style={s.ratingBadge}>
                  <Star size={12} color={colors.primary} fill={colors.primary} />
                  <Text style={s.ratingText}>
                    {typeof rider?.rating === "number" && Number.isFinite(rider.rating) ? rider.rating.toFixed(1) : "5.0"}
                  </Text>
                </View>
              ) : null}
              {rider.rating != null && rider.completedTrips != null ? (
                <View style={s.metaDot} />
              ) : null}
              {rider.completedTrips != null ? (
                <Text style={s.tripsText}>{rider.completedTrips} trips</Text>
              ) : null}
            </View>
          </View>
          {eta ? (
            <View style={s.etaBadge}>
              <Text style={s.etaText}>{eta}</Text>
            </View>
          ) : null}
        </Pressable>

        {/* ─── Vehicle Card ───────────────────────────────── */}
        {(vehicleDescription || rider.vehicle?.plateNumber) && (
          <View style={s.vehicleCard}>
            <View style={s.vehicleLeft}>
              {vehicleDescription ? (
                <Text style={s.vehicleDesc}>{vehicleDescription}</Text>
              ) : null}
              {rider.vehicle?.color ? (
                <Text style={s.vehicleColor}>{rider.vehicle.color}</Text>
              ) : null}
            </View>
            {rider.vehicle?.plateNumber ? (
              <View style={s.plateBadge}>
                <Text style={s.plateText}>{rider.vehicle.plateNumber}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ─── Trip PIN ──────────────────────────────────── */}
        {tripPin && tripPin.length > 0 ? (
          <View style={s.pinRow}>
            <Text style={s.pinLabel}>Trip PIN</Text>
            <View style={s.pinDigits}>
              {tripPin.split("").slice(0, 6).map((digit, i) => (
                <View key={i} style={s.pinDigit}>
                  <Text style={s.pinDigitText}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ─── Actions ───────────────────────────────────── */}
        <View style={s.actionsRow}>
          <Pressable
            style={s.actionBtn}
            onPress={onCall}
            accessibilityRole="button"
            accessibilityLabel="Call rider"
          >
            <Phone size={16} color={colors.text} />
            <Text style={s.actionText}>Call</Text>
          </Pressable>
          <Pressable
            style={s.actionBtn}
            onPress={onChat}
            accessibilityRole="button"
            accessibilityLabel="Chat with rider"
          >
            <MessageCircle size={16} color={colors.text} />
            <Text style={s.actionText}>Chat</Text>
          </Pressable>
          <Pressable
            style={[s.actionBtn, s.safetyBtn]}
            onPress={onSafety}
            accessibilityRole="button"
            accessibilityLabel="Safety options"
          >
            <Shield size={16} color={colors.danger} />
            <Text style={[s.actionText, s.safetyText]}>Safety</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
