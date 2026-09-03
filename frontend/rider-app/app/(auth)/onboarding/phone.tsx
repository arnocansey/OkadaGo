import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Phone, ArrowRight, ArrowLeft, MessageCircle } from "lucide-react-native";
import { api, phoneParts } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

const ONBOARDING_KEY = "@okadago_onboarding";

type OnboardingData = {
  phoneE164?: string;
  phoneCountryCode?: string;
  phoneLocal?: string;
  fullName?: string;
  email?: string;
  password?: string;
};

async function loadOnboarding(): Promise<OnboardingData> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveOnboarding(data: OnboardingData) {
  const existing = await loadOnboarding();
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...existing, ...data }));
}

/**
 * OnboardingPhone — Phone number entry and 6-digit OTP verification.
 *
 * Calls real backend endpoints:
 * - POST /auth/otp/request → sends OTP to phone
 * - POST /auth/otp/verify → verifies OTP code
 */
export default function OnboardingPhoneScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const fullPhone = `+233${phone.replace(/^0/, "")}`;
  const isValidPhone = phone.length >= 9;

  async function handleSendCode() {
    if (!isValidPhone) return;
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const result = await api<{ sent: boolean; debugCode?: string }>(
        "/auth/otp/request",
        {
          method: "POST",
          body: { phoneE164: phoneData.phoneE164 },
        },
      );
      setDebugCode(result.debugCode ?? null);
      await saveOnboarding({
        phoneE164: phoneData.phoneE164,
        phoneCountryCode: phoneData.phoneCountryCode,
        phoneLocal: phoneData.phoneLocal,
      });
      setOtpSent(true);
      Alert.alert("Code Sent", `A verification code has been sent to ${fullPhone}`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      await api("/auth/otp/verify", {
        method: "POST",
        body: { phoneE164: phoneData.phoneE164, code: code.trim() },
      });
      router.push("/(auth)/onboarding/profile");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  }

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceOverlay,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    header: {
      alignItems: "center",
      marginTop: 48,
      marginBottom: 40,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: brand.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.textSecondary,
      textAlign: "center",
    },
    phoneInput: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      height: 56,
      marginBottom: 16,
    },
    countryCode: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: 12,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      marginRight: 12,
    },
    flag: {
      fontSize: 20,
    },
    code: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    phoneInputField: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      letterSpacing: 1,
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 24,
    },
    otpInput: {
      width: 48,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    otpInputFocused: {
      borderColor: brand.primary,
      backgroundColor: brand.primary + "10",
    },
    debugCode: {
      fontSize: 12,
      fontWeight: "500",
      color: brand.primary,
      textAlign: "center",
      marginBottom: 8,
    },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 56,
      borderRadius: 16,
      backgroundColor: otpSent ? (otp.join("").length === 6 ? brand.primary : colors.surfaceOverlay) : (isValidPhone ? brand.primary : colors.surfaceOverlay),
      shadowColor: (otpSent ? otp.join("").length === 6 : isValidPhone) ? brand.primary : "transparent",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: (otpSent ? otp.join("").length === 6 : isValidPhone) ? 0.3 : 0,
      shadowRadius: 12,
      elevation: (otpSent ? otp.join("").length === 6 : isValidPhone) ? 8 : 0,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: "700",
      color: (otpSent ? otp.join("").length === 6 : isValidPhone) ? "#000000" : colors.textMuted,
    },
    resendRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
      marginTop: 16,
    },
    resendLabel: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.textSecondary,
    },
    resendBtn: {
      fontSize: 14,
      fontWeight: "600",
      color: brand.primary,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    terms: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
    termsLink: {
      color: brand.primary,
      fontWeight: "500",
    },
  });

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.content}>
          {/* Back Button */}
          <Pressable
            style={s.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          {/* Header */}
          <View style={s.header}>
            <Animated.View
              style={[
                s.iconWrap,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {otpSent ? (
                <MessageCircle size={32} color={brand.primary} />
              ) : (
                <Phone size={32} color={brand.primary} />
              )}
            </Animated.View>

            <Animated.Text
              style={[
                s.title,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {otpSent ? "Enter Verification Code" : "Enter Your Phone Number"}
            </Animated.Text>

            <Animated.Text
              style={[
                s.subtitle,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {otpSent
                ? `We sent a 6-digit code to ${fullPhone}`
                : "We'll send you a verification code to get started"}
            </Animated.Text>
          </View>

          {/* Phone Input or OTP Input */}
          {!otpSent ? (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={s.phoneInput}>
                <View style={s.countryCode}>
                  <Text style={s.flag}>🇬🇭</Text>
                  <Text style={s.code}>+233</Text>
                </View>
                <TextInput
                  style={s.phoneInputField}
                  placeholder="24 567 8901"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {debugCode ? (
                <Text style={s.debugCode}>Dev code: {debugCode}</Text>
              ) : null}

              <View style={s.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={[
                      s.otpInput,
                      digit && s.otpInputFocused,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <Pressable
                style={s.resendRow}
                onPress={() => {
                  setOtpSent(false);
                  setOtp(["", "", "", "", "", ""]);
                  setDebugCode(null);
                }}
              >
                <Text style={s.resendLabel}>Didn't receive a code?</Text>
                <Text style={s.resendBtn}>Resend</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>

        {/* CTA */}
        <View style={s.footer}>
          <Pressable
            style={s.ctaBtn}
            onPress={otpSent ? handleVerifyOtp : handleSendCode}
            disabled={loading || (!otpSent && !isValidPhone) || (otpSent && otp.join("").length !== 6)}
          >
            <Text style={s.ctaText}>
              {loading
                ? "Please wait..."
                : otpSent
                  ? "Verify Code"
                  : "Send Verification Code"}
            </Text>
            <ArrowRight size={20} color={(otpSent ? otp.join("").length === 6 : isValidPhone) ? "#000000" : colors.textMuted} />
          </Pressable>

          <Text style={s.terms}>
            By continuing, you agree to our{" "}
            <Text style={s.termsLink}>Terms of Service</Text> and{" "}
            <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
