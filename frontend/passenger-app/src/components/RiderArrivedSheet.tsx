import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle, Info, Phone, Shield } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import { StandardBike } from "@/components/vehicles/StandardBike";
import { ExpressBike } from "@/components/vehicles/ExpressBike";
import { CargoTrike } from "@/components/vehicles/CargoTrike";

type RiderData = {
  name: string;
  avatarUrl?: string | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
};

type Props = {
  rider: RiderData;
  tripPin?: string | null;
  onCall: () => void;
  onSafety: () => void;
  onConfirm: () => void;
  onRiderPress?: () => void;
  confirmed?: boolean;
};

function getVehicleComponent(
  make?: string | null,
  model?: string | null,
  color?: string | null,
) {
  const key = `${make ?? ""} ${model ?? ""}`.toLowerCase();
  if (key.includes("cargo") || key.includes("trike")) {
    return <CargoTrike width={220} height={160} color={color ?? "#facc15"} />;
  }
  if (key.includes("express") || key.includes("x")) {
    return <ExpressBike width={220} height={160} color={color ?? "#facc15"} />;
  }
  return <StandardBike width={220} height={160} color={color ?? "#facc15"} />;
}

/**
 * RiderArrivedSheet — Focused view when rider is at pickup
 *
 * ┌──────────────────────────────────────┐
 * │  ✅  Your rider has arrived          │
 * │                                      │
 * │      ┌────────────────────┐          │
 * │      │   🏍️ MOTORCYCLE    │          │  ← Vehicle illustration
 * │      │   ILLUSTRATION     │          │
 * │      └────────────────────┘          │
 * │                                      │
 * │  ┌──────────────────────────────┐    │
 * │  │  PLATE:  GR-1234-24          │    │  ← Large, scannable plate
 * │  └──────────────────────────────┘    │
 * │                                      │
 * │  Honda CB125 · Red                   │  ← Vehicle details
 * │  Kwame Asante · ⭐ 4.8              │  ← Rider info (small)
 * │                                      │
 * │  ┌─────┐                            │
 * │  │ 4 8 │  Trip PIN                  │  ← Compact PIN
 * │  └─────┘                            │
 * │                                      │
 * │  [📞 Call]  [🛡 Safety]             │
 * │                                      │
 * │  [ ✅  I'm at the bike  ]           │  ← Primary CTA
 * └──────────────────────────────────────┘
 */
export function RiderArrivedSheet({
  rider,
  tripPin,
  onCall,
  onSafety,
  onConfirm,
  onRiderPress,
  confirmed = false,
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

        /* ─── Arrival Status ────────────────────────────── */
        arrivalBadge: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginBottom: 16,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.06)",
        },
        arrivalText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.success,
        },

        /* ─── Motorcycle Visual ─────────────────────────── */
        bikeWrap: {
          alignItems: "center",
          marginBottom: 16,
        },

        /* ─── Plate (PRIMARY — extremely scannable) ──────── */
        plateCard: {
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "#FFFBEB",
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.primary,
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: 12,
          alignItems: "center",
        },
        plateLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4,
        },
        plateNumber: {
          fontSize: 26,
          fontWeight: "800",
          color: colors.primary,
          letterSpacing: 2,
        },

        /* ─── Vehicle + Rider Info ──────────────────────── */
        infoRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        },
        vehicleText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        colorDot: {
          width: 14,
          height: 14,
          borderRadius: 7,
          marginTop: 4,
        },
        riderRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        riderName: {
          fontSize: 13,
          color: colors.textSecondary,
        },

        /* ─── PIN ───────────────────────────────────────── */
        pinRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
        },
        pinLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        pinDigits: {
          flexDirection: "row",
          gap: 5,
        },
        pinDigit: {
          width: 34,
          height: 38,
          borderRadius: 8,
          backgroundColor: isDark ? "rgba(250,204,21,0.08)" : "rgba(250,204,21,0.06)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.12)",
          alignItems: "center",
          justifyContent: "center",
        },
        pinDigitText: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.primary,
        },

        /* ─── Actions ───────────────────────────────────── */
        actionsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 14,
        },
        actionBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 46,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        actionText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        safetyBtn: {
          borderColor: colors.danger,
        },
        safetyText: {
          color: colors.danger,
        },

        /* ─── Confirm CTA ───────────────────────────────── */
        confirmBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.success,
        },
        confirmText: {
          fontSize: 16,
          fontWeight: "700",
          color: "#FFFFFF",
        },
      }),
    [colors, isDark, insets.bottom],
  );

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <View style={s.inner}>
        {/* ─── Arrival Status ────────────────────────────── */}
        <View style={s.arrivalBadge}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={s.arrivalText}>Your rider has arrived</Text>
        </View>

        {/* ─── Motorcycle Illustration ───────────────────── */}
        <View style={s.bikeWrap}>
          {getVehicleComponent(
            rider.vehicle?.make,
            rider.vehicle?.model,
            rider.vehicle?.color,
          )}
        </View>

        {/* ─── Plate (PRIMARY — most scannable element) ──── */}
        {rider.vehicle?.plateNumber ? (
          <View style={s.plateCard}>
            <Text style={s.plateLabel}>Plate number</Text>
            <Text style={s.plateNumber}>{rider.vehicle.plateNumber}</Text>
          </View>
        ) : null}

        {/* ─── Vehicle + Rider Info ──────────────────────── */}
        <View style={s.infoRow}>
          <View>
            {vehicleDescription ? (
              <Text style={s.vehicleText}>{vehicleDescription}</Text>
            ) : null}
            {rider.vehicle?.color ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <View
                  style={[
                    s.colorDot,
                    { backgroundColor: rider.vehicle.color.toLowerCase() },
                  ]}
                />
                <Text style={s.vehicleText}>{rider.vehicle.color}</Text>
              </View>
            ) : null}
          </View>
          <Pressable style={s.riderRow} onPress={onRiderPress} accessibilityRole="button" accessibilityLabel="View rider profile">
            <Avatar name={rider.name} size={28} imageUri={rider.avatarUrl ?? undefined} />
            <Text style={s.riderName}>{rider.name}</Text>
            {onRiderPress ? <Info size={14} color={colors.primary} /> : null}
          </Pressable>
        </View>

        {/* ─── Trip PIN ──────────────────────────────────── */}
        {tripPin && tripPin.length > 0 ? (
          <View style={s.pinRow}>
            <Text style={s.pinLabel}>PIN</Text>
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
            style={[s.actionBtn, s.safetyBtn]}
            onPress={onSafety}
            accessibilityRole="button"
            accessibilityLabel="Safety options"
          >
            <Shield size={16} color={colors.danger} />
            <Text style={[s.actionText, s.safetyText]}>Safety</Text>
          </Pressable>
        </View>

        {/* ─── Confirm CTA ───────────────────────────────── */}
        <Pressable
          style={[
            s.confirmBtn,
            confirmed && {
              backgroundColor: isDark ? "rgba(34,197,94,0.2)" : "#DCFCE7",
              borderWidth: 1.5,
              borderColor: "#16A34A",
            },
          ]}
          onPress={onConfirm}
          disabled={confirmed}
          accessibilityRole="button"
          accessibilityLabel={confirmed ? "You're at the bike" : "I'm at the bike"}
        >
          <CheckCircle size={20} color={confirmed ? "#16A34A" : "#FFFFFF"} />
          <Text style={[s.confirmText, confirmed && { color: "#16A34A" }]}>
            {confirmed ? "You're at the bike ✓" : "I'm at the bike"}
          </Text>
        </Pressable>

        {confirmed ? (
          <View style={{ marginTop: 8, alignItems: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
              Please wear your helmet. Waiting for rider to start trip.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
