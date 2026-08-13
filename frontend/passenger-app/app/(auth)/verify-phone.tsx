import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { radius, spacing } from "@/theme/tokens";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyPhoneScreen() {
  const { session, refreshSession, signOut } = useApp();
  const { colors, typography } = useTheme();
  const params = useLocalSearchParams<{ phone?: string }>();

  const phone = session?.user.phoneE164 ?? params.phone ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;

  const code = useMemo(() => digits.join(""), [digits]);

  /* ─── Countdown Timer ─────────────────────────────────── */
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  /* ─── Auto-verify when 6 digits entered ───────────────── */
  useEffect(() => {
    if (code.length === OTP_LENGTH && !verifying && !verified) {
      verifyOtp(code);
    }
  }, [code]);

  /* ─── Success animation ───────────────────────────────── */
  useEffect(() => {
    if (verified) {
      Animated.parallel([
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(successScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(async () => {
        try {
          const prompted = await AsyncStorage.getItem("@okadago_passenger_location_prompted");
          router.replace(prompted === "seen" ? "/(main)" : "/(auth)/location-permission");
        } catch {
          router.replace("/(auth)/location-permission");
        }
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [verified]);

  /* ─── Request OTP ─────────────────────────────────────── */
  async function requestOtp() {
    setSending(true);
    setError("");
    try {
      const result = await api<{ sent: boolean; debugCode?: string }>("/auth/otp/request", {
        method: "POST",
        body: { phoneE164: phone },
      });
      setDebugCode(result.debugCode ?? null);
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setSending(false);
    }
  }

  /* ─── Verify OTP ──────────────────────────────────────── */
  const verifyOtp = useCallback(
    async (otpCode: string) => {
      setVerifying(true);
      setError("");
      try {
        await api("/auth/otp/verify", {
          method: "POST",
          body: { phoneE164: phone, code: otpCode },
        });
        if (session) {
          await refreshSession();
        }
        setVerified(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid code. Please try again.");
        setDigits(Array(OTP_LENGTH).fill(""));
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    },
    [phone, session, refreshSession],
  );

  /* ─── Digit Change Handler ────────────────────────────── */
  function handleChange(text: string, index: number) {
    setError("");
    // Handle paste (multiple characters pasted)
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    if (text && index < OTP_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  }

  /* ─── Key Press Handler (backspace) ───────────────────── */
  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  }

  /* ─── Format phone for display ────────────────────────── */
  function formatPhone(p: string): string {
    const clean = p.replace(/\D/g, "");
    if (clean.length >= 9) {
      return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
    }
    return p;
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.background },
        flex: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: spacing.xxl,
          paddingBottom: spacing.xxl,
        },

        /* ─── Top Bar ────────────────────────────────────── */
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceOverlay,
        },

        /* ─── Hero ───────────────────────────────────────── */
        hero: {
          alignItems: "center",
          paddingTop: spacing.xxxl,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        },
        icon: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        },
        title: {
          ...typography.h1,
          color: colors.text,
          textAlign: "center",
        },
        subtitle: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          paddingHorizontal: spacing.lg,
          lineHeight: 22,
        },
        phone: {
          ...typography.bodySemibold,
          color: colors.primary,
          textAlign: "center",
          marginTop: spacing.xs,
          letterSpacing: 1.5,
        },

        /* ─── OTP Boxes ──────────────────────────────────── */
        otpRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.sm,
          marginBottom: spacing.xl,
          paddingVertical: spacing.lg,
        },
        digitBox: {
          width: 48,
          height: 56,
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        digitBoxActive: {
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
        },
        digitBoxFilled: {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        },
        digitBoxError: {
          borderColor: colors.danger,
          backgroundColor: colors.dangerLight,
        },
        digitText: {
          ...typography.h1,
          color: colors.text,
          fontSize: 22,
        },
        digitTextError: {
          color: colors.danger,
        },

        /* ─── Hidden Input ───────────────────────────────── */
        hiddenInput: {
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1,
        },

        /* ─── Error ──────────────────────────────────────── */
        errorContainer: {
          alignItems: "center",
          marginBottom: spacing.lg,
        },
        errorText: {
          ...typography.caption,
          color: colors.danger,
          textAlign: "center",
        },

        /* ─── Resend ─────────────────────────────────────── */
        resendRow: {
          alignItems: "center",
          marginBottom: spacing.xxxl,
        },
        resendText: {
          ...typography.body,
          color: colors.textSecondary,
        },
        resendBtn: {
          paddingVertical: spacing.xs,
        },
        resendBtnText: {
          ...typography.bodySemibold,
          color: colors.primary,
        },
        countdownText: {
          ...typography.body,
          color: colors.textMuted,
        },

        /* ─── Verify Button ──────────────────────────────── */
        verifyBtn: {
          marginBottom: spacing.xl,
        },

        /* ─── Sign Out ───────────────────────────────────── */
        signOutRow: {
          alignItems: "center",
          marginTop: "auto",
          paddingTop: spacing.xl,
        },
        signOutBtn: {
          paddingVertical: spacing.sm,
        },
        signOutText: {
          ...typography.caption,
          color: colors.textMuted,
        },

        /* ─── Success Overlay ────────────────────────────── */
        successOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        },
        successIcon: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.successLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl,
        },
        successTitle: {
          ...typography.h1,
          color: colors.text,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        successSubtitle: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
        },

        /* ─── Debug ──────────────────────────────────────── */
        debugText: {
          ...typography.caption,
          color: colors.accent,
          textAlign: "center",
          marginBottom: spacing.md,
          backgroundColor: colors.accentLight,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          overflow: "hidden",
        },
      }),
    [colors, typography],
  );

  const hasError = error.length > 0;

  /* ─── Success Screen ──────────────────────────────────── */
  if (verified) {
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View
          style={[styles.successOverlay, { opacity: successOpacity, transform: [{ scale: successScale }] }]}
        >
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>You're verified!</Text>
          <Text style={styles.successSubtitle}>Setting up your account...</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* ─── Back Button ────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ─── Hero ──────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.icon}>
              <ShieldCheck size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verify your phone</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we sent to confirm your number before booking rides.
            </Text>
            <Text style={styles.phone}>{formatPhone(phone)}</Text>
          </View>

          {/* ─── OTP Input Boxes ──────────────────────── */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.digitBox,
                  i === activeIndex && styles.digitBoxActive,
                  digit && !hasError && styles.digitBoxFilled,
                  hasError && styles.digitBoxError,
                ]}
              >
                <Text style={[styles.digitText, hasError && styles.digitTextError]}>
                  {digit}
                </Text>
              </View>
            ))}
          </View>

          {/* ─── Hidden TextInput (captures keyboard) ──── */}
          <TextInput
            ref={(ref) => { inputRefs.current[0] = ref; }}
            style={styles.hiddenInput}
            value={digits.join("")}
            onChangeText={(text) => handleChange(text, activeIndex)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, activeIndex)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
          />

          {/* ─── Error ─────────────────────────────────── */}
          {hasError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ─── Debug Code ────────────────────────────── */}
          {debugCode ? (
            <Text style={styles.debugText}>Dev code: {debugCode}</Text>
          ) : null}

          {/* ─── Resend Code ───────────────────────────── */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <Pressable
                style={styles.resendBtn}
                onPress={() => void requestOtp()}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendBtnText}>Resend code</Text>
                )}
              </Pressable>
            )}
          </View>

          {/* ─── Loading Indicator (while verifying) ───── */}
          <View style={styles.verifyBtn}>
            {verifying && (
              <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>

          {/* ─── Sign Out ──────────────────────────────── */}
          <View style={styles.signOutRow}>
            <Pressable
              style={styles.signOutBtn}
              onPress={async () => {
                await signOut();
                router.replace("/(auth)/login");
              }}
            >
              <Text style={styles.signOutText}>Use a different number</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
