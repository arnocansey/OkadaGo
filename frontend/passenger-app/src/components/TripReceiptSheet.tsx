import { useMemo } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import {
  Banknote,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Share2,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";

type Props = {
  visible: boolean;
  tripId: string;
  fare: string;
  currency?: string;
  pickupAddress: string;
  destinationAddress: string;
  distanceKm?: number;
  durationMinutes?: number;
  riderName: string;
  riderAvatar?: string | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
  paymentMethod?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  onDone: () => void;
};

function formatPayment(method?: string | null): string {
  if (!method) return "Cash";
  const map: Record<string, string> = {
    CASH: "Cash",
    MOBILE_MONEY: "Mobile Money",
    CARD: "Card",
    WALLET: "OkadaGo Wallet",
  };
  return map[method.toUpperCase()] ?? method;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDuration(minutes?: number): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

/**
 * TripReceiptSheet — Clean digital receipt for completed trips
 *
 * ┌──────────────────────────────────────┐
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
 * │                                      │
 * │       OkadaGo Receipt                │  ← Brand header
 * │       ═══════════════                │
 * │                                      │
 * │       GHS 45.00                      │  ← Large fare (hero)
 * │       ═══════════════                │
 * │                                      │
 * │  📍 Pickup                           │
 * │  Osu Oxford Street, Accra            │  ← Address (secondary)
 * │                                      │
 * │  📍 Destination                      │
 * │  Kotoka International Airport        │
 * │                                      │
 * │  ─────────────────────────────────── │
 * │                                      │
 * │  📏 12.4 km          ⏱ 28 min       │  ← Stats row
 * │                                      │
 * │  ─────────────────────────────────── │
 * │                                      │
 * │  ┌─┐  Kwame Asante                  │  ← Rider row
 * │  │ │  Honda CB125 · Red              │
 * │  └─┘  ⚫ GR-1234-24                 │
 * │                                      │
 * │  ─────────────────────────────────── │
 * │                                      │
 * │  💳 Mobile Money                     │  ← Payment method
 * │  📅 9 Aug 2026 · 14:30              │  ← Date + time
 * │  🆔 TRP-abc123                       │  ← Trip ID
 * │                                      │
 * │  ┌──────────────────────────────┐    │
 * │  │     📤 Share receipt         │    │  ← Primary CTA
 * │  └──────────────────────────────┘    │
 * │  ┌──────────────────────────────┐    │
 * │  │         Done                 │    │  ← Secondary CTA
 * │  └──────────────────────────────┘    │
 * └──────────────────────────────────────┘
 */
export function TripReceiptSheet({
  visible,
  tripId,
  fare,
  currency,
  pickupAddress,
  destinationAddress,
  distanceKm,
  durationMinutes,
  riderName,
  riderAvatar,
  vehicle,
  paymentMethod,
  completedAt,
  createdAt,
  onDone,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const vehicleSummary = useMemo(() => {
    if (!vehicle) return null;
    const parts = [vehicle.make, vehicle.model].filter(Boolean);
    const desc = parts.length > 0 ? parts.join(" ") : null;
    const plate = vehicle.plateNumber;
    if (desc && plate) return `${desc} · ${plate}`;
    return desc ?? plate ?? null;
  }, [vehicle]);

  const handleShare = async () => {
    const lines = [
      "OkadaGo Receipt",
      "",
      fare,
      "",
      `${pickupAddress} → ${destinationAddress}`,
      distanceKm != null ? `${distanceKm.toFixed(1)} km` : null,
      durationMinutes != null ? formatDuration(durationMinutes) : null,
      "",
      `Rider: ${riderName}`,
      vehicleSummary ? `Vehicle: ${vehicleSummary}` : null,
      `Payment: ${formatPayment(paymentMethod)}`,
      completedAt ? `${formatDate(completedAt)} ${formatTime(completedAt)}` : null,
      "",
      `Trip ID: ${tripId}`,
    ].filter(Boolean).join("\n");

    try {
      await Share.share({ message: lines, title: "OkadaGo Receipt" });
    } catch {}
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.borderStrong,
          marginTop: 10,
          marginBottom: 6,
        },
        scroll: {
          flex: 1,
        },
        content: {
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom || 16,
        },

        /* ─── Brand Header ────────────────────────────── */
        brandHeader: {
          alignItems: "center",
          marginBottom: 20,
        },
        brandName: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.primary,
          letterSpacing: 1,
        },
        brandLine: {
          width: 40,
          height: 2,
          backgroundColor: colors.primary,
          borderRadius: 1,
          marginTop: 6,
        },
        receiptLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginTop: 10,
        },

        /* ─── Fare (Hero) ─────────────────────────────── */
        fareHero: {
          alignItems: "center",
          marginBottom: 24,
        },
        fareAmount: {
          fontSize: 36,
          fontWeight: "800",
          color: colors.text,
        },
        fareLine: {
          width: 56,
          height: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          borderRadius: 1,
          marginTop: 8,
        },

        /* ─── Route ────────────────────────────────────── */
        routeSection: {
          marginBottom: 20,
        },
        routeRow: {
          flexDirection: "row",
          gap: 12,
          marginBottom: 16,
        },
        routeDotCol: {
          alignItems: "center",
          paddingTop: 4,
        },
        routeDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
        },
        routeDashCol: {
          width: 2,
          flex: 1,
          alignItems: "center",
          paddingTop: 4,
        },
        routeDash: {
          width: 2,
          height: 16,
          borderRadius: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
          marginBottom: 4,
        },
        routeContent: {
          flex: 1,
        },
        routeLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        routeAddress: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
          lineHeight: 20,
        },

        /* ─── Divider ──────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginVertical: 16,
        },

        /* ─── Stats Row ────────────────────────────────── */
        statsRow: {
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 4,
        },
        statItem: {
          alignItems: "center",
          gap: 4,
        },
        statValue: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        statLabel: {
          fontSize: 11,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },

        /* ─── Rider Row ────────────────────────────────── */
        riderRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        },
        riderInfo: {
          flex: 1,
        },
        riderName: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
        },
        riderVehicle: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        riderPlate: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 1,
        },

        /* ─── Details ──────────────────────────────────── */
        detailsSection: {
          gap: 10,
        },
        detailRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        detailIcon: {
          width: 28,
          height: 28,
          borderRadius: 7,
          alignItems: "center",
          justifyContent: "center",
        },
        detailText: {
          fontSize: 14,
          color: colors.text,
          fontWeight: "500",
        },

        /* ─── Actions ──────────────────────────────────── */
        actionsSection: {
          marginTop: 24,
          gap: 10,
        },
        shareBtn: {
          width: "100%",
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        shareText: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.background,
        },
        doneBtn: {
          width: "100%",
          height: 52,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        doneText: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <View style={s.handle} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Brand Header ────────────────────────────── */}
        <View style={s.brandHeader}>
          <Text style={s.brandName}>OKADAGO</Text>
          <View style={s.brandLine} />
          <Text style={s.receiptLabel}>Trip Receipt</Text>
        </View>

        {/* ─── Fare Hero ───────────────────────────────── */}
        <View style={s.fareHero}>
          <Text style={s.fareAmount}>{fare}</Text>
          <View style={s.fareLine} />
        </View>

        {/* ─── Route ────────────────────────────────────── */}
        <View style={s.routeSection}>
          <View style={s.routeRow}>
            <View style={s.routeDotCol}>
              <View style={[s.routeDot, { backgroundColor: colors.primary }]} />
              <View style={s.routeDashCol}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={s.routeDash} />
                ))}
              </View>
              <View style={[s.routeDot, { backgroundColor: colors.danger }]} />
            </View>
            <View style={s.routeContent}>
              <Text style={s.routeLabel}>Pickup</Text>
              <Text style={s.routeAddress}>{pickupAddress}</Text>
              <View style={{ height: 20 }} />
              <Text style={s.routeLabel}>Destination</Text>
              <Text style={s.routeAddress}>{destinationAddress}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* ─── Stats ────────────────────────────────────── */}
        {distanceKm != null || durationMinutes != null ? (
          <View style={s.statsRow}>
            {distanceKm != null && Number.isFinite(distanceKm) ? (
              <View style={s.statItem}>
                <Navigation size={16} color={colors.primary} />
                <Text style={s.statValue}>{distanceKm.toFixed(1)} km</Text>
                <Text style={s.statLabel}>Distance</Text>
              </View>
            ) : null}
            {durationMinutes != null ? (
              <View style={s.statItem}>
                <Clock size={16} color={colors.primary} />
                <Text style={s.statValue}>{formatDuration(durationMinutes)}</Text>
                <Text style={s.statLabel}>Duration</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={s.divider} />

        {/* ─── Rider ────────────────────────────────────── */}
        <View style={s.riderRow}>
          <Avatar name={riderName} size={44} imageUri={riderAvatar ?? undefined} />
          <View style={s.riderInfo}>
            <Text style={s.riderName}>{riderName}</Text>
            {vehicle ? (
              <>
                <Text style={s.riderVehicle}>
                  {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                  {vehicle.color ? ` · ${vehicle.color}` : ""}
                </Text>
                {vehicle.plateNumber ? (
                  <Text style={s.riderPlate}>{vehicle.plateNumber}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* ─── Details ──────────────────────────────────── */}
        <View style={s.detailsSection}>
          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: isDark ? "rgba(250,204,21,0.1)" : "rgba(250,204,21,0.08)" }]}>
              <Banknote size={14} color={colors.primary} />
            </View>
            <Text style={s.detailText}>{formatPayment(paymentMethod)}</Text>
          </View>
          {completedAt || createdAt ? (
            <View style={s.detailRow}>
              <View style={[s.detailIcon, { backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)" }]}>
                <Calendar size={14} color="#3B82F6" />
              </View>
              <Text style={s.detailText}>
                {formatDate(completedAt ?? createdAt)}
                {completedAt ? ` · ${formatTime(completedAt)}` : ""}
              </Text>
            </View>
          ) : null}
          <View style={s.detailRow}>
            <View style={[s.detailIcon, { backgroundColor: isDark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.08)" }]}>
              <MapPin size={14} color="#A855F7" />
            </View>
            <Text style={s.detailText}>TRP-{tripId.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {/* ─── Actions ──────────────────────────────────── */}
        <View style={s.actionsSection}>
          <Pressable style={s.shareBtn} onPress={handleShare} accessibilityRole="button">
            <Share2 size={18} color={colors.background} />
            <Text style={s.shareText}>Share receipt</Text>
          </Pressable>
          <Pressable style={s.doneBtn} onPress={onDone} accessibilityRole="button">
            <Text style={s.doneText}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
