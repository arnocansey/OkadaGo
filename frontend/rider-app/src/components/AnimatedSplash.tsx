import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { BrandLogo } from "@/components/BrandLogo";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/theme/tokens";

type Props = {
  /** Called once the animation has fully played and the overlay has faded out. */
  onFinish: () => void;
};

const BIKE_WIDTH = 168;
const BIKE_HEIGHT = 94;
const DRIVE_DURATION = 2400;
const FADE_DURATION = 500;

/**
 * OkadaGo animated launch overlay.
 *
 * Renders on top of the app while it boots: a branded okada rider speeds from
 * off-screen left to off-screen right (with a bumpy bounce + trailing speed
 * lines), then the whole overlay fades out and reveals the app.
 *
 * Uses the built-in Animated API (react-native-reanimated is not a dependency)
 * and react-native-svg for the vector motorbike so no binary asset is required.
 */
export function AnimatedSplash({ onFinish }: Props) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const drive = useRef(new Animated.Value(0)).current;
  const brand = useRef(new Animated.Value(0)).current;
  const speed = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const speedLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(speed, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(speed, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    speedLoop.start();

    const animation = Animated.sequence([
      Animated.timing(brand, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(drive, {
        toValue: 1,
        duration: DRIVE_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      speedLoop.stop();
      if (finished) finish();
    });

    // Safety net: guarantee the app is revealed even if the animation is
    // interrupted (e.g. app backgrounded mid-launch).
    const timeout = setTimeout(finish, DRIVE_DURATION + FADE_DURATION + 1200);

    return () => {
      clearTimeout(timeout);
      speedLoop.stop();
      animation.stop();
    };
  }, [brand, drive, fade, onFinish, speed]);

  const translateX = drive.interpolate({
    inputRange: [0, 1],
    outputRange: [-BIKE_WIDTH - 40, width + BIKE_WIDTH + 40],
  });

  // Bumpy ride: small vertical wobble as the bike drives across.
  const translateY = drive.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    outputRange: [0, -6, 0, -5, 0, -6, 0, -3],
  });

  const speedLineOpacity = speed.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.8],
  });
  const speedLineScaleX = speed.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.15],
  });

  const brandTranslateY = brand.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const wheelColor = colors.text;
  const bodyColor = colors.primary;
  const riderColor = colors.text;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: "#153252", opacity: fade }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.brandBlock,
          { opacity: brand, transform: [{ translateY: brandTranslateY }] },
        ]}
      >
        <BrandLogo variant="wordmark" size={56} />
        <View style={[styles.tagPill, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.tagline, { color: colors.primary }]}>Your ride, on demand</Text>
        </View>
      </Animated.View>

      <View style={styles.lane} pointerEvents="none">
        <Animated.View
          style={[
            styles.bike,
            { transform: [{ translateX }, { translateY }] },
          ]}
        >
          <Animated.View
            style={[
              styles.speedLines,
              { opacity: speedLineOpacity, transform: [{ scaleX: speedLineScaleX }] },
            ]}
          >
            <View style={[styles.speedLine, styles.speedLineLong, { backgroundColor: colors.primary }]} />
            <View style={[styles.speedLine, styles.speedLineShort, { backgroundColor: colors.primary }]} />
            <View style={[styles.speedLine, styles.speedLineLong, { backgroundColor: colors.primary }]} />
          </Animated.View>

          <Svg width={BIKE_WIDTH} height={BIKE_HEIGHT} viewBox="0 0 160 90">
            {/* Rear Heavy Tire */}
            <Circle cx="32" cy="64" r="16" stroke={wheelColor} strokeWidth={5} fill="none" />
            <Circle cx="32" cy="64" r="4" fill={wheelColor} />
            <Path d="M32 52 L32 76 M20 64 L44 64" stroke={wheelColor} strokeWidth={1.5} />

            {/* Front Heavy Tire */}
            <Circle cx="126" cy="64" r="16" stroke={wheelColor} strokeWidth={5} fill="none" />
            <Circle cx="126" cy="64" r="4" fill={wheelColor} />
            <Path d="M126 52 L126 76 M114 64 L138 64" stroke={wheelColor} strokeWidth={1.5} />

            {/* Engine Block & Lower Chassis */}
            <Path
              d="M58 58 L82 58 L86 68 L56 68 Z"
              fill={wheelColor}
            />
            {/* Engine Cooling Fins */}
            <Path d="M62 61 L78 61 M60 65 L80 65" stroke={bodyColor} strokeWidth={1.5} />

            {/* Sweeping Exhaust Pipe */}
            <Path
              d="M80 65 L52 70 L30 67"
              stroke={wheelColor}
              strokeWidth={3.5}
              strokeLinecap="round"
              fill="none"
            />

            {/* Teardrop Fuel Tank */}
            <Path
              d="M68 44 C74 36 94 36 102 44 L98 52 L66 52 Z"
              fill={bodyColor}
              stroke={wheelColor}
              strokeWidth={1.5}
            />

            {/* Padded Seat */}
            <Path
              d="M44 48 C48 42 66 42 74 46 L70 52 L42 52 Z"
              fill={wheelColor}
            />

            {/* Front Hydraulic Fork & Headlight */}
            <Path
              d="M102 42 L126 64"
              stroke={wheelColor}
              strokeWidth={4.5}
              strokeLinecap="round"
            />
            {/* Handlebars */}
            <Path d="M98 34 L106 32 L112 36" stroke={wheelColor} strokeWidth={3} strokeLinecap="round" />
            {/* Headlight */}
            <Path d="M112 40 L118 42 L116 48 L110 46 Z" fill={bodyColor} />
            <Circle cx="118" cy="43" r="2.5" fill="#fef08a" />

            {/* Rider with Helmet */}
            {/* Torso & Arms */}
            <Path
              d="M56 46 C60 34 76 32 84 36 L104 35"
              stroke={riderColor}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Helmet */}
            <Circle cx="88" cy="24" r="8.5" fill={riderColor} />
            {/* Helmet Visor */}
            <Path d="M92 23 L96 25 L94 28 L90 27 Z" fill="#38bdf8" />
            {/* Legs */}
            <Path d="M60 48 L68 56 L64 66" stroke={riderColor} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Animated.View>
      </View>

      <View style={styles.ground}>
        <View style={[styles.groundLine, { backgroundColor: isDark ? colors.border : colors.borderStrong }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  brandBlock: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.huge,
  },
  wordmark: {
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  lane: {
    position: "absolute",
    top: "58%",
    left: 0,
    right: 0,
    height: BIKE_HEIGHT,
    justifyContent: "center",
  },
  bike: {
    position: "absolute",
    left: 0,
    width: BIKE_WIDTH,
    height: BIKE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  speedLines: {
    position: "absolute",
    left: -46,
    top: 0,
    bottom: 0,
    width: 46,
    justifyContent: "center",
    gap: 7,
  },
  speedLine: {
    height: 4,
    borderRadius: 2,
  },
  speedLineLong: {
    width: 42,
  },
  speedLineShort: {
    width: 26,
  },
  ground: {
    position: "absolute",
    top: "58%",
    left: 0,
    right: 0,
    height: BIKE_HEIGHT,
    justifyContent: "flex-end",
    paddingBottom: 6,
  },
  groundLine: {
    height: 2,
    marginHorizontal: spacing.xxl,
    borderRadius: 1,
    opacity: 0.6,
  },
});
