import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, MapPin, Navigation, Truck } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import {
  space,
  radii,
  type,
  brand,
} from "@/theme/design-system";

type TripRequest = {
  id: string;
  kind: "ride" | "delivery";
  pickupAddress: string;
  pickupDistanceKm?: number;
  estimatedPickupMin?: number;
  destinationAddress: string;
  destinationArea?: string;
  tripDistanceKm: number;
  tripDurationMin: number;
  estimatedFare: number;
  tripType?: string;
};

type Props = {
  visible: boolean;
  request: TripRequest | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  expiresIn?: number;
};

/**
 * TripRequestSheet — Incoming trip request bottom sheet.
 *
 * Design principles:
 * - Map visible behind (50% of screen)
 * - Large bottom sheet (45-55% of screen)
 * - Earnings prominently displayed
 * - All key info at a glance
 * - Accept is dominant (large, gold)
 * - Decline is secondary (small, muted)
 * - Timer visible but not stressful
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │                                 │
 * │       MAP (50%)                 │ ← Visible, dimmed
 * │                                 │
 * ├─────────────────────────────────┤
 * │  ┌───────────────────────────┐  │
 * │  │  🟢 NEW RIDE REQUEST      │  │ ← Status badge
 * │  │                           │  │
 * │  │  GH₵ 25.00                │  │ ← Earnings (large, bold)
 * │  │                           │  │
 * │  │  📍 1.2 km • 🚗 3 min    │  │ ← Pickup distance + ETA
 * │  │  ─────────────────────    │  │ ← Divider
 * │  │  🏁 Osu (3.8 km)         │  │ ← Destination area + trip dist
 * │  │  🏍️ Standard Ride         │  │ ← Trip type
 * │  │                           │  │
 * │  │  👤 Kwame A. ★ 4.8        │  │ ← Passenger (rating if permitted)
 * │  │                           │  │
 * │  │  ┌─────────────────────┐  │  │
 * │  │  │    ACCEPT TRIP      │  │  │ ← Dominant action (large)
 * │  │  └─────────────────────┘  │  │
 * │  │  ┌─────────┐              │  │
 * │  │  │ Decline │              │  │ ← Secondary action (small)
 * │  │  └─────────┘              │  │
 * │  │     Auto in 15s           │  │ ← Timer (subtle)
 * │  └───────────────────────────┘  │
 * └─────────────────────────────────┘
 */
export function TripRequestSheet({
  visible,
  request,
  onAccept,
  onDecline,
  expiresIn = 15,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const tripTypeLabel = useMemo(() => {
    if (request?.kind === "delivery") return "Delivery";
    return "Standard Ride";
  }, [request?.kind]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.35)",
          zIndex: 100,
        },
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 20,
          elevation: 12,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          maxHeight: "55%",
        },
        content: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
        },

        /* ─── Handle Bar ──────────────────────────────────────── */
        handleBar: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginBottom: 12,
        },

        /* ─── Status Badge ────────────────────────────────────── */
        statusBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          alignSelf: "flex-start",
          backgroundColor: brand.online,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
          marginBottom: 12,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#000000",
        },
        statusText: {
          fontSize: 10,
          fontWeight: "700",
          color: "#000000",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },

        /* ─── Earnings Display (Prominent) ──────────────────────── */
        earningsSection: {
          marginBottom: 16,
        },
        earningsLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 4,
        },
        earningsRow: {
          flexDirection: "row",
          alignItems: "baseline",
          gap: 6,
        },
        earningsCurrency: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.textSecondary,
        },
        earningsValue: {
          fontSize: 38,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -1.5,
        },

        /* ─── Info Row (Pickup + Destination) ──────────────────── */
        infoRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        },
        infoItem: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        infoIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
        },
        infoTextGroup: {
          gap: 1,
        },
        infoLabel: {
          fontSize: 9,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        infoValue: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },

        /* ─── Divider ──────────────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginBottom: 12,
        },

        /* ─── Trip Details ──────────────────────────────────────── */
        tripDetails: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        },
        tripBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: colors.surfaceOverlay,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        tripBadgeText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Action Buttons ──────────────────────────────────── */
        actionsSection: {
          gap: 10,
        },
        acceptBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
          borderRadius: 16,
          backgroundColor: brand.primary,
          shadowColor: brand.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        acceptText: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },
        declineBtn: {
          alignSelf: "center",
          height: 44,
          paddingHorizontal: 24,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceOverlay,
          borderWidth: 1,
          borderColor: colors.border,
        },
        declineText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Timer (Subtle) ──────────────────────────────────── */
        timerRow: {
          alignItems: "center",
          marginTop: 12,
        },
        timerText: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
        },
        timerValue: {
          color: brand.accent,
          fontWeight: "600",
        },
      }),
    [colors, isDark, insets],
  );

  if (!visible || !request) return null;

  return (
    <>
      {/* ─── Backdrop (map visible but dimmed) ──────────────────── */}
      <Animated.View
        style={[
          s.backdrop,
          {
            opacity: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      />

      {/* ─── Trip Request Sheet ─────────────────────────────────── */}
      <Animated.View
        style={[
          s.sheet,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [500, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={s.content}>
          {/* Handle Bar */}
          <View style={s.handleBar} />

          {/* Status Badge */}
          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>New {request.kind} request</Text>
          </View>

          {/* Earnings Display (Prominent) */}
          <View style={s.earningsSection}>
            <Text style={s.earningsLabel}>Estimated Earnings</Text>
            <View style={s.earningsRow}>
              <Text style={s.earningsCurrency}>GH₵</Text>
              <Text style={s.earningsValue}>{request.estimatedFare.toFixed(2)}</Text>
            </View>
          </View>

          {/* Pickup Distance + ETA */}
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <View style={s.infoIcon}>
                <MapPin size={14} color={colors.primary} />
              </View>
              <View style={s.infoTextGroup}>
                <Text style={s.infoLabel}>Pickup</Text>
                <Text style={s.infoValue}>
                  {request.pickupDistanceKm?.toFixed(1) ?? "—"} km
                </Text>
              </View>
            </View>
            <View style={s.infoItem}>
              <View style={s.infoIcon}>
                <Clock size={14} color={colors.textSecondary} />
              </View>
              <View style={s.infoTextGroup}>
                <Text style={s.infoLabel}>ETA</Text>
                <Text style={s.infoValue}>
                  {request.estimatedPickupMin ?? "—"} min
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Destination Area + Trip Distance */}
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <View style={s.infoIcon}>
                <Navigation size={14} color={colors.danger} />
              </View>
              <View style={s.infoTextGroup}>
                <Text style={s.infoLabel}>Destination</Text>
                <Text style={s.infoValue} numberOfLines={1}>
                  {request.destinationArea || request.destinationAddress}
                </Text>
              </View>
            </View>
            <View style={s.infoItem}>
              <View style={s.infoIcon}>
                <MapPin size={14} color={colors.textSecondary} />
              </View>
              <View style={s.infoTextGroup}>
                <Text style={s.infoLabel}>Trip</Text>
                <Text style={s.infoValue}>{request.tripDistanceKm.toFixed(1)} km</Text>
              </View>
            </View>
          </View>

          {/* Trip Type */}
          <View style={s.tripDetails}>
            <View style={s.tripBadge}>
              {request.kind === "delivery" ? (
                <Truck size={12} color={colors.textSecondary} />
              ) : (
                <Navigation size={12} color={colors.textSecondary} />
              )}
              <Text style={s.tripBadgeText}>{tripTypeLabel}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={s.actionsSection}>
            <Pressable
              style={s.acceptBtn}
              onPress={() => onAccept(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Accept trip"
            >
              <Text style={s.acceptText}>Accept Trip</Text>
            </Pressable>
            <Pressable
              style={s.declineBtn}
              onPress={() => onDecline(request.id)}
              accessibilityRole="button"
              accessibilityLabel="Decline trip"
            >
              <Text style={s.declineText}>Decline</Text>
            </Pressable>
          </View>

          {/* Timer (Subtle) */}
          <View style={s.timerRow}>
            <Text style={s.timerText}>
              Auto-decline in {expiresIn}s
            </Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
