import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
  Weight,
  XCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type PackageData = {
  type: string;
  size: string;
  description?: string;
  weight?: string;
  fragile?: boolean;
};

type Props = {
  visible: boolean;
  deliveryId: string;
  recipientName?: string;
  recipientPhone?: string;
  dropoffAddress?: string;
  dropoffLandmark?: string;
  package?: PackageData;
  onVerified: () => void;
  onSkip?: () => void;
  onVerify?: (pin: string) => Promise<boolean>;
};

/**
 * DeliveryCompletionSheet — Recipient PIN verification at dropoff.
 *
 * Requires recipient's delivery PIN before marking package delivered.
 * Shows recipient name and package info for confirmation.
 *
 * Layout — PIN Entry:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  📬 DELIVER PACKAGE             │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │ 👤 Ama Mensah           │    │ ← Recipient
 * │  │ 📦 Standard • Medium    │    │ ← Package
 * │  │ 📍 123 Osu Oxford St    │    │ ← Address
 * │  └─────────────────────────┘    │
 * │                                 │
 * │  Ask recipient for the          │
 * │  4-digit delivery PIN           │
 * │                                 │
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
 * │  │ 3  │ │ 8  │ │ 2  │ │ 1  │   │ ← 4-digit PIN
 * │  └────┘ └────┘ └────┘ └────┘   │
 * │                                 │
 * │  Incorrect PIN — try again      │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │   VERIFY & DELIVER          ││ ← Primary CTA
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  📞 Call recipient              │ ← Secondary
 * └─────────────────────────────────┘
 *
 * Layout — Success:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  ✅ DELIVERED                   │ ← Large confirmation
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │   ✓ PIN verified        │    │
 * │  │   ✓ Package delivered   │    │
 * │  │                         │    │
 * │  │   To: Ama Mensah        │    │
 * │  │   At: 123 Osu Oxford St │    │
 * │  └─────────────────────────┘    │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │       COMPLETE              ││ ← Final CTA
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function DeliveryCompletionSheet({
  visible,
  deliveryId,
  recipientName,
  recipientPhone,
  dropoffAddress,
  dropoffLandmark,
  package: pkg,
  onVerified,
  onSkip,
  onVerify,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const displayName = recipientName ?? "recipient";

  // Reset state when visible changes
  useEffect(() => {
    if (visible) {
      setPin(["", "", "", ""]);
      setError(false);
      setVerified(false);
      setVerifying(false);
    }
  }, [visible]);

  function handleChange(text: string, index: number) {
    if (text.length > 1) text = text.slice(-1);
    if (!/^\d*$/.test(text)) return;

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    setError(false);

    // Auto-focus next
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = "";
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verify() {
    const code = pin.join("");
    if (code.length !== 4) {
      setError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setVerifying(true);
    try {
      let valid = false;
      if (onVerify) {
        valid = await onVerify(code);
      } else {
        // DEV ONLY: No verify callback provided — reject in production
        // In production, always provide onVerify to validate PIN against backend
        valid = __DEV__;
      }

      if (valid) {
        setVerified(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(true);
        setPin(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError(true);
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  // Auto-verify when all 4 digits entered
  useEffect(() => {
    const code = pin.join("");
    if (code.length === 4 && !verified && !verifying) {
      verify();
    }
  }, [pin]);

  function handleComplete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onVerified();
  }

  function handleCallRecipient() {
    if (recipientPhone) {
      Alert.alert(
        "Call recipient",
        `Call ${displayName} at ${recipientPhone}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call",
            onPress: () => {
              const { Linking } = require("react-native");
              Linking.openURL(`tel:${recipientPhone}`);
            },
          },
        ],
      );
    }
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.5)",
        },
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: isDark ? 0.6 : 0.2,
          shadowRadius: 24,
          elevation: 16,
          paddingBottom: insets.bottom + 16,
        },
        content: {
          paddingHorizontal: 24,
          paddingTop: 16,
        },

        /* ─── Handle ─────────────────────────────────────────── */
        handle: {
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
          alignSelf: "center",
          marginBottom: 20,
        },

        /* ─── Header ─────────────────────────────────────────── */
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        },
        headerIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: verified ? "#22C55E20" : "#FF6B0020",
          alignItems: "center",
          justifyContent: "center",
        },
        headerText: {
          fontSize: 15,
          fontWeight: "700",
          color: verified ? "#22C55E" : colors.text,
        },

        /* ─── Info Card ──────────────────────────────────────── */
        infoCard: {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          padding: 16,
          marginBottom: 20,
        },
        recipientRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        },
        recipientAvatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.surfaceOverlay,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        recipientInfo: {
          flex: 1,
        },
        recipientLabel: {
          fontSize: 10,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        recipientName: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          marginTop: 2,
        },
        recipientPhone: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 1,
        },
        infoDivider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginVertical: 12,
        },
        detailRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        },
        detailIcon: {
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: "#FF6B0015",
          alignItems: "center",
          justifyContent: "center",
        },
        detailLabel: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          width: 70,
        },
        detailValue: {
          flex: 1,
          fontSize: 14,
          fontWeight: "500",
          color: colors.text,
        },
        packageTags: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        },
        packageTag: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        },
        packageTagText: {
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
        },

        /* ─── Instructions ───────────────────────────────────── */
        instructions: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textSecondary,
          marginBottom: 20,
          lineHeight: 20,
          textAlign: "center",
        },
        recipientHighlight: {
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── PIN Input Row ──────────────────────────────────── */
        pinRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 12,
          marginBottom: 16,
        },
        pinCell: {
          width: 64,
          height: 72,
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
          borderWidth: 2,
          borderColor: error
            ? colors.danger
            : verified
              ? "#22C55E"
              : isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.1)",
          alignItems: "center",
          justifyContent: "center",
        },
        pinCellFocused: {
          borderColor: "#FF6B00",
          backgroundColor: isDark ? "rgba(255,107,0,0.06)" : "rgba(255,107,0,0.04)",
        },
        pinDigit: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── Status Message ─────────────────────────────────── */
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 20,
          minHeight: 20,
        },
        statusText: {
          fontSize: 13,
          fontWeight: "600",
        },
        errorText: {
          color: colors.danger,
        },
        successText: {
          color: "#22C55E",
        },
        idleText: {
          color: colors.textMuted,
        },

        /* ─── Success State ──────────────────────────────────── */
        successBanner: {
          alignItems: "center",
          marginBottom: 20,
        },
        successIconLarge: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },
        successTitle: {
          fontSize: 28,
          fontWeight: "800",
          color: "#22C55E",
          textTransform: "uppercase",
          letterSpacing: 2,
        },
        successSubtitle: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textSecondary,
          marginTop: 4,
        },
        successCard: {
          backgroundColor: "#22C55E10",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#22C55E30",
          padding: 16,
          marginBottom: 20,
        },
        successRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        },
        successCheck: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
        },
        successLabel: {
          fontSize: 14,
          fontWeight: "600",
          color: "#22C55E",
        },
        successDetail: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#22C55E20",
        },
        successDetailIcon: {
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
        },
        successDetailText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
        },

        /* ─── Action Buttons ─────────────────────────────────── */
        primaryBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          height: 56,
          borderRadius: 16,
          backgroundColor: verified ? "#22C55E" : "#FF6B00",
          shadowColor: verified ? "#22C55E" : "#FF6B00",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
          marginBottom: 12,
        },
        primaryBtnDisabled: {
          opacity: 0.5,
        },
        primaryText: {
          fontSize: 16,
          fontWeight: "700",
          color: "#000000",
        },
        secondaryBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 48,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        secondaryText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textSecondary,
        },
      }),
    [colors, isDark, insets, verified, error],
  );

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={s.backdrop} onPress={onSkip} />

      {/* Sheet */}
      <View style={s.sheet}>
        <View style={s.content}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIcon}>
              {verified ? (
                <CheckCircle2 size={16} color="#22C55E" />
              ) : (
                <Package size={16} color="#FF6B00" />
              )}
            </View>
            <Text style={s.headerText}>
              {verified ? "Delivered" : "Deliver Package"}
            </Text>
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* INFO CARD: Recipient + Package details                */}
          {/* ═══════════════════════════════════════════════════════ */}
          <View style={s.infoCard}>
            {/* Recipient */}
            <View style={s.recipientRow}>
              <View style={s.recipientAvatar}>
                <User size={20} color={colors.textSecondary} />
              </View>
              <View style={s.recipientInfo}>
                <Text style={s.recipientLabel}>Recipient</Text>
                <Text style={s.recipientName} numberOfLines={1}>
                  {displayName}
                </Text>
                {recipientPhone && (
                  <Text style={s.recipientPhone} numberOfLines={1}>
                    {recipientPhone}
                  </Text>
                )}
              </View>
            </View>

            <View style={s.infoDivider} />

            {/* Package Details */}
            {pkg && (
              <>
                <View style={s.detailRow}>
                  <View style={s.detailIcon}>
                    <Package size={10} color="#FF6B00" />
                  </View>
                  <Text style={s.detailLabel}>Package</Text>
                  <Text style={s.detailValue} numberOfLines={1}>
                    {pkg.type}
                  </Text>
                </View>
                <View style={s.packageTags}>
                  <View style={s.packageTag}>
                    <Package size={10} color={colors.textSecondary} />
                    <Text style={s.packageTagText}>{pkg.size}</Text>
                  </View>
                  {pkg.weight && (
                    <View style={s.packageTag}>
                      <Weight size={10} color={colors.textSecondary} />
                      <Text style={s.packageTagText}>{pkg.weight}</Text>
                    </View>
                  )}
                  {pkg.fragile && (
                    <View style={[s.packageTag, { backgroundColor: "#FEE2E220" }]}>
                      <Text style={[s.packageTagText, { color: "#EF4444" }]}>
                        Fragile
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[s.infoDivider, { marginTop: 12 }]} />
              </>
            )}

            {/* Dropoff Address */}
            {dropoffAddress && (
              <View style={s.detailRow}>
                <View style={[s.detailIcon, { backgroundColor: "#22C55E15" }]}>
                  <MapPin size={10} color="#22C55E" />
                </View>
                <Text style={s.detailLabel}>Address</Text>
                <Text style={s.detailValue} numberOfLines={2}>
                  {dropoffAddress}
                </Text>
              </View>
            )}
            {dropoffLandmark && (
              <View style={[s.detailRow, { marginTop: 4 }]}>
                <View style={s.detailIcon} />
                <Text style={s.detailLabel} />
                <Text style={[s.detailValue, { color: colors.textSecondary }]} numberOfLines={1}>
                  {dropoffLandmark}
                </Text>
              </View>
            )}
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* PIN VERIFICATION                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          {!verified && (
            <>
              <Text style={s.instructions}>
                Ask{" "}
                <Text style={s.recipientHighlight}>{displayName}</Text>
                {" "}for the 4-digit delivery PIN to confirm receipt.
              </Text>

              {/* PIN Input */}
              <View style={s.pinRow}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      s.pinCell,
                      index === pin.findIndex((d) => !d) && s.pinCellFocused,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    secureTextEntry
                    selectTextOnFocus
                    autoFocus={index === 0}
                    accessibilityLabel={`PIN digit ${index + 1}`}
                  />
                ))}
              </View>

              {/* Status Message */}
              <View style={s.statusRow}>
                {error && (
                  <>
                    <XCircle size={14} color={colors.danger} />
                    <Text style={[s.statusText, s.errorText]}>
                      Incorrect PIN — try again
                    </Text>
                  </>
                )}
                {!error && !verifying && (
                  <Text style={[s.statusText, s.idleText]}>
                    Enter 4 digits above
                  </Text>
                )}
                {verifying && (
                  <ActivityIndicator size="small" color="#FF6B00" />
                )}
              </View>

              {/* Verify Button */}
              <Pressable
                style={[
                  s.primaryBtn,
                  (pin.join("").length !== 4 || verifying) && s.primaryBtnDisabled,
                ]}
                onPress={verify}
                disabled={pin.join("").length !== 4 || verifying}
                accessibilityRole="button"
                accessibilityLabel="Verify delivery PIN"
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#000000" />
                    <Text style={s.primaryText}>VERIFY & DELIVER</Text>
                  </>
                )}
              </Pressable>

              {/* Call Recipient */}
              {recipientPhone && (
                <Pressable
                  style={s.secondaryBtn}
                  onPress={handleCallRecipient}
                  accessibilityRole="button"
                  accessibilityLabel="Call recipient"
                >
                  <Phone size={16} color={colors.primary} />
                  <Text style={s.secondaryText}>Call recipient</Text>
                </Pressable>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SUCCESS STATE                                         */}
          {/* ═══════════════════════════════════════════════════════ */}
          {verified && (
            <>
              {/* Large DELIVERED Confirmation */}
              <View style={s.successBanner}>
                <View style={s.successIconLarge}>
                  <CheckCircle2 size={40} color="#22C55E" />
                </View>
                <Text style={s.successTitle}>DELIVERED</Text>
                <Text style={s.successSubtitle}>
                  Package successfully delivered to {displayName}
                </Text>
              </View>

              {/* Success Card */}
              <View style={s.successCard}>
                <View style={s.successRow}>
                  <View style={s.successCheck}>
                    <CheckCircle2 size={14} color="#22C55E" />
                  </View>
                  <Text style={s.successLabel}>PIN verified</Text>
                </View>
                <View style={s.successRow}>
                  <View style={s.successCheck}>
                    <CheckCircle2 size={14} color="#22C55E" />
                  </View>
                  <Text style={s.successLabel}>Package delivered</Text>
                </View>

                {/* Delivery Details */}
                <View style={s.successDetail}>
                  <View style={s.successDetailIcon}>
                    <User size={10} color="#22C55E" />
                  </View>
                  <Text style={s.successDetailText}>
                    To: {displayName}
                  </Text>
                </View>
                {dropoffAddress && (
                  <View style={s.successDetail}>
                    <View style={s.successDetailIcon}>
                      <MapPin size={10} color="#22C55E" />
                    </View>
                    <Text style={s.successDetailText} numberOfLines={1}>
                      At: {dropoffAddress}
                    </Text>
                  </View>
                )}
              </View>

              {/* Complete Button */}
              <Pressable
                style={s.primaryBtn}
                onPress={handleComplete}
                accessibilityRole="button"
                accessibilityLabel="Complete delivery"
              >
                <Text style={s.primaryText}>COMPLETE</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </>
  );
}
