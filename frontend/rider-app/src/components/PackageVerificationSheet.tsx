import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { brand, layers } from "@/theme/design-system";

type Props = {
  visible: boolean;
  deliveryId: string;
  stopId?: string;
  senderName?: string;
  packageType?: string;
  onVerified: (photoUri?: string) => void;
  onSkip?: () => void;
  onVerify?: (code: string) => Promise<boolean>;
};

/**
 * PackageVerificationSheet — Secure package verification at pickup.
 *
 * Two-step verification:
 * 1. PIN/QR verification from sender
 * 2. Optional photo of package condition
 *
 * Layout — PIN Entry:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  📦 VERIFY PACKAGE              │
 * │                                 │
 * │  Ask Ama for the 6-digit       │
 * │  package verification PIN       │
 * │                                 │
 * │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
 * │  │3 │ │8 │ │2 │ │1 │ │5 │ │9 ││ ← 6-digit PIN
 * │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘│
 * │                                 │
 * │  Incorrect PIN — try again      │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │      VERIFY PACKAGE         ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  📱 Scan QR Code instead        │ ← QR alternative
 * └─────────────────────────────────┘
 *
 * Layout — Photo Capture:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  ✅ PACKAGE VERIFIED            │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │   📷                    │    │ ← Photo preview
 * │  │   Package photo         │    │
 * │  └─────────────────────────┘    │
 * │                                 │
 * │  📸 Capture package condition   │
 * │  Take a photo before accepting  │
 * │  (recommended for protection)   │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │    TAKE PHOTO               ││
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │    ACCEPT PACKAGE           ││ ← Primary CTA
 * │  └─────────────────────────────┘│
 * │                                 │
 * │  Skip photo                     │ ← Secondary
 * └─────────────────────────────────┘
 *
 * Layout — Success:
 * ┌─────────────────────────────────┐
 * │  ── ── ── ── ── ── ── ── ──    │
 * │                                 │
 * │  ✅ PACKAGE ACCEPTED            │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │   ✓ Verified            │    │
 * │  │   ✓ Photo captured      │    │
 * │  │   Ready for delivery    │    │
 * │  └─────────────────────────┘    │
 * │                                 │
 * │  ┌─────────────────────────────┐│
 * │  │       START DELIVERY        ││
 * │  └─────────────────────────────┘│
 * └─────────────────────────────────┘
 */
export function PackageVerificationSheet({
  visible,
  deliveryId,
  stopId,
  senderName,
  packageType,
  onVerified,
  onSkip,
  onVerify,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const displayName = senderName ?? "sender";

  // Reset state when visible changes
  useEffect(() => {
    if (visible) {
      setPin(["", "", "", "", "", ""]);
      setError(false);
      setVerified(false);
      setPhotoUri(null);
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
    if (text && index < 5) {
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
    if (code.length !== 6) {
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
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError(true);
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  // Auto-verify when all 6 digits entered
  useEffect(() => {
    const code = pin.join("");
    if (code.length === 6 && !verified && !verifying) {
      verify();
    }
  }, [pin]);

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to photograph the package.");
      return;
    }

    setPhotoLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert("Photo failed", "Could not capture photo.");
    } finally {
      setPhotoLoading(false);
    }
  }

  function handleAccept() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onVerified(photoUri ?? undefined);
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
          maxHeight: "85%",
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
          backgroundColor: verified ? "#22C55E20" : "#FF6B0020",
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
        senderHighlight: {
          fontWeight: "700",
          color: colors.text,
        },

        /* ─── PIN Input Row ──────────────────────────────────── */
        pinRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginBottom: 16,
        },
        pinCell: {
          width: 48,
          height: 56,
          borderRadius: 12,
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
          fontSize: 22,
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

        /* ─── QR Code Option ─────────────────────────────────── */
        qrOption: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          marginBottom: 16,
        },
        qrText: {
          fontSize: 14,
          fontWeight: "600",
          color: "#FF6B00",
        },

        /* ─── Divider ────────────────────────────────────────── */
        divider: {
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          marginVertical: 16,
        },

        /* ─── Photo Section ──────────────────────────────────── */
        photoSection: {
          marginBottom: 16,
        },
        photoHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        },
        photoIcon: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#FF6B0020",
          alignItems: "center",
          justifyContent: "center",
        },
        photoTitle: {
          fontSize: 13,
          fontWeight: "700",
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        photoPreview: {
          width: "100%",
          height: 160,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginBottom: 12,
        },
        photoImage: {
          width: "100%",
          height: "100%",
        },
        photoPlaceholder: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        },
        photoPlaceholderText: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textMuted,
        },
        photoHint: {
          fontSize: 12,
          fontWeight: "500",
          color: colors.textMuted,
          textAlign: "center",
          marginBottom: 12,
        },

        /* ─── Success Card ───────────────────────────────────── */
        successCard: {
          backgroundColor: "#22C55E10",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#22C55E30",
          padding: 16,
          marginBottom: 16,
        },
        successRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        },
        successCheck: {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#22C55E20",
          alignItems: "center",
          justifyContent: "center",
        },
        successText2: {
          fontSize: 14,
          fontWeight: "600",
          color: "#22C55E",
        },
        successSubtext: {
          fontSize: 13,
          fontWeight: "500",
          color: colors.textSecondary,
          marginLeft: 34,
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
                <ShieldCheck size={16} color="#FF6B00" />
              )}
            </View>
            <Text style={s.headerText}>
              {verified ? "Package Verified" : "Verify Package"}
            </Text>
          </View>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 1: PIN Verification                              */}
          {/* ═══════════════════════════════════════════════════════ */}
          {!verified && (
            <>
              {/* Instructions */}
              <Text style={s.instructions}>
                Ask{" "}
                <Text style={s.senderHighlight}>{displayName}</Text>
                {" "}for the 6-digit package verification PIN.
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
                    Enter 6 digits above
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
                  (pin.join("").length !== 6 || verifying) && s.primaryBtnDisabled,
                ]}
                onPress={verify}
                disabled={pin.join("").length !== 6 || verifying}
                accessibilityRole="button"
                accessibilityLabel="Verify package PIN"
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#000000" />
                    <Text style={s.primaryText}>VERIFY PACKAGE</Text>
                  </>
                )}
              </Pressable>

              {/* QR Code Alternative */}
              <Pressable
                style={s.qrOption}
                onPress={() => {
                  Alert.alert(
                    "QR Code",
                    "Point camera at the sender's QR code to verify.",
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Scan QR code instead"
              >
                <Text style={s.qrText}>📱 Scan QR Code instead</Text>
              </Pressable>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 2: Photo Capture (after verification)            */}
          {/* ═══════════════════════════════════════════════════════ */}
          {verified && !photoUri && (
            <>
              {/* Photo Section */}
              <View style={s.photoSection}>
                <View style={s.photoHeader}>
                  <View style={s.photoIcon}>
                    <Camera size={12} color="#FF6B00" />
                  </View>
                  <Text style={s.photoTitle}>Package Condition</Text>
                </View>

                <View style={s.photoPreview}>
                  <View style={s.photoPlaceholder}>
                    <Camera size={32} color={colors.textMuted} />
                    <Text style={s.photoPlaceholderText}>
                      No photo yet
                    </Text>
                  </View>
                </View>

                <Text style={s.photoHint}>
                  Take a photo of the package condition before accepting.
                  {"\n"}This protects you against damage claims.
                </Text>
              </View>

              {/* Take Photo Button */}
              <Pressable
                style={[s.primaryBtn, { backgroundColor: "#FF6B00" }]}
                onPress={takePhoto}
                disabled={photoLoading}
                accessibilityRole="button"
                accessibilityLabel="Take photo of package"
              >
                {photoLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Camera size={18} color="#000000" />
                    <Text style={s.primaryText}>TAKE PHOTO</Text>
                  </>
                )}
              </Pressable>

              {/* Skip Photo */}
              <Pressable
                style={s.secondaryBtn}
                onPress={handleAccept}
                accessibilityRole="button"
                accessibilityLabel="Skip photo and accept package"
              >
                <Text style={s.secondaryText}>Skip photo — accept package</Text>
              </Pressable>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STEP 2b: Photo Preview (after capture)                */}
          {/* ═══════════════════════════════════════════════════════ */}
          {verified && photoUri && (
            <>
              {/* Photo Section */}
              <View style={s.photoSection}>
                <View style={s.photoHeader}>
                  <View style={s.photoIcon}>
                    <Camera size={12} color="#22C55E" />
                  </View>
                  <Text style={[s.photoTitle, { color: "#22C55E" }]}>
                    Photo Captured
                  </Text>
                </View>

                <View style={s.photoPreview}>
                  <Image
                    source={{ uri: photoUri }}
                    style={s.photoImage}
                    resizeMode="cover"
                  />
                </View>

                <Pressable
                  onPress={() => setPhotoUri(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Retake photo"
                >
                  <Text style={[s.photoHint, { color: "#FF6B00", fontWeight: "600" }]}>
                    Retake photo
                  </Text>
                </Pressable>
              </View>

              {/* Accept Package Button */}
              <Pressable
                style={s.primaryBtn}
                onPress={handleAccept}
                accessibilityRole="button"
                accessibilityLabel="Accept package"
              >
                <Zap size={18} color="#000000" />
                <Text style={s.primaryText}>ACCEPT PACKAGE</Text>
              </Pressable>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SUCCESS STATE                                         */}
          {/* ═══════════════════════════════════════════════════════ */}
          {false && ( // This state is handled by onVerified callback
            <View style={s.successCard}>
              <View style={s.successRow}>
                <View style={s.successCheck}>
                  <CheckCircle2 size={14} color="#22C55E" />
                </View>
                <Text style={s.successText2}>Package Verified</Text>
              </View>
              <View style={s.successRow}>
                <View style={s.successCheck}>
                  <CheckCircle2 size={14} color="#22C55E" />
                </View>
                <Text style={s.successText2}>Photo Captured</Text>
              </View>
              <Text style={s.successSubtext}>
                Ready for delivery
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
