import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bike,
  Shield,
  Wallet,
  ChevronRight,
  Star,
  MapPin,
} from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { brand } from "@/theme/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingStep = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
};

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    icon: <Bike size={48} color="#000000" />,
    title: "Welcome to OkadaGo",
    subtitle: "The premium motorcycle ride-hailing platform built for Ghanaian riders.",
    color: brand.primary,
  },
  {
    id: "earn",
    icon: <Wallet size={48} color="#000000" />,
    title: "Earn More",
    subtitle: "Competitive fares, instant payouts, and weekly bonuses. Your earnings, your schedule.",
    color: brand.online,
  },
  {
    id: "safe",
    icon: <Shield size={48} color="#000000" />,
    title: "Ride Safe",
    subtitle: "Built-in safety features, emergency support, and real-time trip tracking for your protection.",
    color: brand.info,
  },
  {
    id: "trusted",
    icon: <Star size={48} color="#000000" />,
    title: "Build Trust",
    subtitle: "Verification badges, rider ratings, and achievement milestones that set you apart.",
    color: brand.accent,
  },
];

/**
 * OnboardingWelcome — First screen riders see.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │                                 │
 * │         ┌─────────┐             │
 * │         │  Bike   │             │ ← Animated icon
 * │         └─────────┘             │
 * │                                 │
 * │    Welcome to OkadaGo           │
 * │    The premium motorcycle...    │
 * │                                 │
 * │    ● ● ● ●                     │ ← Step indicators
 * │                                 │
 * │    ┌─────────────────────────┐  │
 * │    │        GET STARTED     │  │ ← CTA
 * │    └─────────────────────────┘  │
 * │                                 │
 * │    Already have an account?     │
 * │    Sign In                      │
 * └─────────────────────────────────┘
 */
export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const step = steps[currentStep];

  useEffect(() => {
    // Animate on step change
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
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
  }, [currentStep, fadeAnim, slideAnim]);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/(auth)/onboarding/phone");
    }
  }

  function handleSkip() {
    router.push("/(auth)/onboarding/phone");
  }

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    skipBtn: {
      position: "absolute",
      top: 60,
      right: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    skipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: step.color + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "400",
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 16,
    },
    dots: {
      flexDirection: "row",
      gap: 8,
      marginTop: 48,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 24,
      backgroundColor: step.color,
    },
    ctaContainer: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      gap: 16,
    },
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 56,
      borderRadius: 16,
      backgroundColor: step.color,
      shadowColor: step.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#000000",
    },
    signInRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
    },
    signInLabel: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.textSecondary,
    },
    signInBtn: {
      fontSize: 14,
      fontWeight: "600",
      color: step.color,
    },
    features: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 32,
      marginTop: 32,
    },
    feature: {
      alignItems: "center",
      gap: 6,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceOverlay,
      alignItems: "center",
      justifyContent: "center",
    },
    featureText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={s.screen}>
      {/* Skip Button */}
      <Pressable style={s.skipBtn} onPress={handleSkip}>
        <Text style={s.skipText}>Skip</Text>
      </Pressable>

      {/* Content */}
      <View style={s.content}>
        <Animated.View
          style={[
            s.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {step.icon}
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
          {step.title}
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
          {step.subtitle}
        </Animated.Text>

        {/* Feature Pills */}
        {currentStep === 0 && (
          <Animated.View style={[s.features, { opacity: fadeAnim }]}>
            <View style={s.feature}>
              <View style={s.featureIcon}>
                <MapPin size={18} color={colors.textSecondary} />
              </View>
              <Text style={s.featureText}>Accra</Text>
            </View>
            <View style={s.feature}>
              <View style={s.featureIcon}>
                <MapPin size={18} color={colors.textSecondary} />
              </View>
              <Text style={s.featureText}>Kumasi</Text>
            </View>
            <View style={s.feature}>
              <View style={s.featureIcon}>
                <MapPin size={18} color={colors.textSecondary} />
              </View>
              <Text style={s.featureText}>Tamale</Text>
            </View>
          </Animated.View>
        )}

        {/* Step Dots */}
        <View style={s.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[s.dot, index === currentStep && s.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={s.ctaContainer}>
        <Pressable style={s.ctaBtn} onPress={handleNext}>
          <Text style={s.ctaText}>
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </Text>
          <ChevronRight size={20} color="#000000" />
        </Pressable>

        <Pressable style={s.signInRow} onPress={handleSkip}>
          <Text style={s.signInLabel}>Already have an account?</Text>
          <Text style={s.signInBtn}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
