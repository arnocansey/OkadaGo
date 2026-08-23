import { router } from "expo-router";
import { useMemo, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Lock, Mail, Phone, Eye, EyeOff } from "lucide-react-native";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { radius, spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useApp();
  const { colors, typography } = useTheme();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

        /* ─── Top Section: Logo + Heading ─────────────────── */
        topSection: {
          alignItems: "center",
          paddingTop: spacing.huge + spacing.lg,
          paddingBottom: spacing.xxxl,
        },
        logoContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl,
        },
        heading: {
          ...typography.h1,
          color: colors.text,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        subheading: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          paddingHorizontal: spacing.lg,
        },

        /* ─── Input Section ───────────────────────────────── */
        inputSection: {
          gap: spacing.lg,
          marginBottom: spacing.xxxl,
        },
        fieldWrapper: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 2,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          minHeight: 64,
        },
        phoneFieldActive: {
          borderColor: phone.length > 0 ? colors.primary : colors.border,
        },
        passwordFieldActive: {
          borderColor: password.length > 0 ? colors.primary : colors.border,
        },
        fieldWrapperError: {
          borderColor: colors.danger,
        },
        fieldIcon: {
          marginRight: spacing.md,
        },
        countryCode: {
          ...typography.h2,
          color: colors.text,
          marginRight: spacing.md,
          paddingRight: spacing.md,
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
        phoneInput: {
          flex: 1,
          ...typography.h2,
          color: colors.text,
          paddingVertical: spacing.lg,
          letterSpacing: 2,
        },
        passwordInput: {
          flex: 1,
          ...typography.body,
          color: colors.text,
          paddingVertical: spacing.lg,
        },
        phonePlaceholder: {
          position: "absolute",
          left: 56,
          ...typography.h2,
          color: colors.textMuted,
          letterSpacing: 2,
        },
        eyeBtn: {
          padding: spacing.sm,
        },
        errorText: {
          ...typography.caption,
          color: colors.danger,
          textAlign: "center",
          marginTop: -spacing.sm,
        },
        forgotPassword: {
          alignSelf: "flex-end",
          marginTop: -spacing.md,
        },
        forgotPasswordText: {
          ...typography.captionMedium,
          color: colors.primary,
        },

        /* ─── Divider ─────────────────────────────────────── */
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          marginBottom: spacing.xl,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        },
        dividerText: {
          ...typography.captionMedium,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        },

        /* ─── Social Buttons ──────────────────────────────── */
        socialButtons: {
          gap: spacing.md,
          marginBottom: spacing.xxxl,
        },
        socialBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.md,
          height: 56,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        socialBtnText: {
          ...typography.bodyMedium,
          color: colors.text,
        },

        /* ─── Bottom Section: Legal ───────────────────────── */
        bottomSection: {
          alignItems: "center",
          paddingTop: "auto",
          gap: spacing.sm,
        },
        legalText: {
          ...typography.caption,
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
          paddingHorizontal: spacing.lg,
        },
        legalLink: {
          textDecorationLine: "underline",
          color: colors.textSecondary,
        },
      }),
    [colors, typography, phone, password],
  );

  async function submit() {
    setError("");
    if (phone.replace(/\s/g, "").length < 9) {
      setError("Enter a valid Ghanaian phone number");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const phoneData = phoneParts(phone);
      const result = await api<AuthResponse>("/auth/passenger/login", {
        method: "POST",
        body: { phoneE164: phoneData.phoneE164, password },
      });
      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      if (result.user.isPhoneVerified === false) {
        router.replace("/(auth)/verify-phone");
        return;
      }
      const prompted = await AsyncStorage.getItem("@okadago_passenger_location_prompted");
      router.replace(prompted === "seen" ? "/(main)" : "/(auth)/location-permission");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credential")) {
        setError("Invalid phone number or password");
      } else {
        setError(msg || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ─── Logo + Heading ───────────────────────────── */}
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <BrandLogo variant="icon" size={48} />
            </View>
            <Text style={styles.heading}>Welcome to OkadaGo</Text>
            <Text style={styles.subheading}>
              Ride across Ghana in minutes. Sign in to your account.
            </Text>
          </View>

          {/* ─── Input Fields ─────────────────────────────── */}
          <View style={styles.inputSection}>
            {/* Phone Number */}
            <View style={[styles.fieldWrapper, styles.phoneFieldActive, error ? styles.fieldWrapperError : null]}>
              <Phone size={20} color={colors.textMuted} style={styles.fieldIcon} />
              <Text style={styles.countryCode}>+233</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="024 123 4567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={12}
                autoFocus
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
              {phone.length === 0 && (
                <Text style={styles.phonePlaceholder}>024 123 4567</Text>
              )}
            </View>

            {/* Password */}
            <View style={[styles.fieldWrapper, styles.passwordFieldActive, error ? styles.fieldWrapperError : null]}>
              <Lock size={20} color={colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.textMuted} />
                ) : (
                  <Eye size={20} color={colors.textMuted} />
                )}
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* ─── Sign In CTA ─────────────────────────────── */}
          <Button
            label={t("auth.signIn") || "Sign In"}
            loading={loading}
            onPress={submit}
            fullWidth
            size="lg"
          />

          {/* ─── Divider ──────────────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ─── Social Sign-In ───────────────────────────── */}
          <View style={styles.socialButtons}>
            <Pressable
              style={styles.socialBtn}
              onPress={() => Alert.alert("Coming soon", "Google sign-in will be available in a future update.")}
            >
              <Mail size={20} color={colors.text} />
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </Pressable>
            <Pressable
              style={styles.socialBtn}
              onPress={() => Alert.alert("Coming soon", "Apple sign-in will be available in a future update.")}
            >
              <Lock size={20} color={colors.text} />
              <Text style={styles.socialBtnText}>Continue with Apple</Text>
            </Pressable>
          </View>

          {/* ─── Legal ────────────────────────────────────── */}
          <View style={styles.bottomSection}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{" "}
              <Text style={styles.legalLink}>Terms of Service</Text> and{" "}
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
