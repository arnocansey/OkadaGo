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
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type Props = {
  visible: boolean;
  tripId: string;
  passengerName?: string;
  onVerified: () => void;
  onSkip?: () => void;
  onVerify?: (pin: string) => Promise<boolean>;
};

/**
 * PinVerificationSheet — Simple passenger verification via trip PIN.
 *
 * Displayed when rider arrives at pickup. Large 4-digit input,
 * motorcycle-friendly touch targets, clear success/error states.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │ ← Handle
 * │                                 │
 * │  ✅ VERIFY PASSENGER            │ ← Header
 * │                                 │
 * │  Ask Kwame A. for the           │ ← Context
 * │  4-digit trip PIN               │
 * │                                 │
 * │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
 * │  │ 3  │ │ 8  │ │ 2  │ │ 1  │   │ ← PIN digits
 * │  └────┘ └────┘ └────┘ └────┘   │
 * │                                 │
 * │  Incorrect PIN — try again      │ ← Error state
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │      CONFIRM & START        ││ ← Primary CTA
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  Skip for now                   │ ← Secondary
 * └─────────────────────────────────┘
 *
 * Success state:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  ✅ PASSENGER VERIFIED          │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │   ✓ PIN confirmed       │    │ ← Success card
 * │  │   Trip can begin        │    │
 * │  └─────────────────────────┘    │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │       START TRIP            ││
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function PinVerificationSheet({
  visible,
  tripId,
  passengerName,
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

  const displayName = passengerName ?? "Passenger";

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
    // Handle backspace — focus previous
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
        // Auto-advance after success animation
        setTimeout(() => onVerified(), 1200);
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
          marginBottom: 8,
        },
        headerIcon: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: verified ? "#22C55E20" : brand.primary + "20",
          alignItems: "center",
          justifyContent: "center",
        },
        headerText: {
          fontSize: 15,
          fontWeight: "700",
          color: verified ? "#22C55E" : colors.text,
        },

        /* ─── Instructions ───────────────────────────────────── */
        instructions: {
          fontSize: 14,
          fontWeight: "500",
          color: colors.textSecondary,
          marginBottom: 24,
          lineHeight: 20,
        },
        passengerHighlight: {
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
          borderColor: brand.primary,
          backgroundColor: isDark ? "rgba(250,204,21,0.06)" : "rgba(250,204,21,0.04)",
        },
        pinDigit: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.text,
        },
        pinPlaceholder: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.textMuted,
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

        /* ─── Success Card ───────────────────────────────────── */
        successCard: {
          backgroundColor: "#22C55E10",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#22C55E30",
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        },
        successIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
        },
        successInfo: {
          flex: 1,
        },
        successTitle: {
          fontSize: 15,
          fontWeight: "700",
          color: "#22C55E",
          marginBottom: 2,
        },
        successSubtitle: {
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
          backgroundColor: verified ? "#22C55E" : brand.primary,
          shadowColor: verified ? "#22C55E" : brand.primary,
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
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        secondaryText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.textMuted,
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
                <ShieldCheck size={16} color={brand.primary} />
              )}
            </View>
            <Text style={s.headerText}>
              {verified ? "Passenger Verified" : "Verify Passenger"}
            </Text>
          </View>

          {/* Instructions */}
          {!verified && (
            <Text style={s.instructions}>
              Ask{" "}
              <Text style={s.passengerHighlight}>{displayName}</Text>
              {" "}for the 4-digit trip PIN to confirm this is your passenger.
            </Text>
          )}

          {/* PIN Input */}
          {!verified && (
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
          )}

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
            {verified && (
              <>
                <CheckCircle2 size={14} color="#22C55E" />
                <Text style={[s.statusText, s.successText]}>
                  PIN confirmed
                </Text>
              </>
            )}
            {!error && !verified && !verifying && (
              <Text style={[s.statusText, s.idleText]}>
                Enter 4 digits above
              </Text>
            )}
            {verifying && (
              <ActivityIndicator size="small" color={brand.primary} />
            )}
          </View>

          {/* Success Card */}
          {verified && (
            <View style={s.successCard}>
              <View style={s.successIcon}>
                <CheckCircle2 size={20} color="#22C55E" />
              </View>
              <View style={s.successInfo}>
                <Text style={s.successTitle}>PIN Confirmed</Text>
                <Text style={s.successSubtitle}>
                  {displayName} is verified — you can start the trip
                </Text>
              </View>
            </View>
          )}

          {/* Primary Button */}
          <Pressable
            style={[
              s.primaryBtn,
              (!verified || verifying) && s.primaryBtnDisabled,
            ]}
            onPress={verified ? onVerified : verify}
            disabled={(!verified && pin.join("").length !== 4) || verifying}
            accessibilityRole="button"
            accessibilityLabel={verified ? "Start trip" : "Confirm PIN"}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={s.primaryText}>
                {verified ? "START TRIP" : "CONFIRM & START"}
              </Text>
            )}
          </Pressable>

          {/* Skip */}
          {onSkip && !verified && (
            <Pressable
              style={s.secondaryBtn}
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip PIN verification"
            >
              <Text style={s.secondaryText}>Skip for now</Text>
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}
