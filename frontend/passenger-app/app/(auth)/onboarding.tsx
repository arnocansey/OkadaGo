import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Rect, G } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const ONBOARDING_KEY = "@okadago_passenger_onboarding";

type Slide = {
  id: string;
  headline: string;
  subtitle: string;
  accentColor: string;
  accentLight: string;
  illustration: React.FC<{ size: number }>;
};

/* ─── Illustrations ────────────────────────────────────────────────────────── */

function MotorcycleIllustration({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <Defs>
        <LinearGradient id="mcGrad" x1="0" y1="0" x2="240" y2="240">
          <Stop offset="0" stopColor="#facc15" />
          <Stop offset="1" stopColor="#ff6b00" />
        </LinearGradient>
      </Defs>
      {/* Speed lines */}
      <Path d="M30 90 L80 90" stroke="#facc15" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <Path d="M20 110 L70 110" stroke="#facc15" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <Path d="M35 130 L75 130" stroke="#facc15" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      {/* Rear wheel */}
      <Circle cx="70" cy="160" r="30" stroke="url(#mcGrad)" strokeWidth="4" fill="none" />
      <Circle cx="70" cy="160" r="12" stroke="url(#mcGrad)" strokeWidth="2" fill="none" />
      {/* Front wheel */}
      <Circle cx="175" cy="160" r="30" stroke="url(#mcGrad)" strokeWidth="4" fill="none" />
      <Circle cx="175" cy="160" r="12" stroke="url(#mcGrad)" strokeWidth="2" fill="none" />
      {/* Frame */}
      <Path d="M70 160 L110 100 L155 100 L175 160" stroke="url(#mcGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Tank */}
      <Path d="M100 100 L130 85 L155 100" stroke="url(#mcGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Seat */}
      <Path d="M95 105 L75 115" stroke="url(#mcGrad)" strokeWidth="4" strokeLinecap="round" />
      {/* Handlebar */}
      <Path d="M155 100 L165 80 L175 75" stroke="url(#mcGrad)" strokeWidth="3" strokeLinecap="round" />
      {/* Headlight */}
      <Circle cx="178" cy="140" r="6" fill="#facc15" opacity="0.8" />
      {/* Exhaust */}
      <Path d="M70 155 L50 150 L45 155" stroke="url(#mcGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function PackageIllustration({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <Defs>
        <LinearGradient id="pkgGrad" x1="0" y1="0" x2="240" y2="240">
          <Stop offset="0" stopColor="#ff6b00" />
          <Stop offset="1" stopColor="#facc15" />
        </LinearGradient>
      </Defs>
      {/* Motion lines */}
      <Path d="M30 80 L65 80" stroke="#ff6b00" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <Path d="M25 100 L60 100" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <Path d="M35 120 L60 120" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      {/* Package box - front face */}
      <Path d="M80 100 L160 100 L160 180 L80 180 Z" stroke="url(#pkgGrad)" strokeWidth="4" fill="none" />
      {/* Package box - top face */}
      <Path d="M80 100 L110 75 L190 75 L160 100" stroke="url(#pkgGrad)" strokeWidth="4" fill="none" />
      {/* Package box - side face */}
      <Path d="M160 100 L190 75 L190 155 L160 180" stroke="url(#pkgGrad)" strokeWidth="4" fill="none" />
      {/* Tape cross */}
      <Path d="M120 75 L120 180" stroke="#ff6b00" strokeWidth="3" opacity="0.5" />
      <Path d="M80 140 L160 140" stroke="#ff6b00" strokeWidth="3" opacity="0.5" />
      {/* Checkmark */}
      <Path d="M115 135 L125 148 L148 118" stroke="#4CD964" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldIllustration({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
      <Defs>
        <LinearGradient id="shGrad" x1="60" y1="40" x2="180" y2="200">
          <Stop offset="0" stopColor="#4CD964" />
          <Stop offset="1" stopColor="#22C55E" />
        </LinearGradient>
      </Defs>
      {/* Shield shape */}
      <Path
        d="M120 30 L190 65 L190 130 C190 170 160 200 120 215 C80 200 50 170 50 130 L50 65 Z"
        stroke="url(#shGrad)"
        strokeWidth="4"
        fill="none"
      />
      {/* Inner shield */}
      <Path
        d="M120 55 L170 80 L170 130 C170 160 148 182 120 195 C92 182 70 160 70 130 L70 80 Z"
        stroke="url(#shGrad)"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      {/* Checkmark */}
      <Path d="M95 125 L112 145 L150 100" stroke="url(#shGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Glow dots */}
      <Circle cx="120" cy="75" r="4" fill="#4CD964" opacity="0.6" />
      <Circle cx="90" cy="160" r="3" fill="#4CD964" opacity="0.4" />
      <Circle cx="155" cy="155" r="3" fill="#4CD964" opacity="0.4" />
    </Svg>
  );
}

/* ─── Slides Data ──────────────────────────────────────────────────────────── */

const SLIDES: Slide[] = [
  {
    id: "rides",
    headline: "Ride fast.\nRide safe.",
    subtitle: "OkadaGo connects you with verified motorcycle riders in seconds. Get where you need to go — fast.",
    accentColor: "#facc15",
    accentLight: "rgba(250, 204, 21, 0.12)",
    illustration: MotorcycleIllustration,
  },
  {
    id: "delivery",
    headline: "Send anything,\nanywhere.",
    subtitle: "From food to documents — delivered across Ghana in minutes. Track every package in real time.",
    accentColor: "#ff6b00",
    accentLight: "rgba(255, 107, 0, 0.12)",
    illustration: PackageIllustration,
  },
  {
    id: "safety",
    headline: "Your safety,\nour priority.",
    subtitle: "Every rider is verified. Every trip is tracked. Ride with confidence on OkadaGo.",
    accentColor: "#4CD964",
    accentLight: "rgba(76, 217, 100, 0.12)",
    illustration: ShieldIllustration,
  },
];

/* ─── Onboarding Screen ────────────────────────────────────────────────────── */

export default function OnboardingScreen() {
  const { colors, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  async function handleFinish() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "seen");
    } catch {
      // ignore
    }
    router.replace("/(auth)/login");
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
      return;
    }
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  }

  function onViewableItemsChanged({ viewableItems }: { viewableItems: ViewToken[] }) {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <SafeAreaView edges={["top"]} style={styles.skipSafe}>
        <Pressable
          onPress={handleFinish}
          style={[styles.skipBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </Pressable>
      </SafeAreaView>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        renderItem={({ item }) => (
          <SlideItem
            slide={item}
            colors={colors}
            typography={typography}
            isDark={isDark}
          />
        )}
      />

      {/* Bottom Controls */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
        <View style={styles.bottomControls}>
          {/* Progress Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, index) => {
              const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              const dotColor = scrollX.interpolate({
                inputRange,
                outputRange: [
                  0,
                  1,
                  2,
                ].map((i) => (i === index ? 1 : 0)),
              });
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: SLIDES[index].accentColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Continue / Get Started Button */}
          <Pressable
            onPress={handleNext}
            style={[
              styles.ctaBtn,
              {
                backgroundColor: SLIDES[currentIndex].accentColor,
                marginBottom: insets.bottom > 0 ? 0 : 16,
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>
              {isLast ? "Get Started" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─── Slide Item ───────────────────────────────────────────────────────────── */

function SlideItem({
  slide,
  colors,
  typography,
  isDark,
}: {
  slide: Slide;
  colors: any;
  typography: any;
  isDark: boolean;
}) {
  const Illustration = slide.illustration;
  const illustrationSize = Math.min(SCREEN_WIDTH * 0.55, 220);

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Accent glow */}
      <View
        style={[
          styles.glowOrb,
          {
            backgroundColor: slide.accentColor,
            top: SCREEN_HEIGHT * 0.12,
          },
        ]}
      />

      {/* Illustration */}
      <View style={styles.illustrationWrap}>
        <View
          style={[
            styles.illustrationBg,
            { backgroundColor: slide.accentLight },
          ]}
        >
          <Illustration size={illustrationSize} />
        </View>
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.headline,
            {
              color: colors.text,
              fontFamily: typography?.hero?.fontWeight
                ? undefined
                : undefined,
            },
          ]}
        >
          {slide.headline}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {slide.subtitle}
        </Text>
      </View>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skipSafe: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  glowOrb: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
    alignSelf: "center",
  },
  illustrationWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  illustrationBg: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 16,
  },
  headline: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  bottomSafe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.2,
  },
});
