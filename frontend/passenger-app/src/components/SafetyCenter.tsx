import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CheckCircle2,
  ChevronRight,
  Heart,
  Info,
  Phone,
  Share2,
  Shield,
  User,
  X,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

type Contact = {
  id: string;
  name: string;
  phoneE164: string;
  isPrimary?: boolean;
};

type RiderInfo = {
  name: string;
  phone?: string | null;
  vehicle?: {
    make?: string | null;
    model?: string | null;
    plateNumber?: string | null;
    color?: string | null;
  } | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  tripId?: string;
  tripPin?: string | null;
  rider?: RiderInfo;
  contacts?: Contact[];
  onShareTrip: () => void;
  onReportIssue: () => void;
};

/**
 * SafetyCenter — Passenger safety hub, accessible during every active trip.
 *
 * Design principles:
 * - Calm, non-alarming — uses muted tones, not red alerts
 * - Ordinary actions grouped together at top
 * - Emergency section visually separated with extra spacing + subtle divider
 * - Emergency Help requires long-press to prevent accidental activation
 *
 * ┌──────────────────────────────────────┐
 * │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
 * │  🛡 Safety                           │
 * │                                      │
 * │  During your trip                    │  ← Section label
 * │  ┌──────────────────────────────┐    │
 * │  │ 📤  Share trip           >   │    │
 * │  │ 👥  Trusted contacts     >   │    │
 * │  │ 🔢  Trip PIN             >   │    │
 * │  │ 🏍  Rider info           >   │    │
 * │  │ ⚠   Report issue         >   │    │
 * │  └──────────────────────────────┘    │
 * │                                      │
 * │  · · · · · · · · · · · · · · · · ·  │  ← Visual separator
 * │                                      │
 * │  In case of emergency                │  ← Section label
 * │  ┌──────────────────────────────┐    │
 * │  │ 🆘  Emergency Help           │    │  ← Long-press to activate
 * │  │ 📞  Call emergency services  │    │
 * │  └──────────────────────────────┘    │
 * │                                      │
 * │         [ Close ]                    │
 * └──────────────────────────────────────┘
 */
export function SafetyCenter({
  visible,
  onClose,
  tripId,
  tripPin,
  rider,
  contacts,
  onShareTrip,
  onReportIssue,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emergencyHeld, setEmergencyHeld] = useState(false);

  const contactCount = contacts?.length ?? 0;
  const primaryContact = contacts?.find((c) => c.isPrimary) ?? contacts?.[0];

  const handleLongPressStart = useCallback(() => {
    setEmergencyHeld(true);
    longPressTimer.current = setTimeout(() => {
      // Activate emergency
      Alert.alert(
        "Emergency Help",
        "This will alert OkadaGo safety and share your live location. Call local emergency services if you're in immediate danger.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Alert safety team",
            style: "destructive",
            onPress: () => {
              onReportIssue();
              onClose();
            },
          },
        ],
      );
      setEmergencyHeld(false);
    }, 3000);
  }, [onReportIssue, onClose]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setEmergencyHeld(false);
  }, []);

  const handleCallEmergencyServices = useCallback(() => {
    Alert.alert("Call emergency services", "This will dial your local emergency number.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call 191",
        onPress: () => Linking.openURL("tel:191"),
      },
    ]);
  }, []);

  const handleToggleExpand = useCallback((key: string) => {
    setExpandedItem((prev) => (prev === key ? null : key));
  }, []);

  const s = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "85%",
          paddingBottom: insets.bottom || 16,
        },
        handle: {
          alignSelf: "center",
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? colors.borderStrong : "#D1D5DB",
          marginTop: 10,
          marginBottom: 6,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 10,
        },
        headerLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        closeBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDark ? colors.surfaceOverlay : "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
        },

        /* ─── Scroll ────────────────────────────────────── */
        scroll: {
          paddingHorizontal: 20,
        },

        /* ─── Section ───────────────────────────────────── */
        sectionLabel: {
          fontSize: 12,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginTop: 16,
          marginBottom: 8,
          paddingLeft: 4,
        },
        group: {
          backgroundColor: isDark ? colors.surfaceOverlay : "#F8F9FA",
          borderRadius: 16,
          overflow: "hidden",
        },

        /* ─── Row ───────────────────────────────────────── */
        row: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        },
        rowBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
        rowIcon: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        },
        rowContent: {
          flex: 1,
        },
        rowTitle: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        rowSubtitle: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 1,
        },
        rowChevron: {
          opacity: 0.3,
        },

        /* ─── Expanded Content ──────────────────────────── */
        expandedContent: {
          paddingHorizontal: 16,
          paddingBottom: 14,
          gap: 8,
        },
        expandedText: {
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        pinDisplay: {
          flexDirection: "row",
          gap: 6,
          marginTop: 4,
        },
        pinDigit: {
          width: 36,
          height: 40,
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
        contactRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 6,
        },
        contactName: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.text,
        },
        contactPhone: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        primaryBadge: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.1)" : "rgba(250,204,21,0.08)",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          overflow: "hidden",
        },
        riderDetail: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        actionBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          marginTop: 4,
        },
        actionBtnText: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.primary,
        },

        /* ─── Separator ─────────────────────────────────── */
        separator: {
          flexDirection: "row",
          alignItems: "center",
          marginVertical: 16,
          gap: 8,
        },
        separatorLine: {
          flex: 1,
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        },
        separatorDot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
        },

        /* ─── Emergency Section ─────────────────────────── */
        emergencyRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        },
        emergencyIcon: {
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
        },
        emergencyTitle: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
        },
        emergencySubtitle: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 1,
        },
        longPressHint: {
          fontSize: 11,
          color: colors.textMuted,
          fontStyle: "italic",
          marginTop: 2,
        },
        emergencyHeld: {
          backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
        },
        emergencyProgress: {
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.danger,
          marginTop: 6,
          overflow: "hidden",
        },
        emergencyProgressFill: {
          height: "100%",
          backgroundColor: colors.danger,
          borderRadius: 1.5,
        },

        /* ─── Close Button ──────────────────────────────── */
        closeBtnRow: {
          alignItems: "center",
          paddingVertical: 14,
          marginTop: 8,
          marginBottom: 4,
        },
        closeBtnText: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.textSecondary,
        },
      }),
    [colors, isDark, insets.bottom],
  );

  if (!visible) return null;

  return (
    <View style={s.overlay}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* ─── Header ──────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Shield size={20} color={colors.primary} />
            <Text style={s.headerTitle}>Safety</Text>
          </View>
          <Pressable style={s.closeBtn} onPress={onClose} accessibilityLabel="Close">
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* ─── During Your Trip ──────────────────────── */}
          <Text style={s.sectionLabel}>During your trip</Text>
          <View style={s.group}>
            {/* Share Trip */}
            <Pressable
              style={[s.row, s.rowBorder]}
              onPress={onShareTrip}
              accessibilityRole="button"
            >
              <View style={[s.rowIcon, { backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)" }]}>
                <Share2 size={18} color="#3B82F6" />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>Share trip</Text>
                <Text style={s.rowSubtitle}>Let someone track your ride</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} style={s.rowChevron} />
            </Pressable>

            {/* Trusted Contacts */}
            <Pressable
              style={[s.row, s.rowBorder]}
              onPress={() => handleToggleExpand("contacts")}
              accessibilityRole="button"
            >
              <View style={[s.rowIcon, { backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)" }]}>
                <Heart size={18} color="#22C55E" />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>Trusted contacts</Text>
                <Text style={s.rowSubtitle}>
                  {contactCount > 0 ? `${contactCount} contact${contactCount > 1 ? "s" : ""}` : "No contacts added"}
                </Text>
              </View>
              <ChevronRight
                size={16}
                color={colors.textMuted}
                style={[s.rowChevron, expandedItem === "contacts" && { transform: [{ rotate: "90deg" }] }]}
              />
            </Pressable>
            {expandedItem === "contacts" && (
              <View style={s.expandedContent}>
                {contactCount === 0 ? (
                  <Text style={s.expandedText}>
                    No trusted contacts yet. Add them in Profile → Emergency contacts.
                  </Text>
                ) : (
                  contacts?.map((c) => (
                    <View key={c.id} style={s.contactRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.contactName}>{c.name}</Text>
                        <Text style={s.contactPhone}>{c.phoneE164}</Text>
                      </View>
                      {c.isPrimary ? <Text style={s.primaryBadge}>Primary</Text> : null}
                    </View>
                  ))
                )}
                <Pressable
                  style={s.actionBtn}
                  onPress={() => Linking.openURL("tel:" + (primaryContact?.phoneE164 ?? ""))}
                >
                  <Phone size={14} color={colors.primary} />
                  <Text style={s.actionBtnText}>Call primary contact</Text>
                </Pressable>
              </View>
            )}

            {/* Trip PIN */}
            <Pressable
              style={[s.row, s.rowBorder]}
              onPress={() => handleToggleExpand("pin")}
              accessibilityRole="button"
            >
              <View style={[s.rowIcon, { backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.08)" }]}>
                <Info size={18} color={colors.primary} />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>Trip PIN</Text>
                <Text style={s.rowSubtitle}>Show to rider before departure</Text>
              </View>
              <ChevronRight
                size={16}
                color={colors.textMuted}
                style={[s.rowChevron, expandedItem === "pin" && { transform: [{ rotate: "90deg" }] }]}
              />
            </Pressable>
            {expandedItem === "pin" && (
              <View style={s.expandedContent}>
                {tripPin && tripPin.length > 0 ? (
                  <View style={s.pinDisplay}>
                    {tripPin.split("").slice(0, 6).map((digit, i) => (
                      <View key={i} style={s.pinDigit}>
                        <Text style={s.pinDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={s.expandedText}>
                    No PIN available yet. A PIN will appear once your rider confirms the trip.
                  </Text>
                )}
              </View>
            )}

            {/* Rider Info */}
            <Pressable
              style={[s.row, s.rowBorder]}
              onPress={() => handleToggleExpand("rider")}
              accessibilityRole="button"
            >
              <View style={[s.rowIcon, { backgroundColor: isDark ? "rgba(255,107,0,0.12)" : "rgba(255,107,0,0.08)" }]}>
                <User size={18} color="#ff6b00" />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>Rider information</Text>
                <Text style={s.rowSubtitle}>{rider?.name ?? "Rider details"}</Text>
              </View>
              <ChevronRight
                size={16}
                color={colors.textMuted}
                style={[s.rowChevron, expandedItem === "rider" && { transform: [{ rotate: "90deg" }] }]}
              />
            </Pressable>
            {expandedItem === "rider" && rider && (
              <View style={s.expandedContent}>
                <Text style={[s.expandedText, { fontWeight: "600", color: colors.text }]}>
                  {rider.name}
                </Text>
                {rider.vehicle?.make || rider.vehicle?.model ? (
                  <Text style={s.riderDetail}>
                    {[rider.vehicle?.make, rider.vehicle?.model].filter(Boolean).join(" ")}
                    {rider.vehicle?.color ? ` · ${rider.vehicle.color}` : ""}
                  </Text>
                ) : null}
                {rider.vehicle?.plateNumber ? (
                  <Text style={s.riderDetail}>Plate: {rider.vehicle.plateNumber}</Text>
                ) : null}
                {rider.phone ? (
                  <Pressable
                    style={s.actionBtn}
                    onPress={() => Linking.openURL(`tel:${rider.phone}`)}
                  >
                    <Phone size={14} color={colors.primary} />
                    <Text style={s.actionBtnText}>Call rider</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Report Issue */}
            <Pressable
              style={s.row}
              onPress={onReportIssue}
              accessibilityRole="button"
            >
              <View style={[s.rowIcon, { backgroundColor: isDark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)" }]}>
                <Info size={18} color="#A855F7" />
              </View>
              <View style={s.rowContent}>
                <Text style={s.rowTitle}>Report issue</Text>
                <Text style={s.rowSubtitle}>Something not right?</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} style={s.rowChevron} />
            </Pressable>
          </View>

          {/* ─── Separator ─────────────────────────────── */}
          <View style={s.separator}>
            <View style={s.separatorLine} />
            <View style={s.separatorDot} />
            <View style={s.separatorDot} />
            <View style={s.separatorDot} />
            <View style={s.separatorLine} />
          </View>

          {/* ─── Emergency Section ─────────────────────── */}
          <Text style={s.sectionLabel}>In case of emergency</Text>
          <View style={s.group}>
            {/* Emergency Help — long-press to activate */}
            <Pressable
              style={[s.emergencyRow, s.rowBorder, emergencyHeld && s.emergencyHeld]}
              onLongPress={handleLongPressStart}
              onPressOut={handleLongPressEnd}
              accessibilityRole="button"
              accessibilityLabel="Emergency help. Press and hold for 3 seconds to activate."
            >
              <View style={s.emergencyIcon}>
                <Shield size={18} color={colors.danger} />
              </View>
              <View style={s.rowContent}>
                <Text style={s.emergencyTitle}>Emergency Help</Text>
                <Text style={s.emergencySubtitle}>Alert OkadaGo safety team</Text>
                <Text style={s.longPressHint}>Press and hold for 3 seconds</Text>
              </View>
            </Pressable>

            {/* Call emergency services */}
            <Pressable
              style={s.emergencyRow}
              onPress={handleCallEmergencyServices}
              accessibilityRole="button"
            >
              <View style={s.emergencyIcon}>
                <Phone size={18} color={colors.danger} />
              </View>
              <View style={s.rowContent}>
                <Text style={s.emergencyTitle}>Call emergency services</Text>
                <Text style={s.emergencySubtitle}>Dial local emergency number</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} style={s.rowChevron} />
            </Pressable>
          </View>

          {/* ─── Close ─────────────────────────────────── */}
          <Pressable style={s.closeBtnRow} onPress={onClose}>
            <Text style={s.closeBtnText}>Close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
