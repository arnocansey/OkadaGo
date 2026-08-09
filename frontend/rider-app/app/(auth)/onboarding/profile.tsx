import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User, ArrowRight, ArrowLeft, Lock } from "lucide-react-native";
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
 * OnboardingProfile — Profile setup during onboarding.
 *
 * Collects name, email, and password. Saves to AsyncStorage for the motorcycle screen
 * to submit the full signup to /auth/rider/signup.
 */
export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Load any previously saved onboarding data
    loadOnboarding().then((data) => {
      if (data.fullName) setFullName(data.fullName);
      if (data.email) setEmail(data.email);
    });
  }, [fadeAnim, slideAnim]);

  const isValid = fullName.trim().length >= 2 && email.includes("@") && password.length >= 6;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    try {
      await saveOnboarding({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      router.push("/(auth)/onboarding/motorcycle");
    } catch (e) {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
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
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    passwordHint: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textMuted,
      marginTop: 2,
    },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 56,
      borderRadius: 16,
      backgroundColor: isValid ? brand.primary : colors.surfaceOverlay,
      shadowColor: isValid ? brand.primary : "transparent",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isValid ? 0.3 : 0,
      shadowRadius: 12,
      elevation: isValid ? 8 : 0,
      marginTop: 24,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: "700",
      color: isValid ? "#000000" : colors.textMuted,
    },
  });

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <User size={32} color={brand.primary} />
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
              Set Up Your Profile
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
              Tell us about yourself so passengers can recognize you
            </Animated.Text>
          </View>

          {/* Form */}
          <Animated.View
            style={[
              s.form,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <TextInput
                style={s.input}
                placeholder="Kwame Asante"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email Address</Text>
              <TextInput
                style={s.input}
                placeholder="kwame@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Password</Text>
              <TextInput
                style={s.input}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <Text style={s.passwordHint}>Minimum 6 characters for your account password</Text>
            </View>
          </Animated.View>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Pressable
            style={s.ctaBtn}
            onPress={handleContinue}
            disabled={loading || !isValid}
          >
            <Text style={s.ctaText}>
              {loading ? "Please wait..." : "Continue"}
            </Text>
            <ArrowRight size={20} color={isValid ? "#000000" : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
