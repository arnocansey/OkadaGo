import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, MessageCircle, Phone, Shield, Star } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import { radius } from "@/theme/tokens";

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
 * RiderAssignedSheet â€” Bottom sheet for assigned/arriving state
 *
 * Bolt/Yango-style layout:
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚  â”â”â”â”  (handle)                         â”‚
 * â”‚                                         â”‚
 * â”‚  Arriving in ~6 min  >                  â”‚  â† Bold ETA headline
 * â”‚                                         â”‚
 * â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
 * â”‚  Ayivor  â˜…4.84        [ðŸ]  [ðŸ‘¤ photo] â”‚  â† Name+rating / moto+avatar
 * â”‚  Red Honda CB125                        â”‚
 * â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                â”‚
 * â”‚  â”‚   GR-1234-24        â”‚  â† Plate chip â”‚
 * â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â”‚
 * â”‚                                         â”‚
 * â”‚  [ðŸ“ž Call]  [ðŸ’¬ Chat]  [ðŸ›¡ Safety]     â”‚  â† 3 action buttons
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
    const parts = [rider.vehicle.color, rider.vehicle.make, rider.vehicle.model].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : null;
  }, [rider.vehicle]);

  const ratingDisplay = useMemo(() => {
    if (rider.rating == null) return null;
    return typeof rider.rating === "number" && Number.isFinite(rider.rating)
      ? rider.rating.toFixed(2)
      : "5.00";
  }, [rider.rating]);

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
          paddingBottom: insets.bottom || 20,
        },

        /* â”€â”€â”€ Handle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 10,
          marginBottom: 2,
        },

        /* â”€â”€â”€ ETA Headline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        etaRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
        },
        etaText: {
          flex: 1,
          fontSize: 22,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -0.3,
        },

        /* â”€â”€â”€ Inner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        inner: {
          paddingHorizontal: 20,
          paddingTop: 16,
          gap: 14,
        },

        /* â”€â”€â”€ Rider Profile Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        profileRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        profileLeft: {
          flex: 1,
        },
        riderName: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 3,
        },
        ratingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        ratingText: {
          fontSize: 14,
          fontWeight: "700",
          color: colors.text,
        },
        vehicleDesc: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 4,
        },
        profileRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        motoBadge: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.15)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.2)" : "rgba(250,204,21,0.25)",
        },

        /* â”€â”€â”€ Plate Chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        plateBadge: {
          alignSelf: "flex-start",
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: isDark ? colors.border : "#1A1A1A",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
        },
        plateText: {
          fontSize: 17,
          fontWeight: "800",
          color: isDark ? colors.text : "#1A1A1A",
          letterSpacing: 2,
        },

        /* â”€â”€â”€ Trip PIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        pinRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
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
          width: 34,
          height: 38,
          borderRadius: 8,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.2)" : "rgba(250,204,21,0.15)",
          alignItems: "center",
          justifyContent: "center",
        },
        pinDigitText: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.primary,
        },

        /* â”€â”€â”€ Action Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        actionsRow: {
          flexDirection: "row",
          gap: 10,
          marginTop: 2,
        },
        actionBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 50,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F7F8F9",
        },
        actionBtnCall: {
          backgroundColor: isDark ? "rgba(22,163,74,0.12)" : "rgba(22,163,74,0.08)",
          borderColor: "#16A34A",
        },
        actionBtnSafety: {
          borderColor: colors.danger,
          backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)",
        },
        actionText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        actionTextCall: {
          color: "#16A34A",
        },
        actionTextSafety: {
          color: colors.danger,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      {/* â”€â”€â”€ ETA Headline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Pressable
        style={s.etaRow}
        onPress={onRiderPress}
        accessibilityRole="button"
        accessibilityLabel="View rider details"
      >
        <Text style={s.etaText}>
          {eta ? `Arriving in ~${eta}` : "On the wayâ€¦"}
        </Text>
        {onRiderPress ? (
          <ChevronRight size={20} color={colors.textSecondary} />
        ) : null}
      </Pressable>

      <View style={s.inner}>
        {/* â”€â”€â”€ Rider Profile Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={s.profileRow}>
          <View style={s.profileLeft}>
            <Text style={s.riderName}>{rider.name}</Text>
            {ratingDisplay != null ? (
              <View style={s.ratingRow}>
                <Star size={13} color={colors.primary} fill={colors.primary} />
                <Text style={s.ratingText}>{ratingDisplay}</Text>
              </View>
            ) : null}
            {vehicleDescription ? (
              <Text style={s.vehicleDesc}>{vehicleDescription}</Text>
            ) : null}
          </View>

          {/* Right: motorcycle thumbnail + rider avatar */}
          <View style={s.profileRight}>
            <View style={s.motoBadge}>
              <MotorcycleIcon size={26} color={colors.primary} strokeWidth={2} />
            </View>
            <Avatar name={rider.name} size={48} imageUri={rider.avatarUrl ?? undefined} />
          </View>
        </View>

        {/* â”€â”€â”€ Plate Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {rider.vehicle?.plateNumber ? (
          <View style={s.plateBadge}>
            <Text style={s.plateText}>{rider.vehicle.plateNumber}</Text>
          </View>
        ) : null}

        {/* â”€â”€â”€ Trip PIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

        {/* â”€â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={s.actionsRow}>
          <Pressable
            style={[s.actionBtn, s.actionBtnCall]}
            onPress={onCall}
            accessibilityRole="button"
            accessibilityLabel="Call rider"
          >
            <Phone size={16} color="#16A34A" />
            <Text style={[s.actionText, s.actionTextCall]}>Call</Text>
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
            style={[s.actionBtn, s.actionBtnSafety]}
            onPress={onSafety}
            accessibilityRole="button"
            accessibilityLabel="Safety options"
          >
            <Shield size={16} color={colors.danger} />
            <Text style={[s.actionText, s.actionTextSafety]}>Safety</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
