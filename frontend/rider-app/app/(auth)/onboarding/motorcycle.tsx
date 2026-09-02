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
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown } from "lucide-react-native";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import { api, phoneParts, type AuthResponse } from "@/lib/api";
import { registerPushToken } from "@/lib/push";
import { useApp } from "@/context/AppContext";
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

type MotorcycleData = {
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
};

const motorcycleMakes = [
  "Honda",
  "Yamaha",
  "Suzuki",
  "Kawasaki",
  "Bajaj",
  "TVS",
  "Hero",
  "KTM",
  "Other",
];

const motorcycleColors = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Silver",
  "Yellow",
  "Other",
];

const years = Array.from({ length: 15 }, (_, i) => `${2024 - i}`);

/**
 * OnboardingMotorcycle — Vehicle registration + final signup.
 *
 * Loads profile data from AsyncStorage (saved by phone + profile screens),
 * collects motorcycle details, then submits the full signup to POST /auth/rider/signup.
 */
export default function OnboardingMotorcycleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { signIn } = useApp();
  const [motorcycle, setMotorcycle] = useState<MotorcycleData>({
    make: "",
    model: "",
    year: "",
    color: "",
    plateNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

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

  const isValid =
    motorcycle.make &&
    motorcycle.model &&
    motorcycle.year &&
    motorcycle.color &&
    motorcycle.plateNumber.length >= 6;

  async function handleComplete() {
    setLoading(true);
    try {
      const onboarding = await loadOnboarding();

      if (!onboarding.phoneE164 || !onboarding.password || !onboarding.fullName) {
        Alert.alert("Error", "Missing profile data. Please go back and complete all steps.");
        setLoading(false);
        return;
      }

      const body = {
        fullName: onboarding.fullName,
        email: onboarding.email || undefined,
        phoneCountryCode: onboarding.phoneCountryCode ?? "+233",
        phoneLocal: onboarding.phoneLocal ?? "",
        password: onboarding.password,
        preferredCurrency: "GHS",
        jobPreference: "both",
        vehicle: isValid
          ? {
              make: motorcycle.make,
              model: motorcycle.model,
              plateNumber: motorcycle.plateNumber,
              vehicleType: "okada" as const,
            }
          : undefined,
      };

      const result = await api<AuthResponse>("/auth/rider/signup", {
        method: "POST",
        body,
      });

      await signIn({ token: result.token, expiresAt: result.expiresAt, user: result.user });
      registerPushToken(result.token).catch(() => undefined);

      // Clear onboarding data
      await AsyncStorage.removeItem(ONBOARDING_KEY);

      router.replace("/(main)");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not complete registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: keyof MotorcycleData, value: string) {
    setMotorcycle((prev) => ({ ...prev, [field]: value }));
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
      marginBottom: 32,
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
    selectInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectValue: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: motorcycle.make ? colors.text : colors.textMuted,
    },
    pickerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
    pickerContainer: {
      width: "85%",
      maxHeight: "60%",
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
    },
    pickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    pickerItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemSelected: {
      backgroundColor: brand.primary + "10",
    },
    pickerItemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    ctaBtn: {
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
      marginTop: 24,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#000000",
    },
    skipBtn: {
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 8,
    },
    skipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              <MotorcycleIcon size={36} color={brand.primary} strokeWidth={2.2} />
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
              Register Your Motorcycle
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
              Required to start earning with OkadaGo
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
            {/* Make */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Make</Text>
              <Pressable
                style={[s.input, s.selectInput]}
                onPress={() => setShowMakePicker(true)}
              >
                <Text style={s.selectValue}>
                  {motorcycle.make || "Select make"}
                </Text>
                <ChevronDown size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Model */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Model</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., CB 125, FZ 150"
                placeholderTextColor={colors.textMuted}
                value={motorcycle.model}
                onChangeText={(v) => updateField("model", v)}
              />
            </View>

            {/* Year */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Year</Text>
              <Pressable
                style={[s.input, s.selectInput]}
                onPress={() => setShowYearPicker(true)}
              >
                <Text style={s.selectValue}>
                  {motorcycle.year || "Select year"}
                </Text>
                <ChevronDown size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Color */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Color</Text>
              <Pressable
                style={[s.input, s.selectInput]}
                onPress={() => setShowColorPicker(true)}
              >
                <Text style={s.selectValue}>
                  {motorcycle.color || "Select color"}
                </Text>
                <ChevronDown size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Plate Number */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Plate Number</Text>
              <TextInput
                style={[s.input, { fontFamily: "monospace", letterSpacing: 1 }]}
                placeholder="GR-1234-22"
                placeholderTextColor={colors.textMuted}
                value={motorcycle.plateNumber}
                onChangeText={(v) => updateField("plateNumber", v.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Pressable
            style={s.ctaBtn}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={s.ctaText}>
              {loading ? "Creating account..." : "Complete Setup"}
            </Text>
            {!loading && <CheckCircle2 size={20} color="#000000" />}
          </Pressable>

          <Pressable
            style={s.skipBtn}
            onPress={async () => {
              // Submit without vehicle details
              await handleComplete();
            }}
            disabled={loading}
          >
            <Text style={s.skipText}>I'll add this later</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Make Picker */}
      {showMakePicker && (
        <View style={s.pickerOverlay}>
          <View style={s.pickerContainer}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>Select Make</Text>
              <Pressable onPress={() => setShowMakePicker(false)}>
                <Text style={{ color: brand.primary, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {motorcycleMakes.map((make) => (
                <Pressable
                  key={make}
                  style={[
                    s.pickerItem,
                    motorcycle.make === make && s.pickerItemSelected,
                  ]}
                  onPress={() => {
                    updateField("make", make);
                    setShowMakePicker(false);
                  }}
                >
                  <Text style={s.pickerItemText}>{make}</Text>
                  {motorcycle.make === make && (
                    <CheckCircle2 size={20} color={brand.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Color Picker */}
      {showColorPicker && (
        <View style={s.pickerOverlay}>
          <View style={s.pickerContainer}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>Select Color</Text>
              <Pressable onPress={() => setShowColorPicker(false)}>
                <Text style={{ color: brand.primary, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {motorcycleColors.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    s.pickerItem,
                    motorcycle.color === color && s.pickerItemSelected,
                  ]}
                  onPress={() => {
                    updateField("color", color);
                    setShowColorPicker(false);
                  }}
                >
                  <Text style={s.pickerItemText}>{color}</Text>
                  {motorcycle.color === color && (
                    <CheckCircle2 size={20} color={brand.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Year Picker */}
      {showYearPicker && (
        <View style={s.pickerOverlay}>
          <View style={s.pickerContainer}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerTitle}>Select Year</Text>
              <Pressable onPress={() => setShowYearPicker(false)}>
                <Text style={{ color: brand.primary, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {years.map((year) => (
                <Pressable
                  key={year}
                  style={[
                    s.pickerItem,
                    motorcycle.year === year && s.pickerItemSelected,
                  ]}
                  onPress={() => {
                    updateField("year", year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={s.pickerItemText}>{year}</Text>
                  {motorcycle.year === year && (
                    <CheckCircle2 size={20} color={brand.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
